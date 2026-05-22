import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { CLINICAL_PROTOCOLS } from "./src/data/protocols.ts";
import { z } from "zod";

dotenv.config({ path: ".env.local" });
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 3000;

// Zod schema for structured triage output as per architecture
const triageResultSchema = z.object({
  triage_label: z.enum(["Immediate", "Emergent", "Urgent", "Non-urgent"]),
  red_flags: z.array(z.string()),
  rationale: z.string(),
  citations: z.array(z.object({
    title: z.string(),
    passage_id: z.string(),
    snippet: z.string()
  })),
  missing_info: z.array(z.string()),
  recommended_next_steps: z.array(z.string()),
  safety_verification: z.string()
});

async function callOpenRouter(messages: any[], responseSchema?: any) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is missing");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://ai.studio/build",
      "X-Title": "TriageGuard Copilot",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "gpt-oss-120b",
      messages,
      response_format: responseSchema ? { type: "json_object" } : undefined,
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter Error: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callLLMWithFallback(messages: any[], responseSchema?: any) {
  try {
    console.log("Attempting OpenRouter call...");
    return await callOpenRouter(messages, responseSchema);
  } catch (error) {
    console.error("OpenRouter failed:", error);
    throw new Error(`LLM provider failed: ${error}`);
  }
}

// API Routes
app.post("/api/triage", async (req, res) => {
  try {
    const { patientData } = req.body;
    if (!patientData) {
      return res.status(400).json({ error: "Missing patient data" });
    }

    // 1. Normalization & Category Extraction
    const extractionContent = await callLLMWithFallback([
      {
        role: "system",
        content: `Normalize patient triage data into JSON.
        Required Fields: category (pick one: ${CLINICAL_PROTOCOLS.map(p => p.id).join(", ")}), summary, vitals {sbp, hr, o2}.`
      },
      {
        role: "user",
        content: `Patient Data: ${JSON.stringify(patientData)}`
      }
    ], true);

    const extraction = JSON.parse(extractionContent || "{}");
    const protocol = CLINICAL_PROTOCOLS.find(p => p.id === extraction.category) || CLINICAL_PROTOCOLS[0];

    // 2. Triage Reasoning + Safety Verification (multistep RAG)
    const triageContent = await callLLMWithFallback([
      {
        role: "system",
        content: `You are a Safety-Grounded Clinical RAG Agent. Output strictly valid JSON.
        
        CORE INSTRUCTIONS:
        1. ANALYZE: Check vitals against thresholds (especially SpO2 < ${protocol.vitalsThresholds.criticalSpO2}% or SBP < ${protocol.vitalsThresholds.criticalSBP}).
        2. PRIORITIZE: Assign label from [Immediate, Emergent, Urgent, Non-urgent].
        3. GROUNDING: Every clinical claim MUST cite the protocol.
        4. VERIFICATION: In 'safety_verification', confirm claims match snippets and no diagnosis made.
        
        JSON SCHEMA:
        {
          "triage_label": string,
          "red_flags": string[],
          "rationale": string,
          "citations": [{ "title": string, "passage_id": string, "snippet": string }],
          "missing_info": string[],
          "recommended_next_steps": string[],
          "safety_verification": string
        }`
      },
      {
        role: "user",
        content: `INTAKE: ${JSON.stringify(patientData)}
        PROTOCOL: ${JSON.stringify(protocol)}`
      }
    ], true);

    const result = JSON.parse(triageContent || "{}");
    const validated = triageResultSchema.safeParse(result);

    res.json(validated.success ? validated.data : result);

  } catch (error: any) {
    console.error("Triage Error:", error);
    res.status(500).json({ error: error.message || "Failed to process triage" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Clinical Triage Server running on http://localhost:${PORT}`);
  });
}

startServer();
