// ═══════════════════════════════════════════════════════════
//  boss.js — 5 bosses, multi-phase, cinematic reveal
// ═══════════════════════════════════════════════════════════
const BossMgr = (() => {
  let boss = null;
  let introTimer = 0;
  let introDone  = false;

  /* ── create ── */
  const create = (zoneIdx) => {
    const def = CONFIG.BOSSES[Math.min(zoneIdx, CONFIG.BOSSES.length - 1)];
    boss = {
      ...def,
      hp: def.hp, maxHp: def.hp,
      x: CONFIG.WORLD_W / 2, y: 280,
      vx: 0, vy: 0,
      radius: def.size,
      alive: true,
      phase: 1,
      angle: 0, aimAngle: 0,
      orbitAngle: 0,
      shootTimer: 0,
      patternTimer: 120,
      patternCycle: 0,
      flashTimer: 0,
      animTick: 0,
      enraged: false,
      spawnTimer: 200,
      zoneIdx,
      deathTimer: 90,
      shockwaveTimer: 0,
      // per-boss special state
      specialA: 0, specialB: 0,
    };
    introDone = false;
    introTimer = 160;
    Audio.startBossMusic();
    Camera.shake(14, 22);
    UI.showBossBar(def.name, def.phases);
    return boss;
  };

  const clear = () => { boss = null; introDone = false; };
  const get   = () => boss;

  /* ── phase threshold ── */
  const _phase = (b) => {
    const p = b.hp / b.maxHp;
    if (b.phases >= 4) return p > .75 ? 1 : p > .5 ? 2 : p > .25 ? 3 : 4;
    if (b.phases >= 3) return p > .66 ? 1 : p > .33 ? 2 : 3;
    return p > .5 ? 1 : 2;
  };

  /* ════════════════════════════════
     BULLET PATTERNS
  ════════════════════════════════ */
  const _ring = (b, n=12, spd=6, dmgMult=.7) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      Weapons.enemyShoot(b.x, b.y, a, b.dmg * dmgMult, spd, b.color);
    }
  };

  const _spiral = (b, offset=0, n=8, spd=7) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + offset;
      Weapons.enemyShoot(b.x, b.y, a, b.dmg * .6, spd, b.color);
    }
  };

  const _aimed = (b, spread=0, spd=10, dmgMult=1.2) => {
    const a = Utils.angTo(b.x, b.y, Player.x, Player.y);
    Weapons.enemyShoot(b.x, b.y, a + spread, b.dmg * dmgMult, spd, '#ffffff');
  };

  const _burst = (b, shots=5, delay=90) => {
    for (let i = 0; i < shots; i++) {
      setTimeout(() => {
        if (!boss || !boss.alive) return;
        const a = Utils.angTo(b.x, b.y, Player.x, Player.y) + Utils.rndF(-.08, .08);
        Weapons.enemyShoot(b.x, b.y, a, b.dmg, 10, b.color);
      }, i * delay);
    }
  };

  const _spreadFan = (b, n=5, spread=.8, spd=9) => {
    const base = Utils.angTo(b.x, b.y, Player.x, Player.y);
    for (let i = 0; i < n; i++) {
      const a = base + (i - (n - 1) / 2) * (spread / (n - 1));
      Weapons.enemyShoot(b.x, b.y, a, b.dmg * .85, spd, b.color);
    }
  };

  const _homingVolley = (b, n=4) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      Weapons.enemyShoot(b.x, b.y, a, b.dmg * .9, 7, '#ff4400', true);
    }
  };

  const _waveBeam = (b) => {
    // Sweeping laser — many bullets in an arc
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        if (!boss || !boss.alive) return;
        const sweep = b.specialA + (i - 10) * .06;
        Weapons.enemyShoot(b.x, b.y, sweep, b.dmg * .5, 14, '#ffee00');
      }, i * 30);
    }
  };

  /* ════════════════════════════════
     MOVEMENT PATTERNS
  ════════════════════════════════ */
  const _orbit = (b, r=300, spd=.016) => {
    b.orbitAngle += spd * (b.enraged ? 1.7 : 1);
    const tx = Player.x + Math.cos(b.orbitAngle) * r;
    const ty = Player.y + Math.sin(b.orbitAngle) * r;
    const dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy) || 1;
    b.vx += (dx / d) * b.spd * .6;
    b.vy += (dy / d) * b.spd * .6;
  };

  const _charge = (b) => {
    const dx = Player.x - b.x, dy = Player.y - b.y, d = Math.hypot(dx, dy) || 1;
    b.vx = (dx / d) * b.spd * 5;
    b.vy = (dy / d) * b.spd * 5;
  };

  const _retreat = (b) => {
    const dx = b.x - Player.x, dy = b.y - Player.y, d = Math.hypot(dx, dy) || 1;
    b.vx += (dx / d) * b.spd * 1.2;
    b.vy += (dy / d) * b.spd * 1.2;
  };

  /* ════════════════════════════════
     PER-BOSS BEHAVIOUR
  ════════════════════════════════ */
  const _updateBoss0 = (b) => { // RIFT HERALD
    _orbit(b, 280, .018);
    b.patternTimer--;
    if (b.patternTimer <= 0) {
      b.patternTimer = b.enraged ? 55 : 80;
      b.patternCycle++;
      const c = b.patternCycle % 4;
      if (c === 0) _spreadFan(b, 5, .9, 9);
      else if (c === 1) _ring(b, 10, 6);
      else if (c === 2) _burst(b, 4, 110);
      else _aimed(b, 0, 11);
    }
  };

  const _updateBoss1 = (b) => { // VOID LEVIATHAN
    if (b.phase <= 2) _orbit(b, 340, .014);
    else { _orbit(b, 220, .025); }
    b.patternTimer--;
    if (b.patternTimer <= 0) {
      b.patternTimer = b.enraged ? 45 : 65;
      b.patternCycle++;
      const c = b.patternCycle % 5;
      if (c === 0) _ring(b, 14, 7);
      else if (c === 1) _spiral(b, b.patternCycle * .3, 10, 8);
      else if (c === 2) _homingVolley(b, 5);
      else if (c === 3) { _spreadFan(b, 7, 1.1, 10); _aimed(b); }
      else _burst(b, 6, 80);
    }
    if (b.phase === 3 && b.patternCycle % 3 === 0) _ring(b, 8, 5, .5);
  };

  const _updateBoss2 = (b) => { // IRON COLOSSUS
    // Slow but charge attack
    if (b.patternCycle % 8 === 0) _charge(b);
    else _orbit(b, 380, .010);
    b.patternTimer--;
    if (b.patternTimer <= 0) {
      b.patternTimer = b.enraged ? 40 : 60;
      b.patternCycle++;
      const c = b.patternCycle % 6;
      if (c === 0) { _ring(b, 16, 8); _ring(b, 8, 12, .9); } // double ring
      else if (c === 1) _burst(b, 7, 70);
      else if (c === 2) _spreadFan(b, 9, 1.4, 11);
      else if (c === 3) _homingVolley(b, 6);
      else if (c === 4) { b.specialA = Utils.angTo(b.x, b.y, Player.x, Player.y); _waveBeam(b); }
      else _aimed(b, 0, 13, 1.5);
    }
  };

  const _updateBoss3 = (b) => { // NEXUS OVERMIND
    _orbit(b, 300 - b.phase * 30, .020 + b.phase * .004);
    b.patternTimer--;
    if (b.patternTimer <= 0) {
      b.patternTimer = b.enraged ? 32 : 50;
      b.patternCycle++;
      // Rotating spiral pattern
      const offset = b.patternCycle * .25;
      _spiral(b, offset, 12, 8);
      if (b.phase >= 2) _spiral(b, offset + Math.PI, 8, 10);
      if (b.phase >= 3) { _ring(b, 20, 6, .6); _aimed(b, 0, 14); }
      if (b.phase === 4) { _homingVolley(b, 8); _burst(b, 8, 60); }
    }
  };

  const _updateBoss4 = (b) => { // THE RIFT ITSELF
    // All patterns, increasingly chaotic
    _orbit(b, 260, .022 + b.phase * .006);
    if (b.phase >= 3 && b.patternCycle % 6 === 0) _charge(b);
    b.patternTimer--;
    if (b.patternTimer <= 0) {
      b.patternTimer = b.enraged ? 22 : 38;
      b.patternCycle++;
      // All-out assault
      const offset = b.patternCycle * .18;
      _spiral(b, offset, 14, 9);
      _spiral(b, offset + Math.PI * .5, 10, 7);
      if (b.phase >= 2) { _ring(b, 24, 7, .7); _aimed(b, 0, 15, 1.4); }
      if (b.phase >= 3) { _burst(b, 10, 50); _homingVolley(b, 8); _ring(b, 12, 11, .9); }
      if (b.phase === 4) {
        for (let i = 0; i < 3; i++) {
          setTimeout(() => { if (boss && boss.alive) { _ring(b, 16, 8); _aimed(b, 0, 16, 1.8); } }, i * 200);
        }
      }
    }
    // Screen distortion at high phase
    if (b.phase >= 3 && b.animTick % 60 === 0) Camera.shake(3, 4);
  };

  const _bossUpdaters = [_updateBoss0, _updateBoss1, _updateBoss2, _updateBoss3, _updateBoss4];

  /* ════════════════════════════════
     MAIN UPDATE
  ════════════════════════════════ */
  const update = () => {
    if (!boss) return;
    if (!introDone) {
      introTimer--;
      boss.animTick++;
      boss.y = Utils.lerp(boss.y, 320, .025);
      if (introTimer <= 0) introDone = true;
      return;
    }
    if (!boss.alive) {
      boss.deathTimer--;
      if (boss.animTick % 8 === 0) {
        Particles.explosion(
          boss.x + Utils.rndF(-boss.radius, boss.radius),
          boss.y + Utils.rndF(-boss.radius, boss.radius),
          30, boss.color, 12
        );
      }
      return;
    }

    boss.animTick++;
    if (boss.flashTimer > 0) boss.flashTimer--;
    if (boss.shockwaveTimer > 0) boss.shockwaveTimer--;

    // Phase transitions
    const newPhase = _phase(boss);
    if (newPhase > boss.phase) {
      boss.phase = newPhase;
      boss.enraged = true;
      Camera.shake(16, 26);
      Particles.explosion(boss.x, boss.y, boss.radius * 3, boss.color, 30);
      Audio.play('boss_spawn');
      UI.flashScreen('#ffffff', .6, .35);
      UI.showMessage(`⚠ PHASE ${newPhase} ACTIVATED`, 2200, '#ff4444');
    }

    // Enrage at 25%
    if (!boss.enraged && boss.hp < boss.maxHp * .25) {
      boss.enraged = true;
      Camera.shake(12, 18);
      UI.showMessage('⚠ BOSS ENRAGED', 2000, '#ff0000');
    }

    // Spawn minions in later phases
    boss.spawnTimer--;
    if (boss.spawnTimer <= 0 && boss.phase >= 2) {
      boss.spawnTimer = 220 - boss.phase * 35;
      const types = ['FIGHTER', 'SWARM', 'ELITE'];
      const type  = types[Math.min(boss.phase - 1, types.length - 1)];
      for (let i = 0; i < boss.phase; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = boss.radius + 80;
        EnemyMgr.spawn(type, boss.x + Math.cos(a) * r, boss.y + Math.sin(a) * r, boss.zoneIdx + 1);
      }
    }

    // Run boss-specific AI
    const updater = _bossUpdaters[Math.min(boss.zoneIdx, _bossUpdaters.length - 1)];
    if (updater) updater(boss);

    // Speed / friction
    const spd = boss.spd * (boss.enraged ? 1.6 : 1) * (1 + (boss.phase - 1) * .12);
    boss.vx = Utils.clamp(boss.vx * .86, -spd * 5, spd * 5);
    boss.vy = Utils.clamp(boss.vy * .86, -spd * 5, spd * 5);
    boss.x  = Utils.clamp(boss.x + boss.vx, boss.radius + 20, CONFIG.WORLD_W - boss.radius - 20);
    boss.y  = Utils.clamp(boss.y + boss.vy, boss.radius + 20, CONFIG.WORLD_H - boss.radius - 20);
    boss.angle = Utils.angTo(boss.x, boss.y, Player.x, Player.y);

    // Update boss HP bar
    UI.updateBossBar(boss.hp / boss.maxHp);
  };

  /* ── take damage ── */
  const takeDamage = (dmg) => {
    if (!boss || !boss.alive) return;
    boss.hp = Math.max(0, boss.hp - dmg);
    boss.flashTimer = 8;
    Audio.play('hit_enemy');
    if (boss.hp <= 0) _kill();
  };

  const _kill = () => {
    boss.alive = false;
    Player.addCredits(boss.credits * 10);
    Camera.shake(22, 40);
    Audio.play('boss_die');
    Audio.stopMusic();
    Particles.bossDeathCascade(boss.x, boss.y, boss.radius * 2, boss.color);
    UI.hideBossBar();
    Achievements.notify('boss_killed', boss.zoneIdx);
  };

  /* ════════════════════════════════
     DRAW — Ultra-detailed bosses
  ════════════════════════════════ */
  const draw = (ctx) => {
    if (!boss) return;
    _drawBoss(ctx, boss);
  };

  const _drawBoss = (ctx, b) => {
    if (!Camera.visible(b.x, b.y, b.radius + 80)) return;
    ctx.save();
    ctx.translate(b.x, b.y);

    if (!b.alive) {
      ctx.globalAlpha = Math.max(0, b.deathTimer / 90);
      if (ctx.globalAlpha <= 0) { ctx.restore(); return; }
    }

    switch (b.zoneIdx) {
      case 0: _drawHerald(ctx, b);    break;
      case 1: _drawLeviathan(ctx, b); break;
      case 2: _drawColossus(ctx, b);  break;
      case 3: _drawOvermind(ctx, b);  break;
      case 4: _drawRiftItself(ctx, b);break;
      default:_drawHerald(ctx, b);
    }

    ctx.restore();
  };

  /* ── BOSS 0 : RIFT HERALD ── */
  const _drawHerald = (ctx, b) => {
    const t = b.animTick, flash = b.flashTimer > 0, c = flash ? '#fff' : b.color;
    const r = b.radius;
    // Outer aura
    const ag = ctx.createRadialGradient(0,0,r*.5,0,0,r*2.2);
    ag.addColorStop(0, Utils.hexRGBA(b.color, .25)); ag.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(0,0,r*2.2,0,Math.PI*2); ctx.fill();
    // Rotating outer shell
    ctx.save(); ctx.rotate(t*.018);
    ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.shadowColor = c; ctx.shadowBlur = 14;
    for (let i=0;i<8;i++) {
      const a = (i/8)*Math.PI*2;
      ctx.beginPath(); ctx.moveTo(Math.cos(a)*r*.7,Math.sin(a)*r*.7);
      ctx.lineTo(Math.cos(a)*r*1.1,Math.sin(a)*r*1.1); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(0,0,r*1.1,0,Math.PI*2); ctx.stroke();
    ctx.restore();
    // Counter-rotate inner ring
    ctx.save(); ctx.rotate(-t*.025);
    ctx.strokeStyle = Utils.hexRGBA(b.color, .5); ctx.lineWidth = 2;
    for (let i=0;i<6;i++) {
      const a=(i/6)*Math.PI*2;
      ctx.beginPath(); ctx.arc(Math.cos(a)*r*.55,Math.sin(a)*r*.55,8,0,Math.PI*2); ctx.stroke();
    }
    ctx.restore();
    // Main body — star polygon
    ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 20;
    ctx.beginPath();
    for (let i=0;i<10;i++) {
      const a=(i/10)*Math.PI*2+t*.01;
      const rr = i%2===0 ? r : r*.5;
      if (i===0) ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);
      else ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);
    }
    ctx.closePath(); ctx.fill();
    // Core
    ctx.fillStyle='rgba(0,0,0,.7)'; ctx.shadowBlur=0;
    ctx.beginPath(); ctx.arc(0,0,r*.35,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=c; ctx.shadowColor=c; ctx.shadowBlur=18;
    ctx.beginPath(); ctx.arc(0,0,r*.18,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
    _drawPhaseIndicators(ctx, b);
  };

  /* ── BOSS 1 : VOID LEVIATHAN ── */
  const _drawLeviathan = (ctx, b) => {
    const t=b.animTick, flash=b.flashTimer>0, c=flash?'#fff':b.color, r=b.radius;
    // Tentacle extensions
    for (let i=0;i<8;i++) {
      const a=(i/8)*Math.PI*2+t*.008;
      const wave=Math.sin(t*.04+i)*18;
      const len=r*1.8;
      ctx.strokeStyle=Utils.hexRGBA(c,.5); ctx.lineWidth=6;
      ctx.shadowColor=c; ctx.shadowBlur=10;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a)*r*.8,Math.sin(a)*r*.8);
      ctx.quadraticCurveTo(Math.cos(a+.3)*(r+len*.4)+wave, Math.sin(a+.3)*(r+len*.4),
        Math.cos(a)*len, Math.sin(a)*len);
      ctx.stroke(); ctx.shadowBlur=0;
    }
    // Outer pulsing ring
    const pulse=.85+Math.sin(t*.06)*.15;
    const rg=ctx.createRadialGradient(0,0,r*.3,0,0,r*pulse);
    rg.addColorStop(0,Utils.hexRGBA(c,.6)); rg.addColorStop(.6,Utils.hexRGBA(c,.3)); rg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=rg; ctx.beginPath(); ctx.arc(0,0,r*pulse,0,Math.PI*2); ctx.fill();
    // Body
    ctx.fillStyle=c; ctx.shadowColor=c; ctx.shadowBlur=20;
    ctx.beginPath();
    for (let i=0;i<7;i++) {
      const a=(i/7)*Math.PI*2+t*.005;
      const rr=r*(i%2===0?.9:.65);
      if (i===0) ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);
      else ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);
    }
    ctx.closePath(); ctx.fill(); ctx.shadowBlur=0;
    // Eyes (3 eyes)
    for (let i=0;i<3;i++) {
      const ea=(i/3)*Math.PI*2+t*.01;
      const ex=Math.cos(ea)*r*.38, ey=Math.sin(ea)*r*.38;
      ctx.fillStyle='rgba(0,0,0,.9)'; ctx.beginPath(); ctx.arc(ex,ey,r*.1,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=flash?'#fff':'rgba(255,100,200,.9)';
      ctx.shadowColor='#ff00cc'; ctx.shadowBlur=12;
      ctx.beginPath(); ctx.arc(ex,ey,r*.05,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
    }
    _drawPhaseIndicators(ctx, b);
  };

  /* ── BOSS 2 : IRON COLOSSUS ── */
  const _drawColossus = (ctx, b) => {
    const t=b.animTick, flash=b.flashTimer>0, c=flash?'#fff':b.color, r=b.radius;
    // Massive armored frame — multiple rectangles
    const colors=['#443322','#554433','#332211'];
    // Outer hull segments
    for (let i=0;i<4;i++) {
      ctx.save(); ctx.rotate(i*Math.PI*.5);
      ctx.fillStyle=colors[i%colors.length];
      ctx.fillRect(-r*.8,-r*1.1,r*.6,r*.5);
      ctx.fillRect(r*.2,-r*1.1,r*.6,r*.5);
      ctx.strokeStyle=Utils.hexRGBA(c,.4); ctx.lineWidth=2;
      ctx.strokeRect(-r*.8,-r*1.1,r*.6,r*.5);
      ctx.strokeRect(r*.2,-r*1.1,r*.6,r*.5);
      ctx.restore();
    }
    // Main square body
    ctx.fillStyle='#332211'; ctx.strokeStyle=c; ctx.lineWidth=3;
    ctx.shadowColor=c; ctx.shadowBlur=16;
    ctx.fillRect(-r,-r,r*2,r*2);
    // Shading gradient
    const sg=ctx.createLinearGradient(-r,-r,r,r);
    sg.addColorStop(0,'rgba(255,180,80,.12)'); sg.addColorStop(1,'rgba(0,0,0,.25)');
    ctx.fillStyle=sg; ctx.fillRect(-r,-r,r*2,r*2);
    ctx.strokeRect(-r,-r,r*2,r*2); ctx.shadowBlur=0;
    // Cannons
    for (let i=-1;i<=1;i++) {
      ctx.fillStyle=c; ctx.shadowColor=c; ctx.shadowBlur=8;
      ctx.fillRect(r,i*r*.35-5,r*.7,10);
      ctx.fillRect(-r-r*.7,i*r*.35-5,r*.7,10);
      ctx.shadowBlur=0;
    }
    // Panel lines
    ctx.strokeStyle=Utils.hexRGBA(c,.25); ctx.lineWidth=1;
    for (let i=-r+20;i<r;i+=20) { ctx.beginPath();ctx.moveTo(-r,i);ctx.lineTo(r,i);ctx.stroke(); }
    // Reactor core
    const rp=.7+Math.sin(t*.08)*.3;
    ctx.fillStyle=Utils.hexRGBA(c,.9); ctx.shadowColor=c; ctx.shadowBlur=20*rp;
    ctx.beginPath(); ctx.arc(0,0,r*.22,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
    _drawPhaseIndicators(ctx, b);
  };

  /* ── BOSS 3 : NEXUS OVERMIND ── */
  const _drawOvermind = (ctx, b) => {
    const t=b.animTick, flash=b.flashTimer>0, c=flash?'#fff':b.color, r=b.radius;
    // Orbiting nodes
    for (let i=0;i<b.phase+2;i++) {
      const a=(i/(b.phase+2))*Math.PI*2+t*.022;
      const nd=r*1.4;
      const ng=ctx.createRadialGradient(Math.cos(a)*nd,Math.sin(a)*nd,0,Math.cos(a)*nd,Math.sin(a)*nd,14);
      ng.addColorStop(0,'rgba(0,255,255,.9)'); ng.addColorStop(1,'rgba(0,255,255,0)');
      ctx.fillStyle=ng;
      ctx.beginPath(); ctx.arc(Math.cos(a)*nd,Math.sin(a)*nd,14,0,Math.PI*2); ctx.fill();
      // Connection line
      ctx.strokeStyle=Utils.hexRGBA(c,.3); ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*nd,Math.sin(a)*nd); ctx.stroke();
    }
    // Outer rotating ring
    ctx.save(); ctx.rotate(t*.012);
    ctx.strokeStyle=c; ctx.lineWidth=3; ctx.shadowColor=c; ctx.shadowBlur=12;
    ctx.beginPath();
    for (let i=0;i<12;i++) {
      const a=(i/12)*Math.PI*2;
      if(i===0)ctx.moveTo(Math.cos(a)*r*1.1,Math.sin(a)*r*1.1);
      else ctx.lineTo(Math.cos(a)*r*1.1,Math.sin(a)*r*1.1);
    }
    ctx.closePath(); ctx.stroke(); ctx.shadowBlur=0; ctx.restore();
    // Counter ring
    ctx.save(); ctx.rotate(-t*.018);
    ctx.strokeStyle=Utils.hexRGBA(c,.45); ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(0,0,r*.85,0,Math.PI*2); ctx.stroke(); ctx.restore();
    // Core sphere
    const cg=ctx.createRadialGradient(-r*.25,-r*.25,0,0,0,r*.7);
    cg.addColorStop(0,'rgba(200,255,255,.8)');
    cg.addColorStop(.4,c);
    cg.addColorStop(1,'rgba(0,0,0,.8)');
    ctx.fillStyle=cg; ctx.shadowColor=c; ctx.shadowBlur=22;
    ctx.beginPath(); ctx.arc(0,0,r*.7,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
    // Eye network
    const ep=.7+Math.sin(t*.1)*.3;
    ctx.fillStyle=Utils.hexRGBA('#ffffff',ep);
    ctx.shadowColor='#fff'; ctx.shadowBlur=16*ep;
    ctx.beginPath(); ctx.arc(0,0,r*.22,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(0,0,0,.8)'; ctx.shadowBlur=0;
    ctx.beginPath(); ctx.arc(r*.06,0,r*.12,0,Math.PI*2); ctx.fill();
    _drawPhaseIndicators(ctx, b);
  };

  /* ── BOSS 4 : THE RIFT ITSELF ── */
  const _drawRiftItself = (ctx, b) => {
    const t=b.animTick, flash=b.flashTimer>0, c=flash?'#fff':b.color, r=b.radius;
    const phase=b.phase;

    // Void distortion field
    for (let layer=0;layer<3;layer++) {
      const lr=r*(1.5+layer*.4);
      const ap=(.15-layer*.04)*(1+Math.sin(t*.05+layer)*.3);
      ctx.strokeStyle=`rgba(255,255,255,${ap})`; ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(0,0,lr,0,Math.PI*2); ctx.stroke();
    }
    // Rift tendrils
    const nTend=8+phase*3;
    for (let i=0;i<nTend;i++) {
      const a=(i/nTend)*Math.PI*2+t*.006;
      const wave=Math.sin(t*.04+i)*r*.25;
      const len=r*(1.8+Math.sin(t*.03+i)*.4);
      ctx.strokeStyle=Utils.hexRGBA(c,.4+Math.sin(t*.05+i)*.2); ctx.lineWidth=3;
      ctx.shadowColor=c; ctx.shadowBlur=8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a)*r*.6,Math.sin(a)*r*.6);
      ctx.quadraticCurveTo(Math.cos(a+.5)*(r+wave),Math.sin(a+.5)*(r+wave),Math.cos(a)*len,Math.sin(a)*len);
      ctx.stroke(); ctx.shadowBlur=0;
    }
    // Core — animated tear
    ctx.save(); ctx.rotate(t*.008);
    const tearPulse=.8+Math.sin(t*.07)*.2;
    const tg=ctx.createRadialGradient(0,0,0,0,0,r*tearPulse);
    tg.addColorStop(0,'rgba(255,255,255,.95)');
    tg.addColorStop(.15,Utils.hexRGBA(c,.9));
    tg.addColorStop(.5,Utils.hexRGBA(c,.5));
    tg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=tg;
    // Irregular star shape
    ctx.beginPath();
    for (let i=0;i<16;i++) {
      const a=(i/16)*Math.PI*2;
      const rr=r*(i%2===0?tearPulse:.4+Math.sin(t*.05+i)*.1);
      if (i===0) ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);
      else ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);
    }
    ctx.closePath(); ctx.fill(); ctx.restore();
    // Void center
    ctx.fillStyle='rgba(0,0,0,.95)';
    ctx.beginPath(); ctx.arc(0,0,r*.28,0,Math.PI*2); ctx.fill();
    // Singularity dot
    const sp=.5+Math.sin(t*.15)*.5;
    ctx.fillStyle=`rgba(255,255,255,${sp})`; ctx.shadowColor='#fff'; ctx.shadowBlur=30*sp;
    ctx.beginPath(); ctx.arc(0,0,r*.1,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
    // Phase rings
    if (phase>=2) {
      ctx.save(); ctx.rotate(-t*.03);
      ctx.strokeStyle=Utils.hexRGBA(c,.3); ctx.lineWidth=2;
      for (let i=0;i<phase;i++) {
        ctx.beginPath(); ctx.arc(0,0,r*(1.2+i*.15),0,Math.PI*2); ctx.stroke();
      }
      ctx.restore();
    }
    _drawPhaseIndicators(ctx, b);
  };

  /* ── phase dots (shared) ── */
  const _drawPhaseIndicators = (ctx, b) => {
    if (!b.phases || b.phases <= 1) return;
    for (let i=0;i<b.phases;i++) {
      const a=(i/b.phases)*Math.PI*2-Math.PI/2;
      const r=b.radius+22;
      ctx.fillStyle = i < b.phase ? b.color : 'rgba(255,255,255,.15)';
      ctx.shadowColor = b.color; ctx.shadowBlur = i < b.phase ? 8 : 0;
      ctx.beginPath(); ctx.arc(Math.cos(a)*r,Math.sin(a)*r,5,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=0;
    }
  };

  return {
    create, clear, get, update, draw, takeDamage,
    get alive() { return !!boss && boss.alive; },
    get introDone() { return introDone; },
    get phase()  { return boss ? boss.phase : 0; },
    get hp()     { return boss ? boss.hp : 0; },
    get maxHp()  { return boss ? boss.maxHp : 0; },
    get name()   { return boss ? boss.name : ''; },
  };
})();