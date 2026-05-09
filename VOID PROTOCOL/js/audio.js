// ═══════════════════════════════════════════════════════════
//  audio.js — Advanced procedural Web Audio engine
// ═══════════════════════════════════════════════════════════
const Audio = (() => {
  let ac=null, master=null, musicNode=null, musicInterval=null;
  let muted=false, musicVol=0.5, sfxVol=0.7;
  let ambientOsc=null, ambientGain=null;
  let engineOsc=null,  engineGain=null;
  let lowHealthBeep=null;

  const init=()=>{
    if(ac)return;
    ac=new(window.AudioContext||window.webkitAudioContext)();
    master=ac.createGain(); master.gain.value=muted?0:1;
    master.connect(ac.destination);
  };
  const resume=()=>{ if(ac&&ac.state==='suspended')ac.resume(); };
  const toggleMute=()=>{ muted=!muted; if(master)master.gain.value=muted?0:1; };

  // ── Generic oscillator synth
  const osc=(type='square',freq=440,freqEnd,dur=0.15,gainStart=0.3,gainEnd=0.001,filter,filterF=2000,delay=0,dest)=>{
    if(!ac||muted)return;
    const t=ac.currentTime+delay;
    const o=ac.createOscillator(), g=ac.createGain();
    o.type=type; o.frequency.setValueAtTime(freq,t);
    if(freqEnd!=null)o.frequency.exponentialRampToValueAtTime(Math.max(1,freqEnd),t+dur);
    g.gain.setValueAtTime(gainStart,t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001,gainEnd),t+dur);
    const d=dest||master;
    if(filter){const f=ac.createBiquadFilter();f.type=filter;f.frequency.value=filterF;o.connect(f);f.connect(g);}
    else o.connect(g);
    g.connect(d); o.start(t); o.stop(t+dur+0.05);
  };

  // ── Noise
  const noise=(dur=0.1,vol=0.3,filterF=2000,filterType='bandpass',dest)=>{
    if(!ac||muted)return;
    const len=ac.sampleRate*dur, buf=ac.createBuffer(1,len,ac.sampleRate);
    const d=buf.getChannelData(0); for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
    const s=ac.createBufferSource(), g=ac.createGain(), f=ac.createBiquadFilter();
    s.buffer=buf; f.type=filterType; f.frequency.value=filterF;
    g.gain.setValueAtTime(vol,ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+dur);
    s.connect(f); f.connect(g); g.connect(dest||master);
    s.start(); s.stop(ac.currentTime+dur);
  };

  // ── SFX Library
  const SFX={
    shoot_laser:   ()=>{ osc('square',1200,200,.08,.2); noise(.04,.15,5000); },
    shoot_plasma:  ()=>{ osc('sine',300,700,.12,.25); osc('square',600,100,.12,.12,.05); },
    shoot_shotgun: ()=>{ noise(.08,.4,3000,'bandpass'); osc('square',250,50,.15,.3); },
    shoot_missile: ()=>{ noise(.25,.3,800,'lowpass'); osc('sawtooth',400,80,.25,.25); },
    shoot_rail:    ()=>{ osc('sawtooth',2000,50,.3,.5); noise(.05,.3,8000); },
    shoot_charge:  ()=>{ for(let i=0;i<4;i++)osc('sine',300+i*200,100+i*100,.08,.15,0.001,null,0,i*.06); },
    charge_build:  ()=>{ osc('sine',200,800,.5,.2,.05); },
    hit_enemy:     ()=>{ osc('sawtooth',300,60,.12,.2); noise(.06,.12,1500); },
    hit_player:    ()=>{ osc('square',150,40,.2,.45); noise(.1,.25,600,'lowpass'); },
    shield_hit:    ()=>{ osc('sine',900,400,.1,.15); noise(.05,.1,3000); },
    enemy_die:     ()=>{ osc('sawtooth',280,30,.35,.3); noise(.15,.18,1000,'lowpass'); },
    explosion:     ()=>{ noise(.65,.55,400,'lowpass'); osc('sawtooth',500,20,.6,.5); },
    explosion_big: ()=>{ noise(.9,.7,200,'lowpass'); osc('sawtooth',300,10,.9,.6); for(let i=0;i<3;i++)noise(.4,.25,600,'lowpass'); },
    pickup_credits:()=>{ osc('sine',660,.06,.07,.18);osc('sine',880,.06,.15,0.001,null,0,.07); },
    pickup_weapon: ()=>{ for(let i=0;i<5;i++)osc('square',300+i*130,.07,.15,0.001,null,0,i*.06); },
    warp:          ()=>{ osc('sine',80,3000,.8,.35,.05); noise(.4,.2,2000,'lowpass'); },
    boss_spawn:    ()=>{ noise(.6,.5,300,'lowpass'); osc('sawtooth',60,40,1.2,.5); for(let i=0;i<4;i++)osc('sawtooth',200-i*40,20,.4,.2,0.001,null,0,i*.15); },
    boss_die:      ()=>{ for(let i=0;i<6;i++){noise(.45,.4,700,'lowpass');osc('sawtooth',400-i*55,15,.6,.3,0.001,null,0,i*.22);} },
    dash:          ()=>{ osc('square',900,200,.1,.15); noise(.06,.1,4000); },
    phase_shift:   ()=>{ osc('sine',1200,300,.15,.2); osc('sine',500,1500,.15,.12); },
    low_health:    ()=>{ osc('square',220,220,.08,.08,.05); },
    level_clear:   ()=>{ [440,550,660,880].forEach((f,i)=>osc('sine',f,.15,.22,0.001,null,0,i*.12)); },
    menu_select:   ()=>{ osc('square',500,.06,.1); },
    combo_up:      ()=>{ osc('sine',660,.04,.12);osc('sine',880,.04,.12,0.001,null,0,.04); },
    achievement:   ()=>{ [440,660,880,1100].forEach((f,i)=>osc('sine',f,.12,.2,0.001,null,0,i*.08)); },
    transmit:      ()=>{ for(let i=0;i<3;i++)osc('square',400+i*100,.05,.08,0.001,null,0,i*.07); },
  };

  const play=(id,vol=1.0)=>{
    if(!ac)init(); resume();
    if(muted)return;
    if(SFX[id])SFX[id]();
  };

  // ── Ambient space hum
  const startAmbient=()=>{
    if(!ac)return;
    if(ambientOsc){ ambientOsc.stop(); ambientOsc=null; }
    ambientOsc=ac.createOscillator(); ambientGain=ac.createGain();
    ambientOsc.type='sine'; ambientOsc.frequency.value=55;
    ambientGain.gain.value=muted?0:0.04;
    // LFO for hum variation
    const lfo=ac.createOscillator(), lfoG=ac.createGain();
    lfo.frequency.value=0.08; lfoG.gain.value=5;
    lfo.connect(lfoG); lfoG.connect(ambientOsc.frequency);
    ambientOsc.connect(ambientGain); ambientGain.connect(master);
    lfo.start(); ambientOsc.start();
  };

  // ── Engine sound (varies with speed)
  const startEngine=()=>{
    if(!ac)return;
    engineOsc=ac.createOscillator(); engineGain=ac.createGain();
    engineOsc.type='sawtooth'; engineOsc.frequency.value=80;
    engineGain.gain.value=0;
    const filt=ac.createBiquadFilter(); filt.type='lowpass'; filt.frequency.value=200;
    engineOsc.connect(filt); filt.connect(engineGain); engineGain.connect(master);
    engineOsc.start();
  };
  const setEngineIntensity=(v)=>{ // 0..1
    if(!engineGain||muted)return;
    engineGain.gain.setTargetAtTime(v*0.06,ac.currentTime,0.1);
    if(engineOsc)engineOsc.frequency.setTargetAtTime(60+v*80,ac.currentTime,0.2);
  };

  // ── Procedural music per zone
  const ZONE_MUSIC=[
    { bpm:85,  notes:[55,73,87,110],  vibe:'dark',    label:'outer-belt'  },
    { bpm:90,  notes:[49,65,82,98],   vibe:'mysterious',label:'nebula'    },
    { bpm:95,  notes:[44,55,73,87],   vibe:'tense',   label:'station'     },
    { bpm:100, notes:[41,55,65,82],   vibe:'danger',  label:'wreckage'    },
    { bpm:110, notes:[46,61,73,87],   vibe:'epic',    label:'planet'      },
    { bpm:75,  notes:[33,44,55,66],   vibe:'horror',  label:'blackhole'   },
    { bpm:120, notes:[55,73,92,110],  vibe:'boss',    label:'rift-core'   },
  ];
  const BOSS_MUSIC={ bpm:140, notes:[44,55,66,77,88], vibe:'boss' };

  let musicZone=-1, isBossMusic=false;
  const startMusic=(zoneIdx)=>{
    if(musicZone===zoneIdx&&!isBossMusic)return;
    stopMusic(); isBossMusic=false;
    musicZone=zoneIdx;
    const zm=ZONE_MUSIC[Math.min(zoneIdx,ZONE_MUSIC.length-1)];
    _playMusicLoop(zm);
  };

  const startBossMusic=()=>{
    if(isBossMusic)return;
    stopMusic(); isBossMusic=true;
    _playMusicLoop(BOSS_MUSIC);
  };

  let _step=0;
  const _playMusicLoop=(zm)=>{
    if(!ac)return;
    const beat=60/zm.bpm;
    const playBeat=()=>{
      if(!ac||muted)return;
      const t=ac.currentTime, note=zm.notes[_step%zm.notes.length];
      // Kick
      if(_step%4===0){
        const o=ac.createOscillator(),g=ac.createGain();
        o.frequency.setValueAtTime(120,t); o.frequency.exponentialRampToValueAtTime(20,t+0.2);
        g.gain.setValueAtTime(0.35,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.2);
        o.connect(g); g.connect(master); o.start(t); o.stop(t+0.25);
      }
      // Hi-hat
      if(_step%2===0){
        const b=ac.createBuffer(1,ac.sampleRate*.03,ac.sampleRate);
        const d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
        const s=ac.createBufferSource(),g=ac.createGain(),f=ac.createBiquadFilter();
        s.buffer=b;f.type='highpass';f.frequency.value=8000;
        g.gain.setValueAtTime(0.06,t);g.gain.exponentialRampToValueAtTime(0.001,t+.03);
        s.connect(f);f.connect(g);g.connect(master);s.start(t);
      }
      // Bass
      const o2=ac.createOscillator(),g2=ac.createGain();
      o2.type='sawtooth';o2.frequency.value=note;
      g2.gain.setValueAtTime(0.12,t);g2.gain.exponentialRampToValueAtTime(0.001,t+beat*0.8);
      o2.connect(g2);g2.connect(master);o2.start(t);o2.stop(t+beat*.9);
      // Melody (every 2 beats)
      if(_step%2===0){
        const mel=zm.notes[Math.floor(Math.random()*zm.notes.length)]*2;
        const o3=ac.createOscillator(),g3=ac.createGain();
        o3.type='sine';o3.frequency.value=mel;
        g3.gain.setValueAtTime(0.06,t);g3.gain.exponentialRampToValueAtTime(0.001,t+beat*0.5);
        o3.connect(g3);g3.connect(master);o3.start(t);o3.stop(t+beat*.6);
      }
      _step++;
    };
    playBeat();
    musicInterval=setInterval(playBeat,beat*1000);
  };

  const stopMusic=()=>{
    if(musicInterval){clearInterval(musicInterval);musicInterval=null;}
    musicZone=-1;
  };

  const setLowHealthAlarm=(on)=>{
    if(!ac)return;
    if(on&&!lowHealthBeep){
      lowHealthBeep=setInterval(()=>{ if(!muted)play('low_health'); },900);
    } else if(!on&&lowHealthBeep){
      clearInterval(lowHealthBeep); lowHealthBeep=null;
    }
  };

  return{
    init,resume,toggleMute,play,
    startAmbient,startEngine,setEngineIntensity,
    startMusic,startBossMusic,stopMusic,setLowHealthAlarm,
    get muted(){return muted;},
  };
})();