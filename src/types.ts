export type TriageLabel = 'Immediate' | 'Emergent' | 'Urgent' | 'Non-urgent';

export interface Citation {
  title: string;
  passage_id: string;
  snippet: string;
}

export interface RetrievedPassageSummary {
  id: string;
  title: string;
  section: string;
  score: number;
}

/** Shape returned by POST /api/triage (see server/triage.ts). */
export interface TriageResult {
  triage_label: TriageLabel;
  model_label: TriageLabel;
  red_flags: string[];
  rationale: string;
  citations: Citation[];
  missing_info: string[];
  recommended_next_steps: string[];
  retrieved: RetrievedPassageSummary[];
  verification: {
    citations_checked: number;
    invalid_citation_ids: string[];
    has_valid_citation: boolean;
    vital_sign_flags: number;
    escalated_by_safety_floor: boolean;
  };
}

export interface CorpusInfo {
  protocols: string[];
  passages: number;
  embedding_model: string | null;
  indexed_at: string | null;
}

export interface EvalResults {
  run_at: string;
  embedding_model: string;
  llm: string | null;
  cases: number;
  top_k: number;
  metrics: {
    retrieval_hit_at_1: number | null;
    retrieval_hit_at_k: number | null;
    triage_accuracy: number | null;
    under_triage_rate: number | null;
    cited_rate: number | null;
    errors: number;
  };
  rows: Array<{
    id: string;
    expected_protocol: string;
    expected_label: TriageLabel;
    top1_protocol?: string;
    hit_at_1: boolean;
    predicted_label?: TriageLabel;
    label_correct?: boolean;
    under_triage?: boolean;
    error?: string;
  }>;
}
