import * as THREE from 'three';

export const M = (c) => new THREE.MeshLambertMaterial({ color: c });

export const matGround   = M(0x5a6b3a);
export const matDirt     = M(0x7a6648);
export const matConcrete = M(0x9a9080);
export const matBrick    = M(0x8b5c3a);
export const matWood     = M(0x7a5c30);
export const matRoof     = M(0x4a3828);
export const matRubble   = M(0x7a7060);
export const matWindow   = new THREE.MeshLambertMaterial({ color: 0x3060a0, transparent: true, opacity: 0.5 });
export const matSandbag  = M(0x9a8860);
export const matBarrel   = M(0x4a5040);
