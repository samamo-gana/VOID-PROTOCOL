# VOID PROTOCOL — Beyond the Rift
### Professional 2D Space Shooter — Complete Source

---

## PROJECT STRUCTURE

```
project-game/
├── index.html                    ← Entry point
├── README.md
│
├── css/
│   └── style.css                 ← Full UI, HUD, animations
│
├── js/  (load order = HTML script order)
│   ├── config.js       ← All constants: ships, weapons, enemies, bosses, zones, skills
│   ├── utils.js        ← Math, collision, geometry, 3D-shade helpers
│   ├── input.js        ← Keyboard + mouse manager
│   ├── audio.js        ← Full Web Audio engine: 24 SFX, procedural music, engine hum
│   ├── save.js         ← localStorage persistence
│   ├── camera.js       ← Smooth follow camera, screenshake, cinematic pan
│   ├── physics.js      ← Raycasting, LOS, knockback, safe-spawn
│   ├── particles.js    ← 1200-particle pool: thruster, explosion, plasma, warp, organic
│   ├── environment.js  ← 7 unique space environments (asteroids→rift core)
│   ├── weapons.js      ← 6-weapon system: heat, charging, homing, piercing, AoE
│   ├── player.js       ← 5 ships with ultra-detailed canvas drawing, boost, specials
│   ├── enemy.js        ← 9 enemy types (drone→organic), FSM AI, elite mini-bosses
│   ├── boss.js         ← 5 cinematic bosses, multi-phase, 8+ bullet patterns each
│   ├── missions.js     ← Per-zone objectives, bonus goals, timed challenges
│   ├── story.js        ← 19 data logs, 8 cutscenes, 8 transmissions, lore engine
│   ├── skillTree.js    ← 10 persistent upgrades with save integration
│   ├── achievements.js ← 11 achievements with secret unlocks
│   ├── shop.js         ← Item shop, ship/weapon unlocking, tactical nuke
│   ├── level.js        ← Zone loading, enemy/elite spawning, pickup management
│   ├── renderer.js     ← Full pipeline: lighting, post-FX, minimap, crosshair, title BG
│   ├── ui.js           ← HUD, messages, popups, screens, DOM wiring
│   ├── game.js         ← State machine, game loop, zone transitions
│   └── main.js         ← Boot entry point
│
└── assets/
    └── sounds/         ← Place .ogg files here to replace procedural audio
```

---

## HOW TO RUN

**Option 1 — VS Code Live Server (recommended)**
1. Open `project-game/` in VS Code
2. Install **Live Server** extension (ritwickdey.LiveServer)
3. Right-click `index.html` → **Open with Live Server**
4. Opens at `http://127.0.0.1:5500`

**Option 2 — Python**
```bash
cd project-game
python -m http.server 8080
# → open http://localhost:8080
```

**Option 3 — Node**
```bash
cd project-game
npx serve .
```

> ⚠️ Must be served over HTTP — do NOT open `index.html` directly as `file://`  
> (Web Audio API and canvas require HTTP context)

---

## CONTROLS

| Input | Action |
|-------|--------|
| WASD / Arrow Keys | Move ship |
| Mouse | Aim |
| Left Click / Space | Shoot (hold for auto on auto-fire weapons) |
| Shift | Boost (brief i-frames, speed surge) |
| Q | Special Ability (ship-specific) |
| 1–6 | Switch weapon slot |
| E | Interact / Pick up data log |
| P / Escape | Pause |
| M | Mute / Unmute |

---

## GAME FEATURES

### Ships (5 Phantom-class fighters)
| Ship | Style | Special |
|------|-------|---------|
| PHANTOM-X | Balanced | Afterburner (double boost) |
| WRAITH-II | Speed/glass | Phase Shift (teleport + i-frames) |
| IRON-TITAN | Heavy/tanky | Shield Nova (full shield restore + pulse) |
| NOVA-RAPTOR | Experimental | Rift Pulse (AoE damage burst) |
| ECLIPSE-VOID | Stolen NEXUS tech | Void Mirror (reflect all bullets) |

### Weapons (6 types with full heat system)
| # | Weapon | Special mechanic |
|---|--------|-----------------|
| 1 | Pulse Laser | Infinite ammo, low heat |
| 2 | Plasma Rifle | High damage, medium heat |
| 3 | Shotgun Laser | 6-pellet spread burst |
| 4 | Homing Missile | Tracks nearest enemy |
| 5 | Railgun | Pierces all targets in line |
| 6 | Charged Cannon | Hold to charge → explosive release |

