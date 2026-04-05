import * as THREE from 'three';
import { scene } from './renderer.js';
import { box, cyl, solidBox, addCollider } from './geometry.js';
import { M, matGround, matDirt, matConcrete, matBrick, matWood, matRoof,
         matRubble, matWindow, matSandbag, matBarrel } from './materials.js';
import { registerDoor } from './doorTriggers.js';

// ═══════════════════════════════════════════════════════════════════
//  WORLD CONSTRUCTION
// ═══════════════════════════════════════════════════════════════════
export const explosiveBarrels = [];
export const guillotineData = {
  position: null,
  bladeGroup: null,
  blade: null,
  bladeRestY: 3.0,
  triggered: false,
  bladeFalling: false,
};

// ── Building Templates ──────────────────────────────────────────
function buildingA(bx, bz, ry = 0) {
  const W=8, D=10, H=5;
  solidBox(W, H, D, matBrick, bx, H/2, bz, ry);
  box(W+.2, .3, D+.2, matRoof, bx, H+.15, bz, 0, ry);
  const cosR = Math.cos(ry), sinR = Math.sin(ry);
  const fz = D/2;
  for (let i=-1; i<=1; i+=2) {
    const lx = i * 2.2;
    const wx = bx + lx * cosR + fz * sinR;
    const wz = bz - lx * sinR + fz * cosR;
    box(1.2, 1.2, 0.1, matWindow, wx, H/2+.3, wz, 0, ry);
  }
  const dx = bx + fz * sinR;
  const dz = bz + fz * cosR;
  box(1.2, 2.2, 0.1, M(0x111111), dx, 1.1, dz, 0, ry);
}

function buildingB(bx, bz, ry = 0) {
  const W=6, D=7, H=4;
  const cosR = Math.cos(ry), sinR = Math.sin(ry);
  function wp(lx, lz) {
    return [bx + lx*cosR + lz*sinR, bz - lx*sinR + lz*cosR];
  }
  const [bwx,bwz] = wp(0, -D/2);
  solidBox(W, H, .5, matBrick, bwx, H/2, bwz, ry);
  const [fwx,fwz] = wp(0, D/2);
  solidBox(W, H, .5, matBrick, fwx, H/2, fwz, ry);
  const [lwx,lwz] = wp(-W/2, 0);
  solidBox(.5, H, D, matBrick, lwx, H/2, lwz, ry);
  const [rwx,rwz] = wp(W/2, 0);
  solidBox(.5, H, D, matBrick, rwx, H/2, rwz, ry);
  box(W-1, .3, D-1, matConcrete, bx, H+.15, bz, 0, ry);
  const [r1x,r1z] = wp(1, 1.5);
  box(1.5, .8, 1.5, matRubble, r1x, .4, r1z, 0, ry+.4);
  const [r2x,r2z] = wp(-1.5, -1);
  box(.8, .5, .8, matRubble, r2x, .25, r2z, 0, ry+.8);
}

function shed(bx, bz, ry=0) {
  solidBox(5, 3, 4, matWood, bx, 1.5, bz, ry);
  box(5.1, .2, 4.1, matRoof, bx, 3.1, bz, 0, ry);
}

function sandbags(bx, bz, ry=0) {
  for (let i=-2; i<=2; i++) solidBox(.9,.5,.55, matSandbag, bx+i*.92, .25, bz, 0, ry);
  for (let i=-1; i<=1; i++) solidBox(.9,.5,.55, matSandbag, bx+i*.92, .75, bz, 0, ry);
}

function barrels(bx, bz) {
  for (let i=0; i<3; i++) {
    const px=bx+(Math.random()-.5)*2, pz=bz+(Math.random()-.5)*2;
    const mesh = cyl(.35,.35,1,8, matBarrel, px, .5, pz);
    addCollider(px,.5,pz, .7,1,.7);
    explosiveBarrels.push({
      mesh, pos: new THREE.Vector3(px, 0.5, pz),
      hits: 0, hitTime: 0
    });
  }
}

function tree(bx, bz) {
  const h = 2.2 + Math.random() * 1.4;
  cyl(.16,.22, h, 8, matWood, bx, h/2, bz);
  addCollider(bx, h/2, bz, .45, h, .45);
  const c1 = M(0x2a5c1a), c2 = M(0x1e4812), c3 = M(0x336020);
  cyl(0, 2.4, 3.2, 9, c2, bx, h + 1.2, bz);
  cyl(0, 2.0, 2.8, 9, c1, bx, h + 2.2, bz);
  cyl(0, 1.5, 2.2, 9, c3, bx, h + 3.0, bz);
  cyl(0, 0.9, 1.6, 9, c1, bx, h + 3.6, bz);
  cyl(0, 0.4, 1.0, 8, c2, bx, h + 4.1, bz);
}

