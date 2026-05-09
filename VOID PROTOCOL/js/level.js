// ═══════════════════════════════════════════════════════════
//  level.js — Zone loading, spawn management, pickups
// ═══════════════════════════════════════════════════════════
const Level = (() => {

  let pickups       = [];
  let currentZone   = 0;
  let levelCleared  = false;
  let bossSpawned   = false;
  let allEnemiesDead = false;
  let zoneTick      = 0;
  let warpActive    = false;

  /* ── Elite mini-boss spawn positions per zone ── */
  const ELITE_SPAWNS = [
    [{x:CONFIG.WORLD_W*.3, y:CONFIG.WORLD_H*.3}],
    [{x:CONFIG.WORLD_W*.7, y:CONFIG.WORLD_H*.3},{x:CONFIG.WORLD_W*.3, y:CONFIG.WORLD_H*.7}],
    [{x:CONFIG.WORLD_W*.5, y:CONFIG.WORLD_H*.2},{x:CONFIG.WORLD_W*.2, y:CONFIG.WORLD_H*.6}],
    [{x:CONFIG.WORLD_W*.3, y:CONFIG.WORLD_H*.3},{x:CONFIG.WORLD_W*.7, y:CONFIG.WORLD_H*.4},{x:CONFIG.WORLD_W*.5, y:CONFIG.WORLD_H*.7}],
    [{x:CONFIG.WORLD_W*.4, y:CONFIG.WORLD_H*.3},{x:CONFIG.WORLD_W*.6, y:CONFIG.WORLD_H*.3}],
    [{x:CONFIG.WORLD_W*.3, y:CONFIG.WORLD_H*.4},{x:CONFIG.WORLD_W*.7, y:CONFIG.WORLD_H*.4}],
    [{x:CONFIG.WORLD_W*.3, y:CONFIG.WORLD_H*.3},{x:CONFIG.WORLD_W*.7, y:CONFIG.WORLD_H*.3},{x:CONFIG.WORLD_W*.5, y:CONFIG.WORLD_H*.6}],
  ];

  /* ── Weapon drop spots per zone ── */
  const WEAPON_DROPS = [
    [],
    [{wx:2800,wy:800, wid:1}],   // rifle zone 1
    [{wx:1800,wy:1200,wid:2},{wx:3000,wy:700,wid:3}],
    [{wx:2500,wy:1800,wid:4}],
    [{wx:1500,wy:500, wid:5}],
    [{wx:2000,wy:2000,wid:4}],
    [{wx:CONFIG.WORLD_W/2,wy:CONFIG.WORLD_H-300,wid:5}],
  ];

  /* ════════════════════════════════
     LOAD ZONE
  ════════════════════════════════ */
  const load = (zoneIdx, saveData) => {
    currentZone   = zoneIdx;
    levelCleared  = false;
    bossSpawned   = false;
    allEnemiesDead = false;
    zoneTick      = 0;
    warpActive    = false;
    pickups       = [];

    EnemyMgr.clear();
    BossMgr.clear();
    Weapons.clearBullets();
    Particles.clear();
    Environment.load(zoneIdx);

    // Player start
    Player.init(saveData?.selectedShip || 0);
    SkillTree.applyToPlayer();

    // Unlock weapons from save
    for (const wid of (saveData?.unlockedWeapons || [0])) Weapons.unlock(wid);

    // Spawn enemies
    _spawnEnemies(zoneIdx);
    // Spawn pickups
    _spawnPickups(zoneIdx);
    // Weapon drops
    _spawnWeaponDrops(zoneIdx);
    // Story logs
    Story.spawnLogs(zoneIdx);
    // Mission
    Missions.load(zoneIdx);
    // Music
    Audio.startMusic(zoneIdx);
    Audio.startEngine();

    // Camera start
    Camera.setTarget(Player.x, Player.y);
    Camera.init(Renderer.W, Renderer.H);

    console.log(`[Level] Zone ${zoneIdx+1} loaded | enemies=${EnemyMgr.getCount()} | pickups=${pickups.length}`);
  };

   const _spawnEnemies = (zi) => {
   const pool  = CONFIG.LEVEL_POOL[Math.min(zi, CONFIG.LEVEL_POOL.length-1)];
   const count = 10 + zi*5;
   const px=Player.x, py=Player.y;

    for (let i=0; i<count; i++) {
      let ex,ey,tries=0;
      do {
        ex = 80 + Math.random()*(CONFIG.WORLD_W-160);
        ey = 80 + Math.random()*(CONFIG.WORLD_H-160);
        tries++;
      } while (Utils.dist(ex,ey,px,py)<400 && tries<30);
      const type = pool[Math.floor(Math.random()*pool.length)];
      EnemyMgr.spawn(type, ex, ey, zi+1);
    }

    // Elite mini-bosses
    const eliteSpots = ELITE_SPAWNS[Math.min(zi, ELITE_SPAWNS.length-1)];
    const eliteTypes = pool.filter(t=>!['SWARM','KAMIKAZE'].includes(t));
    for (const spot of eliteSpots) {
      const t = eliteTypes[Math.floor(Math.random()*eliteTypes.length)] || pool[0];
      EnemyMgr.spawnElite(t, spot.x, spot.y, zi+1);
    }
  };

  const _spawnPickups = (zi) => {
    const count = 6 + zi*2;
    for (let i=0; i<count; i++) {
      let px,py,tries=0;
      do { px=80+Math.random()*(CONFIG.WORLD_W-160); py=80+Math.random()*(CONFIG.WORLD_H-160); tries++; }
      while (tries<20);
      const w=[55,30,12,3], types=['AMMO','HEALTH','SHIELD','NUKE'];
      pickups.push({ x:px,y:py,type:Utils.weightedRnd(types,w),radius:18,
        pulse:Math.random()*Math.PI*2,bob:Math.random()*Math.PI*2,alive:true });
    }
  };

  const _spawnWeaponDrops = (zi) => {
    const drops = WEAPON_DROPS[Math.min(zi, WEAPON_DROPS.length-1)];
    for (const d of drops) {
      pickups.push({ x:d.wx,y:d.wy,type:'WEAPON_'+d.wid,radius:22,
        pulse:Math.random()*Math.PI*2,bob:0,alive:true,weaponId:d.wid });
    }
  };

  /* ════════════════════════════════
     UPDATE
  ════════════════════════════════ */
  const update = (saveData) => {
    zoneTick++;
    if (levelCleared || warpActive) return;

    // Pickup collection
    for (let i=pickups.length-1;i>=0;i--) {
      const pk=pickups[i];
      if (!pk.alive){pickups.splice(i,1);continue;}
      pk.pulse+=.06; pk.bob+=.04;
      if (Utils.dist(Player.x,Player.y,pk.x,pk.y) < pk.radius+CONFIG.PLAYER.RADIUS) {
        _collectPickup(pk, saveData);
        pickups.splice(i,1);
      }
    }

    // All enemies dead → spawn boss
    if (!bossSpawned && EnemyMgr.getCount()===0) {
      allEnemiesDead = true;
      bossSpawned    = true;
      BossMgr.create(currentZone);
      Story.triggerTransmission(currentZone, 'boss_spawn');
      Camera.startIntroCam(
        Player.x, Player.y,
        CONFIG.WORLD_W/2, 280,
        120,
        () => Camera.setTarget(Player.x, Player.y)
      );
    }

    // Boss dead → level clear
    if (bossSpawned && !levelCleared && !BossMgr.alive && BossMgr.get()===null) {
      levelCleared = true;
      _handleClear(saveData);
    }
  };

  const _collectPickup = (pk, saveData) => {
    Particles.warpEffect(pk.x, pk.y, '#00ff88');
    switch (pk.type) {
      case 'HEALTH':  Player.heal(40);          UI.showBriefMsg('+40 HULL','#00ff88'); Audio.play('pickup_credits'); break;
      case 'SHIELD':  Player.addShield(60);     UI.showBriefMsg('+SHIELD','#0088ff');  Audio.play('pickup_credits'); break;
      case 'AMMO':    Weapons.refillAmmo();      UI.showBriefMsg('+AMMO','#ff8800');    Audio.play('pickup_ammo');    break;
      case 'NUKE':
        for (const e of EnemyMgr.getAlive()) e.takeDamage(9999);
        Camera.shake(16,22); Audio.play('explosion');
        UI.showMessage('⚡ TACTICAL NUKE DEPLOYED', 2000,'#ff0'); break;
      default:
        if (pk.type.startsWith('WEAPON_')) {
          const wid = pk.weaponId || parseInt(pk.type.split('_')[1]);
          if (saveData && !saveData.unlockedWeapons.includes(wid)) {
            saveData.unlockedWeapons.push(wid); Save.save(saveData);
          }
          Weapons.unlock(wid); Weapons.switchTo(wid);
          UI.showWeaponUnlock(CONFIG.WEAPONS[wid]);
          Achievements.notify('all_weapons', [...Weapons.unlockedSet].length);
        }
    }
  };

  const _handleClear = (saveData) => {
    const bonus = 2000*(currentZone+1);
    Player.addCredits(bonus);
    if (saveData) {
      if (!saveData.completedZones.includes(currentZone)) {
        saveData.completedZones.push(currentZone);
      }
      saveData.stats.runsCompleted++;
      saveData.stats.bossesKilled++;
      Save.save(saveData);
    }
    Achievements.notify('all_zones', saveData?.completedZones?.length||0);

    if (currentZone >= 6) {
      Achievements.notify('win');
      setTimeout(()=>Game.triggerWin(), 3000);
      UI.showMessage('RIFT CORE DESTROYED\nTHE VOID IS SILENT', 4000,'#00ff88');
    } else {
      Audio.play('level_clear');
      UI.showZoneClearBanner();
      UI.showMessage(`ZONE CLEARED  +${bonus.toLocaleString()} CREDITS`, 3000,'#00ff88');
      setTimeout(()=>_warpToNext(), 3200);
    }
  };

  const _warpToNext = () => {
    warpActive = true;
    Particles.warpEffect(Player.x, Player.y, Player.shipDef?.color||'#0ff');
    UI.triggerWarpOverlay();
    Audio.play('warp'); Camera.shake(10,15);
    setTimeout(()=>Game.nextZone(), 1200);
  };

  /* ════════════════════════════════
     DRAW PICKUPS
  ════════════════════════════════ */
  const drawPickups = (ctx) => {
    const tick=zoneTick;
    for (const pk of pickups) {
      if (!pk.alive||!Camera.visible(pk.x,pk.y,35)) continue;
      const bob=Math.sin(pk.bob+tick*.05)*3;
      const pulse=.6+Math.sin(pk.pulse)*.4;
      ctx.save(); ctx.translate(pk.x,pk.y+bob);

      const colors={AMMO:'#ff8800',HEALTH:'#00ff88',SHIELD:'#0088ff',NUKE:'#ff2244',
        WEAPON_1:'#8800ff',WEAPON_2:'#ff6600',WEAPON_3:'#00ffcc',WEAPON_4:'#ffee00',WEAPON_5:'#ff2244'};
      const col = colors[pk.type]||'#fff';

      // Glow
      const g=ctx.createRadialGradient(0,0,0,0,0,30);
      g.addColorStop(0,Utils.hexRGBA(col,.3*pulse)); g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,30,0,Math.PI*2); ctx.fill();

      // Orbit ring
      ctx.save(); ctx.rotate(tick*.04);
      ctx.strokeStyle=Utils.hexRGBA(col,.55*pulse); ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.arc(0,0,pk.radius,0,Math.PI*1.5); ctx.stroke();
      ctx.restore();

      // Icon
      ctx.fillStyle=col; ctx.shadowColor=col; ctx.shadowBlur=10*pulse;
      if(pk.type==='HEALTH'){ctx.fillRect(-2,-9,4,18);ctx.fillRect(-9,-2,18,4);}
      else if(pk.type==='SHIELD'){
        ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(8,-4);ctx.lineTo(8,3);ctx.lineTo(0,9);ctx.lineTo(-8,3);ctx.lineTo(-8,-4);ctx.closePath();ctx.fill();
      } else if(pk.type==='AMMO'){ctx.fillRect(-8,-5,16,10);ctx.fillRect(6,-8,3,16);}
      else if(pk.type==='NUKE'){
        ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='rgba(0,0,0,.5)';ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillStyle=col;ctx.fillText('☢',0,1);
      } else {
        // Weapon
        ctx.fillRect(-10,-3,20,6);ctx.fillRect(8,-6,3,12);
        ctx.fillStyle='rgba(0,0,0,.4)';ctx.fillRect(-10,-1,20,2);
      }
      ctx.shadowBlur=0;
      // Label
      ctx.fillStyle=Utils.hexRGBA(col,.7*pulse);
      ctx.font='9px "Share Tech Mono",monospace';ctx.textAlign='center';
      ctx.fillText(pk.type.replace('WEAPON_','WPN '),0,pk.radius+10);
      ctx.restore();
    }
  };

  return {
    load, update, drawPickups,
    get pickups(){return pickups;},
    get currentZone(){return currentZone;},
    get levelCleared(){return levelCleared;},
    get bossSpawned(){return bossSpawned;},
    get allEnemiesDead(){return allEnemiesDead;},
    get zoneTick(){return zoneTick;},
  };
})();