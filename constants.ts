export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const PLAYER_SPEED = 300; 
export const PLAYER_SHOOT_DELAY = 0.15; 
export const PLAYER_SIZE = 32;

export const BULLET_SPEED = 600;
export const ENEMY_BULLET_SPEED = 300;
export const POWERUP_SPEED = 120; // Nhanh hơn chút

export const SPAWN_RATE_INITIAL = 1.5; 

export const COLORS = {
  player: '#00f3ff', // Neon Blue
  playerAssault: '#ff0055', // Neon Red/Pink for Assault Skin
  playerBullet: '#00ff9d', // Neon Green
  playerPlasma: '#ff0055', // Red Plasma for Assault Skin
  missile: '#a855f7', // Purple
  enemyBasic: '#ff2a2a', // Neon Red
  enemyZigzag: '#ff00ff', // Neon Pink
  enemyBullet: '#ffaa00', // Neon Orange
  particle: '#ffffff',
  
  // PowerUp Colors
  powerUpUpgrade: '#ffff00', // Yellow (Level up)
  powerUpMissile: '#d946ef', // Purple (Missile)
  powerUpShield: '#06b6d4',  // Cyan (Shield)
  powerUpSkin: '#f43f5e'     // Red (Skin Change)
};

export const KEYS = {
  UP: ['ArrowUp', 'w', 'W'],
  DOWN: ['ArrowDown', 's', 'S'],
  LEFT: ['ArrowLeft', 'a', 'A'],
  RIGHT: ['ArrowRight', 'd', 'D'],
  SHOOT: [' ', 'Space', 'Enter'],
  PAUSE: ['p', 'P', 'Escape']
};