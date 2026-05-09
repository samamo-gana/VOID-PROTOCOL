// ═══════════════════════════════════════════════════════════
//  particles.js — Advanced particle system (1200 pool)
// ═══════════════════════════════════════════════════════════
const Particles = (() => {
  const pool=[], active=[];
  const MAX=CONFIG.PARTICLES.MAX;

  const get=()=>{ const p=pool.length?pool.pop():{};active.push(p);return p; };

  const spawn=(opts)=>{
    if(active.length>=MAX)return;
    const p=get();
    p.x=opts.x; p.y=opts.y;
    p.vx=opts.vx||0; p.vy=opts.vy||0;
    p.color=opts.color||'#fff';
    p.size=opts.size||3; p.sizeDecay=opts.sizeDecay||0;
    p.life=opts.life||30; p.maxLife=p.life;
    p.alpha=opts.alpha||1; p.alphaDecay=opts.alphaDecay||0;
    p.gravity=opts.gravity||0; p.friction=opts.friction||0.95;
    p.shape=opts.shape||'circle';
    p.glow=opts.glow||false; p.glowSize=opts.glowSize||p.size*2;
    p.trail=opts.trail||false;
    p.spin=opts.spin||0; p.angle=opts.angle||0;
    return p;
  };

  // ── Preset emitters

  const thrusterTrail=(x,y,angle,shipColor)=>{
    const a=angle+Math.PI+(Math.random()-.5)*.3;
    const spd=Utils.rndF(1.5,4);
    spawn({x:x+Math.cos(angle+Math.PI)*10,y:y+Math.sin(angle+Math.PI)*10,
      vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,
      color:Utils.rndPick([shipColor,'#fff','#88ccff','#0088ff']),
      size:Utils.rndF(2,5),sizeDecay:.12,life:Utils.rndI(10,22),glow:true,friction:.96});
    // Exhaust smoke
    if(Math.random()<.3) spawn({x:x+Math.cos(angle+Math.PI)*12,y:y+Math.sin(angle+Math.PI)*12,
      vx:Math.cos(a)*1.5,vy:Math.sin(a)*1.5,
      color:'rgba(100,120,180,0.3)',size:Utils.rndF(4,10),sizeDecay:.08,
      life:Utils.rndI(20,40),alpha:.35,alphaDecay:.012,friction:.97});
  };

  const explosion=(x,y,radius=60,color='#ff6600',count=28)=>{
    for(let i=0;i<count;i++){
      const a=Math.random()*Math.PI*2,spd=Utils.rndF(2,9)*(radius/60);
      spawn({x:x+Math.cos(a)*Math.random()*radius*.3,y:y+Math.sin(a)*Math.random()*radius*.3,
        vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,
        color:Utils.rndPick([color,'#ff4400','#ffee00','#fff']),
        size:Utils.rndF(2,7),life:Utils.rndI(20,50),friction:.91,glow:true,glowSize:8});
    }
    // Shockwave ring (fake)
    for(let i=0;i<16;i++){
      const a=(i/16)*Math.PI*2;
      spawn({x,y,vx:Math.cos(a)*5,vy:Math.sin(a)*5,
        color:'rgba(255,200,100,0.6)',size:Utils.rndF(3,8),sizeDecay:.1,
        life:20,friction:.88,glow:false});
    }
    // Smoke
    for(let i=0;i<12;i++){
      const a=Math.random()*Math.PI*2,spd=Utils.rndF(.5,2.5);
      spawn({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,
        color:Utils.rndPick(['#334','#445','#223','#556']),
        size:Utils.rndF(6,14),sizeDecay:.05,
        life:Utils.rndI(40,80),alpha:.45,alphaDecay:.007,friction:.96});
    }
  };

  const plasmaHit=(x,y,color='#8800ff')=>{
    for(let i=0;i<14;i++){
      const a=Math.random()*Math.PI*2,spd=Utils.rndF(2,6);
      spawn({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,
        color:Utils.rndPick([color,'#cc88ff','#ffffff']),
        size:Utils.rndF(2,5),life:Utils.rndI(12,28),glow:true,friction:.93});
    }
  };

  const sparks=(x,y,count=12,col='#ffee00')=>{
    for(let i=0;i<count;i++){
      const a=Math.random()*Math.PI*2,spd=Utils.rndF(3,8);
      spawn({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,
        color:col,size:Utils.rndF(1,3),life:Utils.rndI(8,18),shape:'line',friction:.92});
    }
  };

  const railStreak=(x1,y1,x2,y2,color='#ffee00')=>{
    const len=Utils.dist(x1,y1,x2,y2), steps=Math.floor(len/8);
    for(let i=0;i<steps;i++){
      const t=i/steps;
      spawn({x:Utils.lerp(x1,x2,t)+Utils.rndF(-4,4),y:Utils.lerp(y1,y2,t)+Utils.rndF(-4,4),
        vx:Utils.rndF(-.5,.5),vy:Utils.rndF(-.5,.5),
        color:i%2===0?color:'#fff',size:Utils.rndF(1.5,4),
        life:Utils.rndI(8,16),glow:true,friction:.95});
    }
  };

  const warpEffect=(x,y,col='#00f5ff')=>{
    for(let i=0;i<30;i++){
      const a=(i/30)*Math.PI*2,spd=Utils.rndF(5,15);
      spawn({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,
        color:Utils.rndPick([col,'#fff','#88ddff']),
        size:Utils.rndF(2,6),life:Utils.rndI(15,35),glow:true,friction:.88});
    }
    for(let i=0;i<20;i++){
      const a=Math.random()*Math.PI*2;
      spawn({x:x+Math.cos(a)*Utils.rndF(10,80),y:y+Math.sin(a)*Utils.rndF(10,80),
        vx:-Math.cos(a)*3,vy:-Math.sin(a)*3,
        color:col,size:Utils.rndF(1,4),life:Utils.rndI(20,45),glow:true,friction:.95});
    }
  };

  const nebulaPuff=(x,y,col)=>{
    spawn({x,y,vx:Utils.rndF(-.2,.2),vy:Utils.rndF(-.2,.2),
      color:col,size:Utils.rndF(20,60),sizeDecay:-.1,
      life:300,alpha:.04,alphaDecay:.00015,friction:1,glow:false});
  };

  const shieldImpact=(x,y,col='#0088ff')=>{
    for(let i=0;i<10;i++){
      const a=Math.random()*Math.PI*2,spd=Utils.rndF(1,4);
      spawn({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,
        color:col,size:Utils.rndF(2,5),life:Utils.rndI(8,18),glow:true,friction:.9});
    }
  };

  const homingTrail=(x,y)=>{
    spawn({x,y,vx:Utils.rndF(-.5,.5),vy:Utils.rndF(-.5,.5),
      color:Utils.rndPick(['#ff4400','#ff8800','#ffcc00']),
      size:Utils.rndF(2,4),life:Utils.rndI(8,15),glow:true,friction:.9,sizeDecay:.15});
  };

  const muzzleFlash=(x,y,angle,col='#fff')=>{
    for(let i=0;i<5;i++){
      const a=angle+Utils.rndF(-.25,.25),spd=Utils.rndF(3,6);
      spawn({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,
        color:col,size:Utils.rndF(2,4),life:Utils.rndI(4,10),glow:true});
    }
  };

  const bossDeathCascade=(x,y,radius,col)=>{
    for(let wave=0;wave<5;wave++){
      setTimeout(()=>{
        const r=radius*(wave+1)*.35;
        for(let i=0;i<24;i++){
          const a=(i/24)*Math.PI*2,spd=Utils.rndF(3,10);
          spawn({x:x+Math.cos(a)*r*.5,y:y+Math.sin(a)*r*.5,
            vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,
            color:Utils.rndPick([col,'#fff','#ff4400','#ffee00']),
            size:Utils.rndF(3,9),life:Utils.rndI(30,70),glow:true,friction:.9});
        }
      },wave*150);
    }
  };

  const update=()=>{
    for(let i=active.length-1;i>=0;i--){
      const p=active[i];
      p.x+=p.vx; p.y+=p.vy;
      p.vx*=p.friction; p.vy=p.vy*p.friction+p.gravity;
      p.size=Math.max(0,p.size-p.sizeDecay);
      p.alpha=Math.max(0,p.alpha-p.alphaDecay);
      p.angle+=p.spin;
      p.life--;
      if(p.life<=0||p.size<=0){ active.splice(i,1); pool.push(p); }
    }
  };

  const draw=(ctx)=>{
    for(const p of active){
      if(!Camera.visible(p.x,p.y,p.size+10))continue;
      const lifeR=p.life/p.maxLife;
      const alpha=p.alphaDecay>0?p.alpha:lifeR;
      ctx.globalAlpha=Utils.clamp(alpha,0,1);
      if(p.glow){ctx.shadowColor=p.color;ctx.shadowBlur=p.glowSize;}
      ctx.fillStyle=p.color;
      ctx.strokeStyle=p.color;

      if(p.shape==='line'){
        ctx.lineWidth=p.size*.5;
        ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*4,p.y-p.vy*4);ctx.stroke();
      } else if(p.shape==='square'){
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);
        ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);ctx.restore();
      } else {
        ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
      }
      if(p.glow)ctx.shadowBlur=0;
    }
    ctx.globalAlpha=1;
  };

  const clear=()=>{ while(active.length)pool.push(active.pop()); };

  return{spawn,thrusterTrail,explosion,plasmaHit,sparks,railStreak,warpEffect,
    nebulaPuff,shieldImpact,homingTrail,muzzleFlash,bossDeathCascade,
    update,draw,clear,get active(){return active;}};
})();