function rubblePile(bx, bz) {
  for (let i=0; i<5; i++) {
    const px=bx+(Math.random()-.5)*3, pz=bz+(Math.random()-.5)*3, s=.4+Math.random()*.8;
    box(s,s*.6,s, matRubble, px,s*.3,pz, 0,Math.random()*Math.PI);
    addCollider(px, s*.3, pz, s, s*.6, s);
  }
}

function lowWall(bx, bz, len, ry=0) { solidBox(len,1,.3, matConcrete, bx,.5,bz, ry); }

function buildGuillotine(bx, bz) {
  const matWood2 = M(0x8B4513);
  const matMetal = M(0x333333);

  solidBox(0.3, 4, 0.3, matWood2, bx - 0.8, 2, bz);
  solidBox(0.3, 4, 0.3, matWood2, bx + 0.8, 2, bz);
  solidBox(1.6, 0.3, 0.3, matWood2, bx, 3.9, bz);
  solidBox(2.0, 0.4, 1.0, matWood2, bx, 0.2, bz);

  const bladeGroup = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.12), matMetal);
  blade.position.set(0, 3.0, 0);
  bladeGroup.add(blade);
  bladeGroup.position.set(bx, 0, bz);
  scene.add(bladeGroup);

  guillotineData.position = new THREE.Vector3(bx, 0, bz);
  guillotineData.bladeGroup = bladeGroup;
  guillotineData.blade = blade;
  guillotineData.bladeRestY = 3.0;
  guillotineData.triggered = false;
  guillotineData.bladeFalling = false;

  addCollider(bx, 0.2, bz, 2.0, 0.4, 1.0);
}

