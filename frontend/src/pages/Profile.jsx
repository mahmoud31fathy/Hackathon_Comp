import React from 'react';

const Profile = () => {
  return (
    <div className="w-full h-full glass-panel flex flex-col items-center justify-center p-8">
       <div className="w-24 h-24 bg-brand-800 rounded-full border-2 border-[var(--color-accent-blue)] mb-6 flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(14,165,233,0.3)]">
          <div className="w-full h-full bg-[radial-gradient(circle_at_30%_30%,#00f0ff,#0ea5e9)] opacity-80"></div>
       </div>
       <h1 className="text-3xl font-bold text-white tracking-widest uppercase mb-2">Lead Engineer</h1>
       <p className="text-[var(--color-accent-neon)] font-mono mb-8 text-sm">ID: VX-9942A</p>
       
       <div className="bg-brand-900/60 p-6 rounded-xl border border-white/5 w-full max-w-md">
          <h2 className="text-xs text-brand-400 tracking-widest font-mono mb-4 uppercase">Clearance Levels</h2>
          <div className="space-y-3">
             <div className="flex justify-between border-b border-white/5 pb-2">
               <span className="text-brand-300">Fluid Dynamics</span>
               <span className="text-[var(--color-accent-neon)]">Level 5</span>
             </div>
             <div className="flex justify-between border-b border-white/5 pb-2">
               <span className="text-brand-300">Thermal Analysis</span>
               <span className="text-[var(--color-accent-blue)]">Level 3</span>
             </div>
             <div className="flex justify-between pb-1">
               <span className="text-brand-300">Structural</span>
               <span className="text-brand-500">Restricted</span>
             </div>
          </div>
       </div>
    </div>
  );
};

export default Profile;
