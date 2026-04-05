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

    this.buildModel();
  }

  /** Override in subclasses to build the visual mesh. */
  buildModel() {}

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
    this.group.position.set(this.pos.x, 0, this.pos.z);
    this.group.rotation.set(0, 0, 0);
    this.headParts.forEach(part => {
      if (!this.group.children.includes(part)) {
        this.group.add(part);
      }
    });
  }
}
