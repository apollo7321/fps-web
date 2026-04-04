import { colliders } from './geometry.js';

export const GRAVITY = -22;
export const PLAYER_H = 1.75;
export const PLAYER_R = 0.35;

/**
 * Resolve player–world collisions. Mutates pos and vel in place.
 * Returns true if the player landed on top of a collider.
 */
export function resolveCollisions(pos, vel) {
  const hh = PLAYER_H / 2;
  let landed = false;
  for (const c of colliders) {
    const minX = c.min.x - PLAYER_R, maxX = c.max.x + PLAYER_R;
    const minY = c.min.y - hh,       maxY = c.max.y + hh;
    const minZ = c.min.z - PLAYER_R, maxZ = c.max.z + PLAYER_R;
    const cx = pos.x, cy = pos.y - hh, cz = pos.z;
    if (cx >= minX && cx <= maxX && cy >= minY && cy <= maxY && cz >= minZ && cz <= maxZ) {
      const ox = Math.min(cx - minX, maxX - cx);
      const oy = Math.min(cy - minY, maxY - cy);
      const oz = Math.min(cz - minZ, maxZ - cz);
      if (oy < ox && oy < oz) {
        if (cy > (minY + maxY) / 2) {
          pos.y = maxY + hh; vel.y = 0; landed = true;
        } else {
          pos.y = minY + hh; vel.y = 0;
        }
      } else if (ox < oz) {
        pos.x = cx < (minX + maxX) / 2 ? minX : maxX; vel.x = 0;
      } else {
        pos.z = cz < (minZ + maxZ) / 2 ? minZ : maxZ; vel.z = 0;
      }
    }
  }
  return landed;
}
