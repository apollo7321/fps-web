import * as THREE from 'three';
import { scene } from '../renderer.js';
import { colliders } from '../geometry.js';
import { Walker } from './Walker.js';
import { Crawler } from './Crawler.js';
import { spawnBlood, spawnBloodFountain } from '../particles.js';
import { playOuch } from '../audio.js';
import { eventBus } from '../EventBus.js';

// ═══════════════════════════════════════════════════════════════════
//  NPC MANAGER
// ═══════════════════════════════════════════════════════════════════
export const npcs = [];
export const npcMeshMap = new Map(); // mesh → npc

const _npcDir = new THREE.Vector3();

export function spawnNPC(x, z, ry = 0) {
  const npc = new Walker(x, z, ry);
  scene.add(npc.group);

  // Register all child meshes for raycasting
  npc.group.traverse(child => { if (child.isMesh) npcMeshMap.set(child, npc); });
  // Mark head parts
  npc.headParts.forEach(part => { part.isHeadPart = true; });

  npcs.push(npc);
  return npc;
}

export function killNPC(npc, knockbackDir = null, isHeadshot = false, playerExp) {
  if (!npc.alive) return;
  npc.alive = false;
  npc.dying = true;
  npc.dyingTimer = 0;
  npc.isHeadshot = isHeadshot;

  // Award EXP (increment the object property)
  if (playerExp !== undefined) playerExp.value += 1;

  // Store knockback direction
  if (knockbackDir) {
    npc.knockbackX = knockbackDir.x;
    npc.knockbackZ = knockbackDir.z;
  } else {
    npc.knockbackX = Math.random() < 0.5 ? 1 : -1;
    npc.knockbackZ = 0;
  }

  npc.deathSlideStart = npc.group.position.x;
  npc.deathSlideStartZ = npc.group.position.z;

  if (isHeadshot) {
    npc.headParts.forEach(part => npc.group.remove(part));
    const neckWorldPos = new THREE.Vector3(0, 1.22, 0).applyMatrix4(npc.group.matrixWorld);
    spawnBloodFountain(neckWorldPos);
  }

  // Emit zombie count update event
  const breakdown = getZombieBreakdown();
  eventBus.emit('zombieCountChanged', { count: getAliveNPCCount() });
  eventBus.emit('zombieBreakdownChanged', breakdown);
}

function npcBlockedAt(px, pz) {
  const r = 0.35;
  for (const c of colliders) {
    if (c.max.y < 0.3) continue;
    if (px > c.min.x - r && px < c.max.x + r &&
        pz > c.min.z - r && pz < c.max.z + r) return true;
  }
  return false;
}

function applyNPCCollisionPushback(dt) {
  const minDist = 0.8;

  for (let i = 0; i < npcs.length; i++) {
    const npc = npcs[i];
    if (!npc.alive || npc.dying) continue;

    for (let j = i + 1; j < npcs.length; j++) {
      const other = npcs[j];
      if (!other.alive || other.dying) continue;

      const dx = other.group.position.x - npc.group.position.x;
      const dz = other.group.position.z - npc.group.position.z;
      const distSq = dx * dx + dz * dz;

      if (distSq < minDist * minDist) {
        const dist = Math.sqrt(distSq);
        if (dist < 0.01) {
          // Direkt übereinander — in zufällige Richtung trennen
          const angle = Math.random() * Math.PI * 2;
          const push = minDist * 0.5;
          npc.group.position.x -= Math.cos(angle) * push;
          npc.group.position.z -= Math.sin(angle) * push;
          other.group.position.x += Math.cos(angle) * push;
          other.group.position.z += Math.sin(angle) * push;
        } else {
          // Direkt auf minDist auseinandersetzen
          const overlap = (minDist - dist) * 0.5;
          const nx = dx / dist;
          const nz = dz / dist;
          npc.group.position.x -= nx * overlap;
          npc.group.position.z -= nz * overlap;
          other.group.position.x += nx * overlap;
          other.group.position.z += nz * overlap;
        }
      }
    }
  }
}

function npcMove(npc, dx, dz) {
  const nx = npc.group.position.x + dx;
  const nz = npc.group.position.z + dz;

  // Only check world collisions — NPC-NPC is handled by pushback
  if (!npcBlockedAt(nx, npc.group.position.z)) npc.group.position.x = nx;
  if (!npcBlockedAt(npc.group.position.x, nz)) npc.group.position.z = nz;

  npc.group.position.x = Math.max(-88, Math.min(88, npc.group.position.x));
  npc.group.position.z = Math.max(-88, Math.min(88, npc.group.position.z));
}

