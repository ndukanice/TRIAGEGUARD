import React, { useEffect, useState } from 'react';
import {
  Stethoscope,
  ShieldCheck,
  Activity,
  BarChart3,
  Zap,
  ClipboardCheck,
  ChevronRight,
} from 'lucide-react';
import IntakeForm from './components/IntakeForm.tsx';
import TriageDashboard from './components/TriageDashboard.tsx';
import EvalDashboard from './components/EvalDashboard.tsx';
import type { CorpusInfo, TriageResult } from './types.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<'INTAKE' | 'ANALYSIS' | 'EVAL DASHBOARD'>('INTAKE');
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [intakeData, setIntakeData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [corpus, setCorpus] = useState<CorpusInfo | null>(null);

  useEffect(() => {
    fetch('/api/corpus').then((r) => r.json()).then(setCorpus).catch(() => setCorpus(null));
  }, []);

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
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || `Request failed with status ${response.status}`);
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
              <span className="flex items-center gap-1"><ShieldCheck className="w-2.5 h-2.5" /> Retrieval-augmented triage support</span>
            </div>
          </div>
        </div>

        <div className={`flex items-center gap-2 px-3 py-1.5 bg-[#111827] border rounded-full ${corpus?.passages ? 'border-emerald-500/20' : 'border-amber-500/20'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${corpus?.passages ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${corpus?.passages ? 'text-emerald-500' : 'text-amber-500'}`}>
            {corpus?.passages ? 'Index loaded' : 'Index not built'}
          </span>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar */}
        <aside className="w-72 border-r border-[#1E293B] bg-[#0F1115] p-6 flex flex-col gap-6 shrink-0 h-full overflow-y-auto">
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4 flex-1">
            <h3 className="text-[10px] font-black text-slate-500 tracking-[0.2em] flex items-center gap-2">
              <Zap className="w-3 h-3 text-blue-500" /> KNOWLEDGE BASE
            </h3>
            {corpus ? (
              <>
                <ul className="text-xs text-slate-400 leading-relaxed space-y-1">
                  {corpus.protocols.map((title) => <li key={title}>• {title}</li>)}
                </ul>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-2 py-1 bg-slate-800 text-[9px] font-black rounded-lg text-slate-500">{corpus.passages} passages</span>
                  {corpus.embedding_model && (
                    <span className="px-2 py-1 bg-blue-500/10 text-[9px] font-black rounded-lg text-blue-500 border border-blue-500/20">{corpus.embedding_model}</span>
                  )}
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-500">Loading...</p>
            )}
            <p className="text-[10px] text-slate-600 italic">
              Demo protocols written for this project. See the Eval tab for measured performance.
            </p>
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

      {/* Footer */}
      <footer className="h-10 border-t border-[#1E293B] bg-[#0F1115] px-6 flex items-center sticky bottom-0 w-full z-50">
        <span className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-widest">
          Portfolio prototype · not a medical device · not for clinical use
        </span>
      </footer>
    </div>
  );
}

