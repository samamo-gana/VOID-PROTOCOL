// camera.js — Smooth follow + screenshake + cinematic
const Camera = (() => {
  let x=0,y=0,tx=0,ty=0,shX=0,shY=0,shMag=0,shDur=0,W=0,H=0,zoom=1,targetZoom=1;
  const init=(w,h)=>{ W=w;H=h; };
  const resize=(w,h)=>{ W=w;H=h; };
  const setTarget=(tx2,ty2)=>{ tx=tx2;ty=ty2; };
  const shake=(mag,dur)=>{ shMag=Math.max(shMag,mag);shDur=Math.max(shDur,dur); };
  const update=()=>{
    x=Utils.lerp(x,tx-W/2,CONFIG.CAMERA.LERP);
    y=Utils.lerp(y,ty-H/2,CONFIG.CAMERA.LERP);
    x=Utils.clamp(x,0,Math.max(0,CONFIG.WORLD_W-W));
    y=Utils.clamp(y,0,Math.max(0,CONFIG.WORLD_H-H));
    zoom=Utils.lerp(zoom,targetZoom,0.05);
    if(shDur>0){shX=(Math.random()*2-1)*shMag;shY=(Math.random()*2-1)*shMag;shDur--;shMag*=CONFIG.CAMERA.SHAKE_DECAY;}
    else{shX*=0.8;shY*=0.8;}
  };
  const begin=(ctx)=>{ ctx.save();ctx.translate(Math.round(-x+shX),Math.round(-y+shY)); };
  const end=(ctx)=>{ ctx.restore(); };
  const toWorld=(sx,sy)=>({x:sx+x-shX,y:sy+y-shY});
  const toScreen=(wx,wy)=>({x:wx-x+shX,y:wy-y+shY});
  const visible=(wx,wy,margin=60)=>wx>=x-margin&&wx<=x+W+margin&&wy>=y-margin&&wy<=y+H+margin;
  const rectVisible=(rx,ry,rw,rh,m=40)=>rx+rw>=x-m&&rx<=x+W+m&&ry+rh>=y-m&&ry<=y+H+m;
  const setZoom=(z)=>{ targetZoom=z; };
  const startIntroCam=(fromX,fromY,toX,toY,dur=180,cb)=>{
    let t=0;
    const step=()=>{ t++;const prog=Utils.clamp(t/dur,0,1),e=prog<.5?2*prog*prog:(4-2*prog)*prog-1;
      x=Utils.lerp(fromX,toX,e)-W/2;y=Utils.lerp(fromY,toY,e)-H/2;
      if(t<dur)requestAnimationFrame(step);else if(cb)cb(); };
    requestAnimationFrame(step);
  };
  return{init,resize,setTarget,shake,update,begin,end,toWorld,toScreen,visible,rectVisible,setZoom,startIntroCam,
    get x(){return x;},get y(){return y;},get W(){return W;},get H(){return H;},get shX(){return shX;},get shY(){return shY;}};
})();