export function updateNPCs(dt, playerPos, zombieMode) {
  for (const npc of npcs) {
    if (!npc.alive || npc.dying) continue;

    const dx = playerPos.x - npc.group.position.x;
    const dz = playerPos.z - npc.group.position.z;
    const distSq = dx * dx + dz * dz;

    let walkSpeed = 0;

    if (zombieMode) {
      // Crawlers move faster than walkers
      const isCrawler = npc instanceof Crawler;
      walkSpeed = isCrawler ? 5.5 : 3.5;
      _npcDir.set(dx, 0, dz).normalize();
      npcMove(npc, _npcDir.x * walkSpeed * dt, _npcDir.z * walkSpeed * dt);
      npc.group.rotation.y = Math.atan2(_npcDir.x, _npcDir.z);
    } else {
      // Idle / Wander behavior
      npc.wanderTimer -= dt;
      if (npc.wanderTimer <= 0 || !npc.wanderTarget) {
        const angle = Math.random() * Math.PI * 2;
        const dist  = 5 + Math.random() * 12;
        npc.wanderTarget = new THREE.Vector3(
          npc.group.position.x + Math.cos(angle) * dist,
          0,
          npc.group.position.z + Math.sin(angle) * dist
        );
        npc.wanderTarget.x = Math.max(-90, Math.min(90, npc.wanderTarget.x));
        npc.wanderTarget.z = Math.max(-90, Math.min(90, npc.wanderTarget.z));
        npc.wanderTimer = npc.state === 'idle'
          ? (1.5 + Math.random() * 3)
          : (0.5 + Math.random() * 1.5);
        npc.state = npc.wanderTimer > 2 ? 'idle' : 'wander';
      }

      if (npc.state === 'wander' && npc.wanderTarget) {
        _npcDir.set(
          npc.wanderTarget.x - npc.group.position.x, 0,
          npc.wanderTarget.z - npc.group.position.z
        );
        const len = _npcDir.length();
        if (len > 0.6) {
          _npcDir.divideScalar(len);
          walkSpeed = 1.6;
          npcMove(npc, _npcDir.x * walkSpeed * dt, _npcDir.z * walkSpeed * dt);
          npc.group.rotation.y = Math.atan2(_npcDir.x, _npcDir.z);
        } else {
          npc.state = 'idle';
          npc.wanderTimer = 1.5 + Math.random() * 3;
        }
      }
    }

    // Keep on ground
    npc.group.position.y = 0;

    // Walk/Crawl animation
    const isCrawler = npc instanceof Crawler;
    if (walkSpeed > 0) {
      npc.walkCycle += dt * (isCrawler ? 7 : (walkSpeed > 3 ? 8 : 4));
      const swing = Math.sin(npc.walkCycle);

      if (isCrawler) {
        // Crawling: arms alternate reach-forward / pull-back around shoulder pivot
        // Positive offset keeps arms angled forward (+Z) at rest
        const crawlOffset = 0.6;
        npc.armL.rotation.x = crawlOffset + swing * 0.9;
        npc.armR.rotation.x = crawlOffset - swing * 0.9;
      } else {
        if (npc.legL) {
          npc.legL.rotation.x =  swing * (walkSpeed > 3 ? 0.55 : 0.38);
          npc.legR.rotation.x = -swing * (walkSpeed > 3 ? 0.55 : 0.38);
        }
        npc.armL.rotation.x = -swing * 0.6;
        npc.armR.rotation.x =  swing * 0.6;
      }
    } else {
      if (isCrawler) {
        // Return arms to resting forward position
        npc.armL.rotation.x += (0.6 - npc.armL.rotation.x) * 0.1;
        npc.armR.rotation.x += (0.6 - npc.armR.rotation.x) * 0.1;
      } else {
        if (npc.legL) {
          npc.legL.rotation.x *= 0.85;
          npc.legR.rotation.x *= 0.85;
        }
        npc.armL.rotation.x *= 0.85;
        npc.armR.rotation.x *= 0.85;
      }
    }
  }

  // Apply collision pushback to prevent NPCs from overlapping
  applyNPCCollisionPushback(dt);
}

