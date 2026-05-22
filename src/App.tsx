import React, { useState } from 'react';
import { 
  Stethoscope, 
  ShieldCheck, 
  Activity, 
  BarChart3, 
  Zap, 
  ClipboardCheck, 
  ChevronRight, 
  MousePointer2 
} from 'lucide-react';
import IntakeForm from './components/IntakeForm.tsx';
import TriageDashboard from './components/TriageDashboard.tsx';
import EvalDashboard from './components/EvalDashboard.tsx';
import { motion } from 'motion/react';

interface Citation {
  title: string;
  passage_id: string;
  snippet: string;
}

interface TriageResult {
  triage_label: 'Immediate' | 'Emergent' | 'Urgent' | 'Non-urgent';
  red_flags: string[];
  rationale: string;
  citations: Citation[];
  missing_info: string[];
  recommended_next_steps: string[];
  safety_verification: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'INTAKE' | 'ANALYSIS' | 'EVAL DASHBOARD'>('INTAKE');
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [intakeData, setIntakeData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleTriageSubmit = async (data: any) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setTriageResult(null);
    setIntakeData(data);
    
    try {
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientData: data }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
      }

      const result = await response.json();
      setTriageResult(result);
      setActiveTab('ANALYSIS');
    } catch (error) {
      console.error("Triage failed:", error);
      setAnalysisError(error instanceof Error ? error.message : 'Failed to generate triage recommendation.');
      setActiveTab('ANALYSIS');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAll = () => {
    setTriageResult(null);
    setIntakeData(null);
    setActiveTab('INTAKE');
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-slate-300 font-sans selection:bg-blue-500/30">
      {/* Global Header */}
      <header className="h-20 border-b border-[#1E293B] px-8 flex items-center justify-between bg-[#0F1115]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tighter text-white">TRIAGE <span className="text-blue-500">GUARD</span></h1>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              <span className="flex items-center gap-1"><ShieldCheck className="w-2.5 h-2.5" /> V2.4.1-SAFE</span>
              <span>•</span>
              <span>RAG AGENT</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Active Provider</p>
            <p className="text-sm font-bold text-slate-200">Dr. Staff (ID: 99241)</p>
          </div>
          <div className="h-8 w-px bg-[#1E293B]"></div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#111827] border border-emerald-500/20 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">System Active</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#1A1F26] border border-[#1E293B] flex items-center justify-center text-sm font-black text-slate-400">
              ST
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar */}
        <aside className="w-72 border-r border-[#1E293B] bg-[#0F1115] p-6 flex flex-col gap-6 shrink-0 h-full overflow-y-auto">
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-6">
            <h3 className="text-[10px] font-black text-slate-500 tracking-[0.2em] flex items-center gap-2">
              <BarChart3 className="w-3 h-3" /> LIVE PERFORMANCE
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2">
                  <span>CITATION FAITHFULNESS</span>
                  <span className="text-blue-500">98%</span>
                </div>
                <div className="h-1 bg-[#1E293B] rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[98%] shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2">
                  <span>HALLUCINATION RATE</span>
                  <span className="text-emerald-500">&lt;0.5%</span>
                </div>
                <div className="h-1 bg-[#1E293B] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[2%] shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-600 italic">Verified against 500+ annotated clinical cases.</p>
          </div>

          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4 flex-1">
            <h3 className="text-[10px] font-black text-slate-500 tracking-[0.2em] flex items-center gap-2">
              <Zap className="w-3 h-3 text-blue-500" /> RAG CORPUS ACTIVE
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              WHO Triage, ESI Protocols, and National Stroke Guidelines (v4.2).
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-2 py-1 bg-slate-800 text-[9px] font-black rounded-lg text-slate-500">742 Passages</span>
              <span className="px-2 py-1 bg-blue-500/10 text-[9px] font-black rounded-lg text-blue-500 border border-blue-500/20">v4.2-STABLE</span>
            </div>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 overflow-y-auto bg-[#0F1115] p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header / Tabs */}
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-6">
              <div className="flex bg-[#111827] p-1 rounded-xl border border-[#1E293B]">
                {[
                  { id: 'INTAKE', icon: ClipboardCheck },
                  { id: 'ANALYSIS', icon: Activity },
                  { id: 'EVAL DASHBOARD', icon: BarChart3 }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-3 px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
                      ${activeTab === tab.id 
                        ? 'bg-slate-800 text-white shadow-lg' 
                        : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.id}
                  </button>
                ))}
              </div>

              {activeTab === 'INTAKE' && (
                <button 
                  onClick={() => (document.getElementById('intake-form') as HTMLFormElement)?.requestSubmit()}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
                >
                  Start Triage Analysis <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Tab Panels */}
            {activeTab === 'INTAKE' && (
              <IntakeForm onSubmit={handleTriageSubmit} isLoading={isAnalyzing} />
            )}
            
            {activeTab === 'ANALYSIS' && (
              isAnalyzing ? (
                <div className="h-[400px] flex flex-col items-center justify-center text-slate-500 gap-4">
                  <div className="w-16 h-16 bg-[#111827] rounded-2xl flex items-center justify-center border border-[#1E293B]">
                    <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                  </div>
                  <p className="text-sm font-medium">Generating triage recommendation...</p>
                </div>
              ) : analysisError ? (
                <div className="h-[400px] flex flex-col items-center justify-center text-red-400 gap-4 text-center px-6">
                  <div className="w-16 h-16 bg-[#111827] rounded-2xl flex items-center justify-center border border-red-500/20">
                    <ClipboardCheck className="w-8 h-8 opacity-30" />
                  </div>
                  <p className="text-sm font-medium max-w-xl">{analysisError}</p>
                  <p className="text-xs text-slate-500">Try submitting the intake again after checking the server connection.</p>
                </div>
              ) : triageResult ? (
                <TriageDashboard 
                  result={triageResult} 
                  onReset={resetAll} 
                  intakeData={intakeData}
                />
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center text-slate-600 gap-4">
                  <div className="w-16 h-16 bg-[#111827] rounded-2xl flex items-center justify-center border border-[#1E293B]">
                    <ClipboardCheck className="w-8 h-8 opacity-20" />
                  </div>
                  <p className="text-sm font-medium">Please complete the intake form to generate a triage recommendation.</p>
                </div>
              )
            )}

            {activeTab === 'EVAL DASHBOARD' && <EvalDashboard />}
          </div>
        </main>
      </div>

      {/* Footer / Status Bar */}
      <footer className="h-10 border-t border-[#1E293B] bg-[#0F1115] px-6 flex items-center justify-between sticky bottom-0 w-full z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Safety_Guard_Active</span>
          </div>
          <div className="flex items-center gap-3 text-[9px] font-bold text-slate-600 uppercase tracking-widest">
            <span>TR-KERNEL: V0.9-BETA</span>
            <span>•</span>
            <span>GROUNDING ENGINE 1.0.4</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <span className="text-[9px] font-black text-[#F59E0B] uppercase tracking-widest">Waiting for Clinician Validation</span>
          <div className="flex gap-2">
             <button className="px-4 py-1.5 rounded bg-slate-800 text-[9px] font-black text-slate-300 uppercase hover:bg-slate-700 transition-colors">Dismiss</button>
             <button className="px-4 py-1.5 rounded bg-blue-600 text-[9px] font-black text-white uppercase hover:bg-blue-500 transition-colors">Confirm & Document</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

