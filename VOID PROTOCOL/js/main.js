// main.js — Entry point, boot sequence
document.addEventListener('DOMContentLoaded',()=>{
  // Ensure all screens start hidden except title
  document.querySelectorAll('.screen').forEach(s=>{s.style.display='none';s.classList.remove('active');});
  const title=document.getElementById('screen-title');
  if(title){title.style.display='flex';title.classList.add('active');}

  // Boot game engine
  Game.init();

  // Space bar starts from title
  document.addEventListener('keydown',(e)=>{
    if(e.key==='Enter'&&Game.state===Game.STATE.TITLE){
      Audio.init();Audio.resume();Game.startNewGame();
    }
  });

  // First click initialises audio (browser policy)
  document.addEventListener('click',()=>{Audio.init();Audio.resume();},{once:true});

  // Prevent right-click
  document.getElementById('game-canvas')?.addEventListener('contextmenu',e=>e.preventDefault());

  console.log('%c VOID PROTOCOL — READY ','background:#00f5ff;color:#000;font-weight:bold;padding:4px 8px;');
  console.log('%c Serve via Live Server or python -m http.server 8080','color:#0af');
});

window.addEventListener('error',(e)=>{
  console.error('[VOID PROTOCOL]',e.message,'@',e.filename,'line',e.lineno);
});