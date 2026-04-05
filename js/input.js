import { canvas } from './renderer.js';

// ═══════════════════════════════════════════════════════════════════
//  INPUT STATE
// ═══════════════════════════════════════════════════════════════════
export const inputState = {
  keys: {},
  locked: false,
  paused: false,
  adsActive: false,
  adsLerp: 0,
};

export const FOV_HIP = 75;
export const FOV_ADS = 46;

/**
 * Set up all input event listeners.
 * @param {object} callbacks - { onShoot, onReload, onToggleZombie, onToggleExtreme, onRestart }
 * @param {object} player - player state for mouse look
 */
export function setupInput(callbacks, player) {
  const keys = inputState.keys;

  document.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'MetaLeft') {
      if (inputState.locked && !inputState.paused) { inputState.adsActive = true; e.preventDefault(); }
      return;
    }
    if (!inputState.locked || inputState.paused) return;
    if (e.code === 'KeyR') callbacks.onReload();
    if (e.code === 'KeyP') callbacks.onToggleZombie();
    if (e.code === 'KeyX') callbacks.onToggleExtreme();
  });
  document.addEventListener('keyup', e => {
    keys[e.code] = false;
    if (e.code === 'MetaLeft') inputState.adsActive = false;
  });

  document.getElementById('startBtn').addEventListener('click', () => canvas.requestPointerLock());

  document.addEventListener('pointerlockchange', () => {
    const wasLocked = inputState.locked;
    inputState.locked = document.pointerLockElement === canvas;
    if (inputState.locked) {
      document.getElementById('overlay').style.display = 'none';
      document.getElementById('hud').style.display     = 'block';
      document.getElementById('paused').style.display  = 'none';
      inputState.paused = false;
    } else if (wasLocked && player.health > 0) {
      inputState.paused = true;
      document.getElementById('paused').style.display = 'flex';
    }
  });

  document.addEventListener('mousemove', e => {
    if (!inputState.locked || inputState.paused) return;
    const s = 0.0018;
    player.yaw   -= e.movementX * s;
    player.pitch -= e.movementY * s;
    player.pitch  = Math.max(-Math.PI/2.2, Math.min(Math.PI/2.2, player.pitch));
  });

  document.addEventListener('mousedown', e => {
    if (!inputState.locked || inputState.paused) return;
    if (e.button === 0) callbacks.onShoot();
    if (e.button === 2) inputState.adsActive = true;
  });
  document.addEventListener('mouseup', e => {
    if (e.button === 2) inputState.adsActive = false;
  });
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  document.getElementById('paused').addEventListener('click', () => canvas.requestPointerLock());

  // Delegated restart button
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('restart-btn')) {
      callbacks.onRestart();
      canvas.requestPointerLock();
    }
  });
}

export function resetInput() {
  for (const key in inputState.keys) {
    delete inputState.keys[key];
  }
  inputState.locked = false;
  inputState.paused = false;
  inputState.adsActive = false;
  inputState.adsLerp = 0;
}
