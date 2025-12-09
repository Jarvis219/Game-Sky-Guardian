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

export enum PowerUpType {
  WEAPON_UPGRADE = 'WEAPON_UPGRADE', // Nâng cấp súng thường (Đạn vàng)
  MISSILE = 'MISSILE',               // Thêm tên lửa (Hộp tím)
  SHIELD = 'SHIELD',                 // Bất tử 10s (Hộp trắng/xanh)
  SHIP_SKIN = 'SHIP_SKIN'            // Đổi ngoại hình + Súng (Hộp đỏ)
}

export enum ShipStyle {
  DEFAULT = 'DEFAULT',
  ASSAULT = 'ASSAULT' // Skin mới
}

export interface Player extends Entity {
  hp: number;
  maxHp: number;
  speed: number;
  shootTimer: number;
  invulnerableTimer: number;
  weaponLevel: number; 
  hasMissiles: boolean; // Có tên lửa không
  style: ShipStyle;     // Kiểu dáng tàu
}

export interface Bullet extends Entity {
  isPlayerBullet: boolean;
  damage: number;
  isMissile?: boolean; // Đánh dấu là tên lửa
}

export interface PowerUp extends Entity {
  type: PowerUpType;
  pulseTimer: number;
}

export interface Particle extends Entity {
  life: number; 
  decay: number;
  size: number;
}

export interface GameStats {
  score: number;
  highScore: number;
  level: number;
}