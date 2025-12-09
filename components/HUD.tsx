import React from 'react';

interface HUDProps {
  score: number;
  lives: number;
}

const HUD: React.FC<HUDProps> = ({ score, lives }) => {
  return (
    <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none">
      <div>
        <div className="flex items-center gap-2">
            <span className="text-neon-blue font-mono text-sm uppercase tracking-widest">Score</span>
        </div>
        <div className="text-3xl font-bold text-white font-mono leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {score.toString().padStart(6, '0')}
        </div>
      </div>

      <div className="flex flex-col items-end">
        <div className="text-neon-red font-mono text-sm uppercase tracking-widest mb-1">Hull Integrity</div>
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i} 
              className={`w-8 h-2 skew-x-[-20deg] ${i < lives ? 'bg-neon-red shadow-[0_0_8px_rgba(255,42,42,0.8)]' : 'bg-slate-800'}`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HUD;