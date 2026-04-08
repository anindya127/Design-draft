import React from 'react';
import Globe from './components/Globe';
import InfoPanel from './components/InfoPanel';

function App() {
  return (
    <div className="w-screen h-screen bg-slate-950 text-white relative overflow-hidden">
      
      {/* Header Overlay */}
      <header className="absolute top-0 left-0 w-full z-30 p-6 flex justify-between items-start pointer-events-none">
        <div>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-blue-400 to-cyan-200 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
            全球网络
          </h1>
          <p className="text-blue-300 font-mono text-xs md:text-sm mt-1 tracking-widest opacity-80 uppercase">
             GCSS 平台合作伙伴国家可视化
          </p>
        </div>
        <div className="hidden md:block text-right">
             <div className="inline-block px-3 py-1 border border-cyan-500/30 rounded bg-cyan-900/10 text-cyan-400 font-mono text-xs animate-pulse">
                实时数据视图
             </div>
        </div>
      </header>

      {/* Main Visualization */}
      <main className="w-full h-full">
        <Globe />
      </main>

      {/* Side Panel for Country List */}
      <InfoPanel />

      {/* Footer / Status Bar */}
      <footer className="absolute bottom-0 w-full z-30 p-4 border-t border-white/5 bg-slate-950/50 backdrop-blur-sm flex justify-between items-center text-xs font-mono text-slate-500 pointer-events-none">
        <div>
           系统版本 3.4.1 // 渲染引擎: D3_GEO
        </div>
        <div className="flex gap-4">
           <span>延迟: 12ms</span>
           <span>节点: {16}</span>
        </div>
      </footer>
    </div>
  );
}

export default App;