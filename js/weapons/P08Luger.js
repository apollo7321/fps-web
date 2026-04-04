import * as THREE from 'three';
import { WeaponBase } from './WeaponBase.js';

// ═══════════════════════════════════════════════════════════════════
//  P08 LUGER
// ═══════════════════════════════════════════════════════════════════
export class P08Luger extends WeaponBase {
  constructor() {
    super({
      name: 'P08 LUGER',
      magSize: 8,
      reserveAmmo: 32,
      reloadTime: 1.4,
      fireInterval: 0.18,
      damage: 34,
    });
  }

  buildViewModel(vmGroup) {
    function vmBox(w,h,d,col,x,y,z,rx=0,ry=0,rz=0) {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(w,h,d),
        new THREE.MeshLambertMaterial({ color: col })
      );
      m.position.set(x,y,z); m.rotation.set(rx,ry,rz);
      vmGroup.add(m); return m;
    }
    function vmCyl(rt,rb,h,seg,col,x,y,z,rx=0,ry=0) {
      const m = new THREE.Mesh(
        new THREE.CylinderGeometry(rt,rb,h,seg),
        new THREE.MeshLambertMaterial({ color: col })
      );
      m.position.set(x,y,z); m.rotation.set(rx,ry,0);
      vmGroup.add(m); return m;
    }

    // Receiver / body
    vmBox(0.055, 0.05, 0.22, 0x252520,  0,    0,   -0.11);
    // Toggle-joint top (P08 characteristic)
    vmBox(0.048, 0.03, 0.10, 0x1a1a18,  0,  0.04, -0.07,  0.18);
    // Barrel
    vmCyl(0.013, 0.013, 0.19, 8, 0x1a1a18, 0, 0.012, -0.235, Math.PI/2);
    // Front sight
    vmBox(0.006, 0.018, 0.008, 0x333330, 0, 0.038, -0.315);
    // Rear sight
    vmBox(0.022, 0.014, 0.007, 0x333330, 0, 0.038, -0.14);
    // Grip / handle (angled backward — P08 style)
    vmBox(0.04, 0.11, 0.058, 0x3a2c1a,  0.003, -0.072, -0.04,  -0.22, 0, 0);
    // Magazine (inside grip)
    vmBox(0.030, 0.075, 0.036, 0x252520, 0.003, -0.068, -0.042, -0.22);
    // Trigger guard
    vmBox(0.006, 0.035, 0.06, 0x252520, 0, -0.038, -0.056);
    // Trigger
    vmBox(0.006, 0.025, 0.008, 0x1a1a18, 0, -0.034, -0.065);

    // Muzzle flash light
    this.muzzleLight = new THREE.PointLight(0xffaa44, 0, 2.5);
    this.muzzleLight.position.set(0, 0.012, -0.335);
    vmGroup.add(this.muzzleLight);
  }
}
