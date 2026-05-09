// ═══════════════════════════════════════════════════════════
//  input.js
// ═══════════════════════════════════════════════════════════
const Input = (() => {
  const keys={}, jd={}, ju={};
  const mouse={x:0,y:0,wx:0,wy:0,left:false,right:false,jl:false};

  window.addEventListener('keydown',e=>{
    const k=e.key.toLowerCase();
    if(!keys[k])jd[k]=true;
    keys[k]=true;
    if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d',' '].includes(k))e.preventDefault();
  });
  window.addEventListener('keyup',e=>{const k=e.key.toLowerCase();keys[k]=false;ju[k]=true;});
  window.addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;});
  window.addEventListener('mousedown',e=>{if(e.button===0){mouse.left=true;mouse.jl=true;}if(e.button===2)mouse.right=true;});
  window.addEventListener('mouseup',e=>{if(e.button===0)mouse.left=false;if(e.button===2)mouse.right=false;});
  window.addEventListener('contextmenu',e=>e.preventDefault());

  const isDown =k=>!!keys[k];
  const wasDown=k=>{const v=!!jd[k];jd[k]=false;return v;};
  const wasUp  =k=>{const v=!!ju[k];ju[k]=false;return v;};

  const getMove=()=>{
    let dx=0,dy=0;
    if(isDown('a')||isDown('arrowleft'))dx-=1;
    if(isDown('d')||isDown('arrowright'))dx+=1;
    if(isDown('w')||isDown('arrowup'))dy-=1;
    if(isDown('s')||isDown('arrowdown'))dy+=1;
    const[nx,ny]=Utils.norm(dx,dy);
    return{dx:dx?nx:0,dy:dy?ny:0,moving:!!(dx||dy)};
  };
  const isShooting =()=>mouse.left||isDown(' ');
  const isBoost    =()=>wasDown('shift');
  const isInteract =()=>wasDown('e');
  const isPause    =()=>wasDown('p')||wasDown('escape');
  const isMute     =()=>wasDown('m');
  const getWpnKey  =()=>{for(let i=1;i<=6;i++)if(wasDown(String(i)))return i-1;return -1;};
  const flushJust  =()=>{for(const k in jd)jd[k]=false;for(const k in ju)ju[k]=false;mouse.jl=false;};
  const updateWorld=(cx,cy)=>{mouse.wx=mouse.x+cx;mouse.wy=mouse.y+cy;};

  return{isDown,wasDown,wasUp,getMove,isShooting,isBoost,isInteract,isPause,isMute,getWpnKey,flushJust,updateWorld,mouse,keys};
})();