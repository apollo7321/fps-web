# COD2-Style Browser FPS Game

> **⚠️ IMPORTANT**: Keep `ARCHITECTURE.md` and `REVIEW.md` in sync with code changes. These files document the modular structure and guide future refactoring.

## Project Overview
A playable Call of Duty 2-style first-person shooter game built entirely in a single HTML file using Three.js, Web Audio API, and vanilla JavaScript. The game features:

- **3D Rendering**: Three.js for scene management, lighting, shadows
- **First-Person Controls**: WASD/Arrow keys for movement, mouse for camera
- **Weapons**: P08 Luger pistol with magazine-based ammo system
- **NPCs**: AI-controlled soldiers with states (idle/wander/flee/zombie mode)
- **Combat**: Raycasting hit detection, headshots, knockback ragdoll effects
- **Audio**: Procedurally generated sound effects (gunshots, footsteps, voices, reloads, explosions)
- **Physics**: Gravity, collision detection (AABB-based), jumping

## File Structure
- **Modular ES6 Architecture**: Code split across `js/` subdirectories by system.
  - Entry point: `index.html` with canvas + UI overlays, imports `js/main.js` as ES6 module.
  - `main.js`: Game loop, wires controllers, physics, managers, input handlers.
  - Individual systems: audio, physics, NPCs, weapons, particles, UI (hud), pickups, world.

## Key Systems

### Player
- Position/velocity with gravity
- Health (100 HP)
- Yaw/pitch camera rotation
- Sprint speed (9) vs walk speed (5)
- Collision with world objects and NPCs

### Weapons (P08 Luger)
- Magazine size: 8 rounds
- Reserve ammo: 32 rounds (4 extra mags)
- Semi-auto fire (cooldown: 0.18s)
- Procedural gunshot sound with muzzle flash
- Complex reload animation (1.4s) with 6-stage audio

### NPCs
- **Base Class Hierarchy** (`js/npc/BaseNPC.js`):
  - `BaseNPC`: Shared state/polymorphic methods (health, alive, dying, AI state, getXP, getZombieSpeed, updateAnimation, updateZombieBehavior).
  - `Walker`: Standing unit with variants, helmet, legs, arms. Speed 3.5, XP 1/2, standard animation.
  - `Crawler`: Prone unit, no legs, crawling arms. Speed 5.5, XP 2/3, contact damage every 0.5s, custom crawl animation.
  - `Fatty`: Massive unit, green drool. Speed 2.6, XP 3/5, **explodes at 3m (1s countdown)**: 5m radius, 30 HP damage, green slime particles.
- **Polymorphic Methods** (override in subclasses):
  - `getXP(isHeadshot)`: XP reward.
  - `getZombieSpeed()`: Chase speed.
  - `getContactDamageInterval()`: Damage frequency (Walker 1.0s, Crawler 0.5s).
  - `getMinSpawnDistance()`: Min spawn distance from player.
  - `updateAnimation(walkSpeed, dt)`: Limb animation logic.
  - `updateZombieBehavior(dt, distToPlayer)`: Custom behavior (Fatty returns 'explode').
  - `canExplode()`, `getExplosionRadius()`, `getExplosionDamage()`: Explosion interface.
- **States**: idle, wander (normal mode), chase (zombie mode).
- **Normal Mode**: Walkers wander/idle, crawlers/fatties stay still.
- **Zombie Mode** (Y key): All NPCs chase player. Crawlers fastest (5.5), Walkers normal (3.5), Fatties slow (2.6).
- **Shooting**: Headshot = instant kill; body = 2 hits needed (varies by type).
- **Death Mechanics**:
  - Headshot: Lose head, blood fountain, collapse backward.
  - Body shot: Knockback ragdoll with 3.8m slide.
- **Wave Spawning**: Every 10s, ~15% Fatty, ~25% Crawler, ~60% Walker.

### Collision System
- AABB-based collision detection
- `colliders[]` array stores all solid objects
- `resolveCollisions()` handles player-object pushback
- Objects with colliders:
  - Buildings (solidBox)
  - Trees
  - Sandbags
  - Barrels (explosive)
  - Low walls
  - Rubble piles

### Explosive Barrels
- **Trigger**: 2 hits within 2 seconds
- **Effect**: 40 explosive particles (red/orange/yellow), damage 50HP in 8m radius
- **Sound**: Sawtooth oscillator falling from 150→40 Hz

