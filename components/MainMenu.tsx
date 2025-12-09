import React from 'react';
import { audioService } from '../services/audioService';

interface MainMenuProps {
  onStart: () => void;
  highScore: number;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStart, highScore }) => {
  const handleStart = () => {
    audioService.resume();
    onStart();
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10">
      <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-pink mb-4 tracking-tighter filter drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">
        SKY GUARDIAN
      </h1>
      <p className="text-slate-400 mb-8 tracking-widest text-sm uppercase">Aether Defense System Online</p>
      
      <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700 mb-8 text-center min-w-[300px]">
        <p className="text-neon-green font-mono text-xl mb-2">HIGH SCORE</p>
        <p className="text-4xl font-bold text-white">{highScore.toLocaleString()}</p>
      </div>

      <button 
        onClick={handleStart}
        className="group relative px-8 py-4 bg-neon-blue text-black font-bold text-xl uppercase tracking-wider skew-x-[-10deg] hover:bg-white transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,243,255,0.8)]"
      >
        <span className="block skew-x-[10deg]">Initialize Mission</span>
        <div className="absolute inset-0 border-2 border-white opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-200"></div>
      </button>

      <div className="mt-12 flex gap-8 text-slate-500 text-sm font-mono">
        <div className="flex flex-col items-center">
          <div className="flex gap-1 mb-1">
            <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-600">W</kbd>
            <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-600">A</kbd>
            <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-600">S</kbd>
            <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-600">D</kbd>
          </div>
          <span>MOVE</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex gap-1 mb-1">
            <kbd className="px-4 py-1 bg-slate-800 rounded border border-slate-600">SPACE</kbd>
          </div>
          <span>SHOOT</span>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;