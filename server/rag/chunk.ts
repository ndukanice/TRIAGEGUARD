import type { Protocol } from "../../src/data/protocols.ts";

/** One retrievable unit of the knowledge base. */
export interface Passage {
  id: string;
  protocolId: string;
  title: string;
  section: string;
  text: string;
}

const URGENCY_SECTIONS = [
  ["immediate", "Immediate criteria"],
  ["emergent", "Emergent criteria"],
  ["urgent", "Urgent criteria"],
  ["nonUrgent", "Non-urgent criteria"],
] as const;

/**
 * Split a protocol into small, self-describing passages.
 *
 * Each passage repeats the protocol title so it still makes sense when it is
 * retrieved on its own, which improves both embedding quality and citations.
 */
export function chunkProtocol(p: Protocol): Passage[] {
  const make = (suffix: string, section: string, body: string): Passage => ({
    id: `${p.id}#${suffix}`,
    protocolId: p.id,
    title: p.title,
    section,
    text: `${p.title} (${p.category}) — ${section}: ${body}`,
  });

  const t = p.vitalsThresholds;
  const passages = [
    make("overview", "Overview", p.rationale),
    make("red-flags", "Red flags", p.redFlags.join("; ") + "."),
    make(
      "vitals",
      "Critical vital-sign thresholds",
      `SpO2 below ${t.criticalSpO2}%, systolic BP below ${t.criticalSBP} mmHg, ` +
        `or heart rate outside ${t.criticalHeartRate.min}-${t.criticalHeartRate.max} bpm.`
    ),
  ];

  for (const [key, label] of URGENCY_SECTIONS) {
    const items = p.urgencyCriteria[key];
    if (items.length) passages.push(make(key, label, items.join("; ") + "."));
  }
  return passages;
}

export function chunkProtocols(protocols: Protocol[]): Passage[] {
  return protocols.flatMap(chunkProtocol);
}
