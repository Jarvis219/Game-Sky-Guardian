export type GameState = 'MENU' | 'PLAYING' | 'GAMEOVER' | 'PAUSED';

export interface Vector2D {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  pos: Vector2D;
  velocity: Vector2D;
  width: number;
  height: number;
  color: string;
  markedForDeletion: boolean;
}

export enum EnemyType {
  BASIC = 'BASIC',
  ZIGZAG = 'ZIGZAG',
  CHASER = 'CHASER',
  BOSS = 'BOSS'
}

export interface Enemy extends Entity {
  type: EnemyType;
  hp: number;
  maxHp: number;
  scoreValue: number;
  shootTimer: number;
}

export interface Player extends Entity {
  hp: number;
  maxHp: number;
  speed: number;
  shootTimer: number;
  invulnerableTimer: number;
  weaponLevel: number; // Cấp độ vũ khí: 1, 2, 3
}

export interface Bullet extends Entity {
  isPlayerBullet: boolean;
  damage: number;
}

export interface PowerUp extends Entity {
  type: 'WEAPON_UPGRADE';
  pulseTimer: number;
}

export interface Particle extends Entity {
  life: number; // 0 to 1
  decay: number;
  size: number;
}

export interface GameStats {
  score: number;
  highScore: number;
  level: number;
}