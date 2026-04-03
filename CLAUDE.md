# COD2-Style Browser FPS Game

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
- **Single File**: `index.html` (~1800+ lines)
  - All code, styles, HTML markup in one file
  - Modular functions organized by system (audio, physics, NPCs, weapons, UI)

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
- **States**: idle, wander, flee
- **Normal Mode**: Flee when player approaches (<7m), wander otherwise
- **Zombie Mode** (Y key): All NPCs chase player continuously
- **AI**: Pathfinding with collision avoidance, target selection
- **Shooting**: Headshot = instant kill; body = 2 hits needed (34 damage/shot)
- **Death Mechanics**:
  - Headshot: Lose head, blood fountain, collapse backward
  - Body shot: Knockback ragdoll with 3.8m slide
- **Animation**: Leg/arm swing tied to movement speed

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

### HUD
- Compass (16-direction cardinal heading)
- Health bar + HP text
- Ammo display (mag/reserve)
- Reload message
- Pickup hint
- Kill feed
- Pause overlay

## Controls
- **WASD/Arrows**: Movement
- **Mouse**: Look around
- **Left Click**: Fire
- **Shift**: Sprint
- **Space**: Jump
- **MetaLeft**: Aim Down Sights (ADS)
- **R**: Reload
- **Y**: Zombie Mode toggle
- **ESC**: Pause (pointer lock unlock)
- **Right Click on "Resume"**: Re-acquire pointer lock

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
- ~10 NPCs scattered across map
- Ammo pickups at fixed locations

## Common Tasks

### Adding a Sound Effect
1. Create `function playXxx()` similar to `playShot()` or `playFootstep()`
2. Use `getCtx()` to get Web Audio API context
3. Create oscillators/buffers, connect to gain nodes
4. Set frequency/gain curves with `setValueAtTime()` and `exponentialRampToValueAtTime()`
5. Call function from appropriate place (e.g., kill event, footstep timer)

### Modifying NPC Behavior
- Edit `updateNPCs()` function (line ~768)
- Adjust state transitions, walk speeds, target selection
- Change zombie mode chase logic under `if (zombieMode)` block

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
