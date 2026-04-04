import { P08Luger } from './P08Luger.js';

// ═══════════════════════════════════════════════════════════════════
//  WEAPON REGISTRY
// ═══════════════════════════════════════════════════════════════════
const registry = new Map();

export function registerWeapon(name, WeaponClass) {
  registry.set(name, WeaponClass);
}

export function createWeapon(name) {
  const WeaponClass = registry.get(name);
  if (!WeaponClass) throw new Error(`Unknown weapon: ${name}`);
  return new WeaponClass();
}

export function getRegisteredWeapons() {
  return [...registry.keys()];
}

// Register built-in weapons
registerWeapon('P08 LUGER', P08Luger);