// ── Measuring tape ──────────────────────────────────────────────
function buildMeasuringTape() {
  const matTick  = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const matNum5  = new THREE.MeshBasicMaterial({ color: 0xffdd44 });
  const matNum10 = new THREE.MeshBasicMaterial({ color: 0xff6622 });
  const thick = 0.03;

  function toRoman(n) {
    const vals = [50,40,10,9,5,4,1];
    const syms = ['L','XL','X','IX','V','IV','I'];
    let s = '';
    for (let i = 0; i < vals.length; i++) {
      while (n >= vals[i]) { s += syms[i]; n -= vals[i]; }
    }
    return s;
  }

  const W = 0.18, H = 0.22, S = 0.04;
  function letterStrokes(ch) {
    switch (ch) {
      case 'I': return [{w:S, h:H, ox:0, oz:0}];
      case 'V': return [
        {w:S, h:H*0.65, ox:-W*0.3, oz: H*0.18},
        {w:S, h:H*0.65, ox: W*0.3, oz: H*0.18},
        {w:W*0.7, h:S, ox:0, oz:-H*0.35},
      ];
      case 'X': return [
        {w:S, h:H*0.65, ox:-W*0.3, oz: H*0.18},
        {w:S, h:H*0.65, ox: W*0.3, oz: H*0.18},
        {w:W*0.7, h:S, ox:0, oz:-H*0.35},
        {w:S, h:H*0.65, ox:-W*0.3, oz:-H*0.18},
        {w:S, h:H*0.65, ox: W*0.3, oz:-H*0.18},
        {w:W*0.7, h:S, ox:0, oz: H*0.35},
      ];
      case 'L': return [
        {w:S, h:H, ox:-W*0.35, oz:0},
        {w:W*0.6, h:S, ox:W*0.05, oz:-H*0.46},
      ];
      default: return [];
    }
  }

  function drawRoman(label, zPos, lMat) {
    const chars = label.split('');
    const charW = W + 0.06;
    chars.forEach((ch, ci) => {
      const ox = (ci - (chars.length - 1) * 0.5) * charW;
      letterStrokes(ch).forEach(({w, h, ox: lx, oz: lz}) => {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(w, thick, h), lMat);
        bar.position.set(ox + lx, 0.025, zPos - 0.55 + lz);
        scene.add(bar);
      });
    });
  }

  for (let z = -80; z <= 80; z++) {
    const is10 = (z % 10 === 0);
    const is5  = (z % 5  === 0);
    const mat  = is10 ? matNum10 : (is5 ? matNum5 : matTick);
    const w    = is10 ? 3.5 : (is5 ? 2.5 : 1.2);
    const tick = new THREE.Mesh(new THREE.BoxGeometry(w, thick, 0.06), mat);
    tick.position.set(0, 0.025, z);
    scene.add(tick);

    if (is5) {
      const lMat = is10 ? matNum10 : matNum5;
      const roman = toRoman(Math.abs(z));
      drawRoman(roman, z, lMat);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
//  BUILD WORLD (call once at startup)
// ═══════════════════════════════════════════════════════════════════
export function buildWorld() {
  // Ground
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200, 40, 40), matGround);
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  scene.add(ground);

  for (let i = 0; i < 20; i++) {
    box(2 + Math.random()*6, 0.05, 2 + Math.random()*6, matDirt,
        (Math.random()-.5)*180, 0.02, (Math.random()-.5)*180);
  }
  box(6, 0.02, 180, matDirt, 0, 0.01, 0); // road

  // Measuring tape
  // buildMeasuringTape();

  // ── CITY BLOCK LAYOUT ──
  box(80, 0.02, 6, matDirt, 0, 0.011, 0);
  box(40, 0.02, 6, matDirt, 0, 0.011, 40);

  // West side
  buildingA(-11, -18, Math.PI/2);
  registerDoor(-11 + 5*Math.sin(Math.PI/2), -18 + 5*Math.cos(Math.PI/2), -11, -18, 5);
  buildingA(-11, -30, Math.PI/2);
  registerDoor(-11 + 5*Math.sin(Math.PI/2), -30 + 5*Math.cos(Math.PI/2), -11, -30, 5);
  shed(-11, -40, Math.PI/2);
  registerDoor(-11 + 2*Math.sin(Math.PI/2), -40 + 2*Math.cos(Math.PI/2), -11, -40, 3);
  buildingA(-11,  12, Math.PI/2);
  registerDoor(-11 + 5*Math.sin(Math.PI/2), 12 + 5*Math.cos(Math.PI/2), -11, 12, 5);
  buildingA(-11,  24, Math.PI/2);
  registerDoor(-11 + 5*Math.sin(Math.PI/2), 24 + 5*Math.cos(Math.PI/2), -11, 24, 5);
  buildingB(-11,  35, Math.PI/2);
  registerDoor(-11 + 3.5*Math.sin(Math.PI/2), 35 + 3.5*Math.cos(Math.PI/2), -11, 35, 4);
  shed(-11, 48, Math.PI/2);
  registerDoor(-11 + 2*Math.sin(Math.PI/2), 48 + 2*Math.cos(Math.PI/2), -11, 48, 3);

  // East side
  buildingA(11, -18, -Math.PI/2);
  registerDoor(11 + 5*Math.sin(-Math.PI/2), -18 + 5*Math.cos(-Math.PI/2), 11, -18, 5);
  buildingB(11, -30, -Math.PI/2);
  registerDoor(11 + 3.5*Math.sin(-Math.PI/2), -30 + 3.5*Math.cos(-Math.PI/2), 11, -30, 4);
  buildingA(11, -42, -Math.PI/2);
  registerDoor(11 + 5*Math.sin(-Math.PI/2), -42 + 5*Math.cos(-Math.PI/2), 11, -42, 5);
  buildingA(11,  12, -Math.PI/2);
  registerDoor(11 + 5*Math.sin(-Math.PI/2), 12 + 5*Math.cos(-Math.PI/2), 11, 12, 5);
  shed(11,  24, -Math.PI/2);
  registerDoor(11 + 2*Math.sin(-Math.PI/2), 24 + 2*Math.cos(-Math.PI/2), 11, 24, 3);
  buildingA(11,  34, -Math.PI/2);
  registerDoor(11 + 5*Math.sin(-Math.PI/2), 34 + 5*Math.cos(-Math.PI/2), 11, 34, 5);
  buildingA(11,  48, -Math.PI/2);
  registerDoor(11 + 5*Math.sin(-Math.PI/2), 48 + 5*Math.cos(-Math.PI/2), 11, 48, 5);

  // South side of cross street
  buildingA(-28, -10);
  registerDoor(-28 + 5*Math.sin(0), -10 + 5*Math.cos(0), -28, -10, 5);
  shed(-38, -10);
  registerDoor(-38 + 2*Math.sin(0), -10 + 2*Math.cos(0), -38, -10, 3);
  buildingA(28, -10);
  registerDoor(28 + 5*Math.sin(0), -10 + 5*Math.cos(0), 28, -10, 5);
  buildingB(38, -10);
  registerDoor(38 + 3.5*Math.sin(0), -10 + 3.5*Math.cos(0), 38, -10, 4);

  // North side of cross street
  buildingA(-28, 10, Math.PI);
  registerDoor(-28 + 5*Math.sin(Math.PI), 10 + 5*Math.cos(Math.PI), -28, 10, 5);
  buildingB(-38, 10, Math.PI);
  registerDoor(-38 + 3.5*Math.sin(Math.PI), 10 + 3.5*Math.cos(Math.PI), -38, 10, 4);
  buildingA(28, 10, Math.PI);
  registerDoor(28 + 5*Math.sin(Math.PI), 10 + 5*Math.cos(Math.PI), 28, 10, 5);
  shed(38, 10, Math.PI);
  registerDoor(38 + 2*Math.sin(Math.PI), 10 + 2*Math.cos(Math.PI), 38, 10, 3);

  // Back streets
  buildingA(-28, -26, Math.PI/2);
  registerDoor(-28 + 5*Math.sin(Math.PI/2), -26 + 5*Math.cos(Math.PI/2), -28, -26, 5);
  buildingA(-28, -38, Math.PI/2);
  registerDoor(-28 + 5*Math.sin(Math.PI/2), -38 + 5*Math.cos(Math.PI/2), -28, -38, 5);
  buildingA(28, -26, -Math.PI/2);
  registerDoor(28 + 5*Math.sin(-Math.PI/2), -26 + 5*Math.cos(-Math.PI/2), 28, -26, 5);
  shed(28, -38, -Math.PI/2);
  registerDoor(28 + 2*Math.sin(-Math.PI/2), -38 + 2*Math.cos(-Math.PI/2), 28, -38, 3);
  buildingA(-28, 24, Math.PI/2);
  registerDoor(-28 + 5*Math.sin(Math.PI/2), 24 + 5*Math.cos(Math.PI/2), -28, 24, 5);
  buildingA(28, 24, -Math.PI/2);
  registerDoor(28 + 5*Math.sin(-Math.PI/2), 24 + 5*Math.cos(-Math.PI/2), 28, 24, 5);
  shed(-28, 36, Math.PI/2);
  registerDoor(-28 + 2*Math.sin(Math.PI/2), 36 + 2*Math.cos(Math.PI/2), -28, 36, 3);
  buildingB(28, 36, -Math.PI/2);
  registerDoor(28 + 3.5*Math.sin(-Math.PI/2), 36 + 3.5*Math.cos(-Math.PI/2), 28, 36, 4);

  // Sandbags
  sandbags(-2.5, 5);  sandbags(2.5, -5, Math.PI);
  sandbags(5, 2.5, Math.PI/2);  sandbags(-5, -2.5, -Math.PI/2);
  sandbags(0, 20);  sandbags(0, -15, Math.PI);
  sandbags(15, 0, Math.PI/2);  sandbags(-15, 0, -Math.PI/2);
  sandbags(0, 35);  sandbags(0, -35, Math.PI);
  sandbags(-20, -18, Math.PI/2);
  sandbags(20, 12, -Math.PI/2);

  // Low walls
  lowWall(-4, 15, 5);  lowWall(4, -12, 5);
  lowWall(-20, 0, 8, Math.PI/2);  lowWall(20, 0, 8, Math.PI/2);
  lowWall(0, 45, 6);  lowWall(0, -48, 6);

  // Barrels
  barrels(-6, -15);  barrels(7, 18);  barrels(-8, 30);  barrels(6, -28);
  barrels(-20, -5);  barrels(20, 5);  barrels(-3, 42);  barrels(4, -40);
  barrels(-35, -15); barrels(35, 20);

  // Rubble
  rubblePile(-5, -5);  rubblePile(5, 5);
  rubblePile(-18, 15); rubblePile(18, -20);
  rubblePile(0, -25);  rubblePile(-30, 0);

  // Trees
  [[-20,30],[-22,45],[22,30],[24,45],[-40,-20],[-42,-35],[40,-20],[42,-35],
   [-45,15],[45,15],[-45,-5],[45,-5],[-8,55],[8,55],[-8,-55],[8,-55],
   [-50,0],[50,0]].forEach(([tx,tz])=>tree(tx,tz));

  // Guillotine
  buildGuillotine(0, 0);

  // Crater
  { const m = new THREE.Mesh(new THREE.CylinderGeometry(2.5,3,.8,12,1,true), matDirt);
    m.position.set(-22,-.5,-15); m.receiveShadow=true; scene.add(m);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(3,.35,6,12), matDirt);
    rim.rotation.x=-Math.PI/2; rim.position.set(-22,.15,-15); scene.add(rim);
  }
}
