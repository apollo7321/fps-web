import * as THREE from 'three';
import { GRAVITY, PLAYER_H, resolveCollisions } from '../physics.js';
import { eventBus } from '../EventBus.js';

const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _move = new THREE.Vector3();
const BOUND = 95;

export const PlayerController = {
  lastStepX: 0,
  lastStepZ: 0,
  
  reset() {
    this.lastStepX = 0;
    this.lastStepZ = 0;
  },

  updateMovement(dt, player, inputState) {
    const keys = inputState.keys;
    const sprint = keys['ShiftLeft'] || keys['ShiftRight'];
    const speed  = sprint ? player.sprintSpeed : player.speed;

    _fwd.set(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
    _right.set( Math.cos(player.yaw), 0, -Math.sin(player.yaw));
    _move.set(0, 0, 0);

    const moving =
      keys['KeyW']||keys['KeyS']||keys['KeyA']||keys['KeyD']||
      keys['ArrowUp']||keys['ArrowDown']||keys['ArrowLeft']||keys['ArrowRight'];

    if (keys['KeyW']||keys['ArrowUp'])    _move.addScaledVector(_fwd,    1);
    if (keys['KeyS']||keys['ArrowDown'])  _move.addScaledVector(_fwd,   -1);
    if (keys['KeyA']||keys['ArrowLeft'])  _move.addScaledVector(_right, -1);
    if (keys['KeyD']||keys['ArrowRight']) _move.addScaledVector(_right,  1);
    if (_move.length()>0) _move.normalize().multiplyScalar(speed);

    player.vel.x = _move.x;
    player.vel.z = _move.z;
    if (!player.onGround) player.vel.y += GRAVITY * dt;
    if (keys['Space'] && player.onGround) { player.vel.y = player.jumpForce; player.onGround=false; }

    player.pos.addScaledVector(player.vel, dt);
    player.onGround = false;
    if (player.pos.y < PLAYER_H) { player.pos.y=PLAYER_H; player.vel.y=0; player.onGround=true; }

    const landed = resolveCollisions(player.pos, player.vel);
    if (landed) player.onGround = true;

    player.pos.x = Math.max(-BOUND, Math.min(BOUND, player.pos.x));
    player.pos.z = Math.max(-BOUND, Math.min(BOUND, player.pos.z));

    // Footsteps via eventBus
    const dx = player.pos.x - this.lastStepX;
    const dz = player.pos.z - this.lastStepZ;
    if (moving && player.onGround && (dx * dx + dz * dz) >= 1.5 * 1.5) {
      eventBus.emit('playerStep', { sprint });
      this.lastStepX = player.pos.x;
      this.lastStepZ = player.pos.z;
    }
  }
};
