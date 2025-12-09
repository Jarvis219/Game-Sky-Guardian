import { Entity, Vector2D } from '../types';

export const generateId = (): string => Math.random().toString(36).substr(2, 9);

export const checkCollision = (rect1: Entity, rect2: Entity): boolean => {
  return (
    rect1.pos.x < rect2.pos.x + rect2.width &&
    rect1.pos.x + rect1.width > rect2.pos.x &&
    rect1.pos.y < rect2.pos.y + rect2.height &&
    rect1.pos.y + rect1.height > rect2.pos.y
  );
};

export const lerp = (start: number, end: number, t: number): number => {
  return start * (1 - t) + end * t;
};

export const clamp = (val: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, val));
};

export const getRandomRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};