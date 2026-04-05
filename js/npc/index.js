export { BaseNPC } from './BaseNPC.js';
export { Walker } from './Walker.js';
export { Crawler } from './Crawler.js';
export { Fatty } from './Fatty.js';
export {
  npcs, npcMeshMap,
  spawnNPC, killNPC,
  updateNPCs, updateDyingNPCs,
  spawnRandomZombie, spawnRandomCrawler, spawnRandomFatty, resetAllNPCs,
  getAliveNPCMeshes, getNPCFromMesh, getAliveNPCCount, getZombieBreakdown,
  updateZombieEffects, resetZombieEffects,
  setPlayerRef,
} from './NPCManager.js';
