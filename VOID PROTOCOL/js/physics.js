// ═══════════════════════════════════════════════════════════
//  physics.js — Raycasting, LOS, sweep, knockback, overlap
// ═══════════════════════════════════════════════════════════
const Physics = (() => {

  const _raySegInt = (rx,ry,rdx,rdy,x1,y1,x2,y2) => {
    const dx=x2-x1, dy=y2-y1, denom=rdx*dy-rdy*dx;
    if (Math.abs(denom)<1e-8) return null;
    const t=((x1-rx)*dy-(y1-ry)*dx)/denom;
    const u=((x1-rx)*rdy-(y1-ry)*rdx)/denom;
    if (t<0||u<0||u>1) return null;
    return t;
  };

  const raycast = (ox,oy,dx,dy,maxD,walls) => {
    let closest=null, closestD=maxD;
    for (const w of walls) {
      const edges=[
        {x1:w.x,     y1:w.y,     x2:w.x+w.w,y2:w.y,     nx:0, ny:-1},
        {x1:w.x+w.w, y1:w.y,     x2:w.x+w.w,y2:w.y+w.h, nx:1, ny:0 },
        {x1:w.x,     y1:w.y+w.h, x2:w.x+w.w,y2:w.y+w.h, nx:0, ny:1 },
        {x1:w.x,     y1:w.y,     x2:w.x,    y2:w.y+w.h, nx:-1,ny:0 },
      ];
      for (const e of edges) {
        const t=_raySegInt(ox,oy,dx,dy,e.x1,e.y1,e.x2,e.y2);
        if (t!==null&&t>=0&&t<closestD) {
          closestD=t;
          closest={x:ox+dx*t,y:oy+dy*t,dist:t,nx:e.nx,ny:e.ny};
        }
      }
    }
    return closest;
  };

  const hasLOS  = (ax,ay,bx,by,walls) => !Utils.lineHitsWalls(ax,ay,bx,by,walls);
  const reflect = (vx,vy,nx,ny,r=0.4) => { const d=vx*nx+vy*ny; return [vx-(1+r)*d*nx,vy-(1+r)*d*ny]; };

  const resolveOverlap = (ax,ay,ar,bx,by,br) => {
    const dx=ax-bx,dy=ay-by,d=Math.hypot(dx,dy)||.001,ov=(ar+br-d)*.5;
    if (ov<=0) return [ax,ay,bx,by];
    const px=(dx/d)*ov,py=(dy/d)*ov;
    return [ax+px,ay+py,bx-px,by-py];
  };

  const applyKnockback = (ent,fx,fy,force) => {
    const dx=ent.x-fx,dy=ent.y-fy,d=Math.hypot(dx,dy)||1;
    ent.vx=(ent.vx||0)+(dx/d)*force;
    ent.vy=(ent.vy||0)+(dy/d)*force;
  };

  const findSafeSpawn = (nx,ny,minD,walls,attempts=40) => {
    for (let i=0;i<attempts;i++) {
      const a=Math.random()*Math.PI*2;
      const d=minD+Math.random()*500;
      const x=Utils.clamp(nx+Math.cos(a)*d,80,CONFIG.WORLD_W-80);
      const y=Utils.clamp(ny+Math.sin(a)*d,80,CONFIG.WORLD_H-80);
      let blocked=false;
      for (const w of walls) { if(Utils.circleAABB(x,y,25,w.x,w.y,w.w,w.h)){blocked=true;break;} }
      if (!blocked) return {x,y};
    }
    return {x:nx+Utils.rndF(-300,300),y:ny+Utils.rndF(-300,300)};
  };

  return { raycast, hasLOS, reflect, resolveOverlap, applyKnockback, findSafeSpawn };
})();