### Enemies (9 types)
- **Fighter** — Standard chaser with strafe
- **Kamikaze** — Suicide charge, massive contact damage
- **Sniper Drone** — Stationary, long-range, laser sight
- **Shielder** — Energy shield that regenerates + buffs nearby allies
- **Teleporter** — Phases out and repositions mid-combat
- **Swarm** — Tiny, fast, orbit attacks in groups
- **Cruiser** — Heavy armoured triple-cannon battleship
- **Elite** — Hexagonal mini-boss with ring burst special
- **Organic** — Alien tentacle creature with erratic movement

### Bosses (5 cinematic encounters)
1. **Rift Herald** — Spread fan + ring + burst patterns
2. **Void Leviathan** — Spiral, homing volleys, minion spawns
3. **Iron Colossus** — Slow + charge attacks, wave beam sweep
4. **Nexus Overmind** — Rotating spirals, adaptive patterns per phase
5. **The Rift Itself** — All-out assault, 4 phases, chaos patterns

### Zones (7 environments)
1. Outer Belt — Asteroid field with parallax rocks
2. Nebula Crossing — Drifting gas clouds, floating crystals
3. Abandoned Station — Derelict modules with blinking lights and fire
4. Destroyed Fleet — Burning wrecks of capital ships
5. Alien Planet Ring — Orbital debris, organic floaters, giant planet
6. Black Hole Zone — Gravitational pull mechanics, accretion disk
7. Rift Core — Void tears, unstable portals, void crystals

### Systems
- **Dynamic lighting** — Per-zone darkness, point lights per entity, weapon glow
- **Post-processing** — Vignette, scanlines, chromatic aberration on hit, film grain, zone distortion
- **Combo multiplier** — Kill streaks boost credits and score
- **Skill tree** — 10 persistent upgrades across runs (hull, shield, speed, heat, damage, credits, boost, combo)
- **Achievement system** — 11 achievements (3 secret)
- **Save system** — localStorage persistence: ships, weapons, zones, credits, skills, achievements
- **Procedural audio** — Full Web Audio API, no files required: 24 SFX + 7 zone music + boss music + engine hum + ambient space hum + low-health alarm
- **Minimap** — Real-time with enemy, pickup, log, boss tracking
- **Cinematic transitions** — Warp overlay, camera pan intro, boss reveal, phase flash

---

## EXPANDING THE GAME

| Goal | File |
|------|------|
| New weapon | `config.js → WEAPONS[]` + `weapons.js → SFX map` |
| New enemy type | `config.js → ENEMIES{}` + `enemy.js → _drawEnemy()` |
| New boss | `config.js → BOSSES[]` + `boss.js → _bossUpdaters[]` + `_drawBoss()` |
| New zone/environment | `config.js → ZONES[]` + `environment.js → build*()` + `level.js → ENEMY_SPAWNS` |
| New ship | `config.js → SHIPS[]` + `player.js → draw case` |
| New skill | `config.js → SKILL_TREE[]` + `skillTree.js → applyToPlayer()` |
| New achievement | `config.js → ACHIEVEMENTS[]` + `achievements.js → notify()` |
| New story log | `story.js → LOGS[]` |
| New cutscene | `story.js → CUTSCENES[]` |
| Real sound files | `audio.js → play()` — replace synth calls with `new Audio('assets/sounds/X.ogg').play()` |
| Real sprites | `player.js / enemy.js / boss.js` — replace `ctx.beginPath()` blocks with `ctx.drawImage()` |
| Mobile controls | `input.js` — add touch joystick + tap handlers |
| Multiplayer | `game.js` — add WebSocket sync layer |

---

## TECH STACK

- **Pure HTML5 Canvas 2D** — no frameworks, no bundler, no dependencies
- **Web Audio API** — 100% procedural sound + music
- **localStorage** — persistent save system
- **ES6 IIFE modules** — organized, no import/export needed
- **~4500 lines** of clean, documented, expandable code
- **60 FPS** — particle pooling, frustum culling, optimized draw order

---

*VOID PROTOCOL — Close the Rift. Silence the Void.*