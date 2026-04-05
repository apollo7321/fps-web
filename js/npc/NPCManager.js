import * as THREE from 'three';
import { scene } from '../renderer.js';
import { colliders } from '../geometry.js';
import { Walker } from './Walker.js';
import { Crawler } from './Crawler.js';
import { Fatty } from './Fatty.js';
import { spawnBloodFountain } from '../particles.js';
import { eventBus } from '../EventBus.js';

// ═══════════════════════════════════════════════════════════════════
//  NPC MANAGER
// ═══════════════════════════��═══════════════════════════════════════
export const npcs = [];
export const npcMeshMap = new Map(); // mesh → npc

const _npcDir = new THREE.Vector3();

// Player reference (set once at init via setPlayerRef)
let _playerRef = null;
export function setPlayerRef(player) {
  _playerRef = player;
}

// ─── Registration & Spawning ─────────────────────────────────────

function registerNPC(npc) {
  scene.add(npc.group);
  npc.group.traverse(child => { if (child.isMesh) npcMeshMap.set(child, npc); });
  npc.headParts.forEach(part => { part.isHeadPart = true; });
  npcs.push(npc);
  return npc;
}

function findSpawnPosition(playerPos, minDist) {
  let x, z, dist;
  do {
    x = (Math.random() - 0.5) * 150;
    z = (Math.random() - 0.5) * 150;
    dist = Math.sqrt((x - playerPos.x) ** 2 + (z - playerPos.z) ** 2);
  } while (dist < minDist);
  return {
    x: Math.max(-90, Math.min(90, x)),
    z: Math.max(-90, Math.min(90, z)),
  };
}

function spawnRandomNPC(NPCClass, playerPos) {
  const proto = NPCClass.prototype;
  const minDist = proto.getMinSpawnDistance ? proto.getMinSpawnDistance() : 15;
  const { x, z } = findSpawnPosition(playerPos, minDist);
  const npc = new NPCClass(x, z, Math.random() * Math.PI * 2);
  registerNPC(npc);
  npc.makeZombie();
  eventBus.emit('zombieCountChanged', { count: getAliveNPCCount() });
  return npc;
}

/** Spawn a Walker at (x, z) facing ry. Used for non-zombie initial placement. */
export function spawnNPC(x, z, ry = 0) {
  return registerNPC(new Walker(x, z, ry));
}

export function spawnRandomZombie(playerPos)  { return spawnRandomNPC(Walker, playerPos); }
export function spawnRandomCrawler(playerPos) { return spawnRandomNPC(Crawler, playerPos); }
export function spawnRandomFatty(playerPos)   { return spawnRandomNPC(Fatty, playerPos); }

// ─── Kill & Death ────��───────────────────────────────────────────

export function killNPC(npc, knockbackDir = null, isHeadshot = false, playerExp) {
  if (!npc.alive) return;
  npc.alive = false;
  npc.dying = true;
  npc.dyingTimer = 0;
  npc.isHeadshot = isHeadshot;

  if (playerExp !== undefined) {
    playerExp.value += npc.getXP(isHeadshot);
  }

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

  const breakdown = getZombieBreakdown();
  eventBus.emit('zombieCountChanged', { count: getAliveNPCCount() });
  eventBus.emit('zombieBreakdownChanged', breakdown);
}

