import * as THREE from 'three';

const canvas   = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.autoClear = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8a9ba8);
scene.fog = new THREE.Fog(0x8a9ba8, 20, 120);

// Second scene for viewmodel (no fog, always on top)
const vmScene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 200);
camera.position.set(0, 1.75, 0);
scene.add(camera); // needed for viewmodel parenting

const vmCamera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.01, 10);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = vmCamera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  vmCamera.updateProjectionMatrix();
});

export { renderer, scene, vmScene, camera, vmCamera, canvas };
