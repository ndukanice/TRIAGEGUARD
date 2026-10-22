import { z } from "zod";
import { CLINICAL_PROTOCOLS } from "../src/data/protocols.ts";
import type { Embedder } from "./rag/embed.ts";
import type { LLM } from "./llm.ts";
import { buildQuery, retrieve, type RetrievedPassage, type VectorIndex } from "./rag/retriever.ts";
import { applySafetyFloor, checkVitals, TRIAGE_LABELS, verifyCitations, type Vitals } from "./rag/safety.ts";

export const TOP_K = 5;

export const patientDataSchema = z.object({
  complaint: z.string({ error: "complaint is required" }).trim().min(1, "complaint is required"),
  history: z.string().optional().default(""),
  onset: z.string().optional().default(""),
  duration: z.string().optional(),
  vitals: z
    .object({
      bp_sys: z.string().optional(),
      bp_dia: z.string().optional(),
      hr: z.string().optional(),
      temp: z.string().optional(),
      o2: z.string().optional(),
    })
    .optional()
    .default({}),
});
export type PatientData = z.infer<typeof patientDataSchema>;

const modelOutputSchema = z.object({
  triage_label: z.enum(TRIAGE_LABELS),
  red_flags: z.array(z.string()).default([]),
  rationale: z.string(),
  citations: z.array(z.object({ passage_id: z.string() }).passthrough()).default([]),
  missing_info: z.array(z.string()).default([]),
  recommended_next_steps: z.array(z.string()).default([]),
});

const stringArray = { type: "array", items: { type: "string" } };

/** JSON Schema sent to the LLM so the provider enforces the output shape. */
const OUTPUT_SCHEMA = {
  name: "triage_recommendation",
  schema: {
    type: "object",
    properties: {
      triage_label: { type: "string", enum: [...TRIAGE_LABELS] },
      red_flags: stringArray,
      rationale: { type: "string" },
      citations: {
        type: "array",
        items: {
          type: "object",
          properties: { passage_id: { type: "string" } },
          required: ["passage_id"],
          additionalProperties: false,
        },
      },
      missing_info: stringArray,
      recommended_next_steps: stringArray,
    },
    required: ["triage_label", "red_flags", "rationale", "citations", "missing_info", "recommended_next_steps"],
    additionalProperties: false,
  },
};

// One retry: if the model still breaks the schema, the request fails loudly.
const MAX_ATTEMPTS = 2;

async function generate(llm: LLM, messages: ReturnType<typeof buildPrompt>) {
  let lastError = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const raw = await llm(messages, OUTPUT_SCHEMA);
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      lastError = "response was not valid JSON";
      continue;
    }
    const parsed = modelOutputSchema.safeParse(json);
    if (parsed.success) return parsed.data;
    lastError = parsed.error.message;
  }
  throw new Error(`Model returned an invalid triage object after ${MAX_ATTEMPTS} attempts: ${lastError}`);
}

export interface Deps {
  index: VectorIndex;
  embed: Embedder;
  llm: LLM;
}

function buildPrompt(patient: PatientData, passages: RetrievedPassage[]) {
  const context = passages.map((p) => `[${p.id}] ${p.text}`).join("\n");
  return [
    {
      role: "system" as const,
      content: `You are a clinical triage support assistant. Use ONLY the guideline passages provided.
Assign one label from: ${TRIAGE_LABELS.join(", ")}.
Every claim in the rationale must be supported by a cited passage. Cite passages by their exact id in square brackets.
Do not diagnose. If information needed for triage is missing, list it in missing_info.
Reply with JSON only, in this shape:
{"triage_label": string, "red_flags": string[], "rationale": string,
 "citations": [{"passage_id": string}], "missing_info": string[], "recommended_next_steps": string[]}`,
    },
    {
      role: "user" as const,
      content: `GUIDELINE PASSAGES:\n${context}\n\nPATIENT INTAKE:\n${JSON.stringify(patient)}`,
    },
  ];
}

/**
 * The full RAG pipeline: retrieve -> generate -> verify.
 * Kept free of Express so the eval script can run exactly the same code.
 */
export async function runTriage(patient: PatientData, deps: Deps) {
  // 1. Retrieve the passages most similar to the patient's presentation.
  const retrieved = await retrieve(buildQuery(patient), deps.index, deps.embed, TOP_K);
  const topProtocol =
    CLINICAL_PROTOCOLS.find((p) => p.id === retrieved[0]?.protocolId) ?? CLINICAL_PROTOCOLS[0];

  // 2. Generate a recommendation grounded in those passages.
  const output = await generate(deps.llm, buildPrompt(patient, retrieved));

  // 3. Verify in code: real citations only, and a vital-sign safety floor.
  const { valid, invalidIds } = verifyCitations(output.citations, retrieved);
  const vitalFlags = checkVitals(patient.vitals as Vitals, topProtocol);
  const { label, escalated } = applySafetyFloor(output.triage_label, vitalFlags);

  return {
    triage_label: label,
    model_label: output.triage_label,
    red_flags: [...vitalFlags, ...output.red_flags],
    rationale: output.rationale,
    citations: valid,
    missing_info: output.missing_info,
    recommended_next_steps: output.recommended_next_steps,
    retrieved: retrieved.map(({ id, title, section, score }) => ({ id, title, section, score })),
    verification: {
      citations_checked: output.citations.length,
      invalid_citation_ids: invalidIds,
      has_valid_citation: valid.length > 0,
      vital_sign_flags: vitalFlags.length,
      escalated_by_safety_floor: escalated,
    },
  };
}

export type TriageResult = Awaited<ReturnType<typeof runTriage>>;
