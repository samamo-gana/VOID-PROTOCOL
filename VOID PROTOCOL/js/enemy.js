// ═══════════════════════════════════════════════════════════
//  enemy.js — 9 enemy types, FSM AI, attack diversity
// ═══════════════════════════════════════════════════════════
const EnemyMgr = (() => {
  const enemies = [];

  /* ── factory ── */
  const spawn = (type,ex,ey,level) => {
    const base=CONFIG.ENEMIES[type];
    if(!base)return null;
    const lm=1+(level-1)*.16;
    const e={
      type,x:ex,y:ey,vx:0,vy:0,
      hp:Math.round(base.hp*lm), maxHp:Math.round(base.hp*lm),
      speed:base.spd+(level-1)*.08,
      dmg:Math.round(base.dmg*lm), rate:base.rate,
      range:base.range+level*10, score:base.score,
      credits:base.credits, radius:base.size,
      color:base.color, alive:true,
      state:'patrol',alertTimer:0,
      shootTimer:Math.floor(Math.random()*base.rate),
      patrolTarget:null,patrolTimer:Utils.rndI(40,120),
      angle:Math.random()*Math.PI*2, aimAngle:0,
      strafeDir:Math.random()>.5?1:-1, strafeTimer:Utils.rndI(20,60),
      animTick:Math.floor(Math.random()*60), flashTimer:0,
      deathTimer:0, level,
      // type-specific
      shieldHp: type==='SHIELDER'?50+level*10:0,
      shieldMax: type==='SHIELDER'?50+level*10:0,
      shieldRegen: type==='SHIELDER'?0.2:0,
      teleportCooldown:0, teleportCharge:0,
      swarmGroup:null, burstShots:0, burstTimer:0,
      kamikazeTriggered:false,
      organicWave:Math.random()*Math.PI*2,
      orbitAngle:Math.random()*Math.PI*2,
      // elite mini-boss extras
      elite:false,
      phase:1, phaseTimer:0,
      specialTimer:0,
    };
    enemies.push(e);
    return e;
  };

  const spawnElite=(type,ex,ey,level)=>{
    const e=spawn(type,ex,ey,level);
    if(!e)return null;
    e.elite=true;
    e.hp*=3; e.maxHp=e.hp;
    e.dmg=Math.round(e.dmg*1.5);
    e.speed*=1.15; e.radius*=1.4;
    e.score*=5; e.credits*=4;
    e.specialTimer=0;
    return e;
  };

  const clear=()=>{ enemies.length=0; };

  /* ── take damage ── */
  const _damage=(e,dmg,bvx=0,bvy=0)=>{
    if(!e.alive)return;
    if(e.shieldHp>0){
      const abs=Math.min(e.shieldHp,dmg); e.shieldHp-=abs; dmg-=abs;
      Particles.shieldImpact(e.x,e.y,'#0088ff');
      if(dmg<=0)return;
    }
    e.hp-=dmg; e.flashTimer=7;
    e.vx+=bvx*.4; e.vy+=bvy*.4;
    Audio.play('hit_enemy');
    if(e.hp<=0)_kill(e);
  };

  const _kill=(e)=>{
    e.alive=false; e.deathTimer=35;
    const cred=Player.addCredits(e.credits);
    Player.addKill();
    Particles.explosion(e.x,e.y,e.radius*2.5,e.color,e.elite?30:16);
    Audio.play(e.radius>25?'explosion':'enemy_die');
    Camera.shake(e.elite?6:2,e.elite?7:3);
    if(e.elite){
      Audio.play('explosion'); Camera.shake(10,12);
      Particles.bossDeathCascade(e.x,e.y,e.radius*2,e.color);
    }
    Achievements.notify('kill',Player.kills);
  };

  /* ══════════════════════════════════════════
     AI UPDATE
  ══════════════════════════════════════════ */
  const update = (level) => {
    const px=Player.x, py=Player.y;
    for(const e of enemies){
      if(!e.alive){e.deathTimer--;continue;}
      e.animTick++;
      if(e.flashTimer>0)e.flashTimer--;

      const dtp=Utils.dist(e.x,e.y,px,py);
      const los=Physics.hasLOS(e.x,e.y,px,py,[]);  // space — no walls

      // Shield regen
      if(e.shieldHp<e.shieldMax) e.shieldHp=Math.min(e.shieldMax,e.shieldHp+e.shieldRegen);

      // State machine
      _stateTransition(e,dtp,los);
      _stateAction(e,px,py,dtp,los,level);

      // Separation from others
      for(const o of enemies){
        if(o===e||!o.alive)continue;
        const d=Utils.dist(e.x,e.y,o.x,o.y),minD=e.radius+o.radius+2;
        if(d<minD&&d>0){const push=(minD-d)/d*.5;e.vx+=(e.x-o.x)*push;e.vy+=(e.y-o.y)*push;}
      }

      // Velocity + clamp
      e.vx*=.88;e.vy*=.88;
      e.x=Utils.clamp(e.x+e.vx,e.radius,CONFIG.WORLD_W-e.radius);
      e.y=Utils.clamp(e.y+e.vy,e.radius,CONFIG.WORLD_H-e.radius);
    }
    // Prune fully dead
    for(let i=enemies.length-1;i>=0;i--){if(!enemies[i].alive&&enemies[i].deathTimer<=0)enemies.splice(i,1);}
  };

  const _stateTransition=(e,dtp,los)=>{
    switch(e.state){
      case 'patrol':
        if(los&&dtp<e.range){e.state='chase';e.alertTimer=0;}
        break;
      case 'alert':
        e.alertTimer--;
        if(e.alertTimer<=0)e.state='chase';
        if(!los)e.state='patrol';
        break;
      case 'chase':
        if(!los){e.state='search';e.alertTimer=140;}
        if(e.type==='KAMIKAZE'&&!e.kamikazeTriggered&&dtp<200)e.state='kamikaze';
        break;
      case 'search':
        e.alertTimer--;
        if(e.alertTimer<=0)e.state='patrol';
        if(los&&dtp<e.range)e.state='chase';
        break;
      case 'kamikaze':
        // No transition out except death
        break;
      case 'teleport_prep':
        e.teleportCharge++;
        if(e.teleportCharge>=60)_doTeleport(e);
        break;
    }
  };

  const _stateAction=(e,px,py,dtp,los,level)=>{
    switch(e.state){
      case 'patrol':
        _doPatrol(e); break;
      case 'search':
      case 'chase':
        _doChase(e,px,py,dtp);
        if(los)_doShoot(e,px,py,dtp,level);
        break;
      case 'kamikaze':
        _doKamikaze(e,px,py); break;
      case 'teleport_prep':
        // just charge; movement locked
        Particles.spawn({x:e.x+Utils.rndF(-e.radius,e.radius),y:e.y+Utils.rndF(-e.radius,e.radius),
          vx:0,vy:0,color:e.color,size:Utils.rndF(2,5),life:15,glow:true});
        break;
    }

    // Elite special attack
    if(e.elite){
      e.specialTimer--;
      if(e.specialTimer<=0){
        _eliteSpecial(e,px,py,level);
        e.specialTimer=180-level*10;
      }
      // Phase at 50% hp
      if(e.phase===1&&e.hp<e.maxHp*.5){
        e.phase=2; e.speed*=1.3;
        Particles.explosion(e.x,e.y,e.radius*2,e.color,14);
        Camera.shake(5,6);
      }
    }

    // Type-specific passive behaviours
    if(e.type==='TELEPORTER'&&e.state==='chase'){
      e.teleportCooldown--;
      if(e.teleportCooldown<=0&&dtp<e.range*.8&&dtp>120){
        e.state='teleport_prep'; e.teleportCharge=0;
        e.teleportCooldown=300;
      }
    }
    if(e.type==='SWARM'){
      e.orbitAngle+=.03;
      // Orbit player loosely
      if(los&&dtp<e.range){
        const ta=Utils.angTo(e.x,e.y,px,py)+e.orbitAngle*.4;
        e.vx+=Math.cos(ta)*e.speed*.6;
        e.vy+=Math.sin(ta)*e.speed*.6;
      }
    }
    if(e.type==='ORGANIC'){
      e.organicWave+=.04;
      e.vx+=Math.sin(e.organicWave)*.4;
      e.vy+=Math.cos(e.organicWave*.7)*.2;
    }
    if(e.type==='SHIELDER'&&dtp<260){
      // Emit shield bubbles for nearby allies
      for(const o of enemies){
        if(o===e||!o.alive)continue;
        if(Utils.dist(e.x,e.y,o.x,o.y)<180&&o.shieldHp<o.shieldMax){
          o.shieldHp=Math.min(o.shieldMax,o.shieldHp+.5);
        }
      }
    }
  };

  const _doPatrol=(e)=>{
    e.patrolTimer--;
    if(e.patrolTimer<=0||!e.patrolTarget){
      e.patrolTarget={x:Utils.clamp(e.x+Utils.rndF(-300,300),60,CONFIG.WORLD_W-60),
                      y:Utils.clamp(e.y+Utils.rndF(-300,300),60,CONFIG.WORLD_H-60)};
      e.patrolTimer=Utils.rndI(60,180);
    }
    const dx=e.patrolTarget.x-e.x,dy=e.patrolTarget.y-e.y,d=Math.hypot(dx,dy)||1;
    if(d>10){e.vx+=(dx/d)*e.speed*.4;e.vy+=(dy/d)*e.speed*.4;}
    e.angle=Math.atan2(dy,dx);
  };

  const _doChase=(e,px,py,dtp)=>{
    const dx=px-e.x,dy=py-e.y,d=dtp||1;
    const preferred=e.type==='SNIPER_DONE'?520:e.type==='SHIELDER'?200:260;
    const approach=d>preferred?1:.15;
    e.vx+=(dx/d)*e.speed*approach;
    e.vy+=(dy/d)*e.speed*approach;
    // Strafe
    e.strafeTimer--;
    if(e.strafeTimer<=0){e.strafeDir*=-1;e.strafeTimer=Utils.rndI(25,70);}
    e.vx+=(-dy/d)*e.speed*.45*e.strafeDir;
    e.vy+=(dx/d)*e.speed*.45*e.strafeDir;
    e.aimAngle=Math.atan2(dy,dx);
    e.angle=e.aimAngle;
  };

  const _doKamikaze=(e,px,py)=>{
    e.kamikazeTriggered=true;
    const dx=px-e.x,dy=py-e.y,d=Math.hypot(dx,dy)||1;
    e.vx+=(dx/d)*e.speed*2.2;
    e.vy+=(dy/d)*e.speed*2.2;
    e.angle=Math.atan2(dy,dx);
    Particles.thrusterTrail(e.x,e.y,e.angle+Math.PI,'#ff8800');
    // Contact damage
    if(Utils.dist(e.x,e.y,px,py)<CONFIG.PLAYER.RADIUS+e.radius+4){
      Player.takeDamage(e.dmg*2);
      Particles.explosion(e.x,e.y,50,'#ff8800',20);
      _kill(e);
    }
  };

  const _doTeleport=(e)=>{
    const a=Math.random()*Math.PI*2;
    const newX=Utils.clamp(Player.x+Math.cos(a)*Utils.rndF(150,350),60,CONFIG.WORLD_W-60);
    const newY=Utils.clamp(Player.y+Math.sin(a)*Utils.rndF(150,350),60,CONFIG.WORLD_H-60);
    Particles.warpEffect(e.x,e.y,e.color);
    e.x=newX; e.y=newY;
    Particles.warpEffect(e.x,e.y,e.color);
    Audio.play('phase_shift');
    e.state='chase'; e.teleportCharge=0;
  };

  const _doShoot=(e,px,py,dtp,level)=>{
    if(dtp>e.range)return;
    e.shootTimer--;
    if(e.shootTimer>0)return;
    e.shootTimer=e.rate+Utils.rndI(-15,20);

    const spread=e.type==='SNIPER_DONE'?.01:e.type==='ELITE'?.05:.14;
    const baseAngle=Utils.angTo(e.x,e.y,px,py);
    const spd=e.type==='SNIPER_DONE'?18:e.type==='ELITE'?11:7;

    if(e.type==='CRUISER'){
      // Triple spread
      for(let i=-1;i<=1;i++){
        const a=baseAngle+i*.2+Utils.rndF(-spread,spread);
        Weapons.enemyShoot(e.x,e.y,a,e.dmg*.7,spd+2,e.color);
      }
    } else if(e.type==='ORGANIC'){
      // Burst of organic spores
      const n=3;
      for(let i=0;i<n;i++){
        const a=baseAngle+Utils.rndF(-.3,.3);
        Weapons.enemyShoot(e.x,e.y,a,e.dmg*.6,5,'#88ff00');
      }
    } else if(e.type==='SHIELDER'){
      // Single slow heavy bolt
      Weapons.enemyShoot(e.x,e.y,baseAngle,e.dmg*1.4,5,'#0088ff');
    } else {
      const a=baseAngle+Utils.rndF(-spread,spread);
      Weapons.enemyShoot(e.x,e.y,a,e.dmg,spd,e.color);
    }
  };

  const _eliteSpecial=(e,px,py,level)=>{
    const baseAngle=Utils.angTo(e.x,e.y,px,py);
    // Ring burst
    for(let i=0;i<12;i++){
      const a=(i/12)*Math.PI*2;
      Weapons.enemyShoot(e.x,e.y,a,e.dmg*.5,6,e.color);
    }
    // Plus aimed burst
    for(let i=-2;i<=2;i++){
      Weapons.enemyShoot(e.x,e.y,baseAngle+i*.15,e.dmg*.8,9,'#ffffff');
    }
    Audio.play('boss_spawn');
    Camera.shake(4,5);
    Particles.explosion(e.x,e.y,e.radius*3,e.color,16);
  };

  /* ══════════════════════════════════════════
     DRAW
  ══════════════════════════════════════════ */
  const draw=(ctx)=>{
    for(const e of enemies){
      if(!Camera.visible(e.x,e.y,e.radius+30))continue;
      _drawEnemy(ctx,e);
    }
  };

  const _drawEnemy=(ctx,e)=>{
    ctx.save(); ctx.translate(e.x,e.y);
    if(!e.alive){ctx.globalAlpha=Math.max(0,e.deathTimer/35);if(ctx.globalAlpha<=0){ctx.restore();return;}}
    const flash=e.flashTimer>0;
    const t=e.animTick;
    ctx.rotate(e.angle);
    if(!flash){ctx.shadowColor=e.color;ctx.shadowBlur=12;}

    switch(e.type){
      case 'FIGHTER':    _drawFighter(ctx,e,flash,t); break;
      case 'KAMIKAZE':   _drawKamikaze(ctx,e,flash,t); break;
      case 'SNIPER_DONE':_drawSniper(ctx,e,flash,t);  break;
      case 'SHIELDER':   _drawShielder(ctx,e,flash,t);break;
      case 'TELEPORTER': _drawTeleporter(ctx,e,flash,t);break;
      case 'SWARM':      _drawSwarm(ctx,e,flash,t);   break;
      case 'CRUISER':    _drawCruiser(ctx,e,flash,t); break;
      case 'ELITE':      _drawElite(ctx,e,flash,t);   break;
      case 'ORGANIC':    _drawOrganic(ctx,e,flash,t); break;
    }

    ctx.shadowBlur=0;
    _drawHpBar(ctx,e);
    if(e.elite) _drawEliteCrown(ctx,e);
    ctx.restore();
  };

  const _drawFighter=(ctx,e,flash,t)=>{
    const c=flash?'#fff':e.color;
    // Engine glow
    ctx.fillStyle='rgba(255,80,80,.4)';ctx.beginPath();ctx.arc(-e.radius*.7,0,e.radius*.7,0,Math.PI*2);ctx.fill();
    // Body
    ctx.fillStyle=c;
    ctx.beginPath();ctx.moveTo(e.radius,0);ctx.lineTo(-e.radius*.6,-e.radius*.7);ctx.lineTo(-e.radius*.8,0);ctx.lineTo(-e.radius*.6,e.radius*.7);ctx.closePath();ctx.fill();
    // Cockpit
    ctx.fillStyle=flash?'#fff':'rgba(255,150,150,.8)';
    ctx.beginPath();ctx.ellipse(e.radius*.4,0,e.radius*.35,e.radius*.22,0,0,Math.PI*2);ctx.fill();
    // Wing stripe
    ctx.strokeStyle='rgba(255,200,200,.4)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(e.radius*.5,-e.radius*.5);ctx.lineTo(-e.radius*.4,-e.radius*.6);ctx.stroke();
    ctx.beginPath();ctx.moveTo(e.radius*.5,e.radius*.5);ctx.lineTo(-e.radius*.4,e.radius*.6);ctx.stroke();
  };

  const _drawKamikaze=(ctx,e,flash,t)=>{
    const c=flash?'#fff':e.color;
    // Flashing aura
    const p=Math.sin(t*.25)*.4+.6;
    ctx.globalAlpha*=p;
    ctx.fillStyle='rgba(255,140,0,.3)';ctx.beginPath();ctx.arc(0,0,e.radius*1.8,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
    // Jagged body — attack ship
    ctx.fillStyle=c;
    ctx.beginPath();
    for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2,r=e.radius*(i%2===0?.9:.5);
      if(i===0)ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);else ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}
    ctx.closePath();ctx.fill();
    // Trail (if charging)
    if(e.kamikazeTriggered){
      ctx.fillStyle='rgba(255,255,0,.7)';ctx.beginPath();ctx.arc(0,0,e.radius*.4,0,Math.PI*2);ctx.fill();
    }
  };

  const _drawSniper=(ctx,e,flash,t)=>{
    const c=flash?'#fff':e.color;
    // Long barrel
    ctx.fillStyle='#222';ctx.fillRect(e.radius*.4,-2,e.radius*1.2,4);
    ctx.fillStyle=c;
    // Triangular stealth body
    ctx.beginPath();ctx.moveTo(e.radius,0);ctx.lineTo(-e.radius*.6,-e.radius*.6);ctx.lineTo(-e.radius*.4,0);ctx.lineTo(-e.radius*.6,e.radius*.6);ctx.closePath();ctx.fill();
    // Laser sight
    ctx.save();ctx.rotate(-e.angle);
    const ta=Utils.angTo(e.x,e.y,Player.x,Player.y);
    ctx.rotate(ta);
    ctx.strokeStyle='rgba(255,80,80,.15)';ctx.lineWidth=1;ctx.setLineDash([4,8]);
    ctx.beginPath();ctx.moveTo(e.radius*2,0);ctx.lineTo(e.range,0);ctx.stroke();
    ctx.setLineDash([]);ctx.restore();
  };

  const _drawShielder=(ctx,e,flash,t)=>{
    const c=flash?'#fff':e.color;
    // Shield bubble
    const sp=e.shieldHp/e.shieldMax;
    if(sp>0){
      ctx.strokeStyle=`rgba(0,136,255,${sp*.6})`;ctx.lineWidth=3;
      ctx.shadowColor='#0088ff';ctx.shadowBlur=10;
      ctx.beginPath();ctx.arc(0,0,e.radius+10,0,Math.PI*2);ctx.stroke();
      ctx.shadowBlur=0;
    }
    // Turtle-like hexagonal body
    ctx.fillStyle=c;
    ctx.beginPath();for(let i=0;i<6;i++){const a=(i/6)*Math.PI*2;if(i===0)ctx.moveTo(Math.cos(a)*e.radius,Math.sin(a)*e.radius);else ctx.lineTo(Math.cos(a)*e.radius,Math.sin(a)*e.radius);}
    ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.arc(0,0,e.radius*.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(0,100,255,.8)';ctx.beginPath();ctx.arc(0,0,e.radius*.25,0,Math.PI*2);ctx.fill();
  };

  const _drawTeleporter=(ctx,e,flash,t)=>{
    const c=flash?'#fff':e.color;
    const charge=e.state==='teleport_prep'?e.teleportCharge/60:0;
    // Charge ring
    if(charge>0){
      ctx.strokeStyle=c;ctx.lineWidth=2;ctx.globalAlpha=charge;
      ctx.beginPath();ctx.arc(0,0,e.radius*1.6,0,Math.PI*2);ctx.stroke();
      ctx.globalAlpha=1;
    }
    // Rotating body
    ctx.save();ctx.rotate(t*.04);
    ctx.fillStyle=c;
    for(let i=0;i<4;i++){const a=(i/4)*Math.PI*2+t*.04;
      ctx.beginPath();ctx.arc(Math.cos(a)*e.radius*.6,Math.sin(a)*e.radius*.6,e.radius*.4,0,Math.PI*2);ctx.fill();}
    ctx.restore();
    // Core
    ctx.fillStyle=flash?'#fff':'rgba(200,50,255,.9)';
    ctx.beginPath();ctx.arc(0,0,e.radius*.45,0,Math.PI*2);ctx.fill();
  };

  const _drawSwarm=(ctx,e,flash,t)=>{
    const c=flash?'#fff':e.color;
    ctx.fillStyle=c;
    ctx.beginPath();ctx.arc(0,0,e.radius,0,Math.PI*2);ctx.fill();
    // Tiny stingers
    for(let i=0;i<3;i++){const a=(i/3)*Math.PI*2+t*.06;
      ctx.fillStyle=c;ctx.beginPath();ctx.arc(Math.cos(a)*e.radius*.8,Math.sin(a)*e.radius*.8,e.radius*.3,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.arc(0,0,e.radius*.4,0,Math.PI*2);ctx.fill();
  };

  const _drawCruiser=(ctx,e,flash,t)=>{
    const c=flash?'#fff':e.color;
    // Large battleship shape
    ctx.fillStyle=c;
    ctx.beginPath();ctx.moveTo(e.radius,0);ctx.lineTo(e.radius*.3,-e.radius*.7);ctx.lineTo(-e.radius,e.radius*.5);ctx.lineTo(-e.radius,-e.radius*.5);ctx.lineTo(e.radius*.3,e.radius*.7);ctx.closePath();ctx.fill();
    // Armor plates
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(-e.radius*.5,-e.radius*.5,e.radius,e.radius);
    // Turrets
    ctx.fillStyle=c;ctx.fillRect(e.radius*.5,-e.radius*.3,e.radius*.3,e.radius*.2);ctx.fillRect(e.radius*.5,e.radius*.1,e.radius*.3,e.radius*.2);
    // Panel lines
    ctx.strokeStyle='rgba(255,255,255,.15)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(-e.radius*.8,-e.radius*.4);ctx.lineTo(e.radius*.6,-e.radius*.4);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-e.radius*.8,e.radius*.4);ctx.lineTo(e.radius*.6,e.radius*.4);ctx.stroke();
  };

  const _drawElite=(ctx,e,flash,t)=>{
    const c=flash?'#fff':e.color;
    const p=e.phase===2?.8+Math.sin(t*.1)*.2:1;
    ctx.shadowBlur=e.phase===2?20:12;
    // Hexagon body
    ctx.fillStyle=c;ctx.globalAlpha*=p;
    ctx.beginPath();for(let i=0;i<6;i++){const a=(i/6)*Math.PI*2+t*.008;if(i===0)ctx.moveTo(Math.cos(a)*e.radius,Math.sin(a)*e.radius);else ctx.lineTo(Math.cos(a)*e.radius,Math.sin(a)*e.radius);}
    ctx.closePath();ctx.fill();ctx.globalAlpha=1;
    // Inner ring
    ctx.save();ctx.rotate(t*.05*(e.phase===2?2:1));
    ctx.strokeStyle=c;ctx.lineWidth=2;
    for(let i=0;i<6;i++){const a=(i/6)*Math.PI*2;ctx.beginPath();ctx.moveTo(Math.cos(a)*e.radius*.5,Math.sin(a)*e.radius*.5);ctx.lineTo(Math.cos(a)*e.radius*.9,Math.sin(a)*e.radius*.9);ctx.stroke();}
    ctx.restore();
    ctx.fillStyle='rgba(255,255,255,.85)';ctx.beginPath();ctx.arc(0,0,e.radius*.22,0,Math.PI*2);ctx.fill();
  };

  const _drawOrganic=(ctx,e,flash,t)=>{
    const c=flash?'#fff':e.color;
    e.organicWave+=.04;
    const pulse=.85+Math.sin(e.organicWave)*.15;
    // Blob body
    const g=ctx.createRadialGradient(0,0,0,0,0,e.radius*pulse);
    g.addColorStop(0,'rgba(200,255,150,.9)');g.addColorStop(.5,c);g.addColorStop(1,'rgba(0,50,0,.3)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,e.radius*pulse,0,Math.PI*2);ctx.fill();
    // Tendrils
    ctx.strokeStyle=c;ctx.lineWidth=2;
    for(let i=0;i<5;i++){
      const a=(i/5)*Math.PI*2+e.organicWave*.5;
      const wave=Math.sin(e.organicWave*2+i)*8;
      ctx.beginPath();ctx.moveTo(Math.cos(a)*e.radius*.7,Math.sin(a)*e.radius*.7);
      ctx.quadraticCurveTo(Math.cos(a+.3)*(e.radius+10)+wave,Math.sin(a+.3)*(e.radius+10),Math.cos(a)*e.radius*1.6,Math.sin(a)*e.radius*1.6);
      ctx.stroke();
    }
    ctx.fillStyle='rgba(0,0,0,.5)';ctx.beginPath();ctx.arc(0,0,e.radius*.35*pulse,0,Math.PI*2);ctx.fill();
  };

  const _drawHpBar=(ctx,e)=>{
    if(e.hp>=e.maxHp||!e.alive)return;
    ctx.save();ctx.rotate(-e.angle);
    const bw=e.radius*2.4,bh=4,bx=-bw/2,by=-e.radius-12;
    ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(bx,by,bw,bh);
    const pct=e.hp/e.maxHp;
    ctx.fillStyle=pct>.5?'#0f0':pct>.25?'#ff0':'#f00';
    ctx.fillRect(bx,by,bw*pct,bh);
    // Shield bar
    if(e.shieldMax>0){
      const sp=e.shieldHp/e.shieldMax;
      ctx.fillStyle='rgba(0,100,200,.5)';ctx.fillRect(bx,by-6,bw,3);
      ctx.fillStyle='#0088ff';ctx.fillRect(bx,by-6,bw*sp,3);
    }
    ctx.restore();
  };

  const _drawEliteCrown=(ctx,e)=>{
    ctx.save();ctx.rotate(-e.angle);
    const spikes=5;
    ctx.fillStyle='#ffee00';ctx.shadowColor='#ffee00';ctx.shadowBlur=8;
    for(let i=0;i<spikes;i++){
      const a=(i/spikes)*Math.PI*2-Math.PI/2;
      const r=e.radius+14;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a-(Math.PI/spikes)*.5)*e.radius,Math.sin(a-(Math.PI/spikes)*.5)*e.radius);
      ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);
      ctx.lineTo(Math.cos(a+(Math.PI/spikes)*.5)*e.radius,Math.sin(a+(Math.PI/spikes)*.5)*e.radius);
      ctx.fill();
    }
    ctx.shadowBlur=0;ctx.restore();
  };

  const getAlive  = ()=>enemies.filter(e=>e.alive);
  const getCount  = ()=>enemies.filter(e=>e.alive).length;

  return{ spawn,spawnElite,clear,update,draw,getAlive,getCount,enemies };
})();