import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import type { TriageResult } from '../types.ts';

interface Props {
  result: TriageResult;
  onReset: () => void;
  intakeData?: any;
}

const URGENCY_MAP = {
  'Immediate': { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: ShieldAlert, label: 'Resuscitation Required', level: '1' },
  'Emergent': { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: AlertTriangle, label: 'High-Risk Condition', level: '2' },
  'Urgent': { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle, label: 'Stable Acute Case', level: '3' },
  'Non-urgent': { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2, label: 'Routine Medical Care', level: '4' },
};

export default function TriageDashboard({ result, onReset, intakeData }: Props) {
  const config = URGENCY_MAP[result.triage_label] || URGENCY_MAP['Urgent'];
  const label = result.triage_label in URGENCY_MAP ? result.triage_label : 'Urgent';
  const SeverityIcon = config.icon;
  const v = result.verification;
  const verified = v.has_valid_citation && v.invalid_citation_ids.length === 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col lg:flex-row h-full overflow-hidden"
      id="triage-dashboard"
    >
      {/* Left Column: Intake Summary */}
      <aside className="w-full lg:w-80 border-r border-[#1E293B] bg-[#0F1115] flex flex-col p-6 gap-6 shrink-0 overflow-y-auto">
        <div className="space-y-6">
          <div className="flex justify-between items-end border-b border-[#1E293B] pb-4">
            <h2 className="font-serif italic text-xl text-slate-400">Intake Summary</h2>
            <button onClick={onReset} className="text-[10px] uppercase text-emerald-500 font-bold tracking-widest hover:text-emerald-400 transition-colors">Reset</button>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Vitals Stream</p>
              <div className="grid grid-cols-2 gap-3 text-sm font-mono">
                <div className="flex flex-col">
                  <span className="text-slate-600 text-[9px] uppercase">BP</span>
                  <span className="text-slate-200">{intakeData?.vitals?.bp_sys || '--'}/{intakeData?.vitals?.bp_dia || '--'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-600 text-[9px] uppercase">HR</span>
                  <span className="text-slate-200">{intakeData?.vitals?.hr || '--'} BPM</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-600 text-[9px] uppercase">SpO2</span>
                  <span className="text-emerald-400">{intakeData?.vitals?.o2 || '--'}%</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Primary Symptom</p>
              <p className="text-sm leading-relaxed text-slate-300 italic font-sans">
                "{intakeData?.complaint || 'No complaint available.'}"
              </p>
            </div>

            {(intakeData?.onset || intakeData?.duration) && (
              <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Temporal Context</p>
                <div className="text-xs text-slate-400 space-y-1">
                  <div>Onset: {intakeData.onset || 'Unknown'}</div>
                  <div>Duration: {intakeData.duration || 'Unknown'}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Middle Column: Core Recommendation */}
      <section className="flex-1 flex flex-col p-8 bg-[#111827] overflow-y-auto">
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-500 font-bold mb-2">AI-Synthesized Prioritization</p>
            <h1 className={`text-6xl font-serif ${config.color} italic font-bold leading-tight flex items-baseline gap-4`}>
              {label} 
              <span className="text-slate-400 font-sans not-italic text-2xl">(Lvl {config.level})</span>
            </h1>
          </div>
          {v.escalated_by_safety_floor && (
            <div className="max-w-xs p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-300">
              Escalated from <b>{result.model_label}</b> by the vital-sign safety rule.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className={`${config.bg} border ${config.border} p-6 rounded-2xl`}>
            <h3 className={`text-[10px] uppercase font-bold ${config.color} mb-4 tracking-[0.15em] flex items-center gap-2`}>
              <div className={`w-2 h-2 rounded-full ${config.color.replace('text', 'bg')}`}></div> 
              Clinical Red Flags
            </h3>
            <ul className="text-sm space-y-3 text-slate-300">
              {result.red_flags.length > 0 ? (
                result.red_flags.map((flag, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-tight">
                    <span className="text-slate-600 mt-0.5">•</span> {flag}
                  </li>
                ))
              ) : (
                <li className="text-slate-500 italic">No red flags flagged.</li>
              )}
            </ul>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-2xl">
            <h3 className="text-[10px] uppercase font-bold text-emerald-400 mb-4 tracking-[0.15em] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 font-black"></div> 
              Recommended Directives
            </h3>
            <ul className="text-sm space-y-3 text-slate-300">
              {result.recommended_next_steps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2 leading-tight">
                  <span className="text-emerald-600 mt-0.5">→</span> {step}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex-1 p-8 bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col">
          <h3 className="text-[10px] uppercase font-bold text-slate-600 mb-4 tracking-widest">Rationale & Evidence Synthesis</h3>
          <p className="text-lg text-slate-200 font-sans leading-relaxed">
            {result.rationale}
          </p>
          
          <div className="mt-auto pt-8 border-t border-slate-800/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-slate-500 uppercase italic">Citation check (done in code)</p>
              <span className={`text-sm font-mono ${verified ? 'text-emerald-400' : 'text-amber-400'}`}>{verified ? 'PASSED' : 'REVIEW'}</span>
            </div>
            <div className="p-3 bg-slate-800/40 border border-slate-700/40 rounded-lg text-[10px] text-slate-400 font-mono space-y-1">
              <div>{result.citations.length} of {v.citations_checked} citations matched a retrieved passage</div>
              {v.invalid_citation_ids.length > 0 && <div className="text-amber-400">Dropped unknown ids: {v.invalid_citation_ids.join(', ')}</div>}
              <div>{v.vital_sign_flags} critical vital sign(s) detected by rule</div>
            </div>
          </div>
        </div>
      </section>

      {/* Right Column: Protocols & Evidence */}
      <aside className="w-full lg:w-80 border-l border-[#1E293B] bg-[#0F1115] flex flex-col p-6 overflow-y-auto shrink-0">
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-6 flex items-center gap-2">
            <SeverityIcon className="w-3.5 h-3.5" /> Cited Passages
          </h2>
        <div className="space-y-4">
          {result.citations.map((cite, idx) => (
            <div key={idx} className="p-4 border-l-2 border-emerald-500 bg-emerald-500/5 rounded-r-xl">
              <p className="text-[9px] text-emerald-400 uppercase font-black mb-1.5">{cite.title} ({cite.passage_id})</p>
              <p className="text-xs leading-relaxed text-slate-400 italic">
                "{cite.snippet}"
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 p-5 border border-slate-800 bg-[#111827] rounded-2xl">
          <p className="text-[10px] uppercase text-slate-500 font-bold mb-3">Retrieval (top {result.retrieved.length}, cosine similarity)</p>
          <ul className="text-[11px] text-slate-400 space-y-1.5 font-mono">
            {result.retrieved.map((p) => (
              <li key={p.id} className="flex justify-between gap-2">
                <span className="truncate" title={p.id}>{p.id}</span>
                <span className="text-slate-500">{p.score.toFixed(3)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 p-5 border border-slate-800 bg-[#111827] rounded-2xl">
          <p className="text-[10px] uppercase text-amber-500 font-bold mb-3 flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            Missing Information
          </p>
          <ul className="text-[11px] text-slate-500 space-y-2">
            {result.missing_info.map((info, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="text-amber-500/50">?</span> {info}
              </li>
            ))}
          </ul>
        </div>
        
      </aside>
    </motion.div>
  );
}
