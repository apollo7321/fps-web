// ═══════════════════════════════════════════════════════════════════
//  AUDIO (Web Audio API – procedural synthesis)
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
let audioCtx = null;
import { eventBus } from './EventBus.js';

export function initAudio() {
  eventBus.on('weaponFired', () => playShot());
  eventBus.on('emptyClick', () => playEmptyClick());
  eventBus.on('reloadStarted', () => playReloadSound());
  eventBus.on('playerStep', () => playFootstep());
  eventBus.on('enemyDamaged', () => playOuch());
  eventBus.on('playerDamaged', () => playPlayerDamageOuch());
  eventBus.on('itemPickup', () => playPickup());
  eventBus.on('explosion', () => playExplosion());
}

export function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

export function playShot() {
  const ctx = getCtx();
  const t = ctx.currentTime;

  // — Crack component (white noise + bandpass)
  const bufLen = Math.floor(ctx.sampleRate * 0.18);
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buf;

  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = 1200; bp.Q.value = 0.7;

  const gainCrack = ctx.createGain();
  gainCrack.gain.setValueAtTime(1.2, t);
  gainCrack.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

  // — Body / boom component
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(110, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);

  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 250;

  const gainBoom = ctx.createGain();
  gainBoom.gain.setValueAtTime(1.5, t);
  gainBoom.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

  // — Master
  const master = ctx.createGain();
  master.gain.value = 0.55;

  src.connect(bp); bp.connect(gainCrack); gainCrack.connect(master);
  osc.connect(lp); lp.connect(gainBoom); gainBoom.connect(master);
  master.connect(ctx.destination);

  src.start(t);
  osc.start(t); osc.stop(t + 0.2);
}

export function playEmptyClick() {
  const ctx = getCtx();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'square'; osc.frequency.value = 900;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.2, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
  osc.connect(g); g.connect(ctx.destination);
  osc.start(t); osc.stop(t + 0.04);
}

export function playReloadSound() {
  const ctx = getCtx();
  const now = ctx.currentTime;

  function metalClick(delay, dur, freq, Q, vol) {
    const t = now + delay;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = Q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(bp); bp.connect(g); g.connect(ctx.destination);
    src.start(t); src.stop(t + dur + 0.01);
  }

  function metalSlide(delay, dur, freqStart, freqEnd, Q, vol) {
    const t = now + delay;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.Q.value = Q;
    bp.frequency.setValueAtTime(freqStart, t);
    bp.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 800;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.setValueAtTime(vol * 0.7, t + dur * 0.5);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(bp); bp.connect(hp); hp.connect(g); g.connect(ctx.destination);
    src.start(t); src.stop(t + dur + 0.01);
  }

  metalClick(0.0, 0.025, 4500, 12, 0.5);
  metalSlide(0.08, 0.12, 2800, 1800, 6, 0.35);
  metalClick(0.22, 0.04, 2200, 8, 0.3);
  metalSlide(0.45, 0.1, 1600, 3200, 5, 0.4);
  metalClick(0.56, 0.03, 3800, 15, 0.55);
  metalSlide(0.75, 0.15, 2000, 3500, 4, 0.5);
  metalClick(0.92, 0.02, 5000, 18, 0.6);
  metalClick(0.94, 0.025, 3200, 12, 0.45);
}

export function playFootstep() {
  const ctx = getCtx();
  const t = ctx.currentTime;
  const sr = ctx.sampleRate;

  const bufLen = Math.floor(sr * 0.15);
  const buf = ctx.createBuffer(1, bufLen, sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++)
    d[i] = (Math.random() * 2 - 1) * Math.exp(-i / bufLen * 6);

  const src = ctx.createBufferSource();
  src.buffer = buf;

  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 150;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

  src.connect(lp);
  lp.connect(g);
  g.connect(ctx.destination);
  src.start(t);
}

export function playOuch() {
  const ctx = getCtx();
  if (ctx.state !== 'running') ctx.resume();
  const t = ctx.currentTime + 0.01;
  const pitch = (180 + Math.random() * 120);

  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(pitch * 1.4, t);
  osc.frequency.exponentialRampToValueAtTime(pitch * 0.65, t + 0.35);

  const f1 = ctx.createBiquadFilter();
  f1.type = 'bandpass'; f1.frequency.value = 700; f1.Q.value = 5;

  const f2 = ctx.createBiquadFilter();
  f2.type = 'bandpass'; f2.frequency.value = 1400; f2.Q.value = 4;

  const mix = ctx.createGain();
  mix.gain.value = 1.0;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.7, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);

  osc.connect(f1); osc.connect(f2);
  f1.connect(mix); f2.connect(mix);
  mix.connect(gain); gain.connect(ctx.destination);
  osc.start(t); osc.stop(t + 0.45);
}

export function playPlayerDamageOuch() {
  const ctx = getCtx();
  if (ctx.state !== 'running') ctx.resume();
  const t = ctx.currentTime + 0.01;

  const pitch = 240 + Math.random() * 80;

  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(pitch, t);
  osc.frequency.exponentialRampToValueAtTime(pitch * 0.5, t + 0.25);

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1200;
  filter.Q.value = 3;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.6, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.3);
}

export function playPickup() {
  const ctx = getCtx();
  const t = ctx.currentTime;
  [0, 0.1].forEach((delay, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 660 + i * 220;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.3, t + delay);
    g.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.12);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(t + delay); osc.stop(t + delay + 0.13);
  });
}

export function playExplosion() {
  const ctx = getCtx();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.4);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.8, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.5);
}
