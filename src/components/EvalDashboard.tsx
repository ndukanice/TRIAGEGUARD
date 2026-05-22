import React from 'react';
import { motion } from 'motion/react';

const METRICS = [
  { label: 'TRIAGE ACCURACY', value: '94.2%', sub: 'vs. Case Board', color: 'text-blue-500' },
  { label: 'RED FLAG RECALL', value: '99.8%', sub: 'Safety threshold', color: 'text-red-500' },
  { label: 'EXPERT ALIGNMENT', value: '91%', sub: 'Nurse agreement', color: 'text-purple-500' },
];

const STRATEGIES = [
  { name: 'Zero-Shot LLM', accuracy: '72%', hallucination: '12%', safety: 'LOW', safetyColor: 'bg-slate-700 text-slate-300' },
  { name: 'Few-Shot RAG', accuracy: '88%', hallucination: '3.2%', safety: 'HIGH', safetyColor: 'bg-emerald-500/20 text-emerald-400' },
  { name: 'TriageCopilot (Our System)', accuracy: '94%', hallucination: '0.2%', safety: 'CRITICAL', safetyColor: 'bg-blue-500/20 text-blue-400' },
];

export default function EvalDashboard() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-12"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {METRICS.map((m, i) => (
          <div key={i} className="bg-[#111827] border border-[#1E293B] p-8 rounded-2xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">{m.label}</p>
            <div className={`text-5xl font-black ${m.color} mb-2`}>{m.value}</div>
            <p className="text-xs text-slate-600 uppercase tracking-widest">{m.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden">
        <div className="p-8 border-b border-[#1E293B]">
          <h2 className="text-xl font-bold text-slate-100 uppercase tracking-widest">Ablation Report (Simulated)</h2>
          <p className="text-sm text-slate-500 mt-1">Comparison of triage strategies on standardized dataset.</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-slate-600 border-b border-[#1E293B]">
                <th className="px-8 py-6 font-bold">Strategy</th>
                <th className="px-8 py-6 font-bold">Accuracy</th>
                <th className="px-8 py-6 font-bold">Hallucination</th>
                <th className="px-8 py-6 font-bold">Safety</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {STRATEGIES.map((s, i) => (
                <tr key={i} className="group hover:bg-[#0F1115]/50 transition-colors">
                  <td className="px-8 py-8">
                    <span className={`text-sm font-bold ${s.name.includes('Our System') ? 'text-blue-400 underline underline-offset-8 decoration-blue-500/30' : 'text-slate-300'}`}>
                      {s.name}
                    </span>
                  </td>
                  <td className="px-8 py-8 text-sm text-slate-400 font-mono">{s.accuracy}</td>
                  <td className="px-8 py-8 text-sm text-slate-400 font-mono">{s.hallucination}</td>
                  <td className="px-8 py-8">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full ${s.safetyColor}`}>
                      {s.safety}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
