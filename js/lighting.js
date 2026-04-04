import * as THREE from 'three';
import { scene, vmScene } from './renderer.js';

export function setupLighting() {
  scene.add(new THREE.AmbientLight(0xb0c0d0, 0.7));

  const sun = new THREE.DirectionalLight(0xfff0d0, 1.4);
  sun.position.set(40, 80, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 250;
  sun.shadow.camera.left = -80; sun.shadow.camera.right = 80;
  sun.shadow.camera.top   =  80; sun.shadow.camera.bottom = -80;
  sun.shadow.bias = -0.002;
  scene.add(sun);

  { const fl = new THREE.DirectionalLight(0x8090a0, 0.4); fl.position.set(-20, 10, -20); scene.add(fl); }

  vmScene.add(new THREE.AmbientLight(0xffffff, 1.4));
  { const vl = new THREE.DirectionalLight(0xfff0d0, 0.8); vl.position.set(1, 2, 3); vmScene.add(vl); }
}
