import { GoogleGenAI } from "@google/genai";

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

/** A named JSON Schema the response must follow (structured outputs). */
export interface OutputSchema {
  name: string;
  schema: Record<string, unknown>;
}

export type LLM = (messages: ChatMessage[], output: OutputSchema) => Promise<string>;

const REQUEST_TIMEOUT_MS = 60_000;
const MAX_TRIES = 3;

/**
 * fetch with a timeout, retrying network errors, 429s and 5xx responses with
 * a short backoff. Other errors (e.g. 401 bad key) are returned immediately.
 */
export async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
    try {
      const response = await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      // Read the body here too: a connection can drop after the headers arrive.
      const body = await response.text();
      if (response.status !== 429 && response.status < 500) {
        return new Response(body, { status: response.status, headers: response.headers });
      }
      lastError = new Error(`HTTP ${response.status}: ${body}`);
    } catch (error) {
      lastError = error; // timeout or dropped connection
    }
    if (attempt < MAX_TRIES) await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
  throw lastError;
}

async function callOpenRouter(messages: ChatMessage[], output: OutputSchema, apiKey: string): Promise<string> {
  const response = await fetchWithRetry("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "X-Title": "TriageGuard",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "openai/gpt-oss-120b",
      messages,
      // Enforce the schema, and only route to providers that support it.
      response_format: { type: "json_schema", json_schema: { name: output.name, strict: true, schema: output.schema } },
      provider: { require_parameters: true },
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter error ${response.status}: ${await response.text()}`);
  }
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGemini(messages: ChatMessage[], output: OutputSchema, apiKey: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const res = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    contents: messages.filter((m) => m.role === "user").map((m) => m.content).join("\n\n"),
    config: {
      systemInstruction: messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n"),
      responseMimeType: "application/json",
      responseJsonSchema: output.schema,
      temperature: 0.1,
    },
  });
  if (!res.text) throw new Error("Gemini returned an empty response");
  return res.text;
}

/**
 * Chat completion that returns JSON matching `output`. Uses OpenRouter when OPENROUTER_API_KEY is set
 * and falls back to Gemini, so the app runs with only a Gemini key.
 */
export const callLLM: LLM = async (messages, output) => {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (openRouterKey) {
    try {
      return await callOpenRouter(messages, output, openRouterKey);
    } catch (error) {
      if (!geminiKey) throw error;
      console.warn("OpenRouter failed, falling back to Gemini:", error);
    }
  }
  if (!geminiKey) throw new Error("Set OPENROUTER_API_KEY or GEMINI_API_KEY");
  return callGemini(messages, output, geminiKey);
};
