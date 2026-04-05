import * as THREE from 'three';
import { eventBus } from './EventBus.js';

// ═══════════════════════════════════════════════════════════════════
//  DOOR TRIGGERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Door triggers: proximity-based teleportation to roofs
 * Each door has a position and a target roof position
 */
export const doorTriggers = [];

export function registerDoor(doorX, doorZ, roofX, roofZ, roofHeight) {
  doorTriggers.push({
    pos: new THREE.Vector3(doorX, 0, doorZ),
    roofPos: new THREE.Vector3(roofX, roofHeight, roofZ),
    triggerRadius: 1.2,
    playerInside: false,
  });
}

export function updateDoorTriggers(playerPos, player) {
  for (const door of doorTriggers) {
    const dx = playerPos.x - door.pos.x;
    const dz = playerPos.z - door.pos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const inRange = dist < door.triggerRadius;

    if (inRange && !door.playerInside) {
      // Entered door trigger
      door.playerInside = true;
      teleportToRoof(player, door.roofPos);
    } else if (!inRange && door.playerInside) {
      // Exited door trigger
      door.playerInside = false;
    }
  }
}

function teleportToRoof(player, roofPos) {
  player.pos.x = roofPos.x;
  player.pos.y = roofPos.y + 1.75; // Player eye height
  player.pos.z = roofPos.z;
  player.vel.y = 0; // Reset vertical velocity
  eventBus.emit('roofEntered');
}
