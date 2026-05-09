// game.js — Core game loop, state machine, global FX state
const Game = (() => {
  const STATE={TITLE:'title',CUTSCENE:'cutscene',PLAYING:'playing',PAUSED:'paused',DEAD:'dead',WIN:'win'};
  let state=STATE.TITLE,tick=0,_saveData=null;

  // Visual FX (read by Renderer / UI)
  let hitFlash=0,muzzleFlash=0,screenFlash=0,screenFlashDur=20,screenFlashColor='#fff';

  // Timing
  let _startTime=0,_zoneTime=0;

  // Reference for environment gravity
  let playerRef=null;

  /* ── INIT ── */
  const init=()=>{
    _saveData=Save.load();
    Renderer.init($('game-canvas'));
    Audio.init();
    SkillTree.load(_saveData);
    Achievements.load(_saveData);
    Shop.init(_saveData);
    UI.wireButtons(_saveData);

    // Enable continue if zones completed
    if(_saveData.completedZones&&_saveData.completedZones.length>0){
      $('btn-continue').disabled=false;
    }

    Renderer.drawTitleBg();
  };

  const $=(id)=>document.getElementById(id);

  /* ── NEW GAME ── */
  const startNewGame=()=>{
    _saveData.selectedShip=_saveData.selectedShip||0;
    Weapons.reset();
    Player.resetRunStats();
    state=STATE.CUTSCENE;
    Story.playCutscene('intro',()=>{
      _launchZone(0);
    });
  };

  /* ── CONTINUE (resume from last completed zone +1) ── */
  const continueGame=(sd)=>{
    const nextZone=Math.min((sd.completedZones?.length||0),6);
    Weapons.reset();
    Player.resetRunStats();
    _launchZone(nextZone);
  };

  /* ── LAUNCH ZONE ── */
  const _launchZone=(zi)=>{
    UI.showGameScreen();
    state=STATE.PLAYING;
    tick=0; _startTime=Date.now(); _zoneTime=Date.now();
    Level.load(zi,_saveData);
    playerRef=Player;

    // Apply unlocked weapons from save
    for(const wid of(_saveData.unlockedWeapons||[0]))Weapons.unlock(wid);

    Audio.startAmbient();
    Audio.startEngine();

    // Cinematic intro camera pan to player
    Camera.startIntroCam(
      CONFIG.WORLD_W/2,CONFIG.WORLD_H/2,
      Player.x,Player.y,
      140,null
    );

    _loop();
  };

  /* ── NEXT ZONE ── */
  const nextZone=()=>{
    const next=Level.currentZone+1;
    if(next>6){triggerWin();return;}
    Weapons.clearBullets();

    // Zone-specific cutscene IDs
    const cs=[null,'zone1_intro','zone2_intro','zone3_intro','zone4_intro','zone5_intro','zone6_intro'];
    const csId=cs[next];
    const doLaunch=()=>{
      UI.showGameScreen();
      state=STATE.PLAYING;
      _launchZone(next);
    };
    if(csId){state=STATE.CUTSCENE;Story.playCutscene(csId,doLaunch);}
    else doLaunch();
  };

  const retryZone=()=>{
    Weapons.reset();
    state=STATE.PLAYING;
    document.getElementById('screen-gameover').style.display='none';
    document.getElementById('screen-gameover').classList.remove('active');
    _launchZone(Level.currentZone);
    UI.showGameScreen();
  };

  const triggerWin=()=>{
    state=STATE.WIN;
    Audio.stopMusic();
    Audio.setLowHealthAlarm(false);
    Achievements.notify('win');
    _saveData.stats.runsCompleted=(_saveData.stats.runsCompleted||0)+1;
    Save.save(_saveData);
    Story.playCutscene('win',()=>{
      UI.showGameOver(true,Player.score,Player.kills,Level.currentZone);
    });
  };

  const triggerDeath=()=>{
    state=STATE.DEAD;
    Missions.onPlayerDied();
    Audio.stopMusic();
    Audio.setLowHealthAlarm(false);
    _saveData.stats.totalKills=(_saveData.stats.totalKills||0)+Player.kills;
    Save.save(_saveData);
    setTimeout(()=>{
      UI.showGameOver(false,Player.score,Player.kills,Level.currentZone);
    },2200);
  };

  /* ── PAUSE ── */
  const pause=()=>{ if(state!==STATE.PLAYING)return;state=STATE.PAUSED;UI.showPause();Audio.stopMusic(); };
  const resume=()=>{ if(state!==STATE.PAUSED)return;state=STATE.PLAYING;Audio.startMusic(Level.currentZone); };

  /* ── SCREEN FX helpers ── */
  const doScreenFlash=(col='#fff',dur=20)=>{
    screenFlashColor=col; screenFlashDur=dur; screenFlash=dur; UI.flashScreen(col,.55,.3);
  };

  /* ══════════════════════════════════════════
     MAIN UPDATE
  ══════════════════════════════════════════ */
  const _update=()=>{
    tick++;
    if(hitFlash>0)hitFlash--;
    if(muzzleFlash>0)muzzleFlash--;
    if(screenFlash>0)screenFlash--;

    if(state===STATE.PAUSED){
      if(Input.isPause())resume();
      return;
    }
    if(state!==STATE.PLAYING)return;

    // Global input checks
    if(Input.isPause()){ if(Story.popupActive)Story.closePopup(); else pause(); return; }
    if(Input.isMute()){ Audio.toggleMute(); UI.showBriefMsg(Audio.muted?'MUTED':'UNMUTED','#0ff'); }

    // Update camera target
    Camera.setTarget(Player.x,Player.y);

    // Core system updates
    Player.update();
    EnemyMgr.update(Level.currentZone);
    BossMgr.update();
    Weapons.update([],EnemyMgr.getAlive(),BossMgr.alive?BossMgr.get():null,Player);
    Particles.update();
    Environment.update(Player.x,Player.y);
    Level.update(_saveData);
    Story.update();
    Missions.update();

    // Muzzle flash tracking
    if(Input.isShooting()&&!Weapons.overheated)muzzleFlash=5;

    // Player death
    if(!Player.alive&&Player.deathTimer<=0&&state===STATE.PLAYING)triggerDeath();

    // Track credits for missions
    // (handled in Player.addCredits via Missions.onCreditEarned)

    // Save total time periodically
    if(tick%600===0){
      _saveData.stats.totalTime=(_saveData.stats.totalTime||0)+10;
      Save.save(_saveData);
    }

    // Achievements — credits
    Achievements.notify('credits',Player.credits);

    // HUD
    UI.updateHUD();
  };

  /* ── LOOP ── */
  let _loopRunning=false;
  const _loop=()=>{
    _loopRunning=true;
    const step=()=>{
      if(state===STATE.PLAYING||state===STATE.PAUSED||state===STATE.DEAD){
        _update();
        if(state!==STATE.CUTSCENE)Renderer.render(tick);
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  return{
    init,startNewGame,continueGame,nextZone,retryZone,triggerWin,triggerDeath,
    pause,resume,doScreenFlash,
    get tick(){return tick;},
    get state(){return state;},
    get hitFlash(){return hitFlash;},set hitFlash(v){hitFlash=v;},
    get muzzleFlash(){return muzzleFlash;},set muzzleFlash(v){muzzleFlash=v;},
    get screenFlash(){return screenFlash;},
    get screenFlashDur(){return screenFlashDur;},
    get screenFlashColor(){return screenFlashColor;},
    get _startTime(){return _startTime;},
    get playerRef(){return playerRef;},
    STATE,
  };
})();