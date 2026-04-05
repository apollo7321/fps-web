import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════════
//  IMPORTS
// ═══════════════════════════════════════════════════════════════════
import { renderer, scene, vmScene, camera, vmCamera } from './renderer.js';
import { setupLighting } from './lighting.js';
import { buildWorld, explosiveBarrels, guillotineData } from './world.js';
import { updateDoorTriggers } from './doorTriggers.js';
import { createAmmoPickups, updatePickups, resetPickups } from './pickups.js';
import { M } from './materials.js';
import { player, resetPlayer } from './player.js';
import { createWeapon } from './weapons/index.js';
import {
  killNPC, npcs,
  updateNPCs, updateDyingNPCs,
  spawnRandomZombie, spawnRandomCrawler, resetAllNPCs,
  getAliveNPCMeshes, getNPCFromMesh, getAliveNPCCount, getZombieBreakdown,
} from './npc/index.js';
import {
  spawnBlood, spawnBloodFountain, spawnExplosion,
  updateParticles, clearAllParticles,
} from './particles.js';
import { getCtx, initAudio } from './audio.js';
import { updateHUD, initHUD } from './hud.js';
import { inputState, setupInput, resetInput } from './input.js';

// Architecture Decoupling Modules
import { eventBus } from './EventBus.js';
import { GameState } from './GameState.js';
import { PlayerController } from './controllers/PlayerController.js';
import { CameraController } from './controllers/CameraController.js';
import { triggerGuillotine, updateGuillotineAnimation } from './guillotine.js';

// ═══════════════════════════════════════════════════════════════════
//  INITIALISATION
// ═══════════════════════════════════════════════════════════════════
setupLighting();
initAudio();
initHUD();
CameraController.init();
buildWorld();
createAmmoPickups();

// Weapon
const weapon = createWeapon('P08 LUGER');
const vmGroup = new THREE.Group();
vmScene.add(vmGroup);
vmGroup.position.set(0.21, -0.20, -0.38);
vmGroup.rotation.set(0, 0.12, 0);
weapon.buildViewModel(vmGroup);

// Global raycaster
const raycaster = new THREE.Raycaster();

// ═══════════════════════════════════════════════════════════════════
//  SHOOTING
// ═══════════════════════════════════════════════════════════════════
function shoot() {
  if (!weapon.canShoot()) return;

  if (!weapon.hasAmmo()) {
    eventBus.emit('emptyClick');
    weapon.fireCooldown = 0.3;
    return;
  }

  weapon.consumeAmmo();
  weapon.triggerMuzzleFlash();
  eventBus.emit('weaponFired', { recoilAmount: weapon.getRecoilAmount() });

  // Raycast
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

  // Check barrel hits
  const ctx = getCtx();
  for (const barrel of explosiveBarrels) {
    if (!barrel.mesh) continue;
    if (barrel.hits > 0 && ctx.currentTime - barrel.hitTime > 2) {
      barrel.hits = 0;
    }
    if (raycaster.ray.distanceToPoint(barrel.pos) < 0.4) {
      barrel.hits++;
      barrel.hitTime = ctx.currentTime;
      if (barrel.hits >= 2) {
        explodeBarrel(barrel);
        barrel.hits = 0;
      }
      break;
    }
  }

  // Check NPC hits
  const targets = getAliveNPCMeshes();
  const hits = raycaster.intersectObjects(targets, false);

  if (hits.length > 0) {
    const npc = getNPCFromMesh(hits[0].object);
    if (npc && npc.alive) {
      const isHeadshot = hits[0].object.isHeadPart;
      spawnBlood(hits[0].point);
      eventBus.emit('enemyDamaged');

      const expRef = { value: player.exp };
      if (isHeadshot) {
        const dx = npc.group.position.x - player.pos.x;
        const dz = npc.group.position.z - player.pos.z;
        const len = Math.sqrt(dx*dx + dz*dz);
        const knockbackDir = len > 0 ? {x: dx/len, z: dz/len} : {x: 1, z: 0};
        killNPC(npc, knockbackDir, true, expRef);
        eventBus.emit('enemyKilled');
      } else {
        npc.health -= weapon.damage;
        if (npc.health <= 0) {
          const dx = npc.group.position.x - player.pos.x;
          const dz = npc.group.position.z - player.pos.z;
          const len = Math.sqrt(dx*dx + dz*dz);
          const knockbackDir = len > 0 ? {x: dx/len, z: dz/len} : {x: 1, z: 0};
          killNPC(npc, knockbackDir, false, expRef);
          eventBus.emit('enemyKilled');
        }
      }
      player.exp = expRef.value;
    }
  }

  // Auto-reload on empty
  if (!weapon.hasAmmo() && weapon.reserveAmmo > 0) startReload();

  eventBus.emit('ammoChanged', { ammoInMag: weapon.ammoInMag, reserveAmmo: weapon.reserveAmmo });
}

