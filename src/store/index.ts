import { proxy } from 'valtio';

export const state = proxy({
  hovered: false,
  reflectivity: 0.5,
  isDragging: false,
}); 