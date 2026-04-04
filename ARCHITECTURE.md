# FPS Browser Game - AI Architecture & Conventions

This document serves as an overview and instruction set for AI agents (like Claude Code, Antigravity, or Cursor) working on the `cod-refactor-antigravity` project. It ensures that any new code written respects the project's structure and modular design.

## 🎯 Project Goal
A modular, performant browser-based first-person shooter running in a single `index.html` file, leveraging ES6 Modules for clean architecture separated by concerns (weapons, NPCs, physics, rendering). The project relies on vanilla JavaScript and Web APIs (or specific 3D libraries mapped in `renderer.js`) without strict build steps like Webpack for the core logic structure.

## 📁 Directory Structure
- `index.html`: Main entry point. Defines the canvas and UI overlays, imports `js/main.js` as an ES6 module.
- `js/`: Core game logic folder.
  - `main.js`: Game loop initialization (init, animate/update loop), wires inputs, physics, renderer, and managers together.
  - `EventBus.js`: Central Pub/Sub event system used to decouple core game logic from UI and Audio.
  - `GameState.js`: Central storage for global game modes (like zombie mode) and timers.
  - **`controllers/`**: Contains modular logic controllers (e.g., `PlayerController.js`, `CameraController.js`) to keep `main.js` clean.
  - `world.js` / `geometry.js` / `materials.js` / `lighting.js`: Environment construction and basic rendering rules.
  - `physics.js`: Core collision detection and physics rules for the player and entities.
  - `renderer.js`: Abstracted rendering logic / scene graph management.
  - `player.js` / `input.js`: Controller inputs, camera movement, inventory, and player state management.
  - `hud.js`: DOM/Canvas UI updates (health, ammo, crosshair).
  - `audio.js`: Sound system management.
  - `particles.js`: Visual effects system for bullet impacts, blood, smoke, etc.
  - `pickups.js`: Logic for items the player can walk over to collect (health, ammo).
  - **`weapons/`**: Sub-directory dedicated entirely to weapon logic.
    - `WeaponBase.js`: Abstract base class for all weapons.
    - `P08Luger.js` (and similar): Concrete implementations extending `WeaponBase`.
    - `index.js`: Re-exports all weapons to make importing cleaner for the central registry.
  - **`npc/`**: Sub-directory dedicated to enemy/friendly AI logic.
    - `NPCManager.js`: Handles spawning, updating, iterating, and removing NPCs en masse.
    - `NPC.js`: Individual logic for single NPC behavior (pathfinding, states, health, collision boundaries).
    - `index.js`: Exposes NPC functionality to the rest of the game.

## ⚙️ Game Loop Flow
When extending or debugging, keep the central game loop sequence (found in `main.js`) in mind to prevent side effects:
1. **Delta Time Calculation**: Determine time passed since last frame.
2. **Controller Updates** (`PlayerController` handling inputs/movement, `CameraController` handling viewmodes).
3. **Logic Update Step** (`NPCManager.update()`, Weapon cooldowns, Particle updates)
4. **Collision Resolution Step** (e.g. Raycasting: Are bullets hitting NPCs? Triggers?)
5. **Event Emission**: HUD and Audio are not updated directly; instead, specific events (e.g. `eventBus.emit('weaponFired')`) are dispatched.
6. **Render Step** (`renderer.js`)

## 🤖 AI Agent Conventions (How to add features)

### 1. General Rules
- **Use ES Modules Only**: Everything must explicitly use `import` and `export`. Do not pollute the global `window` object. Use relative paths with `.js` extensions (e.g., `import { Vector3 } from './geometry.js'`).
- **Single Responsibility (No Blob Files)**: Do not bloat `main.js`. If you are asked to add a completely new system (e.g., "Vehicles" or "Destructible Props"), create a new `js/system_name/` folder with a generic manager and specific entity classes.
- **No Webpack/Node Dependencies**: Assume the code runs directly in modern browsers via `<script type="module" src="js/main.js"></script>`. Do not suggest or install Node.js modules for core gameplay logic.

### 2. How to add a new Weapon
1. Create a new file in `js/weapons/` (e.g., `Kar98k.js`).
2. Make the specific weapon class `extend WeaponBase` from `WeaponBase.js`.
3. Override methods as needed (e.g., `fire()`, `reload()`) and define specific stats in the constructor (`damage`, `fireRate`, `magazineSize`, `reloadTime`).
4. Export the class and include it in `js/weapons/index.js`.
5. Register or instantiate the weapon within the player's inventory context (`player.js` or `main.js`).

### 3. How to add a new NPC type
1. If the NPC shares standard behavior, extend the `NPC` class inside `js/npc/NPC.js`. If it requires heavily customized logic (e.g., a Boss), create a new class (e.g., `BossNPC.js`) extending `NPC`.
2. Ensure `NPCManager.js` handles the specific instantiation/spawning logic for this new type if required.
3. Validate that its hitboxes register properly with the weapon raycasting/collision system.

## 🛠 Troubleshooting for AI
- **"X is not defined"**: Check the relative paths and ensure the file exports the component correctly. Remember that browser module imports require the `.js` extension.
- **Component not rendering/updating**: Ensure the manager's `update()` or the entity's render calls are correctly hooked into the main game loop inside `main.js`.
