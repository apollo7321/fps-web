import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════════
//  PLAYER STATE
// ═══════════════════════════════════════════════════════════════════
export const player = {
  pos:        new THREE.Vector3(0, 1.75, -50),
  vel:        new THREE.Vector3(),
  yaw:        Math.PI,
  pitch:      0,
  onGround:   false,
  health:     100,
  speed:      5,
  sprintSpeed:9,
  jumpForce:  7,
  exp:        0,
};

export function resetPlayer() {
  player.pos.set(0, 1.75, -50);
  player.vel.set(0, 0, 0);
  player.yaw = Math.PI;
  player.pitch = 0;
  player.onGround = false;
  player.health = 100;
  player.exp = 0;
}
