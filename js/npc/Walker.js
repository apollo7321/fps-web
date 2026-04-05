import * as THREE from 'three';
import { M } from '../materials.js';
import { BaseNPC } from './BaseNPC.js';

// ═══════════════════════════════════════════════════════════════════
//  WALKER VARIANTS (color combinations)
// ═══════════════════════════════════════════════════════════════════
const WALKER_VARIANTS = [
  // Original: grey-green uniform, brown skin, dark helmet
  { body: 0x4a5840, uniform: 0x3a4830, skin: 0xc09060, helmet: 0x3a3820 },
  // Tan uniform, lighter skin, khaki helmet
  { body: 0x8b7355, uniform: 0xa0826d, skin: 0xd4a574, helmet: 0x9d8b6f },
  // Dark grey uniform, darker skin, grey helmet
  { body: 0x3a3a3a, uniform: 0x2a2a2a, skin: 0xa0826d, helmet: 0x4a4a4a },
  // Brown-green, light tan uniform, tan skin, brown helmet
  { body: 0x5a6a4a, uniform: 0x9d8b6f, skin: 0xe0b87d, helmet: 0x6b5d42 },
  // Dark uniform, pale skin, greenish helmet
  { body: 0x3a5a3a, uniform: 0x2a3a2a, skin: 0xc0a080, helmet: 0x4a5a3a },
  // Light grey-brown, light uniform, tanned skin, dark brown helmet
  { body: 0x6a5a4a, uniform: 0x9a8a7a, skin: 0xd9a876, helmet: 0x4a3a2a },
];

// ═══════════════════════════════════════════════════════════════════
//  WALKER CLASS
// ═══════════════════════════════════════════════════════════════════

export class Walker extends BaseNPC {
  buildModel() {
    const g = this.group;
    const variant = WALKER_VARIANTS[Math.floor(Math.random() * WALKER_VARIANTS.length)];

    const matBody    = M(variant.body);
    const matUniform = M(variant.uniform);
    const matSkin    = M(variant.skin);
    const matHelmet  = M(variant.helmet);
    const matFace    = M(0x222222);

    // Legs
    this.legL = new THREE.Mesh(new THREE.BoxGeometry(.18,.6,.18), matUniform);
    this.legL.position.set(-0.12, 0.3, 0); this.legL.castShadow = true; g.add(this.legL);
    this.legR = new THREE.Mesh(new THREE.BoxGeometry(.18,.6,.18), matUniform);
    this.legR.position.set( 0.12, 0.3, 0); this.legR.castShadow = true; g.add(this.legR);

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(.46,.55,.26), matBody);
    torso.position.set(0, 0.9, 0); torso.castShadow = true; g.add(torso);

    // Arms
    this.armL = new THREE.Mesh(new THREE.BoxGeometry(.14,.48,.18), matBody);
    this.armL.position.set(-0.32, 0.85, 0); this.armL.castShadow = true; g.add(this.armL);
    this.armR = new THREE.Mesh(new THREE.BoxGeometry(.14,.48,.18), matBody);
    this.armR.position.set( 0.32, 0.85, 0); this.armR.castShadow = true; g.add(this.armR);

    // Neck
    this.neck = new THREE.Mesh(new THREE.BoxGeometry(.12,.1,.12), matSkin);
    this.neck.position.set(0, 1.22, 0); g.add(this.neck);

    // Head
    this.head = new THREE.Mesh(new THREE.BoxGeometry(.28,.28,.26), matSkin);
    this.head.position.set(0, 1.44, 0); this.head.castShadow = true; g.add(this.head);

    // Eyes
    [-0.07, 0.07].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(.05,.04,.01), matFace);
      eye.position.set(ex, 1.48, 0.14);
      g.add(eye);
      this.eyes.push(eye);
    });

    // Smile
    const smCenter = new THREE.Mesh(new THREE.BoxGeometry(.09,.022,.01), matFace);
    smCenter.position.set(0, 1.38, 0.14); g.add(smCenter);
    const smL = new THREE.Mesh(new THREE.BoxGeometry(.038,.022,.01), matFace);
    smL.position.set(-0.054, 1.393, 0.14); smL.rotation.z = 0.55; g.add(smL);
    const smR = new THREE.Mesh(new THREE.BoxGeometry(.038,.022,.01), matFace);
    smR.position.set( 0.054, 1.393, 0.14); smR.rotation.z = -0.55; g.add(smR);
    this.smileParts = [smCenter, smL, smR];

    // Helmet
    const helmet = new THREE.Mesh(new THREE.BoxGeometry(.34,.16,.32), matHelmet);
    helmet.position.set(0, 1.6, 0); helmet.castShadow = true; g.add(helmet);
    const helmetBrim = new THREE.Mesh(new THREE.BoxGeometry(.40,.06,.38), matHelmet);
    helmetBrim.position.set(0, 1.53, 0); g.add(helmetBrim);

    this.headParts = [this.head, helmet, helmetBrim, smCenter, smL, smR, ...this.eyes];
  }

}
