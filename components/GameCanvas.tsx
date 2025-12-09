import React, { useRef, useEffect } from 'react';
import { GameState, Player, Enemy, Bullet, Particle, EnemyType } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, PLAYER_SPEED, KEYS, PLAYER_SHOOT_DELAY, BULLET_SPEED, ENEMY_BULLET_SPEED, PLAYER_SIZE } from '../constants';
import { generateId, checkCollision, getRandomRange, clamp } from '../utils/gameUtils';
import { audioService } from '../services/audioService';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  setScore: (score: number) => void;
  setLives: (lives: number) => void;
  onGameOver: (finalScore: number) => void;
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, setGameState, setScore, setLives, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  
  // Game Entities Refs (Mutable for performance)
  const playerRef = useRef<Player>({
    id: 'player',
    pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 100 },
    velocity: { x: 0, y: 0 },
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    color: COLORS.player,
    markedForDeletion: false,
    hp: 3,
    maxHp: 3,
    speed: PLAYER_SPEED,
    shootTimer: 0,
    invulnerableTimer: 0
  });

  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]); // Background stars
  const keysPressed = useRef<Set<string>>(new Set());
  const scoreRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const difficultyMultiplierRef = useRef(1);
  const bgScrollRef = useRef(0); // For grid scrolling

  // Initialize Stars
  useEffect(() => {
    const stars: Star[] = [];
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 50 + 20,
        opacity: Math.random()
      });
    }
    starsRef.current = stars;
  }, []);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key);
      if (KEYS.PAUSE.includes(e.key)) {
        if (gameState === 'PLAYING') setGameState('PAUSED');
        else if (gameState === 'PAUSED') setGameState('PLAYING');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, setGameState]);

  // Game Loop
  useEffect(() => {
    if (gameState !== 'PLAYING') {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      return;
    }

    // Initialize/Reset if starting fresh
    if (lastTimeRef.current === 0) {
      playerRef.current.pos = { x: CANVAS_WIDTH / 2 - 16, y: CANVAS_HEIGHT - 100 };
      playerRef.current.hp = 3;
      playerRef.current.invulnerableTimer = 2;
      enemiesRef.current = [];
      bulletsRef.current = [];
      particlesRef.current = [];
      scoreRef.current = 0;
      spawnTimerRef.current = 0;
      difficultyMultiplierRef.current = 1;
      setScore(0);
      setLives(3);
    }
    
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  const animate = (time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;

    const safeDt = Math.min(dt, 0.1);

    update(safeDt);
    draw();

    requestRef.current = requestAnimationFrame(animate);
  };

  const createExplosion = (x: number, y: number, color: string, count: number = 10) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        id: generateId(),
        pos: { x, y },
        velocity: { 
          x: (Math.random() - 0.5) * 300, 
          y: (Math.random() - 0.5) * 300 
        },
        width: Math.random() * 4 + 2,
        height: Math.random() * 4 + 2,
        color: color,
        markedForDeletion: false,
        life: 1.0,
        decay: Math.random() * 2 + 1,
        size: Math.random() * 5 + 2
      });
    }
  };

  const update = (dt: number) => {
    const player = playerRef.current;

    // --- Update Stars & Grid ---
    bgScrollRef.current = (bgScrollRef.current + 50 * dt) % 40;
    starsRef.current.forEach(star => {
      star.y += star.speed * dt;
      if (star.y > CANVAS_HEIGHT) {
        star.y = 0;
        star.x = Math.random() * CANVAS_WIDTH;
      }
    });

    // --- Player Movement ---
    const dir = { x: 0, y: 0 };
    if (KEYS.UP.some(k => keysPressed.current.has(k))) dir.y -= 1;
    if (KEYS.DOWN.some(k => keysPressed.current.has(k))) dir.y += 1;
    if (KEYS.LEFT.some(k => keysPressed.current.has(k))) dir.x -= 1;
    if (KEYS.RIGHT.some(k => keysPressed.current.has(k))) dir.x += 1;

    if (dir.x !== 0 || dir.y !== 0) {
      const length = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
      dir.x /= length;
      dir.y /= length;
    }

    player.pos.x += dir.x * player.speed * dt;
    player.pos.y += dir.y * player.speed * dt;

    player.pos.x = clamp(player.pos.x, 0, CANVAS_WIDTH - player.width);
    player.pos.y = clamp(player.pos.y, 0, CANVAS_HEIGHT - player.height);

    // --- Player Shooting ---
    if (player.shootTimer > 0) player.shootTimer -= dt;
    if (KEYS.SHOOT.some(k => keysPressed.current.has(k)) && player.shootTimer <= 0) {
      // Create two bullets for better feel
      bulletsRef.current.push({
        id: generateId(),
        pos: { x: player.pos.x, y: player.pos.y + 10 },
        velocity: { x: 0, y: -BULLET_SPEED },
        width: 4,
        height: 16,
        color: COLORS.playerBullet,
        markedForDeletion: false,
        isPlayerBullet: true,
        damage: 1
      });
      bulletsRef.current.push({
        id: generateId(),
        pos: { x: player.pos.x + player.width - 4, y: player.pos.y + 10 },
        velocity: { x: 0, y: -BULLET_SPEED },
        width: 4,
        height: 16,
        color: COLORS.playerBullet,
        markedForDeletion: false,
        isPlayerBullet: true,
        damage: 1
      });
      
      player.shootTimer = PLAYER_SHOOT_DELAY;
      audioService.playShoot();
    }

    // --- Invulnerability ---
    if (player.invulnerableTimer > 0) player.invulnerableTimer -= dt;

    // --- Enemy Spawning ---
    spawnTimerRef.current -= dt;
    if (spawnTimerRef.current <= 0) {
      difficultyMultiplierRef.current += 0.01;
      
      const rand = Math.random();
      let type = EnemyType.BASIC;
      let hp = 1;
      let width = 36;
      let color = COLORS.enemyBasic;
      let speed = 100 * difficultyMultiplierRef.current;

      if (rand > 0.8) {
        type = EnemyType.ZIGZAG;
        color = COLORS.enemyZigzag;
        hp = 2;
        width = 40;
        speed = 150 * difficultyMultiplierRef.current;
      } else if (rand > 0.95) {
        type = EnemyType.CHASER;
        width = 48;
        hp = 3;
      }

      enemiesRef.current.push({
        id: generateId(),
        pos: { x: getRandomRange(0, CANVAS_WIDTH - width), y: -60 },
        velocity: { x: 0, y: speed },
        width,
        height: width,
        color,
        markedForDeletion: false,
        type,
        hp,
        maxHp: hp,
        scoreValue: hp * 100,
        shootTimer: getRandomRange(1, 3)
      });
      
      spawnTimerRef.current = Math.max(0.5, 1.5 - (difficultyMultiplierRef.current * 0.1));
    }

    // --- Update Enemies ---
    enemiesRef.current.forEach(enemy => {
      if (enemy.type === EnemyType.BASIC) {
        enemy.pos.y += enemy.velocity.y * dt;
      } else if (enemy.type === EnemyType.ZIGZAG) {
        enemy.pos.y += enemy.velocity.y * dt;
        enemy.pos.x += Math.sin(enemy.pos.y * 0.05) * 3;
        enemy.pos.x = clamp(enemy.pos.x, 0, CANVAS_WIDTH - enemy.width);
      }

      enemy.shootTimer -= dt;
      if (enemy.shootTimer <= 0) {
        bulletsRef.current.push({
          id: generateId(),
          pos: { x: enemy.pos.x + enemy.width / 2 - 3, y: enemy.pos.y + enemy.height },
          velocity: { x: 0, y: ENEMY_BULLET_SPEED },
          width: 6,
          height: 12,
          color: COLORS.enemyBullet,
          markedForDeletion: false,
          isPlayerBullet: false,
          damage: 1
        });
        enemy.shootTimer = getRandomRange(2, 4);
      }

      if (enemy.pos.y > CANVAS_HEIGHT) enemy.markedForDeletion = true;
    });

    // --- Update Bullets ---
    bulletsRef.current.forEach(bullet => {
      bullet.pos.x += bullet.velocity.x * dt;
      bullet.pos.y += bullet.velocity.y * dt;

      if (bullet.pos.y < -20 || bullet.pos.y > CANVAS_HEIGHT + 20) {
        bullet.markedForDeletion = true;
      }
    });

    // --- Update Particles ---
    particlesRef.current.forEach(p => {
      p.life -= p.decay * dt;
      p.pos.x += p.velocity.x * dt;
      p.pos.y += p.velocity.y * dt;
      if (p.life <= 0) p.markedForDeletion = true;
    });

    // --- Collision Detection ---
    bulletsRef.current.filter(b => b.isPlayerBullet).forEach(bullet => {
      enemiesRef.current.forEach(enemy => {
        if (!bullet.markedForDeletion && !enemy.markedForDeletion && checkCollision(bullet, enemy)) {
          bullet.markedForDeletion = true;
          enemy.hp -= bullet.damage;
          if (enemy.hp <= 0) {
            enemy.markedForDeletion = true;
            scoreRef.current += enemy.scoreValue;
            setScore(scoreRef.current);
            createExplosion(enemy.pos.x + enemy.width/2, enemy.pos.y + enemy.height/2, enemy.color, 15);
            audioService.playExplosion();
          } else {
             createExplosion(bullet.pos.x, bullet.pos.y, '#fff', 3);
          }
        }
      });
    });

    if (player.invulnerableTimer <= 0) {
       bulletsRef.current.filter(b => !b.isPlayerBullet).forEach(bullet => {
         if (!bullet.markedForDeletion && checkCollision(bullet, player)) {
           bullet.markedForDeletion = true;
           handlePlayerHit();
         }
       });

       enemiesRef.current.forEach(enemy => {
         if (!enemy.markedForDeletion && checkCollision(enemy, player)) {
            enemy.markedForDeletion = true;
            createExplosion(enemy.pos.x + enemy.width/2, enemy.pos.y + enemy.height/2, enemy.color, 15);
            handlePlayerHit();
         }
       });
    }

    enemiesRef.current = enemiesRef.current.filter(e => !e.markedForDeletion);
    bulletsRef.current = bulletsRef.current.filter(b => !b.markedForDeletion);
    particlesRef.current = particlesRef.current.filter(p => !p.markedForDeletion);
  };

  const handlePlayerHit = () => {
    playerRef.current.hp -= 1;
    setLives(playerRef.current.hp);
    createExplosion(playerRef.current.pos.x + PLAYER_SIZE/2, playerRef.current.pos.y + PLAYER_SIZE/2, COLORS.player, 25);
    audioService.playExplosion();

    if (playerRef.current.hp <= 0) {
      onGameOver(scoreRef.current);
      lastTimeRef.current = 0;
    } else {
      playerRef.current.invulnerableTimer = 2;
      playerRef.current.pos = { x: CANVAS_WIDTH / 2 - 16, y: CANVAS_HEIGHT - 100 };
    }
  };

  // --- DRAWING FUNCTIONS ---

  const drawPlayer = (ctx: CanvasRenderingContext2D, p: Player) => {
    ctx.save();
    ctx.translate(p.pos.x + p.width/2, p.pos.y + p.height/2);
    
    // Glow effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = p.color;

    // Main Body
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(0, -p.height/2); // Nose
    ctx.lineTo(p.width/2, p.height/2); // Right wing tip
    ctx.lineTo(0, p.height/4); // Engine notch
    ctx.lineTo(-p.width/2, p.height/2); // Left wing tip
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(0, -p.height/4);
    ctx.lineTo(3, 0);
    ctx.lineTo(0, 5);
    ctx.lineTo(-3, 0);
    ctx.fill();

    // Engine Flame
    if (Math.random() > 0.2) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'orange';
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.moveTo(-4, p.height/4 + 2);
        ctx.lineTo(4, p.height/4 + 2);
        ctx.lineTo(0, p.height/2 + Math.random() * 15 + 5);
        ctx.fill();
    }

    ctx.restore();
  };

  const drawEnemyBasic = (ctx: CanvasRenderingContext2D, e: Enemy) => {
    ctx.save();
    ctx.translate(e.pos.x + e.width/2, e.pos.y + e.height/2);
    
    ctx.shadowBlur = 10;
    ctx.shadowColor = e.color;
    ctx.fillStyle = e.color;

    // Drone shape
    ctx.beginPath();
    // Top center
    ctx.moveTo(0, -e.height/2);
    // Right wing
    ctx.lineTo(e.width/2, -e.height/4);
    ctx.lineTo(e.width/2, e.height/4);
    // Bottom point
    ctx.lineTo(0, e.height/2);
    // Left wing
    ctx.lineTo(-e.width/2, e.height/4);
    ctx.lineTo(-e.width/2, -e.height/4);
    ctx.closePath();
    ctx.fill();

    // Energy Core
    ctx.fillStyle = '#111';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, 0, e.width/6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.3;
    ctx.beginPath();
    ctx.arc(0, 0, e.width/10, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const drawEnemyZigzag = (ctx: CanvasRenderingContext2D, e: Enemy) => {
    ctx.save();
    ctx.translate(e.pos.x + e.width/2, e.pos.y + e.height/2);
    
    ctx.shadowBlur = 10;
    ctx.shadowColor = e.color;
    ctx.strokeStyle = e.color;
    ctx.lineWidth = 3;

    // Stealth wing shape (Outline only)
    ctx.beginPath();
    ctx.moveTo(0, e.height/2);
    ctx.lineTo(e.width/2, -e.height/4);
    ctx.lineTo(0, -e.height/2); // Nose
    ctx.lineTo(-e.width/2, -e.height/4);
    ctx.closePath();
    ctx.stroke();

    // Inner glow fill
    ctx.fillStyle = e.color;
    ctx.globalAlpha = 0.3;
    ctx.fill();

    ctx.restore();
  };

  const drawBullet = (ctx: CanvasRenderingContext2D, b: Bullet) => {
    ctx.save();
    ctx.translate(b.pos.x + b.width/2, b.pos.y + b.height/2);
    
    // Intense glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = b.color;
    ctx.fillStyle = '#ffffff'; // White core

    ctx.beginPath();
    if (b.isPlayerBullet) {
        // Laser shape
        ctx.ellipse(0, 0, b.width/2, b.height/2, 0, 0, Math.PI * 2);
    } else {
        // Energy ball
        ctx.arc(0, 0, b.width, 0, Math.PI * 2);
    }
    ctx.fill();

    // Outer Halo
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = b.color;
    ctx.beginPath();
    if (b.isPlayerBullet) {
        ctx.ellipse(0, 0, b.width, b.height/1.5, 0, 0, Math.PI * 2);
    } else {
         ctx.arc(0, 0, b.width * 1.5, 0, Math.PI * 2);
    }
    ctx.fill();

    ctx.restore();
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = '#0b0c15';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw Stars
    ctx.fillStyle = '#ffffff';
    starsRef.current.forEach(star => {
      ctx.globalAlpha = star.opacity * (0.5 + Math.sin(Date.now() / 200) * 0.2); // Twinkle
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Draw Grid (Scrolling)
    ctx.strokeStyle = '#151621';
    ctx.lineWidth = 1;
    const offsetY = bgScrollRef.current;
    for(let i=0; i<CANVAS_WIDTH; i+=40) { 
        ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke(); 
    }
    for(let i=-40; i<CANVAS_HEIGHT; i+=40) { 
        const y = i + offsetY;
        if (y < CANVAS_HEIGHT) {
            ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke(); 
        }
    }

    // Draw Player
    const p = playerRef.current;
    if (p.invulnerableTimer <= 0 || Math.floor(Date.now() / 100) % 2 === 0) {
      drawPlayer(ctx, p);
    }

    // Draw Enemies
    enemiesRef.current.forEach(e => {
      if (e.type === EnemyType.ZIGZAG) {
        drawEnemyZigzag(ctx, e);
      } else {
        drawEnemyBasic(ctx, e);
      }
    });

    // Draw Bullets
    bulletsRef.current.forEach(b => {
      drawBullet(ctx, b);
    });

    // Draw Particles
    particlesRef.current.forEach(part => {
      ctx.save();
      ctx.globalAlpha = part.life;
      ctx.fillStyle = part.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = part.color;
      ctx.fillRect(part.pos.x, part.pos.y, part.size, part.size);
      ctx.restore();
    });
  };

  return (
    <canvas 
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="border-2 border-slate-700 shadow-2xl shadow-neon-blue/20 rounded-lg cursor-none bg-black"
    />
  );
};

export default GameCanvas;