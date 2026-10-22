import { afterEach, describe, expect, it, vi } from "vitest";
import { CLINICAL_PROTOCOLS } from "../../src/data/protocols.ts";
import { chunkProtocol, chunkProtocols } from "./chunk.ts";
import { createOpenRouterEmbedder, type Embedder } from "./embed.ts";
import { buildQuery, retrieve, type VectorIndex } from "./retriever.ts";
import { applySafetyFloor, checkVitals, verifyCitations } from "./safety.ts";
import { cosineSimilarity, topK } from "./vector.ts";
import { patientDataSchema, runTriage } from "../triage.ts";

const chestPain = CLINICAL_PROTOCOLS.find((p) => p.id === "chest-pain")!;

describe("chunking", () => {
  it("creates uniquely identified passages that name their protocol", () => {
    const passages = chunkProtocols(CLINICAL_PROTOCOLS);
    const ids = passages.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of passages) expect(p.text).toContain(p.title);
  });

  it("covers red flags, vitals and every urgency level", () => {
    const ids = chunkProtocol(chestPain).map((p) => p.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "chest-pain#red-flags",
        "chest-pain#vitals",
        "chest-pain#immediate",
        "chest-pain#nonUrgent",
      ])
    );
  });
});

describe("vector search", () => {
  it("computes cosine similarity", () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1);
    expect(cosineSimilarity([0, 0], [1, 0])).toBe(0);
  });

  it("rejects vectors of different lengths", () => {
    expect(() => cosineSimilarity([1], [1, 2])).toThrow();
  });

  it("returns the k most similar items in order", () => {
    const items = [
      { id: "a", embedding: [0, 1] },
      { id: "b", embedding: [1, 0] },
      { id: "c", embedding: [1, 1] },
    ];
    expect(topK([1, 0], items, 2).map((r) => r.item.id)).toEqual(["b", "c"]);
  });

  it("retrieves with a query embedding and strips stored vectors", async () => {
    const index: VectorIndex = {
      model: "test",
      dimensions: 2,
      createdAt: "",
      passages: [
        { id: "x#1", protocolId: "x", title: "X", section: "s", text: "x", embedding: [1, 0] },
        { id: "y#1", protocolId: "y", title: "Y", section: "s", text: "y", embedding: [0, 1] },
      ],
    };
    const fakeEmbed: Embedder = async () => [[0.1, 0.9]];
    const results = await retrieve("anything", index, fakeEmbed, 1);
    expect(results[0].id).toBe("y#1");
    expect(results[0]).not.toHaveProperty("embedding");
  });

  it("builds the query from free-text fields only", () => {
    expect(buildQuery({ complaint: "chest pain", history: "", onset: "1h" })).toBe("chest pain. 1h");
  });
});

describe("safety checks", () => {
  const retrieved = chunkProtocol(chestPain).map((p) => ({ ...p, score: 0.9 }));

  it("drops citations to passages that were not retrieved", () => {
    const { valid, invalidIds } = verifyCitations(
      [{ passage_id: "chest-pain#red-flags" }, { passage_id: "made-up#1" }],
      retrieved
    );
    expect(valid.map((c) => c.passage_id)).toEqual(["chest-pain#red-flags"]);
    expect(invalidIds).toEqual(["made-up#1"]);
  });

  it("replaces the snippet with the real passage text", () => {
    const { valid } = verifyCitations([{ passage_id: "chest-pain#red-flags" }], retrieved);
    expect(valid[0].snippet).toContain("Crushing chest pressure");
  });

  it("flags critical vitals and ignores blank ones", () => {
    expect(checkVitals({ o2: "85", bp_sys: "120", hr: "80" }, chestPain)).toHaveLength(1);
    expect(checkVitals({ o2: "", bp_sys: "", hr: "" }, chestPain)).toHaveLength(0);
    expect(checkVitals({ o2: "98", bp_sys: "80", hr: "140" }, chestPain)).toHaveLength(2);
  });

  it("escalates low-urgency labels when vitals are critical", () => {
    expect(applySafetyFloor("Non-urgent", ["SpO2 low"])).toEqual({ label: "Emergent", escalated: true });
    expect(applySafetyFloor("Immediate", ["SpO2 low"])).toEqual({ label: "Immediate", escalated: false });
    expect(applySafetyFloor("Urgent", [])).toEqual({ label: "Urgent", escalated: false });
  });
});

describe("OpenRouter embedder", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends the batch and returns vectors in input order", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          data: [
            { index: 1, embedding: [0, 1] },
            { index: 0, embedding: [1, 0] },
          ],
        })
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const embed = createOpenRouterEmbedder("test-key", "openai/text-embedding-3-small");
    const vectors = await embed(["first", "second"], "RETRIEVAL_DOCUMENT");

    expect(vectors).toEqual([[1, 0], [0, 1]]);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://openrouter.ai/api/v1/embeddings");
    expect(JSON.parse(init.body as string)).toMatchObject({
      model: "openai/text-embedding-3-small",
      input: ["first", "second"],
    });
  });

  it("throws a readable error when the API fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("bad key", { status: 401 })));
    const embed = createOpenRouterEmbedder("bad", "m");
    await expect(embed(["x"], "RETRIEVAL_QUERY")).rejects.toThrow("401");
  });
});

describe("runTriage pipeline", () => {
  const passages = chunkProtocol(chestPain).map((p, i) => ({
    ...p,
    embedding: i === 1 ? [1, 0] : [0, 1],
  }));
  const index: VectorIndex = { model: "test", dimensions: 2, createdAt: "", passages };
  const embed: Embedder = async () => [[1, 0]];
  const good = JSON.stringify({
    triage_label: "Urgent",
    red_flags: [],
    rationale: "See [chest-pain#red-flags].",
    citations: [{ passage_id: "chest-pain#red-flags" }, { passage_id: "invented#1" }],
    missing_info: [],
    recommended_next_steps: ["ECG"],
  });

  it("retries once when the model breaks the schema", async () => {
    const llm = vi.fn().mockResolvedValueOnce('{"label":"bad"}').mockResolvedValueOnce(good);
    const result = await runTriage(patientDataSchema.parse({ complaint: "chest pain" }), { index, embed, llm });
    expect(llm).toHaveBeenCalledTimes(2);
    expect(result.citations.map((c) => c.passage_id)).toEqual(["chest-pain#red-flags"]);
    expect(result.verification.invalid_citation_ids).toEqual(["invented#1"]);
  });

  it("escalates when vitals are critical", async () => {
    const llm = vi.fn().mockResolvedValue(good);
    const patient = patientDataSchema.parse({ complaint: "chest pain", vitals: { o2: "82" } });
    const result = await runTriage(patient, { index, embed, llm });
    expect(result.model_label).toBe("Urgent");
    expect(result.triage_label).toBe("Emergent");
    expect(result.verification.escalated_by_safety_floor).toBe(true);
  });

  it("fails loudly after two invalid responses", async () => {
    const llm = vi.fn().mockResolvedValue("not json");
    await expect(
      runTriage(patientDataSchema.parse({ complaint: "x" }), { index, embed, llm })
    ).rejects.toThrow("after 2 attempts");
  });
});
