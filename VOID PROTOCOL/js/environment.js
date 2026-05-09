// ═══════════════════════════════════════════════════════════
//  environment.js — Procedural space environments
//  Asteroids · Nebulae · Stations · Wreckage · Planets · Black Holes · Rift
// ═══════════════════════════════════════════════════════════
const Environment = (() => {

  /* ── shared state ── */
  let stars     = [];   // parallax star layers
  let objects   = [];   // interactive/decorative world objects
  let bgObjects = [];   // purely visual distant bg elements
  let currentZone = 0;
  let worldTick   = 0;

  /* ══════════════════════════════════════════
     STAR FIELD — three parallax layers
  ══════════════════════════════════════════ */
  const buildStars = () => {
    stars = [];
    // Layer 0 — very distant, barely moves
    for (let i=0;i<220;i++) stars.push({
      x:Math.random()*CONFIG.WORLD_W, y:Math.random()*CONFIG.WORLD_H,
      r:Utils.rndF(0.4,1.2), layer:0, twinkle:Math.random()*Math.PI*2,
      color:Utils.rndPick(['#ffffff','#cce0ff','#ffd0a0','#d0d0ff'])
    });
    // Layer 1 — mid-distance
    for (let i=0;i<120;i++) stars.push({
      x:Math.random()*CONFIG.WORLD_W, y:Math.random()*CONFIG.WORLD_H,
      r:Utils.rndF(1.0,2.2), layer:1, twinkle:Math.random()*Math.PI*2,
      color:Utils.rndPick(['#ffffff','#aac8ff','#ffeecc'])
    });
    // Layer 2 — close bright stars
    for (let i=0;i<40;i++) stars.push({
      x:Math.random()*CONFIG.WORLD_W, y:Math.random()*CONFIG.WORLD_H,
      r:Utils.rndF(1.8,3.5), layer:2, twinkle:Math.random()*Math.PI*2,
      color:Utils.rndPick(['#ffffff','#88ccff','#ffcc88'])
    });
  };

  /* ══════════════════════════════════════════
     ZONE-SPECIFIC GENERATION
  ══════════════════════════════════════════ */
  const load = (zoneIdx) => {
    currentZone = zoneIdx;
    worldTick   = 0;
    objects     = [];
    bgObjects   = [];
    buildStars();

    const builders = [
      buildAsteroidField,
      buildNebula,
      buildAbandonedStation,
      buildDestroyedFleet,
      buildAlienPlanet,
      buildBlackHole,
      buildRiftCore,
    ];
    const fn = builders[Math.min(zoneIdx, builders.length-1)];
    fn();
  };

  /* ── ZONE 0 : ASTEROID FIELD ── */
  const buildAsteroidField = () => {
    bgObjects.push({type:'nebula_bg',x:CONFIG.WORLD_W*.5,y:CONFIG.WORLD_H*.4,
      radius:1800,color:'rgba(30,40,100,',alpha:.12});

    // Asteroid clusters
    for (let c=0;c<8;c++) {
      const cx=100+Math.random()*(CONFIG.WORLD_W-200);
      const cy=100+Math.random()*(CONFIG.WORLD_H-200);
      const count=Utils.rndI(4,14);
      for (let i=0;i<count;i++) {
        const r=Utils.rndF(18,80);
        objects.push({
          type:'asteroid', x:cx+Utils.rndF(-200,200), y:cy+Utils.rndF(-200,200),
          r, spin:Utils.rndF(-0.008,0.008), angle:Math.random()*Math.PI*2,
          color:Utils.rndPick(['#556677','#667788','#445566','#778899','#6B5A4E']),
          craters:_genCraters(r), detail:_genAsteroidDetail(r),
          vx:Utils.rndF(-0.15,0.15), vy:Utils.rndF(-0.15,0.15),
          glow:false,
        });
      }
    }
    // Distant giant asteroids (bg)
    for (let i=0;i<12;i++) {
      bgObjects.push({type:'bg_asteroid',
        x:Math.random()*CONFIG.WORLD_W, y:Math.random()*CONFIG.WORLD_H,
        r:Utils.rndF(100,300), angle:Math.random()*Math.PI*2,
        spin:Utils.rndF(-0.001,0.001),
        color:Utils.rndPick(['#222','#333','#2a2a2a']),
        alpha:Utils.rndF(0.25,0.55)
      });
    }
  };

  const _genCraters = (r) => {
    const c=[];
    for (let i=0;i<Utils.rndI(2,6);i++) {
      const a=Math.random()*Math.PI*2, d=Math.random()*(r*.7);
      c.push({dx:Math.cos(a)*d,dy:Math.sin(a)*d,r:Utils.rndF(r*.1,r*.3)});
    }
    return c;
  };

  const _genAsteroidDetail = (r) => {
    const pts=[];
    const n=Utils.rndI(7,14);
    for (let i=0;i<n;i++) {
      const a=(i/n)*Math.PI*2;
      const dist=r*(0.65+Math.random()*0.45);
      pts.push({x:Math.cos(a)*dist, y:Math.sin(a)*dist});
    }
    return pts;
  };

  /* ── ZONE 1 : NEBULA CROSSING ── */
  const buildNebula = () => {
    const nebulaColors = [
      'rgba(120,0,180,', 'rgba(0,80,200,', 'rgba(180,0,80,',
      'rgba(0,160,120,', 'rgba(80,0,160,'
    ];
    for (let i=0;i<18;i++) {
      bgObjects.push({type:'nebula_cloud',
        x:Math.random()*CONFIG.WORLD_W, y:Math.random()*CONFIG.WORLD_H,
        radius:Utils.rndF(200,700),
        color:Utils.rndPick(nebulaColors),
        alpha:Utils.rndF(0.04,0.14),
        pulse:Math.random()*Math.PI*2,
        driftX:Utils.rndF(-.04,.04), driftY:Utils.rndF(-.04,.04)
      });
    }
    // Gas tendrils
    for (let i=0;i<30;i++) {
      bgObjects.push({type:'nebula_tendril',
        x:Math.random()*CONFIG.WORLD_W, y:Math.random()*CONFIG.WORLD_H,
        len:Utils.rndF(100,500), angle:Math.random()*Math.PI*2,
        width:Utils.rndF(8,40),
        color:Utils.rndPick(nebulaColors),
        alpha:Utils.rndF(0.03,0.09)
      });
    }
    // Floating crystals
    for (let i=0;i<20;i++) {
      objects.push({type:'crystal',
        x:Math.random()*CONFIG.WORLD_W, y:Math.random()*CONFIG.WORLD_H,
        r:Utils.rndF(8,24), angle:Math.random()*Math.PI*2,
        spin:Utils.rndF(-0.012,0.012),
        color:Utils.rndPick(['#cc44ff','#8800ff','#0088ff','#00ffcc']),
        glow:true, glowColor:Utils.rndPick(['#cc44ff','#0088ff'])
      });
    }
  };

  /* ── ZONE 2 : ABANDONED STATION ── */
  const buildAbandonedStation = () => {
    bgObjects.push({type:'nebula_bg',x:CONFIG.WORLD_W*.4,y:CONFIG.WORLD_H*.5,
      radius:2000,color:'rgba(0,60,20,',alpha:.1});

    // Main station hull (decorative mega-object)
    bgObjects.push({type:'station_hull',
      x:CONFIG.WORLD_W/2, y:CONFIG.WORLD_H/2,
      w:800, h:400, angle:0.15,
      color:'#1a2a1a', edgeColor:'rgba(0,200,80,.25)'
    });

    // Station modules
    for (let i=0;i<6;i++) {
      const a=(i/6)*Math.PI*2;
      const d=Utils.rndF(250,450);
      objects.push({type:'station_module',
        x:CONFIG.WORLD_W/2+Math.cos(a)*d, y:CONFIG.WORLD_H/2+Math.sin(a)*d,
        w:Utils.rndI(60,140), h:Utils.rndI(40,90),
        angle:a, color:'#1a2518',
        edgeColor:'rgba(0,180,60,.3)',
        blinkPhase:Math.random()*Math.PI*2,
        damaged:Math.random()<0.5
      });
    }
    // Debris field
    for (let i=0;i<40;i++) {
      objects.push({type:'debris',
        x:Math.random()*CONFIG.WORLD_W, y:Math.random()*CONFIG.WORLD_H,
        r:Utils.rndF(5,30), angle:Math.random()*Math.PI*2,
        spin:Utils.rndF(-0.02,0.02),
        color:Utils.rndPick(['#2a3a2a','#1a2a1a','#334433']),
        vx:Utils.rndF(-0.08,0.08), vy:Utils.rndF(-0.08,0.08)
      });
    }
  };

  /* ── ZONE 3 : DESTROYED FLEET ── */
  const buildDestroyedFleet = () => {
    bgObjects.push({type:'nebula_bg',x:CONFIG.WORLD_W*.6,y:CONFIG.WORLD_H*.4,
      radius:2200,color:'rgba(120,30,0,',alpha:.12});

    // Wrecked capital ships
    const shipTypes=['destroyer','cruiser','carrier'];
    for (let i=0;i<7;i++) {
      const t=Utils.rndPick(shipTypes);
      const scale = t==='carrier'?2.8 : t==='cruiser'?2.0 : 1.4;
      objects.push({type:'wreck',
        x:100+Math.random()*(CONFIG.WORLD_W-200),
        y:100+Math.random()*(CONFIG.WORLD_H-200),
        shipType:t, scale, angle:Math.random()*Math.PI*2,
        color:Utils.rndPick(['#332211','#442211','#331111','#223322']),
        edgeColor:Utils.rndPick(['rgba(255,80,0,.2)','rgba(255,120,0,.15)','rgba(180,50,0,.2)']),
        fire:Math.random()<0.6,
        firePhase:Math.random()*Math.PI*2,
      });
    }
    // Floating debris + hull fragments
    for (let i=0;i<60;i++) {
      objects.push({type:'hull_fragment',
        x:Math.random()*CONFIG.WORLD_W, y:Math.random()*CONFIG.WORLD_H,
        r:Utils.rndF(6,35), angle:Math.random()*Math.PI*2,
        spin:Utils.rndF(-0.015,0.015),
        color:Utils.rndPick(['#332200','#443311','#221100']),
        vx:Utils.rndF(-0.12,0.12), vy:Utils.rndF(-0.12,0.12)
      });
    }
  };

  /* ── ZONE 4 : ALIEN PLANET RING ── */
  const buildAlienPlanet = () => {
    // Background giant planet
    bgObjects.push({type:'planet_bg',
      x:CONFIG.WORLD_W*.75, y:CONFIG.WORLD_H*.3,
      r:900, color1:'rgba(0,80,120,1)', color2:'rgba(0,40,80,1)',
      ringColor:'rgba(0,180,255,.15)', hasRing:true,
      cloudPhase:0
    });
    bgObjects.push({type:'planet_bg',
      x:CONFIG.WORLD_W*.1, y:CONFIG.WORLD_H*.85,
      r:400, color1:'rgba(80,0,60,1)', color2:'rgba(40,0,40,1)',
      ringColor:null, hasRing:false, cloudPhase:0.5
    });

    // Orbital debris ring
    for (let i=0;i<80;i++) {
      const a=(i/80)*Math.PI*2+Utils.rndF(-0.05,0.05);
      const orbitR=Utils.rndF(1200,1600);
      const cx=CONFIG.WORLD_W*.75, cy=CONFIG.WORLD_H*.3;
      objects.push({type:'ring_debris',
        x:cx+Math.cos(a)*orbitR, y:cy+Math.sin(a)*orbitR*.35,  // elliptical
        orbitCenter:{x:cx,y:cy}, orbitR, orbitAngle:a, orbitSpeed:Utils.rndF(.0002,.0006),
        r:Utils.rndF(3,18), angle:Math.random()*Math.PI*2, spin:Utils.rndF(-0.02,.02),
        color:Utils.rndPick(['#334455','#4455667','#556677','#223344'])
      });
    }

    // Alien organisms floating in space
    for (let i=0;i<15;i++) {
      objects.push({type:'organic_floater',
        x:Math.random()*CONFIG.WORLD_W, y:Math.random()*CONFIG.WORLD_H,
        r:Utils.rndF(20,55), angle:Math.random()*Math.PI*2,
        spin:Utils.rndF(-0.005,0.005), pulsePhase:Math.random()*Math.PI*2,
        color:Utils.rndPick(['#00ff88','#88ff00','#44ff44','#00cc66']),
        tentacles:Utils.rndI(4,8)
      });
    }
  };

  /* ── ZONE 5 : BLACK HOLE ── */
  const buildBlackHole = () => {
    // Central black hole
    objects.push({type:'black_hole',
      x:CONFIG.WORLD_W/2, y:CONFIG.WORLD_H/2,
      r:220, innerR:80,
      accretionColor:'rgba(255,140,0,',
      diskAngle:0, diskSpeed:0.004,
      pullRadius:600, pullForce:0.006,
      lensRings:5
    });

    // Gravitationally distorted asteroids
    for (let i=0;i<30;i++) {
      const a=Math.random()*Math.PI*2;
      const d=Utils.rndF(350,1800);
      objects.push({type:'bh_debris',
        x:CONFIG.WORLD_W/2+Math.cos(a)*d, y:CONFIG.WORLD_H/2+Math.sin(a)*d,
        orbitAngle:a, orbitR:d, orbitSpeed:0.002+Math.random()*.004,
        r:Utils.rndF(5,40), angle:Math.random()*Math.PI*2, spin:.02,
        color:Utils.rndPick(['#111','#222','#181818']),
        stretched:true
      });
    }

    // Hawking radiation particles (visual)
    for (let i=0;i<20;i++) {
      bgObjects.push({type:'radiation_arc',
        x:CONFIG.WORLD_W/2, y:CONFIG.WORLD_H/2,
        r:Utils.rndF(260,480), angle:Math.random()*Math.PI*2,
        arcLen:Utils.rndF(.3,1.2), speed:Utils.rndF(.008,.02),
        color:'rgba(255,200,80,',alpha:Utils.rndF(.04,.1)
      });
    }
  };

  /* ── ZONE 6 : RIFT CORE ── */
  const buildRiftCore = () => {
    bgObjects.push({type:'rift_glow',
      x:CONFIG.WORLD_W/2, y:CONFIG.WORLD_H/2,
      r:2500, color:'rgba(180,0,255,', alpha:.08, pulse:0
    });

    // The Rift tear
    objects.push({type:'rift_tear',
      x:CONFIG.WORLD_W/2, y:180,
      w:400, h:200, phase:0, speed:0.02,
      color:'rgba(200,0,255,',
      tendrils: Array.from({length:12},(_,i)=>({
        angle:(i/12)*Math.PI*2, len:Utils.rndF(100,300),
        phase:Math.random()*Math.PI*2, speed:Utils.rndF(.02,.06)
      }))
    });

    // Void crystals
    for (let i=0;i<25;i++) {
      objects.push({type:'void_crystal',
        x:Math.random()*CONFIG.WORLD_W, y:Math.random()*CONFIG.WORLD_H,
        r:Utils.rndF(12,45), angle:Math.random()*Math.PI*2,
        spin:Utils.rndF(-0.015,0.015),
        color:Utils.rndPick(['#cc00ff','#ff00cc','#8800ff','#ff0088']),
        glowPhase:Math.random()*Math.PI*2
      });
    }

    // Unstable portals
    for (let i=0;i<6;i++) {
      objects.push({type:'portal',
        x:100+Math.random()*(CONFIG.WORLD_W-200),
        y:100+Math.random()*(CONFIG.WORLD_H-200),
        r:Utils.rndF(30,70), phase:Math.random()*Math.PI*2,
        speed:Utils.rndF(0.03,0.06),
        color:'rgba(255,0,200,'
      });
    }
  };

  /* ══════════════════════════════════════════
     UPDATE
  ══════════════════════════════════════════ */
  const update = (playerX, playerY) => {
    worldTick++;

    for (const obj of objects) {
      switch (obj.type) {
        case 'asteroid':
        case 'debris':
        case 'hull_fragment':
          obj.angle += obj.spin;
          obj.x = Utils.clamp(obj.x + (obj.vx||0), 30, CONFIG.WORLD_W-30);
          obj.y = Utils.clamp(obj.y + (obj.vy||0), 30, CONFIG.WORLD_H-30);
          break;

        case 'ring_debris':
          obj.orbitAngle += obj.orbitSpeed;
          obj.x = obj.orbitCenter.x + Math.cos(obj.orbitAngle)*obj.orbitR;
          obj.y = obj.orbitCenter.y + Math.sin(obj.orbitAngle)*obj.orbitR*.35;
          obj.angle += obj.spin;
          break;

        case 'bh_debris': {
          obj.orbitAngle += obj.orbitSpeed;
          obj.x = CONFIG.WORLD_W/2 + Math.cos(obj.orbitAngle)*obj.orbitR;
          obj.y = CONFIG.WORLD_H/2 + Math.sin(obj.orbitAngle)*obj.orbitR;
          obj.orbitR = Math.max(80, obj.orbitR - 0.012);
          obj.angle += obj.spin;
          break;
        }
        case 'organic_floater':
          obj.pulsePhase += 0.04;
          obj.angle += obj.spin;
          break;
        case 'rift_tear':
          obj.phase += obj.speed;
          for (const t of obj.tendrils) t.phase += t.speed;
          break;
        case 'void_crystal':
          obj.glowPhase += 0.05;
          obj.angle += obj.spin;
          break;
        case 'portal':
          obj.phase += obj.speed;
          break;
        case 'black_hole':
          obj.diskAngle += obj.diskSpeed;
          // Gravitational pull on player
          const dx=obj.x-playerX, dy=obj.y-playerY;
          const d=Math.hypot(dx,dy);
          if (d<obj.pullRadius&&d>obj.innerR+20) {
            const f=obj.pullForce*(1-(d/obj.pullRadius));
            if (Game&&Game.playerRef) {
              Game.playerRef.vx+=(dx/d)*f;
              Game.playerRef.vy+=(dy/d)*f;
            }
          }
          break;
      }
    }
    // Nebula cloud drift
    for (const bg of bgObjects) {
      if (bg.type==='nebula_cloud') {
        bg.x+=bg.driftX||0; bg.y+=bg.driftY||0;
        bg.pulse+=0.01;
        if(bg.x<-bg.radius)bg.x=CONFIG.WORLD_W+bg.radius;
        if(bg.x>CONFIG.WORLD_W+bg.radius)bg.x=-bg.radius;
      } else if (bg.type==='bg_asteroid') {
        bg.angle+=bg.spin;
      } else if (bg.type==='planet_bg') {
        bg.cloudPhase+=0.002;
      } else if (bg.type==='radiation_arc') {
        bg.angle+=bg.speed;
      } else if (bg.type==='rift_glow') {
        bg.pulse+=0.015;
      }
    }
  };

  /* ══════════════════════════════════════════
     DRAW
  ══════════════════════════════════════════ */
  const draw = (ctx) => {
    _drawBackground(ctx);
    _drawBgObjects(ctx);
    _drawObjects(ctx);
  };

  // ── Pure background fill + stars
  const _drawBackground = (ctx) => {
    const zoneBg = [
      ['#020510','#030818'],  // 0 asteroid
      ['#050012','#0a0020'],  // 1 nebula
      ['#020a04','#030c06'],  // 2 station
      ['#0a0200','#0c0300'],  // 3 wreckage
      ['#000a12','#00080e'],  // 4 planet
      ['#000000','#000005'],  // 5 black hole
      ['#0a0010','#050008'],  // 6 rift
    ][Math.min(currentZone,6)];

    // Gradient background fill
    const grad = ctx.createLinearGradient(Camera.x, Camera.y, Camera.x+Camera.W, Camera.y+Camera.H);
    grad.addColorStop(0, zoneBg[0]);
    grad.addColorStop(1, zoneBg[1]);
    ctx.fillStyle=grad;
    ctx.fillRect(Camera.x-10, Camera.y-10, Camera.W+20, Camera.H+20);

    // Stars with parallax
    const t=worldTick;
    for (const s of stars) {
      if (!Camera.visible(s.x,s.y,4)) continue;
      const twinkle = 0.6+Math.sin(t*.03+s.twinkle)*.4;
      const parallax = [0.15,0.35,0.65][s.layer];
      // Parallax offset (stars shift less than world objects)
      const sx = s.x - Camera.x*(1-parallax);
      const sy = s.y - Camera.y*(1-parallax);
      // Wrap
      const wx = ((sx%Camera.W)+Camera.W)%Camera.W + Camera.x;
      const wy = ((sy%Camera.H)+Camera.H)%Camera.H + Camera.y;
      ctx.globalAlpha = twinkle * (.3+s.layer*.25);
      if (s.layer===2) { ctx.shadowColor=s.color; ctx.shadowBlur=4; }
      ctx.fillStyle=s.color;
      ctx.beginPath(); ctx.arc(wx,wy,s.r,0,Math.PI*2); ctx.fill();
      if (s.layer===2) ctx.shadowBlur=0;
    }
    ctx.globalAlpha=1;
  };

  // ── Background decorative objects
  const _drawBgObjects = (ctx) => {
    for (const bg of bgObjects) {
      if (!Camera.rectVisible(bg.x-bg.r||bg.x-500, bg.y-bg.r||bg.y-500, (bg.r||500)*2,(bg.r||500)*2)) continue;
      ctx.save();
      switch (bg.type) {
        case 'nebula_bg':
        case 'rift_glow': {
          const pulse=1+Math.sin(worldTick*.015+bg.pulse||0)*.08;
          const g=ctx.createRadialGradient(bg.x,bg.y,0,bg.x,bg.y,bg.radius*pulse);
          g.addColorStop(0,bg.color+(bg.alpha||.1)+')');
          g.addColorStop(1,'rgba(0,0,0,0)');
          ctx.fillStyle=g; ctx.beginPath(); ctx.arc(bg.x,bg.y,bg.radius*pulse,0,Math.PI*2); ctx.fill();
          break;
        }
        case 'nebula_cloud': {
          const pulse=1+Math.sin(bg.pulse)*.05;
          const g=ctx.createRadialGradient(bg.x,bg.y,0,bg.x,bg.y,bg.radius*pulse);
          g.addColorStop(0,bg.color+bg.alpha+')');
          g.addColorStop(0.5,bg.color+(bg.alpha*.5)+')');
          g.addColorStop(1,'rgba(0,0,0,0)');
          ctx.fillStyle=g; ctx.beginPath(); ctx.arc(bg.x,bg.y,bg.radius,0,Math.PI*2); ctx.fill();
          break;
        }
        case 'nebula_tendril': {
          ctx.save(); ctx.translate(bg.x,bg.y); ctx.rotate(bg.angle);
          const tg=ctx.createLinearGradient(0,0,bg.len,0);
          tg.addColorStop(0,'rgba(0,0,0,0)');
          tg.addColorStop(0.3,bg.color+bg.alpha+')');
          tg.addColorStop(0.7,bg.color+bg.alpha+')');
          tg.addColorStop(1,'rgba(0,0,0,0)');
          ctx.fillStyle=tg;
          ctx.beginPath(); ctx.ellipse(bg.len/2,0,bg.len/2,bg.width/2,0,0,Math.PI*2); ctx.fill();
          ctx.restore(); break;
        }
        case 'bg_asteroid': {
          ctx.globalAlpha=bg.alpha;
          ctx.save(); ctx.translate(bg.x,bg.y); ctx.rotate(bg.angle);
          ctx.fillStyle=bg.color;
          ctx.beginPath(); ctx.arc(0,0,bg.r,0,Math.PI*2); ctx.fill();
          ctx.restore(); break;
        }
        case 'planet_bg': {
          _drawPlanet(ctx,bg); break;
        }
        case 'station_hull': {
          ctx.save(); ctx.translate(bg.x,bg.y); ctx.rotate(bg.angle);
          ctx.fillStyle=bg.color; ctx.strokeStyle=bg.edgeColor; ctx.lineWidth=2;
          ctx.fillRect(-bg.w/2,-bg.h/2,bg.w,bg.h);
          ctx.strokeRect(-bg.w/2,-bg.h/2,bg.w,bg.h);
          // Hull ribbing
          for(let i=-bg.w/2+50;i<bg.w/2;i+=60){
            ctx.beginPath();ctx.moveTo(i,-bg.h/2);ctx.lineTo(i,bg.h/2);ctx.stroke();
          }
          ctx.restore(); break;
        }
        case 'radiation_arc': {
          ctx.save(); ctx.translate(bg.x,bg.y); ctx.rotate(bg.angle);
          ctx.strokeStyle=bg.color+bg.alpha+')';
          ctx.lineWidth=2; ctx.shadowColor=bg.color+'0.6)'; ctx.shadowBlur=8;
          ctx.beginPath(); ctx.arc(0,0,bg.r,0,bg.arcLen); ctx.stroke();
          ctx.shadowBlur=0; ctx.restore(); break;
        }
      }
      ctx.restore();
    }
  };

  // ── Foreground world objects
  const _drawObjects = (ctx) => {
    for (const obj of objects) {
      if (!Camera.visible(obj.x,obj.y,(obj.r||100)+60)) continue;
      ctx.save();
      switch (obj.type) {
        case 'asteroid': _drawAsteroid(ctx,obj); break;
        case 'debris':
        case 'hull_fragment': _drawDebris(ctx,obj); break;
        case 'crystal':       _drawCrystal(ctx,obj); break;
        case 'station_module':_drawStationModule(ctx,obj); break;
        case 'wreck':         _drawWreck(ctx,obj); break;
        case 'ring_debris':
        case 'bh_debris':     _drawAsteroid(ctx,obj); break;
        case 'organic_floater':_drawOrganic(ctx,obj); break;
        case 'black_hole':    _drawBlackHole(ctx,obj); break;
        case 'rift_tear':     _drawRiftTear(ctx,obj); break;
        case 'void_crystal':  _drawVoidCrystal(ctx,obj); break;
        case 'portal':        _drawPortal(ctx,obj); break;
      }
      ctx.restore();
    }
  };

  /* ── individual draw functions ── */

  const _drawAsteroid = (ctx,obj) => {
    ctx.translate(obj.x,obj.y); ctx.rotate(obj.angle);
    // Shadow
    const grd=ctx.createRadialGradient(0,0,0,0,0,obj.r);
    grd.addColorStop(0,obj.color);
    grd.addColorStop(.6,obj.color);
    grd.addColorStop(1,'rgba(0,0,0,.9)');
    ctx.fillStyle=grd;
    // Irregular shape
    ctx.beginPath();
    const pts=obj.detail;
    ctx.moveTo(pts[0].x,pts[0].y);
    for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x,pts[i].y);
    ctx.closePath(); ctx.fill();
    // Craters
    ctx.globalCompositeOperation='multiply';
    ctx.fillStyle='rgba(0,0,0,0.35)';
    for(const c of obj.craters){
      ctx.beginPath(); ctx.arc(c.dx,c.dy,c.r,0,Math.PI*2); ctx.fill();
    }
    ctx.globalCompositeOperation='source-over';
    // Edge highlight
    ctx.strokeStyle='rgba(255,255,255,0.06)';
    ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(pts[0].x,pts[0].y);
    for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x,pts[i].y);
    ctx.closePath(); ctx.stroke();
  };

  const _drawDebris = (ctx,obj) => {
    ctx.translate(obj.x,obj.y); ctx.rotate(obj.angle);
    ctx.fillStyle=obj.color; ctx.strokeStyle='rgba(255,150,50,.1)'; ctx.lineWidth=1;
    const pts=[]; const n=Utils.rndI(4,7);
    for(let i=0;i<n;i++){
      const a=(i/n)*Math.PI*2; const r=obj.r*(0.5+Math.random()*.7);
      pts.push([Math.cos(a)*r,Math.sin(a)*r]);
    }
    ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0],pts[i][1]);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  };

  const _drawCrystal = (ctx,obj) => {
    ctx.translate(obj.x,obj.y); ctx.rotate(obj.angle);
    const pulse=0.7+Math.sin(worldTick*.05+obj.r)*.3;
    if(obj.glow){ctx.shadowColor=obj.glowColor;ctx.shadowBlur=15*pulse;}
    const g=ctx.createRadialGradient(0,0,0,0,0,obj.r);
    g.addColorStop(0,'rgba(255,255,255,.9)');
    g.addColorStop(.4,obj.color);
    g.addColorStop(1,'rgba(0,0,0,.3)');
    ctx.fillStyle=g;
    // Hexagonal crystal
    ctx.beginPath();
    for(let i=0;i<6;i++){
      const a=(i/6)*Math.PI*2;
      if(i===0)ctx.moveTo(Math.cos(a)*obj.r,Math.sin(a)*obj.r);
      else ctx.lineTo(Math.cos(a)*obj.r,Math.sin(a)*obj.r);
    }
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur=0;
  };

  const _drawStationModule = (ctx,obj) => {
    ctx.translate(obj.x,obj.y); ctx.rotate(obj.angle);
    ctx.fillStyle=obj.color; ctx.strokeStyle=obj.edgeColor; ctx.lineWidth=1.5;
    ctx.fillRect(-obj.w/2,-obj.h/2,obj.w,obj.h);
    ctx.strokeRect(-obj.w/2,-obj.h/2,obj.w,obj.h);
    // Blinking light
    if(!obj.damaged){
      const blink=Math.sin(worldTick*.06+obj.blinkPhase)>.5;
      ctx.fillStyle=blink?'rgba(0,255,80,.8)':'rgba(0,100,40,.3)';
      ctx.beginPath(); ctx.arc(obj.w*.35,-obj.h*.35,4,0,Math.PI*2); ctx.fill();
    } else {
      // Damaged sparks
      if(Math.random()<.05) Particles.sparks(obj.x+Utils.rndF(-obj.w/2,obj.w/2),
        obj.y+Utils.rndF(-obj.h/2,obj.h/2),3,'#ff8800');
    }
  };

  const _drawWreck = (ctx,obj) => {
    ctx.translate(obj.x,obj.y); ctx.rotate(obj.angle);
    const s=obj.scale;
    // Hull
    ctx.fillStyle=obj.color; ctx.strokeStyle=obj.edgeColor; ctx.lineWidth=2;
    if(obj.shipType==='carrier'){
      ctx.fillRect(-200*s,-60*s,400*s,120*s);
      ctx.fillRect(-100*s,-100*s,200*s,200*s);
      ctx.strokeRect(-200*s,-60*s,400*s,120*s);
    } else if(obj.shipType==='cruiser'){
      ctx.beginPath();
      ctx.moveTo(180*s,0); ctx.lineTo(-120*s,-50*s); ctx.lineTo(-180*s,-20*s);
      ctx.lineTo(-180*s,20*s); ctx.lineTo(-120*s,50*s); ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(120*s,0); ctx.lineTo(-80*s,-35*s); ctx.lineTo(-80*s,35*s); ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
    // Fire effect
    if(obj.fire){
      const fp=worldTick*.08+obj.firePhase;
      const fx=Utils.rndF(-80,80)*s, fy=Utils.rndF(-30,30)*s;
      if(Math.random()<.3) Particles.spawn({
        x:obj.x+Math.cos(obj.angle)*fx-Math.sin(obj.angle)*fy,
        y:obj.y+Math.sin(obj.angle)*fx+Math.cos(obj.angle)*fy,
        vx:Utils.rndF(-.5,.5),vy:Utils.rndF(-1.5,-.2),
        color:Utils.rndPick(['#ff6600','#ff4400','#ffaa00']),
        size:Utils.rndF(3,8),sizeDecay:.1,life:Utils.rndI(15,35),glow:true
      });
    }
  };

  const _drawOrganic = (ctx,obj) => {
    ctx.translate(obj.x,obj.y); ctx.rotate(obj.angle);
    const pulse=0.8+Math.sin(obj.pulsePhase)*.2;
    ctx.shadowColor=obj.color; ctx.shadowBlur=20;
    // Body
    const g=ctx.createRadialGradient(0,0,0,0,0,obj.r*pulse);
    g.addColorStop(0,'rgba(200,255,200,.9)');
    g.addColorStop(.4,obj.color);
    g.addColorStop(1,'rgba(0,80,30,.2)');
    ctx.fillStyle=g;
    ctx.beginPath(); ctx.arc(0,0,obj.r*pulse,0,Math.PI*2); ctx.fill();
    // Tentacles
    ctx.strokeStyle=obj.color; ctx.lineWidth=3; ctx.shadowBlur=8;
    for(let i=0;i<obj.tentacles;i++){
      const a=(i/obj.tentacles)*Math.PI*2+worldTick*.02;
      const len=obj.r*1.5;
      const wave=Math.sin(worldTick*.06+i)*15;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a)*obj.r*.7,Math.sin(a)*obj.r*.7);
      ctx.quadraticCurveTo(
        Math.cos(a+.3)*(obj.r+len*.5)+wave,
        Math.sin(a+.3)*(obj.r+len*.5),
        Math.cos(a)*len,Math.sin(a)*len);
      ctx.stroke();
    }
    ctx.shadowBlur=0;
  };

  const _drawPlanet = (ctx,bg) => {
    ctx.save(); ctx.translate(bg.x,bg.y);
    // Glow halo
    const glow=ctx.createRadialGradient(0,0,bg.r*.7,0,0,bg.r*1.6);
    glow.addColorStop(0,'rgba(0,100,200,0.0)');
    glow.addColorStop(.5,'rgba(0,60,150,0.06)');
    glow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=glow;
    ctx.beginPath();ctx.arc(0,0,bg.r*1.6,0,Math.PI*2);ctx.fill();
    // Planet body
    const pg=ctx.createRadialGradient(-bg.r*.3,-bg.r*.3,0,0,0,bg.r);
    pg.addColorStop(0,'rgba(150,200,255,0.7)');
    pg.addColorStop(.3,bg.color1);
    pg.addColorStop(.7,bg.color2);
    pg.addColorStop(1,'rgba(0,0,0,0.95)');
    ctx.fillStyle=pg;
    ctx.beginPath();ctx.arc(0,0,bg.r,0,Math.PI*2);ctx.fill();
    // Cloud bands
    ctx.save();
    ctx.clip();
    for(let i=0;i<5;i++){
      const cy=-bg.r*.6+i*bg.r*.3+Math.sin(bg.cloudPhase+i)*(bg.r*.05);
      const h=bg.r*.08+Math.sin(bg.cloudPhase*1.3+i)*(bg.r*.03);
      ctx.fillStyle=`rgba(255,255,255,${.04+i*.01})`;
      ctx.beginPath();ctx.ellipse(0,cy,bg.r*.9,h,0,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
    // Ring
    if(bg.hasRing){
      ctx.save();
      ctx.scale(1,0.3);
      ctx.rotate(0.2);
      const rg=ctx.createRadialGradient(0,0,bg.r*.85,0,0,bg.r*2.2);
      rg.addColorStop(0,bg.ringColor||'rgba(0,180,255,.0)');
      rg.addColorStop(.3,bg.ringColor||'rgba(0,180,255,.15)');
      rg.addColorStop(.7,bg.ringColor||'rgba(0,150,220,.08)');
      rg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=rg;
      ctx.beginPath();ctx.arc(0,0,bg.r*2.2,0,Math.PI*2);
      ctx.arc(0,0,bg.r*.85,0,Math.PI*2,true);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  };

  const _drawBlackHole = (ctx,obj) => {
    ctx.save(); ctx.translate(obj.x,obj.y);
    // Gravitational lensing rings
    for(let i=0;i<obj.lensRings;i++){
      const r=obj.r*(1.1+i*.3);
      const alpha=.15-i*.025;
      ctx.strokeStyle=`rgba(255,200,80,${alpha})`;
      ctx.lineWidth=2-i*.2;
      ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
    }
    // Accretion disk
    ctx.save(); ctx.rotate(obj.diskAngle); ctx.scale(1,.35);
    const ad=ctx.createRadialGradient(0,0,obj.innerR,0,0,obj.r*1.5);
    ad.addColorStop(0,'rgba(255,200,50,.0)');
    ad.addColorStop(.2,obj.accretionColor+'0.5)');
    ad.addColorStop(.5,obj.accretionColor+'0.3)');
    ad.addColorStop(.8,obj.accretionColor+'0.1)');
    ad.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=ad;
    ctx.beginPath();ctx.arc(0,0,obj.r*1.5,0,Math.PI*2);
    ctx.arc(0,0,obj.innerR,0,Math.PI*2,true);
    ctx.fill();
    ctx.restore();
    // Event horizon (pure black)
    ctx.fillStyle='#000';
    ctx.beginPath();ctx.arc(0,0,obj.innerR,0,Math.PI*2);ctx.fill();
    // Photon sphere
    ctx.strokeStyle='rgba(255,255,255,.04)';
    ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(0,0,obj.innerR*1.5,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  };

  const _drawRiftTear = (ctx,obj) => {
    ctx.save(); ctx.translate(obj.x,obj.y);
    const pulse=0.8+Math.sin(obj.phase)*.2;
    ctx.shadowColor='rgba(200,0,255,.8)'; ctx.shadowBlur=30;
    // Main tear
    const rg=ctx.createRadialGradient(0,0,0,0,0,obj.w/2*pulse);
    rg.addColorStop(0,'rgba(255,255,255,.9)');
    rg.addColorStop(.2,obj.color+'0.8)');
    rg.addColorStop(.6,obj.color+'0.3)');
    rg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=rg;
    ctx.beginPath();ctx.ellipse(0,0,obj.w/2*pulse,obj.h/2*pulse,0,0,Math.PI*2);ctx.fill();
    // Tendrils
    for(const t of obj.tendrils){
      const wv=Math.sin(worldTick*.04+t.phase)*25;
      const ex=Math.cos(t.angle+wv*.02)*t.len;
      const ey=Math.sin(t.angle+wv*.02)*t.len;
      ctx.strokeStyle=obj.color+'0.4)';
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.quadraticCurveTo(ex*.5+wv,ey*.5+wv,ex,ey);
      ctx.stroke();
    }
    ctx.shadowBlur=0;
    ctx.restore();
  };

  const _drawVoidCrystal = (ctx,obj) => {
    ctx.save(); ctx.translate(obj.x,obj.y); ctx.rotate(obj.angle);
    const gp=0.6+Math.sin(obj.glowPhase)*.4;
    ctx.shadowColor=obj.color; ctx.shadowBlur=20*gp;
    const g=ctx.createRadialGradient(0,0,0,0,0,obj.r);
    g.addColorStop(0,'rgba(255,255,255,.8)');
    g.addColorStop(.3,obj.color);
    g.addColorStop(1,'rgba(0,0,0,.4)');
    ctx.fillStyle=g;
    // Double hexagon (star shape)
    ctx.beginPath();
    for(let i=0;i<12;i++){
      const a=(i/12)*Math.PI*2;
      const r=i%2===0?obj.r:obj.r*.5;
      if(i===0)ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);
      else ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);
    }
    ctx.closePath();ctx.fill();
    ctx.shadowBlur=0;ctx.restore();
  };

  const _drawPortal = (ctx,obj) => {
    ctx.save(); ctx.translate(obj.x,obj.y);
    const p=0.7+Math.sin(obj.phase)*.3;
    ctx.shadowColor=obj.color+'0.8)'; ctx.shadowBlur=20;
    for(let i=3;i>=0;i--){
      const r=obj.r*(1+i*.3)*p;
      const a=(4-i)/4*.5;
      ctx.strokeStyle=obj.color+a+')';
      ctx.lineWidth=3-i*.5;
      ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.stroke();
    }
    // Inner glow
    const ig=ctx.createRadialGradient(0,0,0,0,0,obj.r*p);
    ig.addColorStop(0,'rgba(255,255,255,.5)');
    ig.addColorStop(.5,obj.color+'0.3)');
    ig.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=ig;
    ctx.beginPath();ctx.arc(0,0,obj.r*p,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;ctx.restore();
  };

  /* ── Collision obstacle list for bullets/entities ── */
  const getObstacles = () => objects.filter(o=>['asteroid','bh_debris','ring_debris','crystal','void_crystal'].includes(o.type));

  return { load, update, draw, getObstacles,
    get objects(){return objects;},
    get worldTick(){return worldTick;} };
})();