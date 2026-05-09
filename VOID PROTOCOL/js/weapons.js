// ═══════════════════════════════════════════════════════════
//  weapons.js — 6-weapon system, heat, charging, bullet pool
// ═══════════════════════════════════════════════════════════
const Weapons = (() => {

  const bullets      = [];
  const enemyBullets = [];
  const MAX = 600;

  /* ── state ── */
  let currentWpn   = 0;
  let heat         = 0;
  let overheated   = false;
  let overheatTimer= 0;
  let cooldown     = 0;
  let chargeTimer  = 0;
  let charging     = false;
  let unlockedSet  = new Set([0]);
  const ammo       = CONFIG.WEAPONS.map(w=>w.ammo);
  const maxAmmo    = CONFIG.WEAPONS.map(w=>w.maxAmmo);
  let dmgMult      = 1.0;   // from skill tree
  let heatMult     = 1.0;   // from skill tree (lower = less heat)

  const reset = () => {
    bullets.length=0; enemyBullets.length=0;
    heat=0; overheated=false; overheatTimer=0; cooldown=0;
    chargeTimer=0; charging=false;
    currentWpn=0; unlockedSet=new Set([0]);
    CONFIG.WEAPONS.forEach((w,i)=>{ammo[i]=w.ammo;});
    dmgMult=1.0; heatMult=1.0;
  };

  const unlock = (id) => {
    unlockedSet.add(id);
    ammo[id]=CONFIG.WEAPONS[id].ammo;
  };

  const switchTo = (id) => {
    if (!unlockedSet.has(id)) return false;
    if (id===currentWpn) return true;
    currentWpn=id; chargeTimer=0; charging=false;
    Audio.play('menu_select');
    return true;
  };

  const refillAmmo = (id=-1) => {
    if (id<0) { CONFIG.WEAPONS.forEach((w,i)=>{ if(w.ammo>0)ammo[i]=w.maxAmmo; }); }
    else ammo[id]=maxAmmo[id];
  };

  /* ── spawn bullet ── */
  const _spawnBullet = (arr, opts) => {
    if (arr.length>=MAX) arr.shift();
    arr.push({
      x:opts.x,y:opts.y,vx:opts.vx,vy:opts.vy,
      dmg:opts.dmg, color:opts.color||'#0ff',
      life:opts.life||80, maxLife:opts.life||80,
      r:opts.r||4, piercing:opts.piercing||false,
      aoe:opts.aoe||0, homing:opts.homing||false,
      homingTarget:null, chargeScale:opts.chargeScale||1,
      alive:true, trail:opts.trail||false,
    });
  };

  /* ── player shoot ── */
  const shoot = (px,py,angle,enemies,boss) => {
    if (overheated||cooldown>0) return;
    const w = CONFIG.WEAPONS[currentWpn];
    if (ammo[currentWpn]===0) { Audio.play('transmit'); return; }

    // Charged cannon special
    if (w.charged) {
      charging=true;
      chargeTimer=Math.min(chargeTimer+1, w.chargeDuration||90);
      if (chargeTimer<(w.chargeDuration||90)) {
        // Build audio + particles
        if (chargeTimer%8===0) Audio.play('charge_build');
        Particles.spawn({x:px,y:py,vx:Utils.rndF(-1.5,1.5),vy:Utils.rndF(-1.5,1.5),
          color:w.color,size:Utils.rndF(2,5),life:12,glow:true});
        return;
      }
      // Release
      charging=false;
      const scale=1.5;
      _fireShot(px,py,angle,w,scale);
      chargeTimer=0;
      return;
    }

    charging=false; chargeTimer=0;
    _fireShot(px,py,angle,w,1.0);
  };

  const releaseCharge = (px,py,angle) => {
    if (!charging||chargeTimer<5) { charging=false; chargeTimer=0; return; }
    const w=CONFIG.WEAPONS[currentWpn];
    const scale=0.5+chargeTimer/(w.chargeDuration||90);
    _fireShot(px,py,angle,w,scale);
    charging=false; chargeTimer=0;
  };

  const _fireShot = (px,py,angle,w,chargeScale=1.0) => {
    cooldown=w.rate;
    const h=w.heat*heatMult*chargeScale;
    heat=Math.min(CONFIG.MAX_HEAT, heat+h);
    if (heat>=CONFIG.MAX_HEAT) { overheated=true; overheatTimer=CONFIG.OVERHEAT_COOL; }
    if (ammo[currentWpn]>0) ammo[currentWpn]--;

    const baseDmg = w.dmg*dmgMult*chargeScale;
    const ox=Math.cos(angle)*20, oy=Math.sin(angle)*20;
    const bx=px+ox, by=py+oy;

    const pellets=w.burst||1;
    for (let p=0;p<pellets;p++) {
      const sp=p===0&&pellets===1?0:(Math.random()-.5)*2;
      const a=angle+w.spread*(p-pellets/2+.5)+(sp*w.spread*.5);
      const vx=Math.cos(a)*w.spd, vy=Math.sin(a)*w.spd;

      _spawnBullet(bullets,{
        x:bx,y:by,vx,vy,
        dmg:baseDmg/pellets,
        color:w.color,
        life:pellets>1?55:90,
        r:pellets>1?3:w.id===3?6:4,
        piercing:w.piercing||false,
        aoe:w.aoe||0,
        homing:w.homing||false,
        chargeScale,
        trail:w.id>=3,
      });
    }

    // SFX
    const sfxMap=['shoot_laser','shoot_plasma','shoot_shotgun','shoot_missile','shoot_rail','shoot_charge'];
    Audio.play(sfxMap[w.id]||'shoot_laser');
    Particles.muzzleFlash(bx,by,angle,w.color);
    if (w.id===4) Camera.shake(6,8);
    else if (w.id===5) Camera.shake(4,6);
    else Camera.shake(1,2);
  };

  /* ── enemy shoot ── */
  const enemyShoot = (ex,ey,angle,dmg,spd=7,col='#f44',homing=false) => {
    _spawnBullet(enemyBullets,{
      x:ex,y:ey,
      vx:Math.cos(angle)*spd,vy:Math.sin(angle)*spd,
      dmg,color:col,life:100,r:4,homing
    });
  };

  /* ── AoE explosion ── */
  const applyAoE = (cx,cy,radius,dmg,enemies,boss) => {
    Particles.explosion(cx,cy,radius,'#ff6600',24);
    Audio.play('explosion');
    Camera.shake(8,10);
    for (const e of enemies) {
      if (!e.alive) continue;
      const d=Utils.dist(cx,cy,e.x,e.y);
      if (d<radius+e.radius) {
        const f=1-(d/(radius+e.radius));
        e.takeDamage(Math.ceil(dmg*f));
      }
    }
    if (boss&&boss.alive) {
      const d=Utils.dist(cx,cy,boss.x,boss.y);
      if (d<radius+boss.radius) boss.takeDamage(Math.ceil(dmg*.5));
    }
  };

  /* ── main update ── */
  const update = (walls,enemies,boss,player) => {
    // Heat decay
    if (!overheated) {
      heat=Math.max(0,heat-CONFIG.HEAT_DECAY);
    } else {
      overheatTimer--;
      if (overheatTimer<=0) { overheated=false; heat=0; }
    }
    if (cooldown>0) cooldown--;

    // Player bullets
    for (let i=bullets.length-1;i>=0;i--) {
      const b=bullets[i];
      // Homing update
      if (b.homing) {
        let target=null;
        let minD=Infinity;
        for(const e of enemies){if(!e.alive)continue;const d=Utils.dist(b.x,b.y,e.x,e.y);if(d<minD){minD=d;target=e;}}
        if(boss&&boss.alive){const d=Utils.dist(b.x,b.y,boss.x,boss.y);if(d<minD)target=boss;}
        if(target){
          const a=Utils.angTo(b.x,b.y,target.x,target.y);
          const ta=Math.atan2(b.vy,b.vx);
          let diff=a-ta; while(diff>Math.PI)diff-=Math.PI*2; while(diff<-Math.PI)diff+=Math.PI*2;
          const turn=Utils.clamp(diff,.14,-.14);
          const spd=Math.hypot(b.vx,b.vy);
          const na=ta+Utils.clamp(diff,-.14,.14);
          b.vx=Math.cos(na)*spd; b.vy=Math.sin(na)*spd;
        }
        Particles.homingTrail(b.x,b.y);
      }
      b.x+=b.vx; b.y+=b.vy; b.life--;

      // Wall / OOB
      if (b.life<=0||b.x<0||b.x>CONFIG.WORLD_W||b.y<0||b.y>CONFIG.WORLD_H) {
        if(b.aoe>0) applyAoE(b.x,b.y,b.aoe,b.dmg,enemies,boss);
        else Particles.sparks(b.x,b.y,4,b.color);
        bullets.splice(i,1); continue;
      }

      // Railgun streak
      if (b.r>=6&&b.life===b.maxLife-2) Particles.railStreak(b.x-b.vx*6,b.y-b.vy*6,b.x,b.y,b.color);

      // Trail
      if (b.trail&&b.life%2===0) Particles.spawn({x:b.x,y:b.y,vx:0,vy:0,color:b.color,size:2,life:8,glow:true,alpha:.5,alphaDecay:.08});

      // Enemy hit
      let hit=false;
      for (let j=enemies.length-1;j>=0;j--) {
        const e=enemies[j];
        if (!e.alive) continue;
        if (Utils.circleCircle(b.x,b.y,b.r,e.x,e.y,e.radius)) {
          if(b.aoe>0){applyAoE(b.x,b.y,b.aoe,b.dmg,enemies,boss);bullets.splice(i,1);hit=true;break;}
          e.takeDamage?.(damage);
          UI.showDmgNumber(b.x,b.y,Math.round(b.dmg),b.color);
          if (!b.piercing){bullets.splice(i,1);hit=true;break;}
        }
      }
      if (hit) continue;

      // Boss hit
      if (boss&&boss.alive) {
        if (Utils.circleCircle(b.x,b.y,b.r,boss.x,boss.y,boss.radius)) {
          if(b.aoe>0) applyAoE(b.x,b.y,b.aoe,b.dmg,enemies,boss);
          else boss.takeDamage(b.dmg);
          UI.showDmgNumber(b.x,b.y,Math.round(b.dmg),b.color);
          bullets.splice(i,1);
        }
      }
    }

    // Enemy bullets → player
    for (let i=enemyBullets.length-1;i>=0;i--) {
      const b=enemyBullets[i];
      b.x+=b.vx; b.y+=b.vy; b.life--;
      if (b.life<=0||b.x<0||b.x>CONFIG.WORLD_W||b.y<0||b.y>CONFIG.WORLD_H) {
        enemyBullets.splice(i,1); continue;
      }
      if (Utils.circleCircle(b.x,b.y,b.r,player.x,player.y,CONFIG.PLAYER.RADIUS)) {
        player.takeDamage(b.dmg);
        Particles.sparks(player.x,player.y,8,'#ff2244');
        enemyBullets.splice(i,1);
      }
    }
  };

  const drawBullets = (ctx) => {
    const all=[...bullets,...enemyBullets];
    for (const b of all) {
      if (!Camera.visible(b.x,b.y,12)) continue;
      const lr=b.life/b.maxLife;
      ctx.save();
      ctx.globalAlpha=Utils.clamp(lr*1.5,0.3,1);
      // Trail line
      ctx.strokeStyle=b.color+'88';
      ctx.lineWidth=b.r*.7;
      ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-b.vx*4,b.y-b.vy*4);ctx.stroke();
      // Core glow
      ctx.shadowColor=b.color; ctx.shadowBlur=b.r*(2+b.chargeScale);
      ctx.fillStyle=b.color;
      const dispR=b.r*Utils.clamp(b.chargeScale,.8,2.5);
      ctx.beginPath();ctx.arc(b.x,b.y,dispR,0,Math.PI*2);ctx.fill();
      // White hot core
      ctx.shadowBlur=0;ctx.fillStyle='rgba(255,255,255,.7)';
      ctx.beginPath();ctx.arc(b.x,b.y,dispR*.35,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
  };

  const clearBullets = () => { bullets.length=0; enemyBullets.length=0; };

  return {
    shoot, releaseCharge, enemyShoot, applyAoE,
    update, drawBullets, clearBullets, reset, unlock, switchTo, refillAmmo,
    get currentWpn(){return currentWpn;},
    get heat(){return heat;},
    get overheated(){return overheated;},
    get charging(){return charging;},
    get chargeTimer(){return chargeTimer;},
    get ammo(){return ammo;},
    get maxAmmo(){return maxAmmo;},
    get unlockedSet(){return unlockedSet;},
    set dmgMult(v){dmgMult=v;},
    set heatMult(v){heatMult=v;},
    bullets, enemyBullets,
  };
})();