import * as THREE from 'three';
import { scene } from './renderer.js';

// ═══════════════════════════════════════════════════════════════════
//  PARTICLE SYSTEM (blood, explosions)
// ═══════════════════════════════════════════════════════════════════
export const bloodParticles = [];
const bloodGeo = new THREE.SphereGeometry(0.04, 4, 4);
const bloodMat = new THREE.MeshBasicMaterial({ color: 0x990000, transparent: true });

export function spawnBlood(pos) {
  for (let i = 0; i < 12; i++) {
    const m = new THREE.Mesh(bloodGeo, bloodMat.clone());
    m.position.copy(pos);
    scene.add(m);
    const life = 0.5 + Math.random() * 0.4;
    bloodParticles.push({
      mesh: m,
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 4 + 0.5,
        (Math.random() - 0.5) * 5
      ),
      life,
      maxLife: life,
    });
  }
}

export function spawnBloodFountain(pos) {
  for (let i = 0; i < 25; i++) {
    const m = new THREE.Mesh(bloodGeo, bloodMat.clone());
    m.position.copy(pos);
    scene.add(m);
    const life = 0.6 + Math.random() * 0.3;
    bloodParticles.push({
      mesh: m,
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        6 + Math.random() * 4,
        (Math.random() - 0.5) * 1.5
      ),
      life,
      maxLife: life,
    });
  }
}

export function spawnExplosion(pos) {
  const fireColors = [0xff2000, 0xff6600, 0xffaa00];
  for (let i = 0; i < 120; i++) {
    const angle = Math.random() * Math.PI * 2;
    const elevation = Math.random() * Math.PI * 0.5;
    const speed = 10 + Math.random() * 16;

    const m = new THREE.Mesh(bloodGeo, new THREE.MeshBasicMaterial({
      color: fireColors[Math.floor(Math.random() * fireColors.length)]
    }));
    m.position.copy(pos);
    scene.add(m);

    const vx = Math.cos(angle) * Math.cos(elevation) * speed;
    const vy = Math.sin(elevation) * speed + 3 + Math.random() * 8;
    const vz = Math.sin(angle) * Math.cos(elevation) * speed;

    const life = 1.2 + Math.random() * 0.6;
    bloodParticles.push({
      mesh: m,
      vel: new THREE.Vector3(vx, vy, vz),
      life,
      maxLife: life,
    });
  }
}

export function updateParticles(dt) {
  for (let i = bloodParticles.length - 1; i >= 0; i--) {
    const bp = bloodParticles[i];
    bp.life -= dt;
    bp.vel.y -= 14 * dt;
    bp.mesh.position.addScaledVector(bp.vel, dt);
    bp.mesh.material.opacity = Math.max(0, bp.life / bp.maxLife);
    if (bp.life <= 0) {
      scene.remove(bp.mesh);
      bloodParticles.splice(i, 1);
    }
  }
}

export function clearAllParticles() {
  for (let i = bloodParticles.length - 1; i >= 0; i--) {
    scene.remove(bloodParticles[i].mesh);
  }
  bloodParticles.length = 0;
}
