import type { Protocol } from "../../src/data/protocols.ts";
import type { RetrievedPassage } from "./retriever.ts";

export const TRIAGE_LABELS = ["Immediate", "Emergent", "Urgent", "Non-urgent"] as const;
export type TriageLabel = (typeof TRIAGE_LABELS)[number];

/** Lower number = more urgent. */
export const urgencyRank = (label: TriageLabel) => TRIAGE_LABELS.indexOf(label);

export interface Citation {
  title: string;
  passage_id: string;
  snippet: string;
}

export interface Vitals {
  bp_sys?: string;
  hr?: string;
  o2?: string;
}

/**
 * Rule-based vital-sign check against the thresholds of the best-matching
 * protocol. It runs in code, so a critical reading is flagged even if the
 * model misses it.
 */
export function checkVitals(vitals: Vitals | undefined, protocol: Protocol): string[] {
  const t = protocol.vitalsThresholds;
  const num = (v?: string) => (v === undefined || v.trim() === "" ? NaN : Number(v));
  const spo2 = num(vitals?.o2);
  const sbp = num(vitals?.bp_sys);
  const hr = num(vitals?.hr);
  const flags: string[] = [];

  if (spo2 < t.criticalSpO2) flags.push(`SpO2 ${spo2}% is below the critical threshold of ${t.criticalSpO2}%`);
  if (sbp < t.criticalSBP) flags.push(`Systolic BP ${sbp} mmHg is below the critical threshold of ${t.criticalSBP} mmHg`);
  if (hr < t.criticalHeartRate.min || hr > t.criticalHeartRate.max) {
    flags.push(`Heart rate ${hr} bpm is outside ${t.criticalHeartRate.min}-${t.criticalHeartRate.max} bpm`);
  }
  return flags;
}

/**
 * Keep only citations that point at a passage we actually retrieved, and
 * replace the model's snippet with the real passage text so a citation can
 * never quote words that are not in the knowledge base.
 */
export function verifyCitations(citations: Array<{ passage_id: string }>, retrieved: RetrievedPassage[]) {
  const byId = new Map(retrieved.map((p) => [p.id, p]));
  const valid: Citation[] = [];
  const invalidIds: string[] = [];

  for (const c of citations) {
    const passage = byId.get(c.passage_id);
    if (!passage) {
      invalidIds.push(c.passage_id);
    } else if (!valid.some((v) => v.passage_id === passage.id)) {
      valid.push({ title: `${passage.title} — ${passage.section}`, passage_id: passage.id, snippet: passage.text });
    }
  }
  return { valid, invalidIds };
}

/**
 * Safety floor: critical vitals mean the case is at least Emergent, whatever
 * the model said. Returns the final label and whether it was escalated.
 */
export function applySafetyFloor(label: TriageLabel, vitalFlags: string[]) {
  if (vitalFlags.length > 0 && urgencyRank(label) > urgencyRank("Emergent")) {
    return { label: "Emergent" as TriageLabel, escalated: true };
  }
  return { label, escalated: false };
}