### Audio
- **Footsteps**: 1.5m distance intervals, dumpfes Stampfen (lowpass 150 Hz)
- **Gunshot**: Crack (white noise BP 1200 Hz) + boom (sawtooth 110→40 Hz)
- **Reload**: 6-stage metallic sequence
- **Empty click**: Square wave 900 Hz
- **Pain cry**: Sawtooth with formant filters (700/1400 Hz)
- **Headshot blood fountain**: 25 particles upward at 6-10 m/s
- **Explosion sound**: Low sawtooth sweep

### Camera & Animations
- **Spring-based bobbing**: Critically damped oscillation while moving
- **ADS (Aim Down Sights)**: MetaLeft key centers gun + zooms slightly
- **Viewmodel**: Separate scene rendered over main scene
- **Recoil**: Temporary Z-offset on gun after firing

### HUD & Event-Driven Architecture
- **System**: `js/hud.js` manages all DOM updates via `EventBus` subscriptions.
- **Cached Elements**: All DOM queries performed at init; never search during gameplay.
- **Event-Driven Updates**: Core gameplay emits events; HUD listeners update UI without direct DOM calls.
- **Key Events**: `weaponFired`, `reloadMsg`, `enemyKilled`, `roofEntered`, `gameOver`, `gameReset`, `pickupHintUpdate`, etc.
- **HUD Elements**:
  - Compass (16-direction cardinal heading)
  - Health bar + HP text (color-coded by health)
  - Ammo display (mag/reserve) + low-ammo alert (red at ≤2)
  - Reload message + kill feed + roof entry message
  - Pickup hint (magazine nearby)
  - Zombie counter (active, walker/crawler/fatty breakdown)
  - Pause overlay
  - Game over screen

## Controls
- **WASD/Arrows**: Movement
- **Mouse**: Look around
- **Left Click**: Fire
- **Right Click**: Aim Down Sights (ADS)
- **Shift**: Sprint
- **Space**: Jump
- **MetaLeft (Cmd/Win)**: Alternate ADS activation
- **R**: Reload
- **Y**: Zombie Mode toggle (German QWERTZ: physical Y key)
- **ESC**: Pause (pointer lock unlock)
- **Right Click on "Resume"**: Re-acquire pointer lock

**Input Architecture** (`js/input.js`):
- Single consolidated `keydown` / `keyup` handler (not multiple listeners).
- Pointer lock managed separately via `pointerlockchange` event.
- All input state stored in `inputState` object (keys, locked, paused, adsActive).

### Door Triggers & Roof Teleportation
- **System**: `js/doorTriggers.js` manages proximity-based building entry.
- **Mechanic**: Walk near a building door → teleported to roof center + 1.75m (eye height).
- **Trigger Radius**: 1.2m from door position.
- **Feedback**: HUD message "DACH ERREICHT" (roof reached).
- **Registration**: Each building calls `registerDoor(doorX, doorZ, roofX, roofZ, roofHeight)` in `buildWorld()`.

## World
- 200×200m flat ground with dirt mounds
- 6m-wide road bisecting center
- Multiple buildings (buildingA, buildingB, sheds)
- Trees (stacked cone canopy with trunk)
- Sandbag fortifications
- Explosive barrel clusters
- Rubble piles
- Measuring tape with Roman numerals (I, V, X, L)
- Crater near center
- ~30 NPCs (spawn on start, plus zombie waves)
- Ammo pickups at fixed locations
- **Door triggers** at each building entrance for roof access

## Common Tasks

### Adding a Sound Effect
1. Create `function playXxx()` similar to `playShot()` or `playFootstep()`
2. Use `getCtx()` to get Web Audio API context
3. Create oscillators/buffers, connect to gain nodes
4. Set frequency/gain curves with `setValueAtTime()` and `exponentialRampToValueAtTime()`
5. Call function from appropriate place (e.g., kill event, footstep timer)

### Adding a New NPC Type
1. Create a new file in `js/npc/` (e.g., `BossNPC.js`).
2. Extend `BaseNPC` and implement `buildModel()`.
3. Override polymorphic methods as needed:
   - `getXP(isHeadshot)`: XP reward.
   - `getZombieSpeed()`: Chase speed.
   - `getContactDamageInterval()`: Damage frequency.
   - `updateAnimation(walkSpeed, dt)`: Limb animation.
   - `updateZombieBehavior(dt, distToPlayer)`: Custom behavior (return `'explode'` / `'skip'` / `null`).
