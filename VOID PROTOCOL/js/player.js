// ═══════════════════════════════════════════════════════════
//  player.js — Spacecraft entity, movement, special abilities
// ═══════════════════════════════════════════════════════════
const Player = (() => {
  /* ── state ── */
  let x=0,y=0,vx=0,vy=0;
  let hp=0,maxHp=0,shield=0,maxShield=0;
  let invincible=0,alive=true,animTick=0;
  let angle=0;                 // facing direction
  let boostTimer=0,boostCooldown=0,boosting=false;
  let specialCooldown=0;
  let shipId=0;
  let shipDef=null;
  let deathTimer=0;
  let score=0,kills=0,credits=0;
  let comboCount=0,comboTimer=0,comboMult=1;
  let tookHullDamage=false;    // for ghost-run achievement

  /* ── skill modifiers ── */
  let bonusHp=0,bonusShield=0,bonusSpeed=0,bonusDmgPct=0,
      bonusCreditsPct=0,bonusBoostCooldown=0,bonusComboMax=0;

  const init = (sid=0) => {
    shipId=sid;
    shipDef=CONFIG.SHIPS[sid];
    x=CONFIG.WORLD_W/2; y=CONFIG.WORLD_H-300;
    vx=0;vy=0;
    hp=shipDef.hp+bonusHp; maxHp=hp;
    shield=shipDef.shield+bonusShield; maxShield=shield;
    invincible=0; alive=true; animTick=0;
    boostTimer=0; boostCooldown=0; boosting=false;
    specialCooldown=0; deathTimer=0;
    tookHullDamage=false;
  };

  const resetRunStats = () => { score=0; kills=0; credits=0; comboCount=0; comboTimer=0; comboMult=1; };

  /* ── damage & healing ── */
  const takeDamage = (dmg) => {
    if (!alive||invincible>0) return;
    if (shield>0) {
      const abs=Math.min(shield,dmg); shield-=abs; dmg-=abs;
      if (dmg<=0){ Particles.shieldImpact(x,y,'#0088ff'); Audio.play('shield_hit'); return; }
      Audio.play('shield_hit');
    }
    hp-=dmg; tookHullDamage=true;
    invincible=CONFIG.PLAYER.INVINCIBLE;
    Camera.shake(7,9); Audio.play('hit_player');
    Particles.explosion(x,y,18,'#ff2244',10);
    UI.triggerHitFlash();
    Audio.setLowHealthAlarm(hp>0&&hp/maxHp<.25);
    if (hp<=0){ hp=0; _die(); }
  };

  const heal=(v)=>{hp=Math.min(maxHp,hp+v); Audio.play('pickup_credits');};
  const addShield=(v)=>{shield=Math.min(maxShield,shield+v);};
  const addCredits=(v)=>{
    const bonus=Math.floor(v*(1+bonusCreditsPct)*comboMult);
    credits+=bonus; score+=bonus*2;
    return bonus;
  };
  const addKill=()=>{
    kills++;
    comboCount++;
    comboTimer=220;
    const maxM=5+bonusComboMax;
    comboMult=Utils.clamp(1+Math.floor(comboCount/3)*.5,1,maxM);
    if(comboCount===10||comboCount===20||comboCount===50) Audio.play('combo_up');
    Achievements.notify('kills',kills);
  };

  const _die = () => {
    alive=false; deathTimer=150;
    Particles.bossDeathCascade(x,y,60,'#ff4400');
    Audio.play('boss_die'); Camera.shake(18,30);
    Audio.setLowHealthAlarm(false);
  };

  /* ── specials ── */
  const useSpecial = () => {
    if (!shipDef||specialCooldown>0) return;
    const maxCD=300*(1-bonusBoostCooldown*.15);
    switch(shipDef.special){
      case 'AFTERBURNER':
        // big speed burst
        boosting=true; boostTimer=CONFIG.PLAYER.BOOST_DURATION*2;
        invincible=CONFIG.PLAYER.BOOST_DURATION*2;
        Audio.play('dash');
        break;
      case 'PHASE SHIFT':
        // teleport forward
        x+=Math.cos(angle)*180; y+=Math.sin(angle)*180;
        x=Utils.clamp(x,20,CONFIG.WORLD_W-20); y=Utils.clamp(y,20,CONFIG.WORLD_H-20);
        invincible=60; Particles.warpEffect(x,y,shipDef.color);
        Audio.play('phase_shift'); Camera.shake(5,6);
        break;
      case 'SHIELD NOVA':
        // pulse that destroys nearby bullets
        shield=maxShield;
        Particles.warpEffect(x,y,'#0088ff');
        Audio.play('warp'); Camera.shake(8,10);
        break;
      case 'RIFT PULSE':
        // AoE damage around player
        Weapons.applyAoE(x,y,250,60,EnemyMgr.enemies,BossMgr.get());
        Particles.explosion(x,y,250,'#00ff88',30);
        Audio.play('explosion'); Camera.shake(12,15);
        break;
      case 'VOID MIRROR':
        // reflect all bullets back
        for (const b of Weapons.enemyBullets) {
          b.vx=-b.vx; b.vy=-b.vy; b.dmg*=2;
        }
        Particles.warpEffect(x,y,'#ff0055');
        Audio.play('phase_shift');
        break;
    }
    specialCooldown=maxCD;
  };

  /* ── update ── */
  const update = () => {
    animTick++;
    if (invincible>0) invincible--;
    if (boostCooldown>0) boostCooldown--;
    if (specialCooldown>0) specialCooldown--;
    if (!alive){ deathTimer--; return; }

    // Combo decay
    if (comboTimer>0){ comboTimer--; }
    else { comboCount=0; comboMult=1; }

    // Input
    const move=Input.getMove();
    const spd=(shipDef?.speed||4)+bonusSpeed;
    const activeSpd=boosting?spd*CONFIG.PLAYER.BOOST_SPEED:spd;

    // Boost input
    if (Input.isBoost()&&boostCooldown<=0&&move.moving) {
      boosting=true; boostTimer=CONFIG.PLAYER.BOOST_DURATION;
      boostCooldown=CONFIG.PLAYER.BOOST_COOLDOWN-bonusBoostCooldown;
      invincible=Math.max(invincible,12);
      Audio.play('dash');
    }
    if (boostTimer>0){ boostTimer--; if(boostTimer<=0)boosting=false; }

    // Engine audio
    Audio.setEngineIntensity(move.moving?Utils.clamp(activeSpd/6,0.2,1):0.05);

    vx=move.dx*activeSpd; vy=move.dy*activeSpd;

    // Apply velocity (no walls in space — use world clamping)
    x=Utils.clamp(x+vx,30,CONFIG.WORLD_W-30);
    y=Utils.clamp(y+vy,30,CONFIG.WORLD_H-30);

    // Aim toward mouse
    const world=Camera.toWorld(Input.mouse.x,Input.mouse.y);
    angle=Utils.angTo(x,y,world.x,world.y);

    // Shoot
    if (Input.isShooting()&&!Weapons.overheated) {
      Weapons.shoot(x,y,angle,EnemyMgr.enemies,BossMgr.get());
    } else if (!Input.isShooting()&&Weapons.charging) {
      Weapons.releaseCharge(x,y,angle);
    }

    // Weapon switch
    const wk=Input.getWpnKey();
    if (wk>=0) Weapons.switchTo(wk);

    // Special ability
    if (Input.wasDown('q')) useSpecial();

    // Thruster particles
    if (move.moving||boosting) {
      Particles.thrusterTrail(x,y,angle,shipDef?.color||'#0ff');
      if (boosting&&animTick%2===0) Particles.thrusterTrail(x,y,angle,'#ffffff');
    }

    // Camera follow
    Camera.setTarget(x,y);
  };

  /* ══════════════════════════════════════════
     DRAW — Ultra-detailed spacecraft
  ══════════════════════════════════════════ */
  const draw = (ctx) => {
    if (!alive) return;
    if (invincible>0&&Math.floor(invincible/4)%2===1) ctx.globalAlpha=0.35;

    ctx.save(); ctx.translate(x,y); ctx.rotate(angle);

    // ── Ship body based on ID
    switch(shipId) {
      case 0: _drawPhantomX(ctx); break;
      case 1: _drawWraithII(ctx); break;
      case 2: _drawIronTitan(ctx); break;
      case 3: _drawNovaRaptor(ctx); break;
      case 4: _drawEclipseVoid(ctx); break;
      default:_drawPhantomX(ctx);
    }

    ctx.restore();
    ctx.globalAlpha=1;

    // Shield bubble
    if (shield>0) {
      ctx.save();
      const sp=shield/maxShield;
      ctx.strokeStyle=`rgba(0,136,255,${.2+sp*.4})`;
      ctx.lineWidth=2+sp*2;
      ctx.shadowColor='#0088ff'; ctx.shadowBlur=12;
      const arc=(sp)*Math.PI*2;
      ctx.beginPath();
      ctx.arc(x,y,CONFIG.PLAYER.RADIUS+12,-Math.PI/2,-Math.PI/2+arc);
      ctx.stroke();
      ctx.shadowBlur=0; ctx.restore();
    }
    // Boost ring
    if (boosting) {
      ctx.save();
      ctx.strokeStyle=`rgba(0,245,255,${.4+Math.sin(animTick*.3)*.3})`;
      ctx.lineWidth=3; ctx.shadowColor='#00f5ff'; ctx.shadowBlur=16;
      ctx.beginPath(); ctx.arc(x,y,CONFIG.PLAYER.RADIUS+6,0,Math.PI*2); ctx.stroke();
      ctx.shadowBlur=0; ctx.restore();
    }
  };

  /* ── PHANTOM-X (balanced interceptor, T-fighter inspired) ── */
  const _drawPhantomX = (ctx) => {
    const c='#2299ff', ac='#0055ff';
    // Engine glow
    const eg=ctx.createRadialGradient(-18,0,0,-18,0,22);
    eg.addColorStop(0,'rgba(0,150,255,.8)'); eg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=eg; ctx.beginPath(); ctx.arc(-18,0,22,0,Math.PI*2); ctx.fill();
    // Wing left
    ctx.fillStyle=ac;
    ctx.beginPath(); ctx.moveTo(2,-4); ctx.lineTo(-12,-22); ctx.lineTo(-18,-22); ctx.lineTo(-14,-4); ctx.closePath(); ctx.fill();
    // Wing right
    ctx.beginPath(); ctx.moveTo(2,4); ctx.lineTo(-12,22); ctx.lineTo(-18,22); ctx.lineTo(-14,4); ctx.closePath(); ctx.fill();
    // Wing detail stripes
    ctx.strokeStyle='rgba(0,200,255,.5)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(-4,-18); ctx.lineTo(-10,-18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-4,18); ctx.lineTo(-10,18); ctx.stroke();
    // Hull body
    ctx.fillStyle=c;
    ctx.beginPath(); ctx.moveTo(18,0); ctx.lineTo(4,-8); ctx.lineTo(-14,-6); ctx.lineTo(-18,0); ctx.lineTo(-14,6); ctx.lineTo(4,8); ctx.closePath(); ctx.fill();
    // Hull shading (3D effect)
    const hg=ctx.createLinearGradient(-18,-8,18,8);
    hg.addColorStop(0,'rgba(255,255,255,.2)'); hg.addColorStop(.5,'rgba(0,0,0,0)'); hg.addColorStop(1,'rgba(0,0,0,.3)');
    ctx.fillStyle=hg;
    ctx.beginPath(); ctx.moveTo(18,0); ctx.lineTo(4,-8); ctx.lineTo(-14,-6); ctx.lineTo(-18,0); ctx.lineTo(-14,6); ctx.lineTo(4,8); ctx.closePath(); ctx.fill();
    // Cockpit
    ctx.fillStyle='rgba(0,220,255,.85)';
    ctx.shadowColor='#00f5ff'; ctx.shadowBlur=8;
    ctx.beginPath(); ctx.ellipse(8,0,7,4,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(9,-1,3.5,2,-.2,0,Math.PI*2); ctx.fill();
    // Weapon mounts
    ctx.fillStyle=ac; ctx.shadowBlur=0;
    ctx.fillRect(10,-10,8,4); ctx.fillRect(10,6,8,4);
    // Hull edges
    ctx.strokeStyle='rgba(0,200,255,.6)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(18,0); ctx.lineTo(4,-8); ctx.lineTo(-14,-6); ctx.lineTo(-18,0); ctx.lineTo(-14,6); ctx.lineTo(4,8); ctx.closePath(); ctx.stroke();
  };

  /* ── WRAITH-II (stealth speed frame) ── */
  const _drawWraithII = (ctx) => {
    const c='#8800ff', ac='#ff00cc';
    // Engine trails
    for(let i=0;i<2;i++){
      const yy=i===0?-6:6;
      const eg=ctx.createRadialGradient(-14,yy,0,-14,yy,14);
      eg.addColorStop(0,'rgba(200,0,255,.7)'); eg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=eg; ctx.beginPath(); ctx.arc(-14,yy,14,0,Math.PI*2); ctx.fill();
    }
    // Swept delta wings
    ctx.fillStyle=ac;
    ctx.beginPath(); ctx.moveTo(16,0); ctx.lineTo(-6,-28); ctx.lineTo(-18,-10); ctx.lineTo(-8,-2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(16,0); ctx.lineTo(-6,28); ctx.lineTo(-18,10); ctx.lineTo(-8,2); ctx.closePath(); ctx.fill();
    // Body
    ctx.fillStyle=c;
    ctx.beginPath(); ctx.moveTo(20,0); ctx.lineTo(0,-5); ctx.lineTo(-18,-4); ctx.lineTo(-20,0); ctx.lineTo(-18,4); ctx.lineTo(0,5); ctx.closePath(); ctx.fill();
    // Stealth paneling
    ctx.strokeStyle='rgba(200,0,255,.4)'; ctx.lineWidth=1;
    for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(14-i*8,-i*1.2);ctx.lineTo(14-i*8,i*1.2);ctx.stroke();}
    // Cockpit (narrow visor)
    ctx.fillStyle='rgba(255,50,255,.8)';
    ctx.shadowColor=ac; ctx.shadowBlur=10;
    ctx.beginPath(); ctx.ellipse(8,0,6,2.5,0,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
    ctx.strokeStyle='rgba(200,100,255,.5)'; ctx.lineWidth=.8;
    ctx.beginPath(); ctx.moveTo(20,0); ctx.lineTo(0,-5); ctx.lineTo(-18,-4); ctx.lineTo(-20,0); ctx.lineTo(-18,4); ctx.lineTo(0,5); ctx.closePath(); ctx.stroke();
  };

  /* ── IRON-TITAN (heavy assault) ── */
  const _drawIronTitan = (ctx) => {
    const c='#cc5500', ac='#ffaa00';
    // 4 engine nacelles
    for(let i=0;i<4;i++){
      const yy=[-18,-8,8,18][i];
      const eg=ctx.createRadialGradient(-20,yy,0,-20,yy,12);
      eg.addColorStop(0,'rgba(255,150,0,.7)'); eg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=eg; ctx.beginPath(); ctx.arc(-20,yy,12,0,Math.PI*2); ctx.fill();
    }
    // Wide body
    ctx.fillStyle='#443322';
    ctx.fillRect(-22,-16,44,32);
    // Armour plates
    const plateG=ctx.createLinearGradient(-22,-16,22,16);
    plateG.addColorStop(0,'rgba(255,180,80,.15)'); plateG.addColorStop(1,'rgba(0,0,0,.2)');
    ctx.fillStyle=plateG; ctx.fillRect(-22,-16,44,32);
    // Panel lines
    ctx.strokeStyle='rgba(255,140,0,.3)'; ctx.lineWidth=1;
    for(let i=-16;i<=16;i+=8){ctx.beginPath();ctx.moveTo(-22,i);ctx.lineTo(22,i);ctx.stroke();}
    ctx.beginPath();ctx.moveTo(0,-16);ctx.lineTo(0,16);ctx.stroke();
    // Angled nose
    ctx.fillStyle=c;
    ctx.beginPath(); ctx.moveTo(22,0); ctx.lineTo(6,-14); ctx.lineTo(-22,-16); ctx.lineTo(-22,16); ctx.lineTo(6,14); ctx.closePath(); ctx.fill();
    // Cockpit (armored)
    ctx.fillStyle=ac; ctx.shadowColor=ac; ctx.shadowBlur=8;
    ctx.beginPath(); ctx.ellipse(10,0,8,5,0,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
    // Cannons
    ctx.fillStyle='#222';
    for(let i=0;i<3;i++){const yy=-12+i*12; ctx.fillRect(14,yy-2,16,4);}
    ctx.strokeStyle='rgba(255,160,0,.5)'; ctx.lineWidth=1;
    ctx.strokeRect(-22,-16,44,32);
    ctx.beginPath(); ctx.moveTo(22,0); ctx.lineTo(6,-14); ctx.lineTo(-22,-16); ctx.lineTo(-22,16); ctx.lineTo(6,14); ctx.closePath(); ctx.stroke();
  };

  /* ── NOVA-RAPTOR (experimental rift tech) ── */
  const _drawNovaRaptor = (ctx) => {
    const c='#00ff88', ac='#00ffff';
    const pulse=0.8+Math.sin(animTick*.08)*.2;
    // Rift energy core
    const cg=ctx.createRadialGradient(0,0,0,0,0,28*pulse);
    cg.addColorStop(0,'rgba(0,255,150,.15)'); cg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(0,0,28*pulse,0,Math.PI*2); ctx.fill();
    // Forward swept wings
    ctx.fillStyle='#004422';
    ctx.beginPath(); ctx.moveTo(8,-3); ctx.lineTo(-4,-20); ctx.lineTo(-16,-18); ctx.lineTo(-12,-3); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(8,3); ctx.lineTo(-4,20); ctx.lineTo(-16,18); ctx.lineTo(-12,3); ctx.closePath(); ctx.fill();
    // Wing energy lines
    ctx.strokeStyle=`rgba(0,255,136,${.4*pulse})`; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(6,-12); ctx.lineTo(-10,-16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6,12); ctx.lineTo(-10,16); ctx.stroke();
    // Hull
    ctx.fillStyle=c;
    ctx.beginPath(); ctx.moveTo(18,0); ctx.lineTo(4,-7); ctx.lineTo(-12,-5); ctx.lineTo(-16,0); ctx.lineTo(-12,5); ctx.lineTo(4,7); ctx.closePath(); ctx.fill();
    // Rift cockpit
    ctx.fillStyle='rgba(0,255,255,.9)'; ctx.shadowColor=ac; ctx.shadowBlur=14*pulse;
    ctx.beginPath(); ctx.ellipse(7,0,6,3.5,0,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
    ctx.strokeStyle=`rgba(0,255,136,${.6*pulse})`; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(18,0); ctx.lineTo(4,-7); ctx.lineTo(-12,-5); ctx.lineTo(-16,0); ctx.lineTo(-12,5); ctx.lineTo(4,7); ctx.closePath(); ctx.stroke();
  };

  /* ── ECLIPSE-VOID (stolen NEXUS frame) ── */
  const _drawEclipseVoid = (ctx) => {
    const pulse=0.7+Math.sin(animTick*.12)*.3;
    // Dark halo
    const hg=ctx.createRadialGradient(0,0,0,0,0,32);
    hg.addColorStop(0,'rgba(0,0,0,.7)'); hg.addColorStop(.6,'rgba(80,0,80,.2)'); hg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=hg; ctx.beginPath(); ctx.arc(0,0,32,0,Math.PI*2); ctx.fill();
    // Void wings (angular, menacing)
    ctx.fillStyle='#1a001a';
    ctx.beginPath(); ctx.moveTo(6,-2); ctx.lineTo(-2,-26); ctx.lineTo(-14,-24); ctx.lineTo(-18,-8); ctx.lineTo(-8,-2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(6,2); ctx.lineTo(-2,26); ctx.lineTo(-14,24); ctx.lineTo(-18,8); ctx.lineTo(-8,2); ctx.closePath(); ctx.fill();
    // Body
    ctx.fillStyle='#0a0014';
    ctx.beginPath(); ctx.moveTo(20,0); ctx.lineTo(4,-6); ctx.lineTo(-16,-5); ctx.lineTo(-20,0); ctx.lineTo(-16,5); ctx.lineTo(4,6); ctx.closePath(); ctx.fill();
    // Red accent lines
    ctx.strokeStyle=`rgba(255,0,80,${.5*pulse})`; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(12,-4); ctx.lineTo(-10,-4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12,4); ctx.lineTo(-10,4); ctx.stroke();
    ctx.strokeStyle=`rgba(255,0,80,${.3*pulse})`; ctx.lineWidth=.8;
    ctx.beginPath(); ctx.moveTo(20,0); ctx.lineTo(4,-6); ctx.lineTo(-16,-5); ctx.lineTo(-20,0); ctx.lineTo(-16,5); ctx.lineTo(4,6); ctx.closePath(); ctx.stroke();
    // Void eye cockpit
    ctx.fillStyle=`rgba(255,0,80,${.9*pulse})`; ctx.shadowColor='#ff0050'; ctx.shadowBlur=16*pulse;
    ctx.beginPath(); ctx.ellipse(8,0,5,3,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(0,0,0,.8)'; ctx.shadowBlur=0;
    ctx.beginPath(); ctx.ellipse(8,0,2,1.5,0,0,Math.PI*2); ctx.fill();
  };

  return {
    init, resetRunStats, takeDamage, heal, addShield, addCredits, addKill, update, draw,
    get x(){return x;},get y(){return y;},get vx(){return vx;},get vy(){return vy;},
    get hp(){return hp;},get maxHp(){return maxHp;},
    get shield(){return shield;},get maxShield(){return maxShield;},
    get alive(){return alive;},get angle(){return angle;},
    get boostCooldown(){return boostCooldown;},get specialCooldown(){return specialCooldown;},
    get score(){return score;},get kills(){return kills;},get credits(){return credits;},
    get comboMult(){return comboMult;},get comboCount(){return comboCount;},
    get deathTimer(){return deathTimer;},get tookHullDamage(){return tookHullDamage;},
    get shipDef(){return shipDef;},
    set bonusHp(v){bonusHp=v;},set bonusShield(v){bonusShield=v;},
    set bonusSpeed(v){bonusSpeed=v;},set bonusDmgPct(v){bonusDmgPct=v;Weapons.dmgMult=1+v;},
    set bonusCreditsPct(v){bonusCreditsPct=v;},set bonusBoostCooldown(v){bonusBoostCooldown=v;},
    set bonusComboMax(v){bonusComboMax=v;},
  };
})();