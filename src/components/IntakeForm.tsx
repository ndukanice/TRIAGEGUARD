import React, { useState } from 'react';
import { Activity, Thermometer, Wind, MousePointer2, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface Vitals {
  bp_sys: string;
  bp_dia: string;
  hr: string;
  temp: string;
  o2: string;
}

interface IntakeData {
  complaint: string;
  history: string;
  onset: string;
  duration: string;
  vitals: Vitals;
}

interface Props {
  onSubmit: (data: IntakeData) => void;
  isLoading: boolean;
}

export default function IntakeForm({ onSubmit, isLoading }: Props) {
  const [data, setData] = useState<IntakeData>({
    complaint: '',
    history: '',
    onset: '',
    duration: '',
    vitals: {
      bp_sys: '',
      bp_dia: '',
      hr: '',
      temp: '',
      o2: ''
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(data);
  };

  const handleQuickLoad = (type: string) => {
    const examples: Record<string, Partial<IntakeData>> = {
      'POTENTIAL STROKE': {
        complaint: 'Sudden onset facial droop and right-sided weakness. Difficulty speaking.',
        history: 'HTN, Diabetes Type 2, Chronic Smoker.',
        onset: '35 mins ago',
        duration: 'Constant',
        vitals: { bp_sys: '185', bp_dia: '105', hr: '92', temp: '37.1', o2: '96' }
      },
      'ACUTE CHEST PAIN': {
        complaint: 'Crushing substernal chest pain, radiating to left jaw. Diaphoresis present.',
        history: 'Previous MI (2018), High Cholesterol.',
        onset: '1 hour ago',
        duration: 'Increasing severity',
        vitals: { bp_sys: '148', bp_dia: '94', hr: '108', temp: '36.8', o2: '94' }
      },
      'ASTHMA ATTACK': {
        complaint: 'Severe wheezing, unable to finish sentences, reliever inhaler not helping.',
        history: 'Asthma since childhood.',
        onset: '1 hour ago',
        duration: 'Worsening',
        vitals: { bp_sys: '132', bp_dia: '84', hr: '118', temp: '37.0', o2: '88' }
      },
      'ABDOMINAL PAIN': {
        complaint: 'Pain in the lower right abdomen with nausea and a low-grade fever.',
        history: 'No significant history.',
        onset: '12 hours ago',
        duration: 'Constant, getting worse',
        vitals: { bp_sys: '122', bp_dia: '78', hr: '94', temp: '38.1', o2: '98' }
      }
    };

    if (examples[type]) {
      setData({
        ...data,
        ...examples[type],
        vitals: { ...data.vitals, ...examples[type].vitals }
      });
    }
  };

  const inputClasses = "w-full bg-[#0F1115] rounded border-[#1E293B] text-slate-200 placeholder:text-slate-700 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm h-12 px-4";
  const areaClasses = "w-full bg-[#0F1115] rounded border-[#1E293B] text-slate-200 placeholder:text-slate-700 focus:ring-blue-500/20 focus:border-emerald-500 transition-all font-mono text-sm p-4 min-h-[140px] resize-none";
  const labelClasses = "block text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2.5";

  return (
    <motion.form 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onSubmit={handleSubmit}
      className="space-y-6"
      id="intake-form"
    >
      <div className="flex items-center gap-4 mb-2">
        <span className="text-[10px] uppercase font-black tracking-widest text-blue-500 flex items-center gap-2">
          <MousePointer2 className="w-3 h-3" /> Quick Load Examples
        </span>
        <div className="flex flex-wrap gap-2">
          {['POTENTIAL STROKE', 'ACUTE CHEST PAIN', 'ASTHMA ATTACK', 'ABDOMINAL PAIN'].map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => handleQuickLoad(tag)}
              className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded text-[10px] font-bold text-slate-400 hover:bg-slate-700 hover:text-white transition-all"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: Profile & Vitals */}
        <div className="space-y-6">
          <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-6">
            <h2 className="text-[10px] uppercase font-black tracking-[0.2em] text-blue-400 mb-6 flex items-center gap-3">
              <Activity className="w-4 h-4" /> Patient Profile
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Age (Years)</label>
                <input
                  type="text"
                  placeholder="e.g. 45"
                  className={inputClasses}
                  value={data.history.match(/Age: (\d+)/)?.[1] || ''}
                  onChange={e => setData({...data, history: `Age: ${e.target.value}, ${data.history}`})}
                />
              </div>
              <div>
                <label className={labelClasses}>Onset / Duration</label>
                <input
                  type="text"
                  placeholder="e.g. 2 hours"
                  className={inputClasses}
                  value={data.onset}
                  onChange={e => setData({...data, onset: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-6">
            <h2 className="text-[10px] uppercase font-black tracking-[0.2em] text-red-500 mb-6 flex items-center gap-3">
              <Activity className="w-4 h-4" /> Vital Statistics
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Temp (°C)</label>
                <input
                  type="text"
                  placeholder="--.-"
                  className={inputClasses}
                  value={data.vitals.temp}
                  onChange={e => setData({...data, vitals: {...data.vitals, temp: e.target.value}})}
                />
              </div>
              <div>
                <label className={labelClasses}>BP (SYS / DIA)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="SYS"
                    className={inputClasses}
                    value={data.vitals.bp_sys}
                    onChange={e => setData({...data, vitals: {...data.vitals, bp_sys: e.target.value}})}
                  />
                  <span className="text-slate-600 font-bold text-sm select-none">/</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="DIA"
                    className={inputClasses}
                    value={data.vitals.bp_dia}
                    onChange={e => setData({...data, vitals: {...data.vitals, bp_dia: e.target.value}})}
                  />
                </div>
              </div>
              <div>
                <label className={labelClasses}>Heart Rate</label>
                <input
                  type="text"
                  placeholder="bpm"
                  className={inputClasses}
                  value={data.vitals.hr}
                  onChange={e => setData({...data, vitals: {...data.vitals, hr: e.target.value}})}
                />
              </div>
              <div>
                <label className={labelClasses}>SpO2</label>
                <input
                  type="text"
                  placeholder="%"
                  className={inputClasses}
                  value={data.vitals.o2}
                  onChange={e => setData({...data, vitals: {...data.vitals, o2: e.target.value}})}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Narrative */}
        <div className="space-y-6">
          <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-6 flex flex-col h-full">
            <div className="flex-1 space-y-6">
              <div>
                <label className={labelClasses} style={{ color: '#F97316' }}>
                  <Activity className="w-3 h-3 inline mr-2" /> Presenting Symptoms
                </label>
                <textarea
                  required
                  className={areaClasses}
                  placeholder="Chief complaints, pain scale, onset details..."
                  value={data.complaint}
                  onChange={e => setData({...data, complaint: e.target.value})}
                />
              </div>

              <div>
                <label className={labelClasses} style={{ color: '#8B5CF6' }}>
                  <Activity className="w-3 h-3 inline mr-2" /> Clinical History
                </label>
                <textarea
                  className={areaClasses}
                  placeholder="Comorbidities, current medications, surgical history..."
                  value={data.history}
                  onChange={e => setData({...data, history: e.target.value})}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`mt-6 w-full h-16 rounded border bg-blue-500/10 border-blue-500/30 text-blue-400 font-black uppercase tracking-[0.2em] text-[11px] transition-all flex items-center justify-center gap-3 hover:bg-blue-500/20 active:scale-[0.98]
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full" />
                  Analyzing Sequence...
                </>
              ) : (
                <>
                  Start Triage Analysis <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.form>
  );
}
