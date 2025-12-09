export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const PLAYER_SPEED = 300; // pixels per second
export const PLAYER_SHOOT_DELAY = 0.15; // seconds
export const PLAYER_SIZE = 32;

export const BULLET_SPEED = 600;
export const ENEMY_BULLET_SPEED = 300;
export const POWERUP_SPEED = 100;

export const SPAWN_RATE_INITIAL = 1.5; // seconds

export const COLORS = {
  player: '#00f3ff', // Neon Blue
  playerBullet: '#00ff9d', // Neon Green
  enemyBasic: '#ff2a2a', // Neon Red
  enemyZigzag: '#ff00ff', // Neon Pink
  enemyBullet: '#ffaa00', // Neon Orange
  particle: '#ffffff',
  powerUp: '#ffff00' // Neon Yellow
};

export const KEYS = {
  UP: ['ArrowUp', 'w', 'W'],
  DOWN: ['ArrowDown', 's', 'S'],
  LEFT: ['ArrowLeft', 'a', 'A'],
  RIGHT: ['ArrowRight', 'd', 'D'],
  SHOOT: [' ', 'Space', 'Enter'],
  PAUSE: ['p', 'P', 'Escape']
};