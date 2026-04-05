export { BaseNPC } from './BaseNPC.js';
export { Walker } from './Walker.js';
export { Crawler } from './Crawler.js';
export {
  npcs, npcMeshMap,
  spawnNPC, killNPC,
  updateNPCs, updateDyingNPCs,
  spawnRandomZombie, spawnRandomCrawler, resetAllNPCs,
  getAliveNPCMeshes, getNPCFromMesh, getAliveNPCCount, getZombieBreakdown,
} from './NPCManager.js';
