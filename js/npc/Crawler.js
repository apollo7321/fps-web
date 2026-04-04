import * as THREE from 'three';
import { M } from '../materials.js';
import { NPC } from './NPC.js';

// ═══════════════════════════════════════════════════════════════════
//  CRAWLER NPC CLASS
// ═══════════════════════════════════════════════════════════════════

/**
 * Crawler: A zombie lying face-down, pulling itself forward with its arms.
 * No helmet, no legs. Arms are pivot-based for proper crawling animation.
 */
export class Crawler extends NPC {
  constructor(x, z, ry = 0) {
    super(x, z, ry);
  }

  buildModel() {
    const g = this.group;

    const matSkin    = M(0xc09060);
    const matCloth   = M(0x4a3828); // torn, darker clothing
    const matFace    = M(0x111111);
    const matBlood   = M(0x6a0a0a);

    // ── Torso lying flat ────────────────────────────────────────
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.14, 0.52), matCloth);
    torso.position.set(0, 0.07, 0);
    torso.castShadow = true;
    g.add(torso);

    // Ragged lower body stub (behind — negative Z is back)
    const stub = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.18), matBlood);
    stub.position.set(0, 0.05, -0.28);
    g.add(stub);

    // ── Neck ────────────────────────────────────────────────────
    this.neck = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, 0.1), matSkin);
    this.neck.position.set(0, 0.13, 0.28);
    this.neck.rotation.x = -0.4;
    g.add(this.neck);

    // ── Head ────────────────────────────────────────────────────
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.22), matSkin);
    this.head.position.set(0, 0.24, 0.36);
    this.head.rotation.x = -0.3;
    this.head.castShadow = true;
    g.add(this.head);

    // Eyes (looking forward, +Z face)
    [-0.06, 0.06].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.035, 0.01), matFace);
      eye.position.set(ex, 0.29, 0.48);
      g.add(eye);
      this.eyes.push(eye);
    });

    // Grimace mouth
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.025, 0.01), matFace);
    mouth.position.set(0, 0.2, 0.48);
    g.add(mouth);
    this.smileParts = [mouth];

    // ── Arms (pivot groups at shoulders for proper animation) ───
    // Left arm pivot at left shoulder — arms reach forward (+Z)
    const armPivotL = new THREE.Group();
    armPivotL.position.set(-0.23, 0.1, 0.12);
    g.add(armPivotL);

    const upperArmL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, 0.28), matSkin);
    upperArmL.position.set(0, 0, 0.14);
    armPivotL.add(upperArmL);

    const handL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.14), matSkin);
    handL.position.set(0, -0.02, 0.33);
    armPivotL.add(handL);

    this.armL = armPivotL;

    // Right arm pivot at right shoulder
    const armPivotR = new THREE.Group();
    armPivotR.position.set(0.23, 0.1, 0.12);
    g.add(armPivotR);

    const upperArmR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, 0.28), matSkin);
    upperArmR.position.set(0, 0, 0.14);
    armPivotR.add(upperArmR);

    const handR = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.14), matSkin);
    handR.position.set(0, -0.02, 0.33);
    armPivotR.add(handR);

    this.armR = armPivotR;

    // headParts — no helmet, just head + face parts
    this.headParts = [this.head, mouth, ...this.eyes];

    // No legs
    this.legL = null;
    this.legR = null;
  }
}
