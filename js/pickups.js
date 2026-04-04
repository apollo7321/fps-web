import * as THREE from 'three';
import { scene } from './renderer.js';
import { playPickup } from './audio.js';

// ═══════════════════════════════════════════════════════════════════
//  AMMO PICKUPS
// ═══════════════════════════════════════════════════════════════════
export const ammoPickups = [];
const ammoPickupMat = new THREE.MeshLambertMaterial({ color: 0xc8a84b, emissive: new THREE.Color(0x3a2800) });

const AMMO_SPOTS = [
  [-4,10],[4,-10],[0,22],[-6,-22],[6,35],[-6,42],[5,-35],[0,-45],
  [-18,8],[18,-8],[-25,-18],[25,22],[-35,0],[35,0],
];

export function createAmmoPickups() {
  AMMO_SPOTS.forEach(([ax, az]) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(.28, .18, .14), ammoPickupMat);
    mesh.position.set(ax, .22, az);
    mesh.castShadow = true;
    scene.add(mesh);
    ammoPickups.push({ mesh, pos: new THREE.Vector3(ax, .22, az), active: true });
  });
}

/**
 * Update ammo pickups: bob animation + pickup detection.
 * Returns { pickedUp, nearFull } to let caller handle HUD/sound.
 */
export function updatePickups(dt, playerPos, weapon) {
  let nearPickup = false;
  let pickedUp = false;

  for (const p of ammoPickups) {
    if (!p.active) continue;
    // Bob the pickup
    p.mesh.position.y = .22 + Math.sin(performance.now() / 600 + p.pos.x) * .04;
    p.mesh.rotation.y += dt * 1.2;

    const dx = playerPos.x - p.pos.x;
    const dz = playerPos.z - p.pos.z;
    if (Math.sqrt(dx * dx + dz * dz) < 1.0) {
      if (weapon.reserveAmmo < 64) {
        weapon.reserveAmmo += 8;
        p.active = false;
        scene.remove(p.mesh);
        playPickup();
        pickedUp = true;
      } else {
        nearPickup = true;
      }
    }
  }

  return { pickedUp, nearPickup };
}

export function resetPickups() {
  for (const pickup of ammoPickups) {
    if (!pickup.active) {
      pickup.active = true;
      pickup.mesh.position.copy(pickup.pos);
      scene.add(pickup.mesh);
    }
    pickup.mesh.visible = true;
  }
}
