/**
 * Ingestion step of the RAG pipeline: chunk the protocols, embed every
 * passage (OpenRouter or Gemini) and save the vectors to data/vector-index.json.
 *
 * Run with: npm run index
 */
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { CLINICAL_PROTOCOLS } from "../src/data/protocols.ts";
import { chunkProtocols } from "../server/rag/chunk.ts";
import { createEmbedder, EMBEDDING_DIM } from "../server/rag/embed.ts";
import { INDEX_PATH, type VectorIndex } from "../server/rag/retriever.ts";

dotenv.config({ path: ".env.local" });
dotenv.config();

const passages = chunkProtocols(CLINICAL_PROTOCOLS);
console.log(`Chunked ${CLINICAL_PROTOCOLS.length} protocols into ${passages.length} passages`);

const { embed, model } = createEmbedder();
const vectors = await embed(passages.map((p) => p.text), "RETRIEVAL_DOCUMENT");

const index: VectorIndex = {
  model,
  dimensions: EMBEDDING_DIM,
  createdAt: new Date().toISOString(),
  passages: passages.map((p, i) => ({ ...p, embedding: vectors[i] })),
};

fs.mkdirSync(path.dirname(INDEX_PATH), { recursive: true });
fs.writeFileSync(INDEX_PATH, JSON.stringify(index));
console.log(`Wrote ${INDEX_PATH} (${model}, ${EMBEDDING_DIM} dims)`);