export function updateDyingNPCs(dt) {
  for (const npc of npcs) {
    if (!npc.dying) continue;
    npc.dyingTimer += dt;

    if (npc.isHeadshot) {
      const p = Math.min(npc.dyingTimer / 0.5, 1);
      const e = 1 - Math.pow(1 - p, 3);
      const kbLen = Math.sqrt(npc.knockbackX**2 + npc.knockbackZ**2);
      const kbX = npc.knockbackX / (kbLen || 1);
      const kbZ = npc.knockbackZ / (kbLen || 1);
      npc.group.rotation.x = e * Math.PI * 0.5 * kbZ;
      npc.group.rotation.z = e * Math.PI * 0.5 * kbX;
      const slideAmount = Math.sin(p * Math.PI * 0.5) * 1.5;
      npc.group.position.x = npc.deathSlideStart + npc.knockbackX * slideAmount;
      npc.group.position.z = npc.deathSlideStartZ + npc.knockbackZ * slideAmount;
      if (p >= 1) {
        npc.group.position.y = 0;
        npc.group.rotation.order = 'YXZ';
        npc.dying = false;
      }
    } else {
      const p = Math.min(npc.dyingTimer / 0.6, 1);
      const e = 1 - Math.pow(1 - p, 3);
      const tiltAngle = e * Math.PI * 0.65;
      const kbLen = Math.sqrt(npc.knockbackX**2 + npc.knockbackZ**2);
      const kbX = npc.knockbackX / kbLen;
      const kbZ = npc.knockbackZ / kbLen;
      npc.group.rotation.x = tiltAngle * kbZ;
      npc.group.rotation.z = tiltAngle * kbX;
      const slideAmount = Math.sin(p * Math.PI * 0.5) * 3.8;
      npc.group.position.x = npc.deathSlideStart + npc.knockbackX * slideAmount;
      npc.group.position.z = npc.deathSlideStartZ + npc.knockbackZ * slideAmount;
      if (p >= 1) {
        npc.group.position.y = 0;
        npc.dying = false;
      }
    }
  }
}

export function spawnRandomZombie(playerPos) {
  let x, z, dist;
  do {
    x = (Math.random() - 0.5) * 150;
    z = (Math.random() - 0.5) * 150;
    dist = Math.sqrt((x - playerPos.x)**2 + (z - playerPos.z)**2);
  } while (dist < 15);

  x = Math.max(-90, Math.min(90, x));
  z = Math.max(-90, Math.min(90, z));

  const newZombie = spawnNPC(x, z, Math.random() * Math.PI * 2);
  newZombie.makeZombie();
  eventBus.emit('zombieCountChanged', { count: getAliveNPCCount() });
  return newZombie;
}

export function spawnRandomCrawler(playerPos) {
  let x, z, dist;
  do {
    x = (Math.random() - 0.5) * 150;
    z = (Math.random() - 0.5) * 150;
    dist = Math.sqrt((x - playerPos.x)**2 + (z - playerPos.z)**2);
  } while (dist < 15);

  x = Math.max(-90, Math.min(90, x));
  z = Math.max(-90, Math.min(90, z));

  const crawler = new Crawler(x, z, Math.random() * Math.PI * 2);
  scene.add(crawler.group);
  crawler.group.traverse(child => { if (child.isMesh) npcMeshMap.set(child, crawler); });
  crawler.headParts.forEach(part => { part.isHeadPart = true; });
  npcs.push(crawler);
  crawler.makeZombie();
  eventBus.emit('zombieCountChanged', { count: getAliveNPCCount() });
  return crawler;
}

export function resetAllNPCs() {
  for (const npc of npcs) {
    npc.reset();
    npc.makeNormal();
  }
}

/** Get all alive NPC meshes for raycasting */
export function getAliveNPCMeshes() {
  return [...npcMeshMap.keys()].filter(k => npcMeshMap.get(k).alive);
}

/** Look up which NPC a mesh belongs to */
export function getNPCFromMesh(mesh) {
  return npcMeshMap.get(mesh);
}

/** Get count of alive NPCs */
export function getAliveNPCCount() {
  return npcs.filter(npc => npc.alive && !npc.dying).length;
}

export function getZombieBreakdown() {
  const alive = npcs.filter(npc => npc.alive && !npc.dying);
  const walkers = alive.filter(npc => npc instanceof Walker).length;
  const crawlers = alive.filter(npc => npc instanceof Crawler).length;
  return { walkers, crawlers };
}
