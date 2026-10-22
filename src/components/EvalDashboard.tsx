import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { EvalResults } from '../types.ts';

const fmt = (v: number | null) => (v === null ? 'n/a' : `${v}%`);

export default function EvalDashboard() {
  const [results, setResults] = useState<EvalResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/eval')
      .then(async (r) => (r.ok ? setResults(await r.json()) : setError((await r.json()).error)))
      .catch(() => setError('Could not load evaluation results.'));
  }, []);

  if (error || !results) {
    return (
      <div className="bg-[#111827] border border-[#1E293B] p-8 rounded-2xl text-sm text-slate-400">
        {error ?? 'Loading evaluation results...'}
      </div>
    );
  }

  const m = results.metrics;
  const metrics = [
    { label: 'Retrieval hit@1', value: fmt(m.retrieval_hit_at_1), sub: 'Correct protocol ranked first', color: 'text-blue-500' },
    { label: `Retrieval hit@${results.top_k}`, value: fmt(m.retrieval_hit_at_k), sub: `Correct protocol in top ${results.top_k}`, color: 'text-blue-400' },
    { label: 'Triage accuracy', value: fmt(m.triage_accuracy), sub: 'Exact label match', color: 'text-purple-500' },
    { label: 'Under-triage rate', value: fmt(m.under_triage_rate), sub: 'Labelled less urgent than expected', color: 'text-red-500' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-[#111827] border border-[#1E293B] p-6 rounded-2xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">{metric.label}</p>
            <div className={`text-4xl font-black ${metric.color} mb-2`}>{metric.value}</div>
            <p className="text-xs text-slate-600">{metric.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#1E293B]">
          <h2 className="text-lg font-bold text-slate-100">Per-case results</h2>
          <p className="text-xs text-slate-500 mt-1">
            {results.cases} synthetic cases · embeddings: {results.embedding_model} · LLM: {results.llm ?? 'not run (retrieval only)'} ·
            run {new Date(results.run_at).toLocaleString()}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-slate-600 border-b border-[#1E293B]">
                <th className="px-6 py-4">Case</th>
                <th className="px-6 py-4">Expected protocol</th>
                <th className="px-6 py-4">Top retrieved</th>
                <th className="px-6 py-4">Expected label</th>
                <th className="px-6 py-4">Predicted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B] font-mono text-xs">
              {results.rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-6 py-3 text-slate-300">{r.id}</td>
                  <td className="px-6 py-3 text-slate-400">{r.expected_protocol}</td>
                  <td className={`px-6 py-3 ${r.hit_at_1 ? 'text-emerald-400' : 'text-red-400'}`}>{r.top1_protocol}</td>
                  <td className="px-6 py-3 text-slate-400">{r.expected_label}</td>
                  <td className={`px-6 py-3 ${r.error ? 'text-amber-400' : r.label_correct ? 'text-emerald-400' : r.under_triage ? 'text-red-400' : 'text-amber-400'}`}>
                    {r.error ? 'error' : r.predicted_label ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="p-6 text-xs text-slate-600 border-t border-[#1E293B]">
          Cases are synthetic and written from the protocol criteria in this repo. They are not clinically validated.
        </p>
      </div>
    </motion.div>
  );
}
