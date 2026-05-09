// ═══════════════════════════════════════════════════════════
//  utils.js
// ═══════════════════════════════════════════════════════════
const Utils = (() => {
  const dist     = (ax,ay,bx,by) => Math.hypot(bx-ax,by-ay);
  const clamp    = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
  const lerp     = (a,b,t) => a+(b-a)*t;
  const lerpAng  = (a,b,t) => { let d=b-a; while(d>Math.PI)d-=Math.PI*2; while(d<-Math.PI)d+=Math.PI*2; return a+d*t; };
  const rndF     = (lo,hi) => lo+Math.random()*(hi-lo);
  const rndI     = (lo,hi) => Math.floor(lo+Math.random()*(hi-lo+1));
  const rndPick  = a => a[Math.floor(Math.random()*a.length)];
  const norm     = (x,y) => { const l=Math.hypot(x,y)||1; return [x/l,y/l]; };
  const angTo    = (ax,ay,bx,by) => Math.atan2(by-ay,bx-ax);
  const hexRGBA  = (hex,a) => { const h=hex.replace('#',''); const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16); return `rgba(${r},${g},${b},${a})`; };
  const fmt      = n => n.toLocaleString();

  const circleAABB = (cx,cy,cr,rx,ry,rw,rh) => {
    const nx=clamp(cx,rx,rx+rw), ny=clamp(cy,ry,ry+rh);
    return dist(cx,cy,nx,ny)<cr;
  };
  const circleCircle = (ax,ay,ar,bx,by,br) => dist(ax,ay,bx,by)<ar+br;

  const lineHitsWalls = (x1,y1,x2,y2,walls) => {
    for(const w of walls){
      if(lineAABB(x1,y1,x2,y2,w.x,w.y,w.x+w.w,w.y+w.h)) return true;
    } return false;
  };
  const lineAABB = (x1,y1,x2,y2,rx1,ry1,rx2,ry2) => {
    const dx=x2-x1,dy=y2-y1;
    const p=[-dx,dx,-dy,dy], q=[x1-rx1,rx2-x1,y1-ry1,ry2-y1];
    let t0=0,t1=1;
    for(let i=0;i<4;i++){
      if(Math.abs(p[i])<1e-6){ if(q[i]<0)return false; }
      else{ const t=q[i]/p[i]; if(p[i]<0)t0=Math.max(t0,t); else t1=Math.min(t1,t); }
    } return t0<=t1;
  };

  const moveSlide = (x,y,vx,vy,r,walls) => {
    let nx=x+vx,ny=y+vy;
    for(const w of walls){ if(circleAABB(nx,y,r,w.x,w.y,w.w,w.h)){nx=x;break;} }
    for(const w of walls){ if(circleAABB(nx,ny,r,w.x,w.y,w.w,w.h)){ny=y;break;} }
    return [nx,ny];
  };

  const weightedRnd = (items,weights) => {
    const tot=weights.reduce((a,b)=>a+b,0);
    let r=Math.random()*tot;
    for(let i=0;i<items.length;i++){ r-=weights[i]; if(r<=0)return items[i]; }
    return items[items.length-1];
  };

  // Draw gradient circle (used for spacecraft pseudo-3D shading)
  const draw3DSphere = (ctx,x,y,r,baseColor,lightAngle=(-Math.PI/4)) => {
    const lx=x+Math.cos(lightAngle)*r*0.4, ly=y+Math.sin(lightAngle)*r*0.4;
    const g=ctx.createRadialGradient(lx,ly,0,x,y,r);
    g.addColorStop(0,'rgba(255,255,255,0.6)');
    g.addColorStop(0.3,baseColor);
    g.addColorStop(1,'rgba(0,0,0,0.9)');
    ctx.fillStyle=g;
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  };

  // Draw metallic panel (pseudo-3D hull segment)
  const drawMetalPanel = (ctx,x,y,w,h,angle,baseColor,rx=0) => {
    ctx.save(); ctx.translate(x,y); ctx.rotate(angle);
    const g=ctx.createLinearGradient(-w/2,-h/2,w/2,h/2);
    g.addColorStop(0,'rgba(255,255,255,0.25)');
    g.addColorStop(0.4,baseColor);
    g.addColorStop(0.7,baseColor);
    g.addColorStop(1,'rgba(0,0,0,0.5)');
    ctx.fillStyle=g;
    ctx.shadowColor=baseColor; ctx.shadowBlur=6;
    if(rx>0){ ctx.beginPath(); ctx.roundRect(-w/2,-h/2,w,h,rx); ctx.fill(); }
    else { ctx.fillRect(-w/2,-h/2,w,h); }
    // Edge highlight
    ctx.strokeStyle='rgba(255,255,255,0.15)';
    ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(-w/2,-h/2); ctx.lineTo(w/2,-h/2); ctx.lineTo(w/2,h/2);
    ctx.stroke();
    ctx.shadowBlur=0;
    ctx.restore();
  };

  return { dist,clamp,lerp,lerpAng,rndF,rndI,rndPick,norm,angTo,hexRGBA,fmt,
           circleAABB,circleCircle,lineHitsWalls,moveSlide,weightedRnd,
           draw3DSphere,drawMetalPanel };
})();