import React from 'react';

const Settings = () => {
  return (
    <div className="w-full h-full glass-panel flex flex-col p-8">
       <h1 className="text-2xl font-bold text-white tracking-widest uppercase mb-8 border-b border-white/10 pb-4">System Preferences</h1>
       
       <div className="space-y-6 max-w-2xl">
          <div className="bg-brand-800/50 p-6 rounded-xl border border-white/5 flex justify-between items-center hover:bg-white/5 transition-colors">
             <div>
                <h3 className="text-white font-semibold">High Performance Computation</h3>
                <p className="text-sm text-brand-300">Utilize experimental WebGL APIs for rendering</p>
             </div>
             <div className="w-12 h-6 bg-[var(--color-accent-blue)] rounded-full relative cursor-pointer shadow-[0_0_10px_var(--color-accent-blue)]">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-md"></div>
             </div>
          </div>

          <div className="bg-brand-800/50 p-6 rounded-xl border border-white/5 flex gap-4 hover:bg-white/5 transition-colors flex-col sm:flex-row">
             <div className="flex-1">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  Simulation Cache
                  <span className="text-[10px] bg-[var(--color-accent-pink)]/20 text-[var(--color-accent-pink)] px-2 py-0.5 rounded-full border border-[var(--color-accent-pink)]/50">NEAR LIMIT</span>
                </h3>
                <p className="text-sm text-brand-300 mb-2 mt-1">Store previous prediction arrays locally.</p>
                <div className="w-full bg-brand-900 rounded-full h-2 mb-1 overflow-hidden">
                  <div className="bg-[var(--color-accent-pink)] h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <p className="text-xs text-brand-400">1.8GB / 2.0GB used</p>
             </div>
             <button className="self-center sm:self-end px-4 py-2 border border-white/20 rounded-lg text-xs font-mono tracking-widest hover:bg-[var(--color-accent-pink)]/20 text-brand-300 hover:text-[var(--color-accent-pink)] hover:border-[var(--color-accent-pink)] transition-all">PURGE</button>
          </div>
       </div>
    </div>
  );
};
export default Settings;
