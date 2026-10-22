/**
 * Evaluates the RAG pipeline on eval/cases.json and writes eval/results.json,
 * which the Eval tab in the app displays.
 *
 *   npm run eval                      # retrieval + full triage (embeddings + LLM calls)
 *   npm run eval -- --retrieval-only  # retrieval metrics only (embeddings only)
 */
import fs from "fs";
import dotenv from "dotenv";
import { createEmbedder } from "../server/rag/embed.ts";
import { buildQuery, loadIndex, retrieve } from "../server/rag/retriever.ts";
import { urgencyRank, type TriageLabel } from "../server/rag/safety.ts";
import { callLLM } from "../server/llm.ts";
import { patientDataSchema, runTriage, TOP_K } from "../server/triage.ts";

dotenv.config({ path: ".env.local" });
dotenv.config();

interface EvalCase {
  id: string;
  expected_protocol: string;
  expected_label: TriageLabel;
  patient: unknown;
}

const retrievalOnly = process.argv.includes("--retrieval-only");
const cases: EvalCase[] = JSON.parse(fs.readFileSync("eval/cases.json", "utf8"));
const index = loadIndex();
const { embed } = createEmbedder();
const pct = (n: number, d: number) => (d === 0 ? null : Math.round((n / d) * 1000) / 10);

const rows = [];
for (const c of cases) {
  const patient = patientDataSchema.parse(c.patient);
  const retrieved = await retrieve(buildQuery(patient), index, embed, TOP_K);
  const row: Record<string, unknown> = {
    id: c.id,
    expected_protocol: c.expected_protocol,
    expected_label: c.expected_label,
    top1_protocol: retrieved[0]?.protocolId,
    hit_at_1: retrieved[0]?.protocolId === c.expected_protocol,
    hit_at_k: retrieved.some((p) => p.protocolId === c.expected_protocol),
  };

  if (!retrievalOnly) {
    try {
      const result = await runTriage(patient, { index, embed, llm: callLLM });
      row.predicted_label = result.triage_label;
      row.label_correct = result.triage_label === c.expected_label;
      // Under-triage = predicted LESS urgent than expected. The most dangerous error.
      row.under_triage = urgencyRank(result.triage_label) > urgencyRank(c.expected_label);
      row.has_valid_citation = result.verification.has_valid_citation;
      row.invalid_citations = result.verification.invalid_citation_ids.length;
    } catch (error) {
      row.error = String(error);
    }
  }
  rows.push(row);
  console.log(JSON.stringify(row));
}

const scored = rows.filter((r) => "predicted_label" in r);
const results = {
  run_at: new Date().toISOString(),
  embedding_model: index.model,
  llm: retrievalOnly ? null : process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_MODEL || "openai/gpt-oss-120b" : process.env.GEMINI_MODEL || "gemini-2.5-flash",
  cases: rows.length,
  top_k: TOP_K,
  metrics: {
    retrieval_hit_at_1: pct(rows.filter((r) => r.hit_at_1).length, rows.length),
    retrieval_hit_at_k: pct(rows.filter((r) => r.hit_at_k).length, rows.length),
    triage_accuracy: pct(scored.filter((r) => r.label_correct).length, scored.length),
    under_triage_rate: pct(scored.filter((r) => r.under_triage).length, scored.length),
    cited_rate: pct(scored.filter((r) => r.has_valid_citation).length, scored.length),
    errors: rows.filter((r) => "error" in r).length,
  },
  rows,
};

fs.writeFileSync("eval/results.json", JSON.stringify(results, null, 2));
console.log("\nMetrics:", results.metrics);
console.log("Wrote eval/results.json");
