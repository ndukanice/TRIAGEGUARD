import fs from "fs";
import type { Passage } from "./chunk.ts";
import type { Embedder } from "./embed.ts";
import { topK } from "./vector.ts";

export interface IndexedPassage extends Passage {
  embedding: number[];
}

export interface VectorIndex {
  model: string;
  dimensions: number;
  createdAt: string;
  passages: IndexedPassage[];
}

export interface RetrievedPassage extends Passage {
  score: number;
}

export const INDEX_PATH = "data/vector-index.json";

export function loadIndex(path = INDEX_PATH): VectorIndex {
  if (!fs.existsSync(path)) {
    throw new Error(`Vector index not found at ${path}. Run "npm run index" first.`);
  }
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

/** Build the search text from the free-text parts of an intake form. */
export function buildQuery(patientData: {
  complaint?: string;
  history?: string;
  onset?: string;
}): string {
  return [patientData.complaint, patientData.history, patientData.onset]
    .filter(Boolean)
    .join(". ");
}

export async function retrieve(
  query: string,
  index: VectorIndex,
  embed: Embedder,
  k = 5
): Promise<RetrievedPassage[]> {
  const [queryVector] = await embed([query], "RETRIEVAL_QUERY");
  return topK(queryVector, index.passages, k).map(({ item, score }) => {
    const { embedding: _embedding, ...passage } = item;
    return { ...passage, score };
  });
}
