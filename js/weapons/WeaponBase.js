// ═══════════════════════════════════════════════════════════════════
//  WEAPON BASE CLASS
// ═══════════════════════════════════════════════════════════════════

/**
 * Base class for all weapons. Extend this to add new weapons.
 *
 * Override:
 *   - buildViewModel(vmGroup) to create the 3D viewmodel
 *   - getRecoilAmount() to customise recoil kick
 */
export class WeaponBase {
  constructor({ name, magSize, reserveAmmo, reloadTime, fireInterval, damage }) {
    this.name = name;
    this.magSize = magSize;
    this.ammoInMag = magSize;
    this.reserveAmmo = reserveAmmo;
    this._initialReserve = reserveAmmo;
    this.reloadTime = reloadTime;
    this.minFireInterval = fireInterval;
    this.damage = damage || 34;

    this.reloading = false;
    this.reloadTimer = 0;
    this.fireCooldown = 0;

    // Muzzle flash state
    this.muzzleLight = null;
    this.muzzleFlashTimer = 0;
  }

  canShoot() {
    return !this.reloading && this.fireCooldown <= 0;
  }

  hasAmmo() {
    return this.ammoInMag > 0;
  }

  consumeAmmo() {
    this.ammoInMag--;
    this.fireCooldown = this.minFireInterval;
  }

  startReload() {
    if (this.reloading) return false;
    if (this.reserveAmmo <= 0) return false;
    if (this.ammoInMag >= this.magSize) return false;
    this.reloading = true;
    this.reloadTimer = this.reloadTime;
    return true;
  }

  finishReload() {
    const needed = this.magSize - this.ammoInMag;
    const take = Math.min(needed, this.reserveAmmo);
    this.ammoInMag += take;
    this.reserveAmmo -= take;
    this.reloading = false;
  }

  updateTimers(dt) {
    if (this.fireCooldown > 0) this.fireCooldown -= dt;
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= dt;
      if (this.muzzleFlashTimer <= 0 && this.muzzleLight) {
        this.muzzleLight.intensity = 0;
      }
    }
  }

  triggerMuzzleFlash() {
    if (this.muzzleLight) this.muzzleLight.intensity = 4;
    this.muzzleFlashTimer = 0.05;
  }

  getRecoilAmount() {
    return 0.045;
  }

  reset() {
    this.ammoInMag = this.magSize;
    this.reserveAmmo = this._initialReserve;
    this.reloading = false;
    this.fireCooldown = 0;
    this.reloadTimer = 0;
    this.muzzleFlashTimer = 0;
  }

  /**
   * Build the 3D viewmodel and add it to the given group.
   * Should set this.muzzleLight if the weapon has a muzzle flash.
   * @param {THREE.Group} vmGroup
   */
  buildViewModel(vmGroup) {
    // Override in subclass
  }
}
