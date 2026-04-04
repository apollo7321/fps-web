import * as THREE from 'three';
import { M } from './materials.js';
import { scene } from './renderer.js';
import { GameState } from './GameState.js';

// ═══════════════════════════════════════════════════════════════════
//  GUILLOTINE SYSTEM
// ═══════════════════════════════════════════════════════════════════

// Camera state for smooth 3rd-person transition
const _camTarget = new THREE.Vector3();
const _camPos    = new THREE.Vector3();

// ── Soldier model (Allied officer look — different from walkers) ──
export function createSoldierModel() {
  const g        = new THREE.Group();
  const matKhaki = M(0x8a7a55);   // tan/khaki uniform
  const matDark  = M(0x5a4a30);   // darker trim
  const matSkin  = M(0xd4a070);   // lighter skin than walkers
  const matFace  = M(0x111111);
  const matBelt  = M(0x3a2a10);
  const matPeak  = M(0x4a3a20);   // peaked officer cap

  // Legs
  const legL = new THREE.Mesh(new THREE.BoxGeometry(.18,.6,.18), matKhaki);
  legL.position.set(-0.12, .3, 0); legL.castShadow = true; g.add(legL);
  const legR = new THREE.Mesh(new THREE.BoxGeometry(.18,.6,.18), matKhaki);
  legR.position.set( 0.12, .3, 0); legR.castShadow = true; g.add(legR);

  // Belt
  const belt = new THREE.Mesh(new THREE.BoxGeometry(.50,.07,.28), matBelt);
  belt.position.set(0, .63, 0); g.add(belt);

  // Torso (slightly wider/bulkier than walker)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(.50,.58,.28), matKhaki);
  torso.position.set(0, .94, 0); torso.castShadow = true; g.add(torso);

  // Shoulder epaulettes
  [-0.30, 0.30].forEach(ex => {
    const ep = new THREE.Mesh(new THREE.BoxGeometry(.12,.04,.24), matDark);
    ep.position.set(ex, 1.18, 0); g.add(ep);
  });

  // Arms
  const armL = new THREE.Mesh(new THREE.BoxGeometry(.14,.50,.18), matKhaki);
  armL.position.set(-0.34, .88, 0); armL.castShadow = true; g.add(armL);
  const armR = new THREE.Mesh(new THREE.BoxGeometry(.14,.50,.18), matKhaki);
  armR.position.set( 0.34, .88, 0); armR.castShadow = true; g.add(armR);

  // Neck
  const neck = new THREE.Mesh(new THREE.BoxGeometry(.12,.10,.12), matSkin);
  neck.position.set(0, 1.24, 0); g.add(neck);

  // Head (square jaw, slightly different proportions)
  const head = new THREE.Mesh(new THREE.BoxGeometry(.30,.30,.27), matSkin);
  head.position.set(0, 1.47, 0); head.castShadow = true; g.add(head);

  // Eyes
  [-0.08, 0.08].forEach(ex => {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(.055,.04,.01), matFace);
    eye.position.set(ex, 1.51, 0.145); g.add(eye);
  });

  // Thin moustache
  const mous = new THREE.Mesh(new THREE.BoxGeometry(.10,.018,.01), matFace);
  mous.position.set(0, 1.44, 0.145); g.add(mous);

  // Officer peaked cap (flat-topped, different from helmet)
  const capTop = new THREE.Mesh(new THREE.BoxGeometry(.32,.06,.30), matPeak);
  capTop.position.set(0, 1.65, 0); capTop.castShadow = true; g.add(capTop);
  const capBand = new THREE.Mesh(new THREE.BoxGeometry(.34,.08,.32), matBelt);
  capBand.position.set(0, 1.58, 0); g.add(capBand);
  const capBrim = new THREE.Mesh(new THREE.BoxGeometry(.38,.03,.20), matPeak);
  capBrim.position.set(0, 1.55, -0.10); g.add(capBrim);   // brim faces forward

  const headParts = [head, capTop, capBand, capBrim, mous];

  scene.add(g);
  return { group: g, head, headParts, armL, armR, legL, legR };
}

// ── Severed rolling head (simpler mesh, just needs to roll) ────────
function createSeveredHead() {
  const g     = new THREE.Group();
  const mSkin = M(0xd4a070);
  const mFace = M(0x111111);
  const mCap  = M(0x4a3a20);

  const head = new THREE.Mesh(new THREE.BoxGeometry(.30,.30,.27), mSkin);
  g.add(head);
  [-0.08, 0.08].forEach(ex => {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(.055,.04,.01), mFace);
    eye.position.set(ex, 0.04, 0.145); g.add(eye);
  });
  const cap = new THREE.Mesh(new THREE.BoxGeometry(.32,.06,.30), mCap);
  cap.position.set(0, 0.18, 0); g.add(cap);

  return g;
}

