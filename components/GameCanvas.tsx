import React, { useRef, useEffect } from 'react';
import { GameState, Player, Enemy, Bullet, Particle, EnemyType, PowerUp, PowerUpType, ShipStyle } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, PLAYER_SPEED, KEYS, PLAYER_SHOOT_DELAY, BULLET_SPEED, ENEMY_BULLET_SPEED, PLAYER_SIZE, POWERUP_SPEED } from '../constants';
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
    invulnerableTimer: 0,
    weaponLevel: 1,
    hasMissiles: false,
    style: ShipStyle.DEFAULT
  });

  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const starsRef = useRef<Star[]>([]); 
  const keysPressed = useRef<Set<string>>(new Set());
  const scoreRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const powerUpSpawnTimerRef = useRef(0);
  const difficultyMultiplierRef = useRef(1);
  const bgScrollRef = useRef(0); 

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
      const p = playerRef.current;
      p.pos = { x: CANVAS_WIDTH / 2 - 16, y: CANVAS_HEIGHT - 100 };
      p.hp = 3;
      p.invulnerableTimer = 2;
      p.weaponLevel = 1;
      p.hasMissiles = false;
      p.style = ShipStyle.DEFAULT;
      p.color = COLORS.player;
      
      enemiesRef.current = [];
      bulletsRef.current = [];
      particlesRef.current = [];
      powerUpsRef.current = [];
      scoreRef.current = 0;
      spawnTimerRef.current = 0;
      powerUpSpawnTimerRef.current = 8; // First powerup quicker
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
      
      const spawnBullet = (offsetX: number, angleDegrees: number = 0, isMissile: boolean = false) => {
        const rad = (angleDegrees * Math.PI) / 180;
        const color = isMissile ? COLORS.missile : (player.style === ShipStyle.ASSAULT ? COLORS.playerPlasma : COLORS.playerBullet);
        const damage = isMissile ? 5 : (player.style === ShipStyle.ASSAULT ? 2 : 1);
        const speed = isMissile ? BULLET_SPEED * 0.8 : BULLET_SPEED;
        const width = isMissile ? 8 : (player.style === ShipStyle.ASSAULT ? 6 : 4);
        const height = isMissile ? 20 : (player.style === ShipStyle.ASSAULT ? 20 : 16);

        bulletsRef.current.push({
            id: generateId(),
            pos: { x: player.pos.x + player.width/2 - width/2 + offsetX, y: player.pos.y - 10 },
            velocity: { 
                x: Math.sin(rad) * speed, 
                y: -Math.cos(rad) * speed 
            },
            width,
            height,
            color,
            markedForDeletion: false,
            isPlayerBullet: true,
            damage,
            isMissile
        });
      };

      // Main Guns
      if (player.weaponLevel === 1) {
          spawnBullet(-10, 0);
          spawnBullet(10, 0);
      } else if (player.weaponLevel === 2) {
          spawnBullet(0, 0);
          spawnBullet(-12, -8);
          spawnBullet(12, 8);
      } else {
          spawnBullet(0, 0);
          spawnBullet(-10, -5);
          spawnBullet(10, 5);
          spawnBullet(-20, -15);
          spawnBullet(20, 15);
      }

      // Missiles
      if (player.hasMissiles) {
        spawnBullet(-25, 0, true);
        spawnBullet(25, 0, true);
      }
      
      player.shootTimer = PLAYER_SHOOT_DELAY;
      audioService.playShoot();
    }

    // --- Invulnerability ---
    if (player.invulnerableTimer > 0) player.invulnerableTimer -= dt;

    // --- PowerUp Spawning (Enhanced) ---
    powerUpSpawnTimerRef.current -= dt;
    if (powerUpSpawnTimerRef.current <= 0) {
        // Randomly select powerup type
        const rand = Math.random();
        let type = PowerUpType.WEAPON_UPGRADE;
        let color = COLORS.powerUpUpgrade;

        if (rand < 0.4) {
             type = PowerUpType.WEAPON_UPGRADE; // 40% chance
             color = COLORS.powerUpUpgrade;
        } else if (rand < 0.7) {
             type = PowerUpType.MISSILE; // 30% chance
             color = COLORS.powerUpMissile;
        } else if (rand < 0.9) {
             type = PowerUpType.SHIELD; // 20% chance
             color = COLORS.powerUpShield;
        } else {
             type = PowerUpType.SHIP_SKIN; // 10% chance
             color = COLORS.powerUpSkin;
        }

        powerUpsRef.current.push({
            id: generateId(),
            pos: { x: getRandomRange(50, CANVAS_WIDTH - 50), y: -40 },
            velocity: { x: 0, y: POWERUP_SPEED },
            width: 32,
            height: 32,
            color: color,
            markedForDeletion: false,
            type: type,
            pulseTimer: 0
        });
        
        powerUpSpawnTimerRef.current = getRandomRange(10, 20);
    }

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

    // --- Update Entities ---
    powerUpsRef.current.forEach(p => {
        p.pos.y += p.velocity.y * dt;
        p.pulseTimer += dt * 5;
        if (p.pos.y > CANVAS_HEIGHT) p.markedForDeletion = true;
    });

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

    bulletsRef.current.forEach(bullet => {
      bullet.pos.x += bullet.velocity.x * dt;
      bullet.pos.y += bullet.velocity.y * dt;

      // Missile Trail
      if (bullet.isMissile) {
         particlesRef.current.push({
            id: generateId(),
            pos: { x: bullet.pos.x + bullet.width/2 - 2, y: bullet.pos.y + bullet.height },
            velocity: { x: (Math.random()-0.5)*20, y: 50 },
            width: 4, height: 4, color: '#a855f7',
            markedForDeletion: false, life: 0.3, decay: 2, size: 4
         });
      }

      if (bullet.pos.y < -20 || bullet.pos.y > CANVAS_HEIGHT + 20) {
        bullet.markedForDeletion = true;
      }
    });

    particlesRef.current.forEach(p => {
      p.life -= p.decay * dt;
      p.pos.x += p.velocity.x * dt;
      p.pos.y += p.velocity.y * dt;
      if (p.life <= 0) p.markedForDeletion = true;
    });

    // --- Collision Detection ---
    
    // PowerUp vs Player
    powerUpsRef.current.forEach(p => {
        if (!p.markedForDeletion && checkCollision(p, player)) {
            p.markedForDeletion = true;
            audioService.playPowerUp();
            createExplosion(p.pos.x + p.width/2, p.pos.y + p.height/2, p.color, 20);
            
            // Handle Effects
            switch(p.type) {
                case PowerUpType.WEAPON_UPGRADE:
                    if (player.weaponLevel < 3) player.weaponLevel++;
                    setScore(scoreRef.current += 200);
                    break;
                case PowerUpType.MISSILE:
                    player.hasMissiles = true;
                    setScore(scoreRef.current += 300);
                    break;
                case PowerUpType.SHIELD:
                    player.invulnerableTimer = 10; // 10s Immortal
                    setScore(scoreRef.current += 100);
                    break;
                case PowerUpType.SHIP_SKIN:
                    player.style = ShipStyle.ASSAULT;
                    player.color = COLORS.playerAssault;
                    player.weaponLevel = 3; // Max Weapon immediately
                    setScore(scoreRef.current += 500);
                    break;
            }
        }
    });

    // Bullets vs Enemies
    bulletsRef.current.filter(b => b.isPlayerBullet).forEach(bullet => {
      enemiesRef.current.forEach(enemy => {
        if (!bullet.markedForDeletion && !enemy.markedForDeletion && checkCollision(bullet, enemy)) {
          bullet.markedForDeletion = true;
          enemy.hp -= bullet.damage;
          if (enemy.hp <= 0) {
            enemy.markedForDeletion = true;
            scoreRef.current += enemy.scoreValue;
            setScore(scoreRef.current);
            // Bigger explosion for missiles
            const boomSize = bullet.isMissile ? 25 : 15;
            createExplosion(enemy.pos.x + enemy.width/2, enemy.pos.y + enemy.height/2, enemy.color, boomSize);
            audioService.playExplosion();
          } else {
             createExplosion(bullet.pos.x, bullet.pos.y, '#fff', 3);
          }
        }
      });
    });

    // Bullets vs Player
    // NOTE: invulnerableTimer > 0 acts as a shield/immortality
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
    powerUpsRef.current = powerUpsRef.current.filter(p => !p.markedForDeletion);
  };

  const handlePlayerHit = () => {
    playerRef.current.hp -= 1;
    // Reset upgrades on hit
    playerRef.current.weaponLevel = 1; 
    playerRef.current.hasMissiles = false;
    playerRef.current.style = ShipStyle.DEFAULT;
    playerRef.current.color = COLORS.player;

    setLives(playerRef.current.hp);
    createExplosion(playerRef.current.pos.x + PLAYER_SIZE/2, playerRef.current.pos.y + PLAYER_SIZE/2, COLORS.player, 25);
    audioService.playExplosion();

    if (playerRef.current.hp <= 0) {
      onGameOver(scoreRef.current);
      lastTimeRef.current = 0;
    } else {
      playerRef.current.invulnerableTimer = 2; // Mercy invincibility
      playerRef.current.pos = { x: CANVAS_WIDTH / 2 - 16, y: CANVAS_HEIGHT - 100 };
    }
  };

  // --- DRAWING FUNCTIONS ---

  const drawPlayer = (ctx: CanvasRenderingContext2D, p: Player) => {
    ctx.save();
    ctx.translate(p.pos.x + p.width/2, p.pos.y + p.height/2);
    
    // Shield Visual
    if (p.invulnerableTimer > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, p.width, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(100, 255, 255, ${0.5 + Math.sin(Date.now() / 100) * 0.3})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = `rgba(100, 255, 255, 0.1)`;
        ctx.fill();
        ctx.restore();
    }

    if (p.style === ShipStyle.ASSAULT) {
        // --- ASSAULT STYLE ---
        ctx.shadowBlur = 20;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;

        // Heavy Body
        ctx.beginPath();
        ctx.moveTo(0, -p.height/2 - 5);
        ctx.lineTo(p.width/2 + 5, p.height/2);
        ctx.lineTo(0, p.height/2 - 5);
        ctx.lineTo(-p.width/2 - 5, p.height/2);
        ctx.closePath();
        ctx.fill();
        
        // Side Cannons
        ctx.fillStyle = '#333';
        ctx.fillRect(-p.width/2 - 8, 0, 6, 15);
        ctx.fillRect(p.width/2 + 2, 0, 6, 15);

        // Cockpit
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(5, 5);
        ctx.lineTo(-5, 5);
        ctx.fill();

    } else {
        // --- DEFAULT STYLE ---
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.height/2);
        ctx.lineTo(p.width/2, p.height/2);
        ctx.lineTo(0, p.height/4);
        ctx.lineTo(-p.width/2, p.height/2);
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
    }

    // Weapon Pods Visuals
    if (p.weaponLevel >= 2) {
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.width/2 - 4, 0, 4, 10);
        ctx.fillRect(p.width/2, 0, 4, 10);
    }

    // Engine Flame
    if (Math.random() > 0.2) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.style === ShipStyle.ASSAULT ? 'red' : 'orange';
        ctx.fillStyle = p.style === ShipStyle.ASSAULT ? '#ff5500' : 'orange';
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
    ctx.moveTo(0, -e.height/2);
    ctx.lineTo(e.width/2, -e.height/4);
    ctx.lineTo(e.width/2, e.height/4);
    ctx.lineTo(0, e.height/2);
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

    ctx.beginPath();
    ctx.moveTo(0, e.height/2);
    ctx.lineTo(e.width/2, -e.height/4);
    ctx.lineTo(0, -e.height/2);
    ctx.lineTo(-e.width/2, -e.height/4);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = e.color;
    ctx.globalAlpha = 0.3;
    ctx.fill();

    ctx.restore();
  };

  const drawBullet = (ctx: CanvasRenderingContext2D, b: Bullet) => {
    ctx.save();
    ctx.translate(b.pos.x + b.width/2, b.pos.y + b.height/2);
    
    ctx.shadowBlur = 10;
    ctx.shadowColor = b.color;
    ctx.fillStyle = '#ffffff';

    if (b.isMissile) {
        // Missile Shape
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.moveTo(0, -b.height/2);
        ctx.lineTo(b.width/2, b.height/2);
        ctx.lineTo(0, b.height/2 - 4);
        ctx.lineTo(-b.width/2, b.height/2);
        ctx.closePath();
        ctx.fill();
        // Thruster
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.arc(0, b.height/2 + 2, 3, 0, Math.PI*2);
        ctx.fill();
    } else {
        // Standard Laser/Plasma
        ctx.beginPath();
        if (b.isPlayerBullet) {
            ctx.ellipse(0, 0, b.width/2, b.height/2, 0, 0, Math.PI * 2);
        } else {
            ctx.arc(0, 0, b.width, 0, Math.PI * 2);
        }
        ctx.fill();

        ctx.globalAlpha = 0.6;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        if (b.isPlayerBullet) {
            ctx.ellipse(0, 0, b.width, b.height/1.5, 0, 0, Math.PI * 2);
        } else {
             ctx.arc(0, 0, b.width * 1.5, 0, Math.PI * 2);
        }
        ctx.fill();
    }

    ctx.restore();
  };

  const drawPowerUp = (ctx: CanvasRenderingContext2D, p: PowerUp) => {
      ctx.save();
      ctx.translate(p.pos.x + p.width/2, p.pos.y + p.height/2);
      
      const scale = 1 + Math.sin(p.pulseTimer) * 0.1;
      ctx.scale(scale, scale);

      ctx.shadowBlur = 15;
      ctx.shadowColor = p.color;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(-p.width/2, -p.height/2, p.width, p.height);

      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(-p.width/2, -p.height/2, p.width, p.height);

      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      let symbol = '';
      switch(p.type) {
          case PowerUpType.WEAPON_UPGRADE: symbol = 'UP'; break;
          case PowerUpType.MISSILE: symbol = 'M'; break;
          case PowerUpType.SHIELD: symbol = 'S'; break;
          case PowerUpType.SHIP_SKIN: symbol = 'X'; break;
      }
      
      ctx.fillText(symbol, 0, 1);

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
      ctx.globalAlpha = star.opacity * (0.5 + Math.sin(Date.now() / 200) * 0.2); 
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Draw Grid
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

    // Draw Entities
    powerUpsRef.current.forEach(p => drawPowerUp(ctx, p));

    const p = playerRef.current;
    // Draw logic: Draw if NOT invulnerable (<=0) OR Shield is active (>2) OR Blink frame during mercy time
    if (p.invulnerableTimer <= 0 || p.invulnerableTimer > 2 || Math.floor(Date.now() / 100) % 2 === 0) {
        drawPlayer(ctx, p);
    }

    enemiesRef.current.forEach(e => {
      if (e.type === EnemyType.ZIGZAG) {
        drawEnemyZigzag(ctx, e);
      } else {
        drawEnemyBasic(ctx, e);
      }
    });

    bulletsRef.current.forEach(b => {
      drawBullet(ctx, b);
    });

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