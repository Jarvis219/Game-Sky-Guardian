import React from 'react';

interface GameOverProps {
  score: number;
  onRestart: () => void;
  onMenu: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ score, onRestart, onMenu }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/20 backdrop-blur-sm z-20">
      <h2 className="text-5xl font-black text-white mb-2 tracking-widest animate-pulse">CRITICAL FAILURE</h2>
      <p className="text-neon-red font-mono mb-8">SHIP DESTROYED</p>
      
      <div className="bg-black/60 p-8 rounded-xl border border-neon-red/50 text-center mb-8 shadow-[0_0_30px_rgba(255,0,0,0.2)]">
        <p className="text-slate-400 text-sm mb-2 uppercase">Final Score</p>
        <p className="text-5xl font-mono text-white font-bold">{score.toLocaleString()}</p>
      </div>

      <div className="flex gap-4">
        <button 
          onClick={onMenu}
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded border border-slate-600 transition-colors"
        >
          MAIN MENU
        </button>
        <button 
          onClick={onRestart}
          className="px-6 py-3 bg-neon-red hover:bg-red-600 text-white font-bold rounded shadow-[0_0_15px_rgba(255,42,42,0.5)] transition-all hover:scale-105"
        >
          RETRY MISSION
        </button>
      </div>
    </div>
  );
};

export default GameOver;