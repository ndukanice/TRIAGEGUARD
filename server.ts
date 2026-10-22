import express from "express";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { CLINICAL_PROTOCOLS } from "./src/data/protocols.ts";
import { createEmbedder } from "./server/rag/embed.ts";
import { loadIndex, type VectorIndex } from "./server/rag/retriever.ts";
import { callLLM } from "./server/llm.ts";
import { patientDataSchema, runTriage } from "./server/triage.ts";

dotenv.config({ path: ".env.local" });
dotenv.config();

const app = express();
app.use(express.json({ limit: "50kb" }));

const PORT = Number(process.env.PORT || 3000);
const EVAL_RESULTS_PATH = "eval/results.json";

// Load the vector index once at startup. If it is missing the UI still loads
// and the triage endpoint explains how to build it.
let index: VectorIndex | null = null;
try {
  index = loadIndex();
  console.log(`Loaded vector index: ${index.passages.length} passages (${index.model})`);
} catch (error) {
  console.warn(String(error));
}

app.post("/api/triage", async (req, res) => {
  const parsed = patientDataSchema.safeParse(req.body?.patientData);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join("; ") });
  }
  if (!index) {
    return res.status(503).json({ error: 'Vector index not built. Run "npm run index".' });
  }

  try {
    const { embed, model } = createEmbedder();
    if (model !== index.model) {
      return res.status(503).json({
        error: `Index was built with ${index.model} but the server is using ${model}. Run "npm run index" again.`,
      });
    }
    const result = await runTriage(parsed.data, { index, embed, llm: callLLM });
    res.json(result);
  } catch (error) {
    console.error("Triage error:", error);
    res.status(502).json({ error: "Failed to generate a triage recommendation. Please try again." });
  }
});

// Real facts about the knowledge base, shown in the sidebar.
app.get("/api/corpus", (_req, res) => {
  res.json({
    protocols: CLINICAL_PROTOCOLS.map((p) => p.title),
    passages: index?.passages.length ?? 0,
    embedding_model: index?.model ?? null,
    indexed_at: index?.createdAt ?? null,
  });
});

// Results of the last `npm run eval`, or 404 if it has never been run.
app.get("/api/eval", (_req, res) => {
  if (!fs.existsSync(EVAL_RESULTS_PATH)) {
    return res.status(404).json({ error: 'No evaluation results yet. Run "npm run eval".' });
  }
  res.type("json").send(fs.readFileSync(EVAL_RESULTS_PATH, "utf8"));
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TriageGuard running on http://localhost:${PORT}`);
  });
}

startServer();