function startReload() {
  if (weapon.startReload()) {
    eventBus.emit('reloadStarted');
    eventBus.emit('reloadMsg', { show: true });
  }
}

function explodeBarrel(barrel) {
  spawnExplosion(barrel.pos);
  eventBus.emit('explosion');

  // Damage nearby NPCs
  const expRef = { value: player.exp };
  for (const npc of npcs) {
    if (!npc.alive) continue;
    const dx = npc.group.position.x - barrel.pos.x;
    const dz = npc.group.position.z - barrel.pos.z;
    const dist = Math.sqrt(dx*dx + dz*dz);
    if (dist < 8) {
      npc.health -= 50;
      if (npc.health <= 0) {
        const len = dist > 0 ? dist : 1;
        const knockbackDir = {x: dx/len, z: dz/len};
        killNPC(npc, knockbackDir, false, expRef);
        eventBus.emit('enemyKilled');
      }
    }
  }
  player.exp = expRef.value;

  scene.remove(barrel.mesh);
  barrel.mesh = null;
}

// ═══════════════════════════════════════════════════════════════════
//  GUILLOTINE (see guillotine.js)
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
//  GAME OVER / RESET
// ═══════════════════════════════════════════════════════════════════
function gameOver() {
  document.exitPointerLock();
  inputState.paused = true;
  eventBus.emit('gameOver');
}

function resetGame() {
  resetPlayer();
  weapon.reset();
  GameState.reset();
  CameraController.reset();
  PlayerController.reset();

  resetAllNPCs();
  resetPickups();
  clearAllParticles();

  vmGroup.visible = true;  // Restore viewmodel visibility
  resetInput();
  eventBus.emit('gameReset');
  eventBus.emit('ammoChanged', { ammoInMag: weapon.ammoInMag, reserveAmmo: weapon.reserveAmmo });
  eventBus.emit('zombieModeToggled', { active: false, count: 0 });
  eventBus.emit('zombieBreakdownChanged', { walkers: 0, crawlers: 0 });
}

// ═══════════════════════════════════════════════════════════════════
//  INPUT SETUP
// ═══════════════════════════════════════════════════════════════════
setupInput({
  onShoot: shoot,
  onReload: startReload,
  onToggleZombie: () => {
    GameState.zombieMode = !GameState.zombieMode;
    if (GameState.zombieMode) {
      // Spawn initial mix of walkers and crawlers if none exist yet
      if (getAliveNPCCount() === 0) {
        for (let i = 0; i < 7; i++) spawnRandomZombie(player.pos);
        for (let i = 0; i < 3; i++) spawnRandomCrawler(player.pos);
      }
      npcs.forEach(npc => { if (npc.alive && !npc.dying) npc.makeZombie(); });
    } else {
      npcs.forEach(npc => { if (npc.alive && !npc.dying) npc.makeNormal(); });
    }
    const breakdown = getZombieBreakdown();
    eventBus.emit('zombieModeToggled', { active: GameState.zombieMode, count: getAliveNPCCount() });
    eventBus.emit('zombieBreakdownChanged', breakdown);
  },
  onRestart: resetGame,
}, player);