4. If exploding, implement explosion interface: `canExplode()`, `getExplosionRadius()`, `getExplosionDamage()`, `getExplosionEvent()`, `spawnExplosionParticles(pos)`.
5. Add spawn function in `NPCManager.js`: `export function spawnRandomBoss(playerPos) { return spawnRandomNPC(BossNPC, playerPos); }`.
6. Update wave spawning in `updateZombieEffects()` to include the new type.

### Tweaking Physics/Collision
- `GRAVITY`, `PLAYER_H`, `PLAYER_R` constants (line ~1126)
- `resolveCollisions()` function for push-back logic
- `addCollider()` to add new solid objects to world

### Adding New World Objects
1. Use `box()` or `cyl()` for mesh creation
2. Use `solidBox()` for automatic collider setup
3. Place in "WORLD CONSTRUCTION" section or wrap in a `function myObject(x, z)`

### NPC Death
- `killNPC(npc, knockbackDir, isHeadshot)` in weapon firing code
- Animation plays in "Dying NPCs" update loop
- Mesh stays in scene (not removed)

## Performance Notes
- Single threaded JavaScript (no Web Workers)
- AABB collision only (no complex shapes)
- Particle system: blood + explosion particles share same geometry
- Raycasting: filtered to live NPCs only per frame
- No LOD, fog, or culling optimizations

## German Keyboard Layout
- Z/Y keys are swapped on German QWERTZ layout
- Zombie mode is bound to **KeyY** (physical Y key, which is Z on QWERTY)
- Reload is **KeyR** (same on both layouts)

## Recent Refactorings

### Architecture Cleanup (from REVIEW.md)
1. **Zombie Spawn Bug Fixed** (`main.js:212`): Changed `npcs.length === 0` to `getAliveNPCCount() === 0` so new waves spawn correctly when all zombies die.
2. **Input Consolidation** (`js/input.js`): Merged 3 separate `keydown` handlers into one for cleaner code.
3. **DOM Caching in HUD** (`js/hud.js`): All DOM queries moved to init; functions no longer search for elements at runtime.
4. **Event-Driven UI** (`js/hud.js`, `js/main.js`): Gameplay emits events; HUD listens via `eventBus`. Removed direct DOM manipulation from `main.js`.
5. **NPC Inheritance & Polymorphism Refactor** (`js/npc/`):
   - Created `BaseNPC.js` with polymorphic methods: `getZombieSpeed()`, `updateAnimation()`, `updateZombieBehavior()`, `canExplode()`, etc.
   - Removed all `instanceof` checks from `NPCManager.js` — each NPC controls its own behavior.
   - `Walker`, `Crawler`, `Fatty` override methods for type-specific logic (speed, animation, explosion).
   - `NPCManager` now uses generic `handleNPCExplosion()` instead of type-specific handlers.
   - Consolidated `spawnRandomNPC(Class, pos)` to eliminate 3 duplicate spawn functions.
6. **Fatty Zombie NPC** (`js/npc/Fatty.js`):
   - Massive, round zombie with green drool. Speed 2.6 (3/4 Walker speed).
   - Explodes 1 second after getting within 3m of player: 5m radius, 30 HP damage, green slime particles (100 particles, 4 green shades).
   - Generates low squelch sound + bubble-pop audio effects.
   - Higher XP: 3 base / 5 headshot (vs Walker 1/2, Crawler 2/3).
7. **Door Trigger System** (`js/doorTriggers.js`): Proximity-based building entry with roof teleportation.
8. **Zombie Effects Decoupling** (`js/npc/NPCManager.js` → `updateZombieEffects()`):
   - Contact damage + wave spawning moved from `main.js` to `NPCManager.js`.
   - Per-NPC damage timers (each NPC has own interval via `getContactDamageInterval()`).
   - Generic contact damage handler in `updateZombieEffects()`.

## Next Feature Ideas
(If user asks for more work)
- Muzzle flash animation improvements
- Shell casing particle effects
- Multiple weapon types
- Damage feedback visual effects (red vignette on hit)
- Sound occlusion (quieter sounds from behind walls)
- Improved NPC AI (squad behavior, suppression)
- Bullet decals on surfaces
- Limb-specific hit detection
- Roof traverse mechanics (jumping between buildings)
- Interior building exploration
