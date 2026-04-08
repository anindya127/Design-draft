import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  ArrowRight, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  Activity,
  Terminal,
  Settings,
  ChevronRight
} from 'lucide-react';
import Diagram from './components/Diagram';

export default function App() {
  const [view, setView] = useState<'B2C' | 'B2B'>('B2C');

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-mono selection:bg-blue-500/30 overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/5 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="px-10 py-8 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                <Zap className="text-white w-7 h-7" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-white">EV_OS // CORE</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Activity className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">System Status: Operational</span>
              </div>
            </div>
          </div>
          
          <nav className="flex bg-slate-900/50 p-1.5 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setView('B2C')}
              className={`px-8 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                view === 'B2C' 
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              B2C_MODEL
            </button>
            <button
              onClick={() => setView('B2B')}
              className={`px-8 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                view === 'B2B' 
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              B2B_MODEL
            </button>
          </nav>

          <div className="hidden xl:flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Uptime</p>
              <p className="text-xs font-bold text-white">99.998%</p>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <Settings className="w-5 h-5 text-slate-500 hover:text-white cursor-pointer transition-colors" />
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-10 py-16">
        <div className="grid lg:grid-cols-[1fr_400px] gap-16 items-start">
          
          {/* Diagram Area */}
          <div className="space-y-10">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <Terminal className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Architecture_Visualizer_v2.0</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data_Stream</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Revenue_Flow</span>
                </div>
              </div>
            </div>

            <div className="aspect-[16/9] w-full relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-emerald-600/20 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                  className="w-full h-full relative z-10"
                >
                  <Diagram type={view} />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-3 gap-8">
              <MetricCard label="Active Sessions" value="1,284" trend="+12%" />
              <MetricCard label="Network Load" value="42.8%" trend="Stable" />
              <MetricCard label="Revenue 24h" value="$42,902" trend="+5.4%" />
            </div>
          </div>

          {/* Sidebar / Description */}
          <aside className="space-y-10">
            <section className="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Layers className="w-24 h-24" />
              </div>
              <h2 className="text-2xl font-black text-white mb-6 tracking-tighter">
                {view === 'B2C' ? 'B2C_FLOW_LOGIC' : 'B2B_ENTERPRISE_LOGIC'}
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-8 font-medium">
                {view === 'B2C' 
                  ? 'A direct interaction model where end-users authenticate via QR and communicate with a central server to manage charging sessions with the CPO.'
                  : 'An enterprise-grade model supporting multi-tenant operators (CPO 1-3) aggregated under a Super Admin management layer for global oversight.'}
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-500 font-bold border-b border-slate-800 pb-2">
                  <span>Logic_Sequence</span>
                  <span>Status</span>
                </div>
                {view === 'B2C' ? (
                  <>
                    <StepItem label="User -> QR -> Charger" status="Active" />
                    <StepItem label="Charger -> Server" status="Active" />
                    <StepItem label="Server -> CPO" status="Active" />
                    <StepItem label="Server -> User" status="Active" />
                  </>
                ) : (
                  <>
                    <StepItem label="User -> QR -> Charger" status="Active" />
                    <StepItem label="Charger -> Server" status="Active" />
                    <StepItem label="Server -> CPO1" status="Active" />
                    <StepItem label="Server -> User" status="Active" />
                    <StepItem label="CPO[1-3] -> Admin" status="Active" />
                  </>
                )}
              </div>
            </section>

            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-3xl shadow-[0_20px_40px_rgba(37,99,235,0.2)] group cursor-pointer">
              <div className="flex justify-between items-start mb-6">
                <ShieldCheck className="w-10 h-10 text-white/90" />
                <ChevronRight className="w-6 h-6 text-white/50 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Security_Protocol_v4</h3>
              <p className="text-blue-100/70 text-xs leading-relaxed">
                All data flows are encrypted via AES-256 and authenticated through the central server layer.
              </p>
            </div>
          </aside>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-[1600px] mx-auto px-10 py-16 border-t border-slate-900 mt-16">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center">
              <Cpu className="w-4 h-4 text-slate-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.4em] text-slate-600">EV_CORE_SYSTEMS // 2026</span>
          </div>
          <div className="flex gap-12">
            <FooterLink label="System_Logs" />
            <FooterLink label="API_Docs" />
            <FooterLink label="Network_Map" />
          </div>
        </div>
      </footer>
    </div>
  );
}

function MetricCard({ label, value, trend }: { label: string, value: string, trend: string }) {
  return (
    <div className="bg-slate-900/30 border border-slate-800/50 p-6 rounded-2xl hover:border-slate-700 transition-colors">
      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">{label}</p>
      <div className="flex items-baseline gap-3">
        <h4 className="text-2xl font-black text-white tracking-tighter">{value}</h4>
        <span className={`text-[10px] font-bold ${trend.startsWith('+') ? 'text-emerald-500' : 'text-slate-500'}`}>{trend}</span>
      </div>
    </div>
  );
}

function StepItem({ label, status }: { label: string, status: string }) {
  return (
    <div className="flex items-center justify-between group">
      <span className="text-xs font-bold text-slate-400 group-hover:text-blue-400 transition-colors">{label}</span>
      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase tracking-widest">{status}</span>
    </div>
  );
}

function FooterLink({ label }: { label: string }) {
  return (
    <a href="#" className="text-[10px] font-bold text-slate-600 hover:text-white uppercase tracking-widest transition-colors">
      {label}
    </a>
  );
}
