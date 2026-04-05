import * as THREE from 'three';
import { M } from '../materials.js';

// ═══════════════════════════════════════════════════════════════════
//  BASE NPC CLASS
// ═══════════════════════════════════════════════════════════════════

export class BaseNPC {
  constructor(x, z, ry = 0) {
    this.group = new THREE.Group();
    this.group.position.set(x, 0, z);
    this.group.rotation.y = ry;

    this.health = 100;
    this.alive = true;
    this.dying = false;
    this.dyingTimer = 0;
    this.isHeadshot = false;
    this.pos = new THREE.Vector3(x, 0, z);

    // Limb references (populated by subclass buildModel)
    this.legL = null;
    this.legR = null;
    this.armL = null;
    this.armR = null;
    this.head = null;
    this.neck = null;
    this.headParts = [];
    this.eyes = [];
    this.smileParts = [];

    // AI state
    this.state = 'idle';
    this.wanderTarget = null;
    this.wanderTimer = Math.random() * 3;
    this.walkCycle = Math.random() * Math.PI * 2;

    // Death animation state
    this.knockbackX = 0;
    this.knockbackZ = 0;
    this.deathSlideStart = 0;
    this.deathSlideStartZ = 0;

    // Contact damage timer (per-NPC, for controlling damage frequency)
    this.contactDamageTimer = 0;

    this.buildModel();
  }

  // ─── Override in subclasses ────────────────────────────────────

  /** Build the visual mesh. */
  buildModel() {}

  /** XP reward for killing this NPC. */
  getXP(isHeadshot) {
    return isHeadshot ? 2 : 1;
  }

  /** Contact damage interval in seconds. */
  getContactDamageInterval() {
    return 1.0;
  }

  /** Movement speed in zombie mode. */
  getZombieSpeed() {
    return 3.5;
  }

  /** Minimum spawn distance from player. */
  getMinSpawnDistance() {
    return 15;
  }

  /**
   * Called each frame in zombie mode before normal movement.
   * Return 'skip' to suppress movement this frame,
   * 'explode' to trigger an explosion, or null for normal chase.
   */
  updateZombieBehavior(dt, distToPlayer) {
    return null;
  }

  /**
   * Walk/idle animation. Override for type-specific animation.
   */
  updateAnimation(walkSpeed, dt) {
    if (walkSpeed > 0) {
      this.walkCycle += dt * (walkSpeed > 3 ? 8 : 4);
      const swing = Math.sin(this.walkCycle);
      if (this.legL) {
        this.legL.rotation.x =  swing * (walkSpeed > 3 ? 0.55 : 0.38);
        this.legR.rotation.x = -swing * (walkSpeed > 3 ? 0.55 : 0.38);
      }
      this.armL.rotation.x = -swing * 0.6;
      this.armR.rotation.x =  swing * 0.6;
    } else {
      if (this.legL) {
        this.legL.rotation.x *= 0.85;
        this.legR.rotation.x *= 0.85;
      }
      this.armL.rotation.x *= 0.85;
      this.armR.rotation.x *= 0.85;
    }
  }

  // ─── Explosion interface (for exploding NPC types) ─────────────

  /** Whether this NPC type can explode. */
  canExplode() { return false; }

  /** Blast radius in meters. */
  getExplosionRadius() { return 0; }

  /** Max damage to player at point blank. */
  getExplosionDamage() { return 0; }

  /** EventBus event name for the explosion sound. */
  getExplosionEvent() { return 'explosion'; }

  /** Spawn explosion particles at given position. */
  spawnExplosionParticles(pos) {}

  // ─── Shared methods ────────────────────────────────────────────

  makeZombie() {
    this.smileParts.forEach(part => this.group.remove(part));
    const redEyeMat = M(0xff0000);
    this.eyes.forEach(eye => { eye.material = redEyeMat; });
  }

  makeNormal() {
    const matFace = M(0x222222);
    this.eyes.forEach(eye => { eye.material = matFace; });
    this.smileParts.forEach(part => this.group.add(part));
  }

  reset() {
    this.alive = true;
    this.dying = false;
    this.health = 100;
    this.state = 'idle';
    this.dyingTimer = 0;
    this.isHeadshot = false;
    this.contactDamageTimer = 0;
    this.group.position.set(this.pos.x, 0, this.pos.z);
    this.group.rotation.set(0, 0, 0);
    this.headParts.forEach(part => {
      if (!this.group.children.includes(part)) {
        this.group.add(part);
      }
    });
  }
}
