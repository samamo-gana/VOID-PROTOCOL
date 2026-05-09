// renderer.js — Master draw pipeline, lighting, post-FX, minimap
const Renderer = (() => {
  let canvas=null,ctx=null,W=0,H=0;
  let lightCanvas=null,lightCtx=null,_tick=0;

  const init=(c)=>{
    canvas=c; ctx=canvas.getContext('2d');
    W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight;
    lightCanvas=document.createElement('canvas');
    lightCanvas.width=W; lightCanvas.height=H;
    lightCtx=lightCanvas.getContext('2d');
    Camera.init(W,H);
    window.addEventListener('resize',_onResize);
  };

  const _onResize=()=>{
    W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight;
    if(lightCanvas){lightCanvas.width=W;lightCanvas.height=H;}
    Camera.resize(W,H);
  };

  const render=(tick)=>{
    _tick=tick;
    Camera.update();
    Input.updateWorld(Camera.x,Camera.y);
    ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
    Camera.begin(ctx);
      Environment.draw(ctx);
      Level.drawPickups(ctx);
      Story.drawLogs(ctx);
      Particles.draw(ctx);
      Weapons.drawBullets(ctx);
      EnemyMgr.draw(ctx);
      BossMgr.draw(ctx);
      Player.draw(ctx);
    Camera.end(ctx);
    _drawLighting();
    _drawPostFX();
    _drawMinimap();
    _drawCrosshair();
  };

  const _drawLighting=()=>{
    lightCtx.clearRect(0,0,W,H);
    const zoneDark=[0.62,0.70,0.65,0.68,0.60,0.80,0.75];
    const dark=zoneDark[Math.min(Level.currentZone,zoneDark.length-1)];
    lightCtx.fillStyle=`rgba(0,0,0,${dark})`; lightCtx.fillRect(0,0,W,H);
    lightCtx.globalCompositeOperation='destination-out';
    const ps=Camera.toScreen(Player.x,Player.y);
    const wCol=CONFIG.WEAPONS[Weapons.currentWpn]?.color||'#0ff';
    _ptLight(ps.x,ps.y,380,0.65,wCol);
    if(Game.muzzleFlash>0){const mf=Game.muzzleFlash/8;_ptLight(ps.x+Math.cos(Player.angle)*30,ps.y+Math.sin(Player.angle)*30,120*mf,mf*.9,'#fff');}
    for(const e of EnemyMgr.enemies){
      if(!e.alive||!Camera.visible(e.x,e.y,e.radius+40))continue;
      const es=Camera.toScreen(e.x,e.y);
      _ptLight(es.x,es.y,e.radius*4.5,0.14,e.color);
      if(e.elite)_ptLight(es.x,es.y,e.radius*7,0.10,'#ffee00');
    }
    if(BossMgr.alive){const b=BossMgr.get();if(b){const bs=Camera.toScreen(b.x,b.y);_ptLight(bs.x,bs.y,b.radius*5.5,0.45+Math.sin(_tick*.05)*.2,b.color);if(b.enraged)_ptLight(bs.x,bs.y,b.radius*8,0.15,'#ff4444');}}
    for(const bl of[...Weapons.bullets,...Weapons.enemyBullets]){if(!Camera.visible(bl.x,bl.y,12))continue;const bls=Camera.toScreen(bl.x,bl.y);_ptLight(bls.x,bls.y,55,0.35,bl.color);}
    for(const pk of Level.pickups){if(!Camera.visible(pk.x,pk.y,25))continue;const pks=Camera.toScreen(pk.x,pk.y);const col=pk.type==='HEALTH'?'#00ff88':pk.type==='SHIELD'?'#0088ff':'#ff8800';_ptLight(pks.x,pks.y,50,0.18+Math.sin(_tick*.08+pk.pulse)*.06,col);}
    lightCtx.globalCompositeOperation='source-over';
    const tint=CONFIG.ZONES[Math.min(Level.currentZone,CONFIG.ZONES.length-1)]?.tint||'rgba(0,0,0,.3)';
    lightCtx.fillStyle=tint; lightCtx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation='multiply'; ctx.drawImage(lightCanvas,0,0); ctx.globalCompositeOperation='source-over';
  };

  const _ptLight=(x,y,radius,intensity,color)=>{
    const g=lightCtx.createRadialGradient(x,y,0,x,y,radius);
    let r=255,gv=255,b=255;
    if(color&&color[0]==='#'){const h=color.replace('#','');if(h.length===6){r=parseInt(h.slice(0,2),16);gv=parseInt(h.slice(2,4),16);b=parseInt(h.slice(4,6),16);}}
    const i=Utils.clamp(intensity,0,1);
    g.addColorStop(0,`rgba(${r},${gv},${b},${i})`);
    g.addColorStop(0.4,`rgba(${r},${gv},${b},${i*.4})`);
    g.addColorStop(1,'rgba(0,0,0,0)');
    lightCtx.fillStyle=g; lightCtx.beginPath(); lightCtx.arc(x,y,radius,0,Math.PI*2); lightCtx.fill();
  };

  const _drawPostFX=()=>{
    const vig=ctx.createRadialGradient(W/2,H/2,H*.22,W/2,H/2,H*.88);
    vig.addColorStop(0,'transparent'); vig.addColorStop(1,'rgba(0,0,0,0.74)');
    ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='rgba(0,0,0,0.048)';
    for(let y=0;y<H;y+=4)ctx.fillRect(0,y,W,2);
    if(Game.hitFlash>0){const i=Game.hitFlash/22;ctx.save();ctx.globalAlpha=i*.15;ctx.drawImage(canvas,-3,0,W,H);ctx.globalAlpha=i*.10;ctx.drawImage(canvas,3,0,W,H);ctx.restore();ctx.fillStyle=`rgba(255,0,0,${i*.12})`;ctx.fillRect(0,0,W,H);}
    if(Game.screenFlash>0){ctx.fillStyle=Utils.hexRGBA(Game.screenFlashColor,(Game.screenFlash/Game.screenFlashDur)*.65);ctx.fillRect(0,0,W,H);}
    if(Level.currentZone===5){ctx.save();ctx.globalAlpha=0.03+Math.sin(_tick*.04)*.01;ctx.drawImage(canvas,Math.sin(_tick*.03)*2,Math.cos(_tick*.04)*2,W,H);ctx.restore();}
    if(Level.currentZone===6){ctx.save();ctx.globalAlpha=0.06+Math.sin(_tick*.07)*.03;ctx.drawImage(canvas,-1,0,W+1,H);ctx.restore();}
    if(_tick%2===0){for(let i=0;i<60;i++){ctx.fillStyle=`rgba(255,255,255,${Math.random()*.018})`;ctx.fillRect(Math.random()*W,Math.random()*H,1,1);}}
    if(Weapons.charging){const cp=Weapons.chargeTimer/(CONFIG.WEAPONS[Weapons.currentWpn]?.chargeDuration||90);ctx.strokeStyle=`rgba(255,136,0,${cp*.5})`;ctx.lineWidth=4+cp*8;ctx.strokeRect(2,2,W-4,H-4);}
  };

  const _drawMinimap=()=>{
    const mm=document.getElementById('minimap'); if(!mm)return;
    const mc=mm.getContext('2d'),mW=mm.width,mH=mm.height;
    const sx=mW/CONFIG.WORLD_W,sy=mH/CONFIG.WORLD_H;
    mc.clearRect(0,0,mW,mH); mc.fillStyle='rgba(2,8,20,0.88)'; mc.fillRect(0,0,mW,mH);
    for(const pk of Level.pickups){mc.fillStyle=pk.type==='HEALTH'?'#00ff88':pk.type==='SHIELD'?'#0088ff':'#ff8800';mc.beginPath();mc.arc(pk.x*sx,pk.y*sy,2,0,Math.PI*2);mc.fill();}
    for(const ln of Story.logNodes){if(ln.collected)continue;mc.fillStyle='#00f5ff';mc.beginPath();mc.arc(ln.x*sx,ln.y*sy,2,0,Math.PI*2);mc.fill();}
    for(const e of EnemyMgr.enemies){if(!e.alive)continue;mc.fillStyle=e.elite?'#ffee00':e.color;mc.beginPath();mc.arc(e.x*sx,e.y*sy,e.elite?3:2,0,Math.PI*2);mc.fill();}
    if(BossMgr.alive){const b=BossMgr.get();if(b){mc.fillStyle='#fff';mc.shadowColor='#fff';mc.shadowBlur=5;mc.beginPath();mc.arc(b.x*sx,b.y*sy,4,0,Math.PI*2);mc.fill();mc.shadowBlur=0;}}
    const sc=Player.shipDef?.color||'#00f5ff';
    mc.fillStyle=sc;mc.shadowColor=sc;mc.shadowBlur=6;
    mc.beginPath();mc.arc(Player.x*sx,Player.y*sy,3,0,Math.PI*2);mc.fill();mc.shadowBlur=0;
    mc.strokeStyle=sc;mc.lineWidth=1;mc.beginPath();mc.moveTo(Player.x*sx,Player.y*sy);mc.lineTo(Player.x*sx+Math.cos(Player.angle)*7,Player.y*sy+Math.sin(Player.angle)*7);mc.stroke();
    mc.strokeStyle='rgba(0,200,255,0.22)';mc.lineWidth=1;mc.strokeRect(Camera.x*sx,Camera.y*sy,Camera.W*sx,Camera.H*sy);
    mc.strokeStyle='rgba(0,200,255,0.3)';mc.strokeRect(0,0,mW,mH);
  };

  const _drawCrosshair=()=>{
    const mx=Input.mouse.x,my=Input.mouse.y;
    const ov=Weapons.overheated,ch=Weapons.charging;
    const col=ov?'#ff4444':ch?'#ff8800':'#00f5ff';
    const size=ov?16:ch?14:11,gap=ch?6:4;
    ctx.save(); ctx.strokeStyle=col; ctx.lineWidth=1.5; ctx.shadowColor=col; ctx.shadowBlur=5;
    ctx.beginPath();
    ctx.moveTo(mx-size,my);ctx.lineTo(mx-gap,my);ctx.moveTo(mx+gap,my);ctx.lineTo(mx+size,my);
    ctx.moveTo(mx,my-size);ctx.lineTo(mx,my-gap);ctx.moveTo(mx,my+gap);ctx.lineTo(mx,my+size);
    ctx.stroke();
    ctx.fillStyle=col;ctx.beginPath();ctx.arc(mx,my,2,0,Math.PI*2);ctx.fill();
    if(Game.muzzleFlash>0){ctx.globalAlpha=Game.muzzleFlash/8;ctx.beginPath();ctx.arc(mx,my,14,0,Math.PI*2);ctx.stroke();}
    if(ch){const cp=Weapons.chargeTimer/(CONFIG.WEAPONS[Weapons.currentWpn]?.chargeDuration||90);ctx.globalAlpha=.7;ctx.strokeStyle='#ff8800';ctx.lineWidth=2;ctx.beginPath();ctx.arc(mx,my,18,-Math.PI/2,-Math.PI/2+cp*Math.PI*2);ctx.stroke();}
    ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();
  };

  let _titleTick=0;
  const drawTitleBg=()=>{
    _titleTick++;
    const tc=document.getElementById('title-bg'); if(!tc)return;
    tc.width=window.innerWidth; tc.height=window.innerHeight;
    const tc2=tc.getContext('2d'),TW=tc.width,TH=tc.height,t=_titleTick;
    const bg=tc2.createRadialGradient(TW*.5,TH*.5,0,TW*.5,TH*.5,TH*.8);
    bg.addColorStop(0,'#04081a');bg.addColorStop(1,'#010208');
    tc2.fillStyle=bg;tc2.fillRect(0,0,TW,TH);
    for(let i=0;i<200;i++){const sx=(Math.sin(i*1.73+t*.002)*.5+.5)*TW,sy=((i/200)*TH+t*(0.15+(i%5)*.04))%TH;tc2.fillStyle=`rgba(200,220,255,${.04+Math.sin(t*.04+i)*.03})`;tc2.beginPath();tc2.arc(sx,sy,.5+Math.sin(i)*.5,0,Math.PI*2);tc2.fill();}
    const cols=['rgba(80,0,150,','rgba(0,60,180,','rgba(100,0,60,'];
    for(let i=0;i<5;i++){const nx=(Math.sin(i*1.3+t*.003)*.5+.5)*TW,ny=(Math.cos(i*.9+t*.002)*.5+.5)*TH,nr=200+Math.sin(t*.01+i)*80;const ng=tc2.createRadialGradient(nx,ny,0,nx,ny,nr);ng.addColorStop(0,cols[i%cols.length]+'.07)');ng.addColorStop(1,'rgba(0,0,0,0)');tc2.fillStyle=ng;tc2.beginPath();tc2.arc(nx,ny,nr,0,Math.PI*2);tc2.fill();}
    const hexS=70;tc2.strokeStyle='rgba(0,100,200,0.045)';tc2.lineWidth=1;
    for(let row=0;row<Math.ceil(TH/hexS)+1;row++){for(let col=0;col<Math.ceil(TW/(hexS*1.5))+1;col++){const hx=col*hexS*1.5,hy=row*hexS*1.732+(col%2?hexS*.866:0);tc2.beginPath();for(let k=0;k<6;k++){const a=(k/6)*Math.PI*2+Math.PI/6;if(k===0)tc2.moveTo(hx+Math.cos(a)*hexS*.5,hy+Math.sin(a)*hexS*.5);else tc2.lineTo(hx+Math.cos(a)*hexS*.5,hy+Math.sin(a)*hexS*.5);}tc2.closePath();tc2.stroke();}}
    const sweep=(t*2)%TH,swg=tc2.createLinearGradient(0,sweep-80,0,sweep+80);
    swg.addColorStop(0,'rgba(0,200,255,0)');swg.addColorStop(.5,'rgba(0,200,255,0.035)');swg.addColorStop(1,'rgba(0,200,255,0)');
    tc2.fillStyle=swg;tc2.fillRect(0,sweep-80,TW,160);
    tc2.fillStyle='rgba(0,0,0,0.055)';for(let y=0;y<TH;y+=4)tc2.fillRect(0,y,TW,2);
    requestAnimationFrame(drawTitleBg);
  };

  const drawShipPreview=(shipId,tick)=>{
    const pc=document.getElementById('ship-preview-canvas'); if(!pc)return;
    const pc2=pc.getContext('2d'); pc2.clearRect(0,0,320,320);
    pc2.fillStyle='#010510';pc2.fillRect(0,0,320,320);
    pc2.strokeStyle='rgba(0,100,200,.06)';pc2.lineWidth=1;
    for(let i=0;i<320;i+=40){pc2.beginPath();pc2.moveTo(i,0);pc2.lineTo(i,320);pc2.stroke();pc2.beginPath();pc2.moveTo(0,i);pc2.lineTo(320,i);pc2.stroke();}
    pc2.save();pc2.translate(160,160);pc2.rotate(tick*.008);
    const ship=CONFIG.SHIPS[shipId]||CONFIG.SHIPS[0];
    pc2.scale(2.2,2.2);
    const gg=pc2.createRadialGradient(0,0,0,0,0,50);
    gg.addColorStop(0,Utils.hexRGBA(ship.color,.2));gg.addColorStop(1,'rgba(0,0,0,0)');
    pc2.fillStyle=gg;pc2.beginPath();pc2.arc(0,0,50,0,Math.PI*2);pc2.fill();
    pc2.fillStyle=ship.color;pc2.shadowColor=ship.color;pc2.shadowBlur=18;
    pc2.beginPath();pc2.moveTo(22,0);pc2.lineTo(4,-9);pc2.lineTo(-16,-7);pc2.lineTo(-20,0);pc2.lineTo(-16,7);pc2.lineTo(4,9);pc2.closePath();pc2.fill();
    pc2.fillStyle=ship.accentColor;pc2.shadowColor=ship.accentColor;pc2.shadowBlur=12;
    pc2.beginPath();pc2.ellipse(9,0,7,4,0,0,Math.PI*2);pc2.fill();pc2.shadowBlur=0;
    pc2.restore();
  };

  return{init,render,drawTitleBg,drawShipPreview,get W(){return W;},get H(){return H;},get ctx(){return ctx;}};
})();