// ═══════════════════════════════════════════════════════════
//  assets/placeholder.js
//  Asset manifest + placeholder generators
//  Replace with real sprites/sounds when ready.
// ═══════════════════════════════════════════════════════════

/*
  NEXUS ZERO — Asset Placeholder System
  ─────────────────────────────────────
  All graphics are procedurally drawn on <canvas>.
  All audio is synthesized via Web Audio API.
  This file documents what real assets would replace them.

  ── SPRITES (replace canvas drawing in player.js / enemy.js / boss.js)
  ┌────────────────────────────────────────────────────────┐
  │ File                    │ Size   │ Format │ Frames     │
  ├────────────────────────────────────────────────────────┤
  │ player_idle.png         │ 64×64  │ PNG    │ 4          │
  │ player_run.png          │ 64×64  │ PNG    │ 8          │
  │ player_dash.png         │ 64×64  │ PNG    │ 4          │
  │ player_shoot.png        │ 64×64  │ PNG    │ 2          │
  │ player_death.png        │ 64×64  │ PNG    │ 6          │
  │ enemy_drone.png         │ 48×48  │ PNG    │ 4          │
  │ enemy_soldier.png       │ 48×48  │ PNG    │ 6          │
  │ enemy_heavy.png         │ 64×64  │ PNG    │ 4          │
  │ enemy_sniper.png        │ 48×48  │ PNG    │ 4          │
  │ enemy_elite.png         │ 56×56  │ PNG    │ 6          │
  │ enemy_spider.png        │ 48×48  │ PNG    │ 8          │
  │ enemy_tank.png          │ 80×80  │ PNG    │ 2          │
  │ boss_sentinel.png       │ 96×96  │ PNG    │ 8          │
  │ boss_decimator.png      │ 112×112│ PNG    │ 8          │
  │ boss_avatar.png         │ 128×128│ PNG    │ 10         │
  │ boss_guardian.png       │ 144×144│ PNG    │ 10         │
  │ boss_prime.png          │ 160×160│ PNG    │ 12         │
  │ bullet_pistol.png       │ 16×8   │ PNG    │ 1          │
  │ bullet_rifle.png        │ 16×6   │ PNG    │ 1          │
  │ bullet_plasma.png       │ 20×20  │ PNG    │ 4          │
  │ pickup_ammo.png         │ 32×32  │ PNG    │ 1          │
  │ pickup_health.png       │ 32×32  │ PNG    │ 1          │
  │ pickup_shield.png       │ 32×32  │ PNG    │ 1          │
  │ pickup_weapon.png       │ 32×32  │ PNG    │ 1          │
  │ log_node.png            │ 32×32  │ PNG    │ 4          │
  │ tileset_zone1.png       │ 512×512│ PNG    │ —          │
  │ tileset_zone2.png       │ 512×512│ PNG    │ —          │
  │ tileset_zone3.png       │ 512×512│ PNG    │ —          │
  │ tileset_zone4.png       │ 512×512│ PNG    │ —          │
  │ tileset_zone5.png       │ 512×512│ PNG    │ —          │
  │ wall_industrial.png     │ 128×128│ PNG    │ —          │
  │ ui_health_bar.png       │ 256×24 │ PNG    │ —          │
  │ ui_weapon_icons.png     │ 192×32 │ PNG    │ —          │
  └────────────────────────────────────────────────────────┘

  ── SOUNDS (replace Audio.play() synth in audio.js)
  ┌────────────────────────────────────────────────────────┐
  │ File                    │ Format │ Duration           │
  ├────────────────────────────────────────────────────────┤
  │ shoot_pistol.ogg        │ OGG    │ ~0.3s              │
  │ shoot_rifle.ogg         │ OGG    │ ~0.2s              │
  │ shoot_shotgun.ogg       │ OGG    │ ~0.4s              │
  │ shoot_sniper.ogg        │ OGG    │ ~0.5s              │
  │ shoot_plasma.ogg        │ OGG    │ ~0.4s              │
  │ shoot_rocket.ogg        │ OGG    │ ~0.6s              │
  │ reload.ogg              │ OGG    │ ~1.0s              │
  │ empty_gun.ogg           │ OGG    │ ~0.1s              │
  │ hit_enemy.ogg           │ OGG    │ ~0.2s              │
  │ hit_player.ogg          │ OGG    │ ~0.3s              │
  │ shield_hit.ogg          │ OGG    │ ~0.2s              │
  │ enemy_die.ogg           │ OGG    │ ~0.5s              │
  │ explosion.ogg           │ OGG    │ ~0.8s              │
  │ pickup_ammo.ogg         │ OGG    │ ~0.2s              │
  │ pickup_health.ogg       │ OGG    │ ~0.3s              │
  │ pickup_weapon.ogg       │ OGG    │ ~0.5s              │
  │ pickup_log.ogg          │ OGG    │ ~0.3s              │
  │ boss_spawn.ogg          │ OGG    │ ~1.5s              │
  │ boss_die.ogg            │ OGG    │ ~2.0s              │
  │ level_clear.ogg         │ OGG    │ ~1.0s              │
  │ game_over.ogg           │ OGG    │ ~2.0s              │
  │ win.ogg                 │ OGG    │ ~3.0s              │
  │ dash.ogg                │ OGG    │ ~0.15s             │
  │ music_zone1.ogg         │ OGG    │ loop ~120s         │
  │ music_zone2.ogg         │ OGG    │ loop ~120s         │
  │ music_zone3.ogg         │ OGG    │ loop ~120s         │
  │ music_zone4.ogg         │ OGG    │ loop ~120s         │
  │ music_zone5.ogg         │ OGG    │ loop ~120s         │
  └────────────────────────────────────────────────────────┘

  ── HOW TO ADD REAL SPRITES
  Replace the drawEnemy / drawPlayer functions in:
    js/player.js    → Player.draw()
    js/enemy.js     → drawEnemy()
    js/boss.js      → Boss.draw()

  Example pattern (spritesheet):
    const img = new Image();
    img.src = 'assets/sprites/player_run.png';
    // In draw():
    const frameW = 64, frameH = 64;
    const frame = Math.floor(animTick / 6) % 8;
    ctx.drawImage(img, frame * frameW, 0, frameW, frameH, -32, -32, 64, 64);

  ── HOW TO ADD REAL SOUNDS
  In audio.js, replace synth() calls with:
    const sfx = new Audio('assets/sounds/shoot_pistol.ogg');
    sfx.volume = 0.5;
    sfx.play();

  Or use a proper audio manager with WebAudio for spatial sound.
*/

const AssetPlaceholder = {
  // Sprite dimensions reference (for when real assets are added)
  SPRITE_SIZES: {
    player: 64, drone: 48, soldier: 48, heavy: 64,
    sniper: 48, elite: 56, spider: 48, tank: 80,
  },
  // Sound IDs list (for reference)
  SOUND_IDS: [
    'shoot_pistol','shoot_rifle','shoot_shotgun','shoot_sniper',
    'shoot_plasma','shoot_rocket','reload','empty_gun',
    'hit_enemy','hit_player','shield_hit','enemy_die',
    'explosion','pickup_ammo','pickup_health','pickup_weapon',
    'pickup_log','boss_spawn','boss_die','level_clear',
    'game_over','win','dash','menu_select',
  ],
  // Returns a colored placeholder rect (dev mode)
  placeholder: (ctx, x, y, w, h, label = '', color = '#f0f') => {
    ctx.fillStyle = color + '44';
    ctx.fillRect(x - w/2, y - h/2, w, h);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(x - w/2, y - h/2, w, h);
    if (label) {
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, y + 4);
    }
  },
};