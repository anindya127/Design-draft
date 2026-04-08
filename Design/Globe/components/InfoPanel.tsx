import React from 'react';
import { TARGET_COUNTRIES } from '../constants';

const InfoPanel: React.FC = () => {
  return (
    <div className="hidden md:flex flex-col absolute left-8 top-1/2 -translate-y-1/2 z-20 max-h-[80vh] overflow-hidden pointer-events-none">
      <div className="bg-slate-900/80 backdrop-blur-md border border-blue-800/50 p-6 rounded-lg shadow-[0_0_20px_rgba(30,58,138,0.5)] w-80 pointer-events-auto overflow-y-auto custom-scrollbar">
        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-4 border-b border-blue-800 pb-2">
          覆盖目的地
        </h2>
        <div className="space-y-3">
          {TARGET_COUNTRIES.map((country, idx) => (
            <div key={idx} className="flex items-center space-x-3 group">
              <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.8)] group-hover:bg-yellow-400 transition-colors duration-300"></div>
              <span className="text-slate-300 font-mono text-sm tracking-wide group-hover:text-cyan-300 transition-colors">
                {country.name}
              </span>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-blue-800/50">
           <div className="text-xs text-slate-500 font-mono">
              起点: CN (中国)<br/>
              状态: <span className="text-green-500">传输活跃</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;