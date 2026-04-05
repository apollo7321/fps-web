// Centralization of global game state and mode variables

export const GameState = {
  zombieMode: true,
  extremeMode: false,
  healthRegenTimer: 0,
  guillotineAnimation: null,
  guillotineCutscene: false,   // freezes player + camera during guillotine
  pickupHintTimer: 0,

  reset() {
    this.zombieMode = true;
    this.extremeMode = false;
    this.healthRegenTimer = 0;
    this.guillotineAnimation = null;
    this.guillotineCutscene = false;
    this.pickupHintTimer = 0;
  }
};
