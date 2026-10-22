import { GoogleGenAI } from "@google/genai";
import { fetchWithRetry } from "../llm.ts";

export type TaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";
export type Embedder = (texts: string[], taskType: TaskType) => Promise<number[][]>;

export const EMBEDDING_DIM = Number(process.env.EMBEDDING_DIM || 768);

// Both APIs accept at most ~100 texts per request; stay within that.
const BATCH_SIZE = 100;

async function inBatches(texts: string[], embedBatch: (batch: string[]) => Promise<number[][]>) {
  const vectors: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    vectors.push(...(await embedBatch(texts.slice(i, i + BATCH_SIZE))));
  }
  if (vectors.length !== texts.length) {
    throw new Error(`Expected ${texts.length} embeddings, got ${vectors.length}`);
  }
  return vectors;
}

/** OpenRouter embeddings (OpenAI-compatible /embeddings endpoint). */
export function createOpenRouterEmbedder(apiKey: string, model: string): Embedder {
  return (texts) =>
    inBatches(texts, async (batch) => {
      const response = await fetchWithRetry("https://openrouter.ai/api/v1/embeddings", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, input: batch, dimensions: EMBEDDING_DIM, encoding_format: "float" }),
      });
      if (!response.ok) {
        throw new Error(`OpenRouter embeddings error ${response.status}: ${await response.text()}`);
      }
      const data: { data: Array<{ index: number; embedding: number[] }> } = await response.json();
      return [...data.data].sort((a, b) => a.index - b.index).map((d) => d.embedding);
    });
}

/**
 * Gemini embeddings. Documents and queries use different task types: Gemini
 * tunes the vectors so a short question lands near the passage that answers it.
 */
export function createGeminiEmbedder(apiKey: string, model: string): Embedder {
  const ai = new GoogleGenAI({ apiKey });
  return (texts, taskType) =>
    inBatches(texts, async (batch) => {
      const res = await ai.models.embedContent({
        model,
        contents: batch,
        config: { taskType, outputDimensionality: EMBEDDING_DIM },
      });
      return (res.embeddings ?? []).map((e) => {
        if (!e.values) throw new Error("Gemini returned an empty embedding");
        return e.values;
      });
    });
}

/**
 * Picks the embedding provider from the keys that are set: OpenRouter first,
 * then Gemini. The model name is stored in the index, because queries must be
 * embedded with the same model as the passages.
 */
export function createEmbedder(): { embed: Embedder; model: string } {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (openRouterKey) {
    const model = process.env.EMBEDDING_MODEL || "openai/text-embedding-3-small";
    return { embed: createOpenRouterEmbedder(openRouterKey, model), model };
  }
  if (geminiKey) {
    const model = process.env.EMBEDDING_MODEL || "gemini-embedding-001";
    return { embed: createGeminiEmbedder(geminiKey, model), model };
  }
  throw new Error("Set OPENROUTER_API_KEY (or GEMINI_API_KEY) to create embeddings");
}
