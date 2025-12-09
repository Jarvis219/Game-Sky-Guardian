import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import MainMenu from './components/MainMenu';
import HUD from './components/HUD';
import GameOver from './components/GameOver';
import { GameState } from './types';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(0);

  // Load Highscore
  useEffect(() => {
    const stored = localStorage.getItem('sky_guardian_highscore');
    if (stored) setHighScore(parseInt(stored, 10));
  }, []);

  const handleStartGame = () => {
    setScore(0);
    setLives(3);
    setGameState('PLAYING');
  };

  const handleGameOver = (finalScore: number) => {
    setGameState('GAMEOVER');
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('sky_guardian_highscore', finalScore.toString());
    }
  };

  const handleRestart = () => {
    setScore(0);
    setLives(3);
    setGameState('PLAYING');
  };

  return (
    <div className="w-full h-screen bg-space-900 flex items-center justify-center relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon-blue/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-pink/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative">
        <GameCanvas 
          gameState={gameState} 
          setGameState={setGameState}
          setScore={setScore}
          setLives={setLives}
          onGameOver={handleGameOver}
        />
        
        {gameState === 'MENU' && <MainMenu onStart={handleStartGame} highScore={highScore} />}
        
        {(gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'GAMEOVER') && (
          <HUD score={score} lives={lives} />
        )}
        
        {gameState === 'PAUSED' && (
           <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20">
             <h2 className="text-4xl font-bold text-white tracking-widest">PAUSED</h2>
           </div>
        )}

        {gameState === 'GAMEOVER' && (
          <GameOver score={score} onRestart={handleRestart} onMenu={() => setGameState('MENU')} />
        )}
      </div>
      
      <div className="absolute bottom-4 text-slate-600 text-xs font-mono">
        v1.0.0 | SYSTEM READY
      </div>
    </div>
  );
};

export default App;