// ═══════════════════════════════════════════════════════════════════
//  HUD HELPERS
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
const hudCompass  = document.getElementById('compass');
import { eventBus } from './EventBus.js';

export function initHUD() {
  eventBus.on('ammoChanged', ({ ammoInMag, reserveAmmo }) => updateAmmoHUD(ammoInMag, reserveAmmo));
  eventBus.on('playerDamaged', () => triggerDamageFlash());
  eventBus.on('enemyKilled', () => showKillFeed());
  eventBus.on('reloadMsg', ({ show }) => showReloadMsg(show));
  eventBus.on('zombieModeToggled', ({ active, count }) => updateZombieCounter(active, count));
  eventBus.on('zombieCountChanged', ({ count }) => updateZombieCounterValue(count));
  eventBus.on('zombieBreakdownChanged', ({ walkers, crawlers }) => updateZombieBreakdown(walkers, crawlers));
}
const hudHealthBar= document.getElementById('health-bar');
const hudHealthTxt= document.getElementById('health-text');
const hudCoords   = document.getElementById('coords');
const hudExpDisplay = document.getElementById('exp-display');
const hudZombieCounter = document.getElementById('zombie-counter');
const hudZombieBreakdown = document.getElementById('zombie-breakdown');
const hudAmmoMag  = document.getElementById('ammo-mag');
const hudAmmoRes  = document.getElementById('ammo-reserve');
export const hitFlash    = document.getElementById('hit-flash');
export const pickupHint  = document.getElementById('pickup-hint');

const DIRS = ['N','NNO','NO','ONO','O','OSO','SO','SSO','S','SSW','SW','WSW','W','WNW','NW','NNW'];

export function updateAmmoHUD(ammoInMag, reserveAmmo) {
  hudAmmoMag.textContent = ammoInMag;
  hudAmmoRes.textContent = reserveAmmo;
  hudAmmoMag.style.color = ammoInMag <= 2 ? '#e04040' : '#c8a84b';
}

export function showKillFeed() {
  const feed = document.getElementById('kill-feed');
  const el = document.createElement('div');
  el.className = 'kill-entry';
  el.textContent = 'FEIND AUSGESCHALTET';
  feed.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

export function updateHUD(player) {
  // Compass
  const deg = ((-player.yaw * 180 / Math.PI) % 360 + 360) % 360;
  hudCompass.textContent = DIRS[Math.round(deg / 22.5) % 16];

  // Health
  const hp = Math.max(0, Math.min(100, player.health));
  hudHealthBar.style.width = hp + '%';
  hudHealthTxt.textContent = hp;
  hudHealthBar.style.background = hp > 60 ? '#c8a84b' : hp > 30 ? '#e08830' : '#cc2222';

  // Coords
  hudCoords.textContent = `${player.pos.x.toFixed(1)} / ${player.pos.z.toFixed(1)}`;

  // EXP
  hudExpDisplay.textContent = `EXP: ${player.exp}`;
}

export function triggerDamageFlash() {
  hitFlash.style.opacity = '1';
  setTimeout(() => { hitFlash.style.opacity = '0'; }, 80);
}

export function showReloadMsg(show) {
  document.getElementById('reload-msg').style.display = show ? 'block' : 'none';
}

export function updateZombieCounter(active, count) {
  if (active) {
    hudZombieCounter.style.display = 'block';
    hudZombieBreakdown.style.display = 'block';
    hudZombieCounter.textContent = `ZOMBIES: ${count}`;
  } else {
    hudZombieCounter.style.display = 'none';
    hudZombieBreakdown.style.display = 'none';
  }
}

export function updateZombieCounterValue(count) {
  hudZombieCounter.textContent = `ZOMBIES: ${count}`;
}

export function updateZombieBreakdown(walkerCount, crawlerCount) {
  hudZombieBreakdown.innerHTML = `Walkers: ${walkerCount}<br>Crawlers: ${crawlerCount}`;
}
