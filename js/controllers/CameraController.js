import * as THREE from 'three';
import { FOV_HIP, FOV_ADS } from '../input.js';
import { eventBus } from '../EventBus.js';

const vmBasePos = new THREE.Vector3(0.21, -0.20, -0.38);

export const CameraController = {
  camBobPos: 0,
  camBobVel: 0,
  vmSwayX: 0,
  vmRecoilZ: 0,

  init() {
    eventBus.on('playerStep', ({ sprint }) => {
      this.camBobVel += sprint ? 0.062 : 0.044;
    });
    eventBus.on('weaponFired', ({ recoilAmount }) => {
      this.vmRecoilZ = recoilAmount;
    });
  },

  reset() {
    this.camBobPos = 0;
    this.camBobVel = 0;
    this.vmSwayX = 0;
    this.vmRecoilZ = 0;
  },

  update(dt, player, inputState, weapon, camera, vmCamera, vmGroup) {
    // Basic Camera
    camera.position.copy(player.pos);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = player.yaw;
    camera.rotation.x = player.pitch;

    vmCamera.rotation.order = 'YXZ';
    vmCamera.rotation.y = 0;
    vmCamera.rotation.x = 0;

    // ADS
    inputState.adsLerp += ((inputState.adsActive ? 1 : 0) - inputState.adsLerp) * Math.min(dt * 14, 1);
    camera.fov = FOV_HIP + (FOV_ADS - FOV_HIP) * inputState.adsLerp;
    camera.updateProjectionMatrix();

    // Spring-based camera bob
    this.camBobVel += (-220 * this.camBobPos - 20 * this.camBobVel) * dt;
    this.camBobPos += this.camBobVel * dt;
    camera.position.y = player.pos.y + this.camBobPos;
    camera.rotation.z = 0;

    // Viewmodel animation
    this.vmSwayX += (-player.pitch * 0.04 - this.vmSwayX) * Math.min(dt * 12, 1);
    this.vmRecoilZ *= Math.pow(0.04, dt);

    const adsLerp = inputState.adsLerp;
    const vmTargetX = vmBasePos.x * (1 - adsLerp);
    const vmTargetY = vmBasePos.y + adsLerp * 0.115;
    const vmTargetZ = vmBasePos.z + adsLerp * 0.045;
    vmGroup.rotation.y = 0.12 * (1 - adsLerp);

    const adsBobScale = 1 - adsLerp * 0.7;
    vmGroup.position.set(
      vmTargetX,
      vmTargetY + this.vmSwayX * 0.4 * adsBobScale + this.camBobPos * 0.3 * adsBobScale,
      vmTargetZ + this.vmRecoilZ
    );
    vmGroup.rotation.x = this.vmSwayX * 0.5 * adsBobScale;

    // Reload dip
    if (weapon.reloading) {
      const prog = 1 - weapon.reloadTimer / weapon.reloadTime;
      const dip  = prog < 0.5 ? prog * 2 : (1 - prog) * 2;
      vmGroup.position.y = vmBasePos.y - dip * 0.12 + this.camBobPos * 0.35;
      vmGroup.rotation.x = this.vmSwayX * 0.5 - dip * 0.4;
    }
  }
};
