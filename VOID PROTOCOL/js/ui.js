// ui.js — HUD, messages, popups, screens, DOM wiring
const UI = (() => {
  const $=(id)=>document.getElementById(id);

  const el={
    barHull:    $('bar-hull'),    barShield: $('bar-shield'),
    barBoost:   $('bar-boost'),   barHeat:   $('bar-heat'),
    valHull:    $('val-hull'),    valShield: $('val-shield'),
    valScore:   $('val-score'),   valKills:  $('val-kills'),
    valTime:    $('val-time'),    valCreditsHud:$('val-credits-hud'),
    valCombo:   $('val-combo'),   hudCombo:  $('hud-combo'),
    hudZone:    $('hud-zone'),    hudObj:    $('hud-objective'),
    overheatSt: $('val-overheat-state'),
    weapSlots:  $('weapon-slots'),
    bossBarWrap:$('boss-bar-wrap'),bossFill:  $('boss-bar-inner'),
    bossTitle:  $('boss-bar-title'),bossPhLabel:$('boss-bar-phase-label'),
    bossMarkers:$('boss-phase-markers'),
    centerMsg:  $('center-msg'),
    storyBox:   $('story-box'),   sbHeader:  $('sb-header'),sbBody:$('sb-body'),
    txBox:      $('transmission-box'),txSender:$('tx-sender'),txBody:$('tx-body'),
    achToast:   $('achievement-toast'),achName:$('ach-name-toast'),
    pauseOv:    $('pause-overlay'),
    lowHealthOv:$('low-health-overlay'),
    warpOv:     $('warp-overlay'),
    screenGame: $('screen-game'),
    screenOver: $('screen-gameover'),
    screenTitle:$('screen-title'),
  };

  let msgTimer=null, txTimer=null, achTimer=null, interactTimer=null;
  let _previewTick=0;

  /* ── HUD UPDATE (every frame) ── */
  const updateHUD=()=>{
    if(!Player||!Player.alive)return;

    // Hull bar
    const hp=Player.hp/Player.maxHp;
    el.barHull.style.width=(hp*100)+'%';
    el.barHull.style.background=hp>.55?'#00ff88':hp>.28?'#ffcc00':'#ff2244';
    el.valHull.textContent=Math.ceil(Player.hp);

    // Shield
    const sp=Player.shield/Player.maxShield;
    el.barShield.style.width=(sp*100)+'%';
    el.valShield.textContent=Math.ceil(Player.shield);

    // Boost cooldown
    const bp=Utils.clamp(1-Player.boostCooldown/CONFIG.PLAYER.BOOST_COOLDOWN,0,1);
    el.barBoost.style.width=(bp*100)+'%';
    el.barBoost.style.background=bp>=1?'#ffaa00':'#555';

    // Heat
    const heatP=Weapons.heat/CONFIG.MAX_HEAT;
    el.barHeat.style.width=(heatP*100)+'%';
    el.barHeat.style.background=heatP>.7?'#ff2244':heatP>.4?'#ff8800':'#ff6600';
    el.overheatSt.textContent=Weapons.overheated?'OVERHEATED':Weapons.charging?'CHARGING':'';

    // Weapon slots
    _updateWeaponSlots();

    // Score / credits / kills
    el.valScore.textContent=Player.score.toLocaleString();
    el.valCreditsHud.textContent=Player.credits.toLocaleString();
    el.valKills.textContent=Player.kills;

    // Combo
    if(Player.comboCount>2){
      el.hudCombo.style.display='block';
      el.valCombo.textContent=Player.comboMult.toFixed(1);
      el.hudCombo.style.color=Player.comboMult>=5?'#ff8800':'#ffee00';
    } else {
      el.hudCombo.style.display='none';
    }

    // Timer
    if(Game._startTime){
      const s=Math.floor((Date.now()-Game._startTime)/1000);
      el.valTime.textContent=`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
    }

    // Boss bar
    if(BossMgr.alive){
      const pct=Math.max(0,BossMgr.hp/BossMgr.maxHp*100);
      el.bossFill.style.width=pct+'%';
      el.bossPhLabel.textContent=`PHASE ${BossMgr.phase}`;
    }

    // Low health overlay
    el.lowHealthOv.style.display=Player.hp>0&&Player.hp/Player.maxHp<.25?'block':'none';
  };

  const _updateWeaponSlots=()=>{
    el.weapSlots.innerHTML='';
    for(const [id,wDef] of CONFIG.WEAPONS.entries()){
      if(!Weapons.unlockedSet.has(id))continue;
      const slot=document.createElement('div');
      slot.className='wpn-slot'+(Weapons.currentWpn===id?' active':'')+(Weapons.overheated&&Weapons.currentWpn===id?' overheated':'');
      const ammoTxt=wDef.ammo<0?'∞':Weapons.ammo[id];
      slot.innerHTML=`<div class="wpn-key">[${wDef.key}]</div><div class="wpn-name">${wDef.name}</div><div class="wpn-ammo" style="color:${wDef.color}">${ammoTxt}</div>`;
      el.weapSlots.appendChild(slot);
    }
  };

  const updateMission=(title,obj)=>{
    if(el.hudZone)el.hudZone.textContent=title;
    if(el.hudObj)el.hudObj.textContent=obj||'—';
  };
  const updateObjective=(txt)=>{ if(el.hudObj)el.hudObj.textContent=txt; };

  /* ── MESSAGES ── */
  const showMessage=(txt,dur=2500,col='#ffee00')=>{
    if(!el.centerMsg)return;
    el.centerMsg.innerHTML=txt.replace(/\n/g,'<br>');
    el.centerMsg.style.display='block';
    el.centerMsg.style.color=col;
    el.centerMsg.style.textShadow=`0 0 20px ${col}`;
    if(msgTimer)clearTimeout(msgTimer);
    msgTimer=setTimeout(()=>{el.centerMsg.style.display='none';},dur);
  };

  const showBriefMsg=(txt,col='#0ff')=>{
    const div=document.createElement('div');
    div.className='float-dmg';
    div.textContent=txt; div.style.color=col;
    div.style.left=(window.innerWidth/2-60)+'px';
    div.style.top=(window.innerHeight/2-80)+'px';
    div.style.fontSize='18px';
    el.screenGame?.appendChild(div);
    setTimeout(()=>div.remove(),900);
  };

  const showDmgNumber=(wx,wy,dmg,col='#fff')=>{
    const scr=Camera.toScreen(wx,wy);
    const div=document.createElement('div');
    div.className='float-dmg';
    div.textContent=dmg>0?`-${dmg}`:`+${Math.abs(dmg)}`;
    div.style.color=col;
    div.style.left=(scr.x+Utils.rndF(-18,18))+'px';
    div.style.top=(scr.y-24)+'px';
    div.style.fontSize=dmg>80?'22px':dmg>40?'16px':'13px';
    el.screenGame?.appendChild(div);
    setTimeout(()=>div.remove(),900);
  };

  /* ── BOSS BAR ── */
  const showBossBar=(name,phases=2)=>{
    if(!el.bossBarWrap)return;
    el.bossBarWrap.style.display='block';
    el.bossTitle.textContent=name;
    el.bossFill.style.width='100%';
    // Phase markers
    el.bossMarkers.innerHTML='';
    for(let i=0;i<phases-1;i++){
      const m=document.createElement('div');
      m.className='bpm';
      m.style.borderRight='1px solid rgba(255,255,255,.3)';
      el.bossMarkers.appendChild(m);
    }
  };
  const hideBossBar=()=>{ if(el.bossBarWrap)el.bossBarWrap.style.display='none'; };
  const updateBossBar=(pct)=>{ if(el.bossFill)el.bossFill.style.width=Utils.clamp(pct*100,0,100)+'%'; };

  /* ── STORY / POPUP ── */
  const showStoryBox=(title,body)=>{
    if(!el.storyBox)return;
    el.sbHeader.textContent=title;
    el.sbBody.textContent=body;
    el.storyBox.style.display='block';
  };
  const hideStoryBox=()=>{ if(el.storyBox)el.storyBox.style.display='none'; };

  /* ── TRANSMISSION ── */
  const showTransmission=(sender,text)=>{
    if(!el.txBox)return;
    el.txSender.textContent=sender;
    el.txBody.textContent=text;
    el.txBox.style.display='block';
    Audio.play('transmit');
    if(txTimer)clearTimeout(txTimer);
    txTimer=setTimeout(()=>{ el.txBox.style.display='none'; },5000);
  };

  /* ── ACHIEVEMENT TOAST ── */
  const showAchievementToast=(name)=>{
    if(!el.achToast)return;
    el.achName.textContent=name;
    el.achToast.style.display='flex';
    if(achTimer)clearTimeout(achTimer);
    achTimer=setTimeout(()=>{ el.achToast.style.display='none'; },3500);
  };

  /* ── WEAPON UNLOCK ── */
  const showWeaponUnlock=(wDef)=>{
    if(!wDef)return;
    const wp=$('weapon-popup');
    if(!wp)return;
    $('wpn-popup-name').textContent=wDef.name;
    $('wpn-popup-stats').textContent=`DMG:${wDef.dmg} | HEAT:${wDef.heat} | AMMO:${wDef.ammo<0?'∞':wDef.ammo} | ${wDef.auto?'AUTO':'SEMI'}`;
    wp.style.display='block';
    setTimeout(()=>{ wp.style.display='none'; },3500);
  };

  /* ── INTERACT HINT ── */
  const showInteractHint=(show,txt='[E] INTERACT')=>{
    if(!el.hudObj)return;
    if(show){
      if(interactTimer)clearTimeout(interactTimer);
      interactTimer=setTimeout(()=>{ },200);
    }
  };

  /* ── SCREEN EFFECTS ── */
  const flashScreen=(col='#fff',intensity=.8,dur=.3)=>{
    const div=document.createElement('div');
    div.className='phase-flash';
    div.style.background=col; div.style.opacity=intensity;
    div.style.transition=`opacity ${dur}s ease-out`;
    document.body.appendChild(div);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ div.style.opacity=0; }));
    setTimeout(()=>div.remove(),(dur*1000)+100);
  };
  const triggerHitFlash=()=>{ Game.hitFlash=22; };
  const triggerWarpOverlay=()=>{
    if(!el.warpOv)return;
    el.warpOv.style.display='block';
    el.warpOv.style.opacity=1;
    el.warpOv.style.transition='opacity .6s ease-out';
    setTimeout(()=>{ el.warpOv.style.opacity=0; setTimeout(()=>{ el.warpOv.style.display='none'; },700); },400);
  };

  /* ── ZONE CLEAR BANNER ── */
  const showZoneClearBanner=()=>{
    const div=document.createElement('div');
    div.className='level-clear-banner';
    div.textContent='ZONE CLEARED';
    div.style.cssText='position:absolute;top:40%;left:50%;transform:translate(-50%,-50%);font-family:"Orbitron",sans-serif;font-size:48px;color:#00ff88;text-shadow:0 0 30px #00ff88;letter-spacing:8px;z-index:25;pointer-events:none;';
    el.screenGame?.appendChild(div);
    setTimeout(()=>div.remove(),2500);
  };

  /* ── PAUSE ── */
  const showPause=()=>{ if(el.pauseOv){el.pauseOv.style.display='flex';el.pauseOv.style.pointerEvents='all';} };
  const hidePause=()=>{ if(el.pauseOv){el.pauseOv.style.display='none';el.pauseOv.style.pointerEvents='none';} };

  /* ── GAME OVER / WIN ── */
  const showGameOver=(win,score,kills,zone)=>{
    hidePause();
    el.screenGame.style.display='none';
    el.screenOver.style.display='flex';
    el.screenOver.classList.add('active');
    const title=$('go-title'),sub=$('go-subtitle'),stats=$('go-stats'),lore=$('go-lore');
    if(win){
      title.textContent='THE RIFT IS CLOSED';title.style.color='#00ff88';
      sub.textContent='VOID PROTOCOL — COMPLETE';sub.style.color='#00ff88';
    } else {
      title.textContent='SIGNAL LOST';title.style.color='#ff2244';
      sub.textContent='PHANTOM WING — OFFLINE';sub.style.color='#ff2244';
    }
    if(stats)stats.innerHTML=`FINAL SCORE &nbsp; ${score.toLocaleString()}<br>KILLS &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${kills}<br>ZONE REACHED &nbsp; ${zone+1} / 7`;
    if(lore&&!win)lore.textContent='The Rift remains open. The Void continues its harvest. But somewhere, a pilot proved it could be fought.';
    if(lore&&win)lore.textContent='The Void is silent. Somewhere across a broken solar system, lights flicker back on.';
  };

  const showGameScreen=()=>{
    el.screenGame.style.display='flex';
    el.screenOver.style.display='none';
    el.screenOver.classList.remove('active');
    el.screenTitle.style.display='none';
    el.screenTitle.classList.remove('active');
  };

  /* ── HANGAR UI ── */
  const buildHangarUI=(saveData)=>{
    const list=$('ship-list'); if(!list)return;
    list.innerHTML='';
    for(const ship of CONFIG.SHIPS){
      const locked=!saveData.unlockedShips.includes(ship.id);
      const div=document.createElement('div');
      div.className='ship-card'+(locked?' locked':'')+(saveData.selectedShip===ship.id?' selected':'');
      div.innerHTML=`<div style="color:${ship.color};font-size:13px;letter-spacing:2px">${ship.name}</div><div style="font-size:10px;color:rgba(200,230,255,.5);margin-top:4px">${locked?'LOCKED — ¢'+Shop.SHIP_PRICES[ship.id]:ship.desc}</div>`;
      div.addEventListener('click',()=>{
        if(locked){
          if(Shop.buyShip(ship.id,saveData)){
            $('val-credits').textContent=saveData.credits;
            buildHangarUI(saveData);
          }
        } else {
          saveData.selectedShip=ship.id; Save.save(saveData);
          buildHangarUI(saveData);
          Renderer.drawShipPreview(ship.id,_previewTick);
          $('ship-info').innerHTML=`<b style="color:${ship.color}">${ship.name}</b><br>${ship.desc}<br><br>HULL:${ship.hp} | SPEED:${ship.speed} | SHIELD:${ship.shield}<br>SPECIAL: ${ship.special}`;
        }
      });
      list.appendChild(div);
    }
    Renderer.drawShipPreview(saveData.selectedShip,_previewTick);
    $('val-credits').textContent=saveData.credits;
    $('ship-info').innerHTML=(()=>{const s=CONFIG.SHIPS[saveData.selectedShip];return`<b style="color:${s.color}">${s.name}</b><br>${s.desc}<br><br>HULL:${s.hp} | SPEED:${s.speed} | SHIELD:${s.shield}<br>SPECIAL: ${s.special}`;})();
    SkillTree.buildUI(saveData);
    setInterval(()=>{ _previewTick++; Renderer.drawShipPreview(saveData.selectedShip,_previewTick); },33);
  };

  /* ── ARCHIVES UI ── */
  const buildArchivesUI=(tab,saveData)=>{
    const content=$('archives-content'); if(!content)return;
    content.innerHTML='';
    if(tab==='logs'){
      for(const log of Story.LOGS){
        const got=saveData.achievements.includes('log_'+log.id)||true; // logs show preview
        const div=document.createElement('div');
        div.className='log-entry';
        div.innerHTML=`<div class="log-title">${log.title}</div><div class="log-body">${log.text.substring(0,120)}${log.text.length>120?'...':''}</div>`;
        content.appendChild(div);
      }
    } else if(tab==='achievements'){
      Achievements.buildArchiveUI();
    } else if(tab==='stats'){
      const s=saveData.stats;
      content.innerHTML=`<div class="log-entry"><div class="log-body">TOTAL KILLS: ${s.totalKills||0}<br>TOTAL CREDITS: ${s.totalCredits||0}<br>TIME PLAYED: ${Math.floor((s.totalTime||0)/60)}m ${(s.totalTime||0)%60}s<br>RUNS COMPLETED: ${s.runsCompleted||0}<br>BOSSES KILLED: ${s.bossesKilled||0}</div></div>`;
    }
  };

  /* ── BUTTON WIRING ── */
  const wireButtons=(saveData)=>{
    // Title
    $('btn-newgame')?.addEventListener('click',()=>{ Audio.init();Audio.resume();Audio.play('menu_select');Game.startNewGame(); });
    $('btn-continue')?.addEventListener('click',()=>{ Audio.init();Audio.resume();Audio.play('menu_select');Game.continueGame(saveData); });
    $('btn-hangar')?.addEventListener('click',()=>{ Audio.play('menu_select');_showScreen('screen-hangar');buildHangarUI(saveData); });
    $('btn-archives')?.addEventListener('click',()=>{ Audio.play('menu_select');_showScreen('screen-archives');buildArchivesUI('logs',saveData); });
    $('btn-controls-title')?.addEventListener('click',()=>{ Audio.play('menu_select');alert('WASD/ARROWS: Move\nMOUSE: Aim\nLEFT CLICK/SPACE: Shoot\nSHIFT: Boost\nQ: Special Ability\n1-6: Switch Weapon\nE: Interact\nP/ESC: Pause\nM: Mute'); });
    $('btn-hangar-launch')?.addEventListener('click',()=>{ Audio.play('menu_select');_showScreen('screen-title');});
    $('btn-hangar-back')?.addEventListener('click',()=>{ Audio.play('menu_select');_showScreen('screen-title'); });
    $('btn-archives-back')?.addEventListener('click',()=>{ Audio.play('menu_select');_showScreen('screen-title'); });
    // Archive tabs
    document.querySelectorAll('.tab-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        buildArchivesUI(btn.dataset.tab,saveData);
      });
    });
    // Pause
    $('btn-resume')?.addEventListener('click',()=>{ Audio.play('menu_select');Game.resume();hidePause(); });
    $('btn-pause-hangar')?.addEventListener('click',()=>{ Audio.play('menu_select');Game.resume();hidePause();_showScreen('screen-hangar');buildHangarUI(saveData); });
    $('btn-quit-menu')?.addEventListener('click',()=>{ location.reload(); });
    // Game Over
    $('btn-retry')?.addEventListener('click',()=>{ Audio.play('menu_select');Game.retryZone(); });
    $('btn-go-menu')?.addEventListener('click',()=>{ location.reload(); });
    // Story popup
    $('story-box')?.addEventListener('click',()=>{ Story.closePopup(); });
    // Cutscene
    $('screen-cutscene')?.addEventListener('click',()=>{ Story.skipCutscene(); });
  };

  const _showScreen=(id)=>{
    document.querySelectorAll('.screen').forEach(s=>{ s.style.display='none'; s.classList.remove('active'); });
    const sc=$(id); if(sc){ sc.style.display='flex'; sc.classList.add('active'); }
  };

  return{
    updateHUD,updateMission,updateObjective,
    showMessage,showBriefMsg,showDmgNumber,
    showBossBar,hideBossBar,updateBossBar,
    showStoryBox,hideStoryBox,showTransmission,
    showAchievementToast,showWeaponUnlock,showInteractHint,
    flashScreen,triggerHitFlash,triggerWarpOverlay,
    showZoneClearBanner,showPause,hidePause,
    showGameOver,showGameScreen,
    buildHangarUI,buildArchivesUI,wireButtons,
  };
})();