// ═══════════════════════════════════════════════════════════════════
//  UPDATE LOOP
// ═══════════════════════════════════════════════════════════════════
function update(dt) {
  if (!inputState.locked || inputState.paused) return;

  // ─── Guillotine cutscene overrides player & camera ────────────
  if (GameState.guillotineCutscene) {
    vmGroup.visible = false;  // Hide viewmodel (pistol) during cutscene
    updateGuillotineAnimation(dt, camera, player, guillotineData,
      spawnBloodFountain, eventBus, gameOver);
    // Still update blade falling
    if (guillotineData.bladeFalling) {
      guillotineData.blade.position.y -= 15 * dt;
      if (guillotineData.blade.position.y < 0.4) {
        guillotineData.blade.position.y = 0.4;
        guillotineData.bladeFalling = false;
      }
    }
    updateDyingNPCs(dt);
    updateParticles(dt);
    return;
  }

  vmGroup.visible = true;  // Ensure viewmodel is visible during normal gameplay

  const movementState = PlayerController.updateMovement(dt, player, inputState);
  CameraController.update(dt, player, inputState, weapon, camera, vmCamera, vmGroup);

  // ─── Door Triggers ────────────────────────────────────────────
  updateDoorTriggers(player.pos, player);

  // ─── Weapon timers ────────────────────────────────────────────
  weapon.updateTimers(dt);

  if (weapon.reloading) {
    weapon.reloadTimer -= dt;
    if (weapon.reloadTimer <= 0) {
      weapon.finishReload();
      eventBus.emit('reloadMsg', { show: false });
      eventBus.emit('ammoChanged', { ammoInMag: weapon.ammoInMag, reserveAmmo: weapon.reserveAmmo });
    }
  }

  // ─── NPC AI ───────────────────────────────────────────────────
  updateNPCs(dt, player.pos, GameState.zombieMode);

  // ─── Zombie Contact Damage ────────────────────────────────────
  if (GameState.zombieMode) {
    const CONTACT_DISTANCE = 0.65;
    const contactingZombies = npcs.filter(npc => {
      if (!npc.alive || npc.dying) return false;
      const dx = npc.group.position.x - player.pos.x;
      const dz = npc.group.position.z - player.pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      return dist < CONTACT_DISTANCE;
    });

    if (contactingZombies.length > 0) {
      GameState.zombieContactDamageTimer += dt;
      if (GameState.zombieContactDamageTimer >= 1.0) {
        player.health -= contactingZombies.length;
        eventBus.emit('playerDamaged');
        GameState.zombieContactDamageTimer = 0;
      }
    } else {
      GameState.zombieContactDamageTimer = 0;
    }

    // Zombie spawning (mix of walkers and crawlers)
    GameState.zombieSpawnTimer += dt;
    if (GameState.zombieSpawnTimer >= 10.0) {
      const spawnCount = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < spawnCount; i++) {
        if (Math.random() < 0.3) spawnRandomCrawler(player.pos);
        else spawnRandomZombie(player.pos);
      }
      GameState.zombieSpawnTimer = 0;
    }
  } else {
    GameState.zombieContactDamageTimer = 0;
    GameState.zombieSpawnTimer = 0;
  }

  // ─── Health Regeneration ──────────────────────────────────────
  if (player.health < 100) {
    GameState.healthRegenTimer += dt;
    if (GameState.healthRegenTimer >= 5.0) {
      player.health = Math.min(100, player.health + 2);
      GameState.healthRegenTimer = 0;
    }
  } else {
    GameState.healthRegenTimer = 0;
  }

  // ─── Guillotine Trigger ───────────────────────────────────────
  if (!GameState.guillotineAnimation && guillotineData.position) {
    const dx = player.pos.x - guillotineData.position.x;
    const dz = player.pos.z - guillotineData.position.z;
    if (Math.sqrt(dx * dx + dz * dz) < 2.0) {
      triggerGuillotine(player, guillotineData);
    }
  }

  // ─── Dying NPCs ───────────────────────────────────────────────
  updateDyingNPCs(dt);

  // ─── Particles ────────────────────────────────────────────────
  updateParticles(dt);

  // ─── Ammo pickups ─────────────────────────────────────────────
  const pickupResult = updatePickups(dt, player.pos, weapon);
  if (pickupResult.pickedUp) {
    eventBus.emit('ammoChanged', { ammoInMag: weapon.ammoInMag, reserveAmmo: weapon.reserveAmmo });
    eventBus.emit('itemPickup');
    GameState.pickupHintTimer = 2.0;
  }

  if (GameState.pickupHintTimer > 0) {
    GameState.pickupHintTimer -= dt;
    eventBus.emit('pickupHintUpdate', { show: GameState.pickupHintTimer > 0 });
  } else if (pickupResult.nearPickup) {
    eventBus.emit('pickupHintUpdate', { show: true, text: '[ MAGAZIN AUFNEHMEN ]' });
  } else {
    eventBus.emit('pickupHintUpdate', { show: false });
  }

  // ─── Game Over Check ──────────────────────────────────────────
  if (player.health <= 0) {
    gameOver();
  }
}

// ═══════════════════════════════════════════════════════════════════
//  RENDER LOOP
// ═══════════════════════════════════════════════════════════════════
eventBus.emit('ammoChanged', { ammoInMag: weapon.ammoInMag, reserveAmmo: weapon.reserveAmmo });
let last = performance.now();

function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  update(dt);
  updateHUD(player);

  renderer.clear();
  renderer.render(scene, camera);

  renderer.clearDepth();
  renderer.render(vmScene, vmCamera);

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
