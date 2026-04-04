import * as THREE from 'three';
import { scene } from './renderer.js';

// ═══════════════════════════════════════════════════════════════════
//  COLLISION
// ═══════════════════════════════════════════════════════════════════
export const colliders = [];

export function addCollider(x, y, z, w, h, d) {
  colliders.push({
    min: new THREE.Vector3(x - w/2, y - h/2, z - d/2),
    max: new THREE.Vector3(x + w/2, y + h/2, z + d/2)
  });
}

// ═══════════════════════════════════════════════════════════════════
//  GEOMETRY HELPERS
// ═══════════════════════════════════════════════════════════════════
export function box(w, h, d, mat, x, y, z, rx = 0, ry = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.rotation.set(rx, ry, 0);
  m.castShadow = true; m.receiveShadow = true;
  scene.add(m); return m;
}

export function cyl(rt, rb, h, seg, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  scene.add(m); return m;
}

export function solidBox(w, h, d, mat, x, y, z, ry = 0) {
  const mesh = box(w, h, d, mat, x, y, z, 0, ry);
  // For rotated boxes, swap w/d to approximate AABB
  if (Math.abs(ry % Math.PI) > 0.3 && Math.abs(ry % Math.PI) < 2.8) {
    addCollider(x, y, z, d, h, w);
  } else {
    addCollider(x, y, z, w, h, d);
  }
  return mesh;
}