export function updateDyingNPCs(dt) {
  for (const npc of npcs) {
    if (!npc.dying) continue;
    npc.dyingTimer += dt;

    if (npc.isHeadshot) {
      const p = Math.min(npc.dyingTimer / 0.5, 1);
      const e = 1 - Math.pow(1 - p, 3);
      const kbLen = Math.sqrt(npc.knockbackX ** 2 + npc.knockbackZ ** 2);
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
      const kbLen = Math.sqrt(npc.knockbackX ** 2 + npc.knockbackZ ** 2);
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

// ─── Collision ───────────────────────────────────────────────────

function npcBlockedAt(px, pz) {
  const r = 0.35;
  for (const c of colliders) {
    if (c.max.y < 0.3) continue;
    if (px > c.min.x - r && px < c.max.x + r &&
        pz > c.min.z - r && pz < c.max.z + r) return true;
  }
  return false;
}

function applyNPCCollisionPushback() {
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
          const angle = Math.random() * Math.PI * 2;
          const push = minDist * 0.5;
          npc.group.position.x -= Math.cos(angle) * push;
          npc.group.position.z -= Math.sin(angle) * push;
          other.group.position.x += Math.cos(angle) * push;
          other.group.position.z += Math.sin(angle) * push;
        } else {
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
  if (!npcBlockedAt(nx, npc.group.position.z)) npc.group.position.x = nx;
  if (!npcBlockedAt(npc.group.position.x, nz)) npc.group.position.z = nz;
  npc.group.position.x = Math.max(-88, Math.min(88, npc.group.position.x));
  npc.group.position.z = Math.max(-88, Math.min(88, npc.group.position.z));
}

// ─── NPC Explosion (generic for any exploding NPC) ───────────────

function handleNPCExplosion(npc) {
  if (!npc.alive) return;

  const pos = npc.group.position.clone();
  npc.alive = false;
  npc.dying = false;
  if (npc.exploded !== undefined) npc.exploded = true;

  scene.remove(npc.group);

  // Visuals & sound
  npc.spawnExplosionParticles(pos);
  eventBus.emit(npc.getExplosionEvent());

  // Blast damage to nearby NPCs
  const radius = npc.getExplosionRadius();
  for (const other of npcs) {
    if (!other.alive || other === npc) continue;
    const dx = other.group.position.x - pos.x;
    const dz = other.group.position.z - pos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < radius) {
      const len = dist > 0 ? dist : 1;
      killNPC(other, { x: dx / len, z: dz / len }, false);
      eventBus.emit('enemyKilled');
    }
  }

  // Blast damage to player
  if (_playerRef) {
    const pdx = pos.x - _playerRef.pos.x;
    const pdz = pos.z - _playerRef.pos.z;
    const playerDist = Math.sqrt(pdx * pdx + pdz * pdz);
    if (playerDist < radius) {
      const maxDmg = npc.getExplosionDamage();
      _playerRef.health -= Math.round(maxDmg * (1 - playerDist / radius));
      eventBus.emit('playerDamaged');
    }
  }

  const breakdown = getZombieBreakdown();
  eventBus.emit('zombieCountChanged', { count: getAliveNPCCount() });
  eventBus.emit('zombieBreakdownChanged', breakdown);
}

// ─── Main NPC Update ───���─────────────────────────────────────────

export function updateNPCs(dt, playerPos, zombieMode) {
  for (const npc of npcs) {
    if (!npc.alive || npc.dying) continue;

    const dx = playerPos.x - npc.group.position.x;
    const dz = playerPos.z - npc.group.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    let walkSpeed = 0;

    if (zombieMode) {
      // Let the NPC handle type-specific behavior first
      const behavior = npc.updateZombieBehavior(dt, dist);
      if (behavior === 'explode') { handleNPCExplosion(npc); continue; }
      if (behavior === 'skip') continue;

      // Normal zombie chase
      walkSpeed = npc.getZombieSpeed();
      _npcDir.set(dx, 0, dz).normalize();
      npcMove(npc, _npcDir.x * walkSpeed * dt, _npcDir.z * walkSpeed * dt);
      npc.group.rotation.y = Math.atan2(_npcDir.x, _npcDir.z);
    } else {
      // Idle / Wander behavior
      npc.wanderTimer -= dt;
      if (npc.wanderTimer <= 0 || !npc.wanderTarget) {
        const angle = Math.random() * Math.PI * 2;
        const d = 5 + Math.random() * 12;
        npc.wanderTarget = new THREE.Vector3(
          npc.group.position.x + Math.cos(angle) * d,
          0,
          npc.group.position.z + Math.sin(angle) * d
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

    npc.group.position.y = 0;
    npc.updateAnimation(walkSpeed, dt);
  }

  applyNPCCollisionPushback();
}

// ─── Reset ──���────────────────────────────────────────────────────

export function resetAllNPCs() {
  // Remove all NPCs from scene and clear tracking structures
  for (const npc of npcs) {
    scene.remove(npc.group);
    npc.group.traverse(child => {
      if (child.isMesh) npcMeshMap.delete(child);
    });
  }
  npcs.length = 0;
  npcMeshMap.clear();
}

// ─── Queries ──────────────────────────────���──────────────────────

export function getAliveNPCMeshes() {
  return [...npcMeshMap.keys()].filter(k => npcMeshMap.get(k).alive);
}

export function getNPCFromMesh(mesh) {
  return npcMeshMap.get(mesh);
}

export function getAliveNPCCount() {
  return npcs.filter(npc => npc.alive && !npc.dying).length;
}

export function getZombieBreakdown() {
  const alive = npcs.filter(npc => npc.alive && !npc.dying);
  return {
    walkers:  alive.filter(npc => npc instanceof Walker).length,
    crawlers: alive.filter(npc => npc instanceof Crawler).length,
    fatties:  alive.filter(npc => npc instanceof Fatty).length,
  };
}

// ─── Zombie Effects (contact damage + wave spawning) ─────────────

const CONTACT_DISTANCE = 0.65;
const SPAWN_INTERVAL = 10.0;
const EXTREME_SPAWN_INTERVAL = 2.0;
let zombieSpawnTimer = 0;

export function updateZombieEffects(dt, player, extremeMode = false) {
  let damageDealt = false;

  for (const npc of npcs) {
    if (!npc.alive || npc.dying) continue;

    const dx = npc.group.position.x - player.pos.x;
    const dz = npc.group.position.z - player.pos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < CONTACT_DISTANCE) {
      npc.contactDamageTimer += dt;
      if (npc.contactDamageTimer >= npc.getContactDamageInterval()) {
        player.health -= 1;
        damageDealt = true;
        npc.contactDamageTimer = 0;
      }
    } else {
      npc.contactDamageTimer = 0;
    }
  }

  if (damageDealt) {
    eventBus.emit('playerDamaged');
  }

  // Wave spawning
  const spawnInterval = extremeMode ? EXTREME_SPAWN_INTERVAL : SPAWN_INTERVAL;
  zombieSpawnTimer += dt;
  if (zombieSpawnTimer >= spawnInterval) {
    const spawnCount = extremeMode
      ? 5 + Math.floor(Math.random() * 4)
      : 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < spawnCount; i++) {
      const roll = Math.random();
      if (roll < 0.15) spawnRandomFatty(player.pos);
      else if (roll < 0.40) spawnRandomCrawler(player.pos);
      else spawnRandomZombie(player.pos);
    }
    zombieSpawnTimer = 0;
  }
}

export function resetZombieEffects() {
  zombieSpawnTimer = 0;
  npcs.forEach(npc => npc.contactDamageTimer = 0);
}
