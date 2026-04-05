import * as THREE from 'three';
import { M } from '../materials.js';
import { BaseNPC } from './BaseNPC.js';
import { spawnSlimeExplosion } from '../particles.js';

// ═══════════════════════════════════════════════════════════════════
//  FATTY NPC CLASS
// ═══════════════════════════════════════════════════════════════════

const FATTY_VARIANTS = [
  { skin: 0xd4a574, shirt: 0x6a6a4a, pants: 0x4a4a3a },
  { skin: 0xc09060, shirt: 0x5a4a3a, pants: 0x3a3a2a },
  { skin: 0xe0b87d, shirt: 0x7a6a5a, pants: 0x5a4a3a },
];

const matDrool = M(0x44cc22);

export class Fatty extends BaseNPC {
  constructor(x, z, ry = 0) {
    super(x, z, ry);
    this.exploding = false;
    this.explodeTimer = 0;
    this.exploded = false;
  }

  buildModel() {
    const g = this.group;
    const variant = FATTY_VARIANTS[Math.floor(Math.random() * FATTY_VARIANTS.length)];

    const matSkin  = M(variant.skin);
    const matShirt = M(variant.shirt);
    const matPants = M(variant.pants);
    const matFace  = M(0x222222);

    // ── Stubby legs ──────────────────────────────────────────────
    this.legL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.35, 0.24), matPants);
    this.legL.position.set(-0.18, 0.175, 0); this.legL.castShadow = true; g.add(this.legL);
    this.legR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.35, 0.24), matPants);
    this.legR.position.set(0.18, 0.175, 0); this.legR.castShadow = true; g.add(this.legR);

    // ── Torso ──────────────────────────────────────
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6), matShirt);
    belly.position.set(0, 0.70, 0); belly.castShadow = true; g.add(belly);

    // ── Short thick arms ─────────────────────────────────────────
    this.armL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.34, 0.22), matSkin);
    this.armL.position.set(-0.55, 0.72, 0); this.armL.castShadow = true; g.add(this.armL);
    this.armR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.34, 0.22), matSkin);
    this.armR.position.set(0.55, 0.72, 0); this.armR.castShadow = true; g.add(this.armR);

    // ── Neck (barely visible, fat folds) ─────────────────────────
    this.neck = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.2), matSkin);
    this.neck.position.set(0, 1.1, 0); g.add(this.neck);

    // ── Double chin / neck fat ───────────────────────────────────
    const chinFat = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.16), matSkin);
    chinFat.position.set(0, 1.06, 0.08); g.add(chinFat);

    // ── Round head ───────────────────────────────────────────────
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.3), matSkin);
    this.head.position.set(0, 1.3, 0); this.head.castShadow = true; g.add(this.head);

    // ── Puffy cheeks ─────────────────────────────────────────────
    const cheekL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.12), matSkin);
    cheekL.position.set(-0.18, 1.26, 0.08); g.add(cheekL);
    const cheekR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.12), matSkin);
    cheekR.position.set(0.18, 1.26, 0.08); g.add(cheekR);

    // ── Small beady eyes ─────────────────────────────────────────
    [-0.08, 0.08].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.01), matFace);
      eye.position.set(ex, 1.34, 0.16);
      g.add(eye);
      this.eyes.push(eye);
    });

    // ── Open mouth ───────────────────────────────────────────────
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.01), matFace);
    mouth.position.set(0, 1.2, 0.16); g.add(mouth);
    this.smileParts = [mouth];

    // ── Green drool strands ──────────────────────────────────────
    const drool1 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.03), matDrool);
    drool1.position.set(-0.03, 1.11, 0.16); g.add(drool1);
    const drool2 = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.16, 0.025), matDrool);
    drool2.position.set(0.03, 1.09, 0.16); g.add(drool2);
    const droolBlob = new THREE.Mesh(new THREE.SphereGeometry(0.025, 4, 4), matDrool);
    droolBlob.position.set(0.03, 1.01, 0.16); g.add(droolBlob);
    this.droolParts = [drool1, drool2, droolBlob];

    this.headParts = [this.head, cheekL, cheekR, mouth, ...this.eyes,
                      ...this.droolParts, chinFat];
  }

  // ─── Behavior overrides ────────────────────────────────────────

  getXP(isHeadshot) {
    return isHeadshot ? 5 : 3;
  }

  getZombieSpeed() {
    return 2.6;
  }

  getMinSpawnDistance() {
    return 20;
  }

  updateZombieBehavior(dt, distToPlayer) {
    if (this.exploded) return 'skip';

    if (distToPlayer < 3.0) {
      this.exploding = true;
      this.explodeTimer += dt;

      // Wobble to telegraph the explosion
      this.group.scale.x = 1 + Math.sin(this.explodeTimer * 20) * 0.08;
      this.group.scale.z = 1 + Math.cos(this.explodeTimer * 20) * 0.08;

      if (this.explodeTimer >= 1.0) return 'explode';
      return 'skip';
    }

    // Out of range — reset
    this.exploding = false;
    this.explodeTimer = 0;
    this.group.scale.set(1, 1, 1);
    return null;
  }

  // ─── Explosion interface ───────────────────────────────────────

  canExplode() { return true; }
  getExplosionRadius() { return 5; }
  getExplosionDamage() { return 30; }
  getExplosionEvent() { return 'slimeExplosion'; }

  spawnExplosionParticles(pos) {
    spawnSlimeExplosion(pos);
  }

  reset() {
    super.reset();
    this.exploding = false;
    this.explodeTimer = 0;
    this.exploded = false;
  }
}
