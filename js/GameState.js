// Centralization of global game state and mode variables

export const GameState = {
  zombieMode: false,
  zombieContactDamageTimer: 0,
  healthRegenTimer: 0,
  zombieSpawnTimer: 0,
  guillotineAnimation: null,
  guillotineCutscene: false,   // freezes player + camera during guillotine
  pickupHintTimer: 0,

  reset() {
    this.zombieMode = false;
    this.zombieContactDamageTimer = 0;
    this.healthRegenTimer = 0;
    this.zombieSpawnTimer = 0;
    this.guillotineAnimation = null;
    this.guillotineCutscene = false;
    this.pickupHintTimer = 0;
  }
};
