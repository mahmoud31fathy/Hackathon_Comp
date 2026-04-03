import React from 'react';

const ShapeCard = ({ id, name, type, icon, active, onClick }) => {
  return (
    <button 
      onClick={() => onClick(id)}
      className={`w-full text-left p-4 rounded-xl transition-all duration-300 flex items-center gap-4 border ${
        active 
          ? 'bg-[var(--color-accent-blue)]/10 border-[var(--color-accent-blue)]/50 shadow-[0_0_15px_rgba(14,165,233,0.3)]' 
          : 'bg-brand-800/40 border-white/5 hover:border-white/20 hover:bg-brand-800'
      }`}
    >
      <div className={`p-3 rounded-lg ${active ? 'bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-neon)]' : 'bg-brand-700 text-brand-300'}`}>
        {icon}
      </div>
      <div>
        <h3 className={`font-semibold tracking-wide ${active ? 'text-white' : 'text-brand-100'}`}>{name}</h3>
        <span className="text-xs text-brand-400 capitalize">{type}</span>
      </div>
    </button>
  );
};

export default ShapeCard;