// ── Trigger ────────────────────────────────────────────────────────
export function triggerGuillotine(player, guillotineData) {
  if (GameState.guillotineAnimation) return;

  GameState.guillotineCutscene = true;

  const model = createSoldierModel();

  // Place the model lying face-down (prone) on ground, neck under blade.
  // Standing model: head at y=1.47, neck at y=1.24, eyes at z=+0.145 (+Z face).
  // Rx(+90°) transforms: +Z face → -Y (looking down), +Y body → +Z (extending forward).
  // NO rotation.y — adding π to Y flips the face back upward.
  // Position: group origin at gp.z - 1.24 so neck (local y=1.24→world z=1.24) aligns with blade.
  const gp = guillotineData.position;
  model.group.position.set(gp.x, 0.54, gp.z - 1.24);  // y=0.4 (base top) + 0.14 (half body depth)
  model.group.rotation.x = Math.PI / 2;  // pitch 90°: face looks down, body extends toward +Z
  model.group.rotation.y = 0;

  GameState.guillotineAnimation = {
    model,
    phase: 0,   // 0 = camera pan in, 1 = blade falls, 2 = head rolls
    timer: 0,
    headRemoved: false,
    severedHead: null,
    headVelX: 0,
    headVelZ: 0,
    headSpin: 0,
  };
}

// ── Per-frame update (called from main.js instead of camera/player) ─
export function updateGuillotineAnimation(dt, camera, player, guillotineData, spawnBloodFountain, eventBus, gameOverCb) {
  const anim = GameState.guillotineAnimation;
  if (!anim) return;

  anim.timer += dt;

  // ── 3rd-person camera: smooth lerp to side-angle view ─────────
  _camTarget.copy(guillotineData.position).add(new THREE.Vector3(0, 1.0, 0));
  _camPos.copy(guillotineData.position).add(new THREE.Vector3(-3.5, 2.5, 3.0));
  camera.position.lerp(_camPos, Math.min(dt * 3, 1));
  camera.lookAt(_camTarget);

  // ── Phase 0: Hold for dramatic pause, then release blade (1.5s) ─
  if (anim.phase === 0) {
    if (anim.timer >= 1.5) {
      guillotineData.bladeFalling = true;
      anim.phase = 1;
      anim.timer = 0;
    }
  }

  // ── Phase 1: Wait for blade to fall, then separate head ────────
  else if (anim.phase === 1) {
    const bladeHit = !guillotineData.bladeFalling && anim.timer > 0.1;
    const timeout  = anim.timer > 1.5;

    if ((bladeHit || timeout) && !anim.headRemoved) {
      anim.headRemoved = true;
      const pg = anim.model.group;

      // Remove head parts from body model
      anim.model.headParts.forEach(part => {
        if (pg.children.includes(part)) pg.remove(part);
      });

      // Spawn free-rolling severed head at blade impact point
      const sHead = createSeveredHead();
      const neckWorld = guillotineData.position.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.2, 0.5, 0.1
      ));
      sHead.position.copy(neckWorld);
      sHead.rotation.set(Math.random() * 0.5, Math.random() * Math.PI * 2, Math.random() * 0.5);
      scene.add(sHead);
      anim.severedHead = sHead;

      // Roll away from guillotine
      const rollAngle = (Math.random() - 0.5) * Math.PI * 0.6;
      const rollSpeed = 2.5 + Math.random() * 1.5;
      anim.headVelX = Math.sin(rollAngle) * rollSpeed;
      anim.headVelZ = Math.cos(rollAngle) * rollSpeed;
      anim.headSpin = (Math.random() < 0.5 ? 1 : -1) * (8 + Math.random() * 6);

      spawnBloodFountain(neckWorld);
      eventBus.emit('playerDamaged');

      anim.phase = 2;
      anim.timer = 0;
    }
  }

  // ── Phase 2: Head rolls on ground, camera holds, then game over ─
  else if (anim.phase === 2) {
    if (anim.severedHead) {
      anim.headVelX *= 0.97;
      anim.headVelZ *= 0.97;
      anim.headSpin  *= 0.96;

      anim.severedHead.position.x += anim.headVelX * dt;
      anim.severedHead.position.z += anim.headVelZ * dt;
      anim.severedHead.rotation.x += anim.headSpin * dt;
      anim.severedHead.rotation.z += anim.headSpin * 0.3 * dt;

      // Drop to ground
      if (anim.severedHead.position.y > 0.15) {
        anim.severedHead.position.y -= dt * 5.0;
      } else {
        anim.severedHead.position.y = 0.15;
      }
    }

    if (anim.timer > 3.5) {
      scene.remove(anim.model.group);
      if (anim.severedHead) scene.remove(anim.severedHead);
      GameState.guillotineAnimation = null;
      GameState.guillotineCutscene  = false;
      player.health = 0;
      gameOverCb();
    }
  }
}
