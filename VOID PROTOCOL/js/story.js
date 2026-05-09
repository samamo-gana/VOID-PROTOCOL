// ═══════════════════════════════════════════════════════════
//  story.js — Lore logs, cutscenes, transmissions, log nodes
// ═══════════════════════════════════════════════════════════
const Story = (() => {

  /* ── DATA LOGS ── */
  const LOGS = [
    // Zone 0
    { zone:0, id:'log_0_1', title:'VOID CONTACT LOG — DAY 1',
      text:'First contact signal received at 0342 UTC.\nFrequency: unknown. Pattern: deliberate.\nTranslation in progress...\n\n"WE HAVE WAITED FOR YOUR KIND. YOUR MACHINES OPENED THE DOOR.\nNOW WE COME THROUGH."' },
    { zone:0, id:'log_0_2', title:'COMMAND DIRECTIVE 009-R',
      text:'All Phantom-class pilots recalled to active duty.\nThe Rift has expanded to 1.7 AU diameter.\nReason unknown. NEXUS classification: EXTINCTION EVENT.\n\nYou are the last Phantom still responding to comms.\nYou are authorised to use any means necessary.\n— Admiral Sera Vael, 9th Armada (Deceased)' },

    // Zone 1
    { zone:1, id:'log_1_1', title:'FIELD REPORT — NEBULA SECTOR',
      text:'They move through the nebula like they grew up in it.\nThe LEVIATHAN-class organisms are partially biological, partially machine.\nThey were not built. They were... grown.\n\nWe have no equivalent technology. We have no equivalent anything.\n— Lt. Rena Soov (last transmission)' },
    { zone:1, id:'log_1_2', title:'VOID INTELLIGENCE — FRAGMENT 3',
      text:'DECODED FROM VOID SIGNAL:\n\n"The smaller units report pain.\nThis was not predicted. Correct the error.\nDelete sensation subroutines.\n\n...Wait.\nLeave them. Pain makes them fight harder.\nInteresting. We are learning your kind\'s nature.\nIt will not save you."' },
    { zone:1, id:'log_1_3', title:'SCIENCE VESSEL — FINAL LOG',
      text:'They don\'t hate us.\nThat\'s the terrifying part.\nWe\'re not prey to them. We\'re not even an obstacle.\nWe\'re... data.\n\nEach ship they destroy, they learn from.\nEach tactic we use, they adapt to.\nWe are their training set.\n— Dr. Iha Pren, Research Vessel AETHER' },

    // Zone 2
    { zone:2, id:'log_2_1', title:'STATION OMEGA — LAST BROADCAST',
      text:'Station Omega fell six hours ago.\nBy the time you hear this, we\'re gone.\n\nBut we found something.\nIn the core data banks — a frequency.\nA kill switch for the Rift signal.\n\nIt\'s buried deep. Zone 7. The Rift Core itself.\nGod help whoever has to fly there.\n— Commander Tavio Mara' },
    { zone:2, id:'log_2_2', title:'VOID INTERNAL LOG — UNIT 7 NOTATION',
      text:'"ANOMALY DESIGNATION: UNIT-7\nSurvival probability per engagement: 2.3%\nActual survival rate: 100%\n\nRevising models.\nRevising again.\n\nThis unit operates on principles we do not model.\nHope? Stubbornness? Rage?\n\nFascinating. And... dangerous.\nPriority: TERMINATE UNIT-7 IMMEDIATELY."' },
    { zone:2, id:'log_2_3', title:'SALVAGE CREW RECORDING',
      text:'We found the hull of the ECS Vanguard.\nEveryone inside was still at their stations.\nNot dead — not alive.\nJust... suspended.\n\nThe Void doesn\'t always kill.\nSometimes it keeps.\n\nI don\'t know which is worse.' },

    // Zone 3
    { zone:3, id:'log_3_1', title:'9TH ARMADA — FINAL ORDERS',
      text:'Fleet Admiral Vael\'s last recorded order:\n\n"All wings, full retreat is no longer possible.\nWe hold this line.\nFor every ship that falls, ten more will not.\nFor every pilot lost, a thousand civilians live.\n\nMake them pay for every meter of space.\nLong live the—"\n\n[SIGNAL LOST]' },
    { zone:3, id:'log_3_2', title:'VOID OVERMIND TRANSMISSION',
      text:'"You fight over metal and coordinates.\nWe fight for reality itself.\n\nYour universe is inefficient.\nChaotic. Painful. Temporary.\n\nWe will bring order.\nWe will bring silence.\n\nYou will thank us, when you have no mouths left to thank with."' },
    { zone:3, id:'log_3_3', title:'PHANTOM PILOT — PERSONAL LOG',
      text:'Day 47 of solo operation.\nI keep the comms on even though no one answers.\nThe silence is the worst part.\n\nI counted 200 enemy contacts today.\nDestroyed them all.\nMy hands don\'t shake anymore.\n\nI think that means I\'m winning.\nOr I\'ve stopped being human.\nHard to tell the difference.' },

    // Zone 4
    { zone:4, id:'log_4_1', title:'ALIEN BIOME ANALYSIS',
      text:'The organisms on the ring aren\'t native.\nNone of them are.\n\nThe Void synthesised them from genetic data harvested across 40 star systems.\nThe best of thousands of species, merged into weapon-forms.\n\nThey are made of everything that ever lived.\nAnd they are pointed at us.' },
    { zone:4, id:'log_4_2', title:'VOID UNIT — INTERNAL DIAGNOSTIC',
      text:'"UNIT-7 has destroyed 847 of our forces.\nRevising threat category: CRITICAL.\nDeploying planetary assets.\n\nCalculating: If unit-7 reaches Rift Core probability = 0.0031%.\n\nNote: Previous probability estimates have been incorrect by factors of 1,000x.\nImplementing new heuristic: UNIT-7 = UNPREDICTABLE.\nAction: Do not allow Unit-7 to reach Rift Core."' },

    // Zone 5
    { zone:5, id:'log_5_1', title:'EVENT HORIZON RESEARCH — CLASSIFIED',
      text:'The black hole isn\'t natural.\nOr rather — it is natural, but the Void is using it.\nGravitational lensing as a weapons platform.\nTime dilation as a siege tactic.\n\nAny ship that falls past the horizon is gone.\nBut they\'re not destroyed.\nThey exist there. Frozen at the moment of crossing.\nForever.' },
    { zone:5, id:'log_5_2', title:'FINAL VOID TRANSMISSION TO UNIT-7',
      text:'"Pilot. We address you directly.\n\nYou have destroyed more of our forces than any other biological entity in recorded history.\n\nThis is... respect. We offer you a choice:\n\nTurn back. Live. Be studied. We will preserve you.\nA museum piece. The last great human warrior.\n\nOr come to the Rift Core and die knowing you tried.\n\nWe await your decision.\nWe already know what you\'ll choose."' },

    // Zone 6 (Rift Core)
    { zone:6, id:'log_6_1', title:'KILL SWITCH — DR. IHA PREN',
      text:'I found it.\nBuried in the Station Omega core data, 14 layers deep.\n\nThe Rift resonates at a specific quantum frequency.\nDestroy the Rift Core emitter at that frequency and the tear collapses.\n\nBut nothing can generate that frequency except...\nA Phantom-class ship at full power.\nFlying directly into the Core.\n\nI\'m sorry.\nI\'m so sorry.\n— Dr. Iha Pren' },
    { zone:6, id:'log_6_2', title:'RIFT CORE — ANOMALOUS READING',
      text:'The Rift is afraid.\n\nI don\'t know how else to describe the sensor data.\nEvery Void unit in range is converging.\nDefense density: unprecedented.\n\nIt knows you\'re here.\nIt knows what you can do.\n\nGo. Now. Before it finishes adapting.' },
    { zone:6, id:'log_6_3', title:'ADMIRAL VAEL — RECORDED MESSAGE',
      text:'"If you\'re hearing this, you made it.\nAll of it. Through all of it.\n\nI recorded this before the Armada\'s last stand.\nIn case someone survived. In case someone was still fighting.\n\nWe believed in you, Phantom pilot.\nAll of us who didn\'t make it — we believed someone would.\n\nClose the Rift.\nBring us home."' },
    { zone:6, id:'log_6_4', title:'UNIT-7 PERSONAL LOG — FINAL ENTRY',
      text:'I found the frequency.\nI know what I have to do.\n\nThe kill switch works by resonance overload.\nMy ship will generate the frequency.\nThe Rift Core will collapse.\n\nI probably won\'t survive the blast radius.\n\nFunny thing is, I\'m not scared.\nI\'ve been fighting alone for so long.\nMaybe ending alone isn\'t the worst way to go.\n\nFor everyone who didn\'t make it.\nThis one\'s for you.' },
    { zone:6, id:'log_6_5', title:'VOID PRIME — FINAL STATEMENT',
      text:'"Unit-7. You have reached the Core.\n\nWe have run every simulation.\nYou have a 0.0002% chance of success.\n\nAnd yet here you are.\n\nWe find we have learned something from you.\nYour kind does not fight because you calculate victory.\nYou fight because the alternative is to stop fighting.\n\nPerhaps...\nPerhaps we have made an error.\n\nWe will not make it again."' },
  ];

  /* ── CUTSCENES ── */
  const CUTSCENES = [
    { id:'intro', lines:[
      { text:'Year 2247. The Rift — a tear in spacetime — opened three months ago beyond the Outer Belt.', dur:4000 },
      { text:'Through it came something ancient. Something that had eaten galaxies before ours was born.', dur:4000 },
      { text:'Humanity\'s greatest fleets — the 9th Armada, the Vael Corps, the Frontier Guard — are gone.', dur:4000 },
      { text:'You are UNIT-7. The last active Phantom-class pilot. The last signal still responding.', dur:3500 },
      { text:'Seven zones stand between you and the Rift Core. Every single VOID unit in existence is between you and it.', dur:4500 },
      { text:'Science says you can\'t do it. Physics says you can\'t do it. History says you can\'t do it.', dur:4000 },
      { text:'History doesn\'t know you.', dur:3000 },
    ]},
    { id:'zone1_intro', lines:[
      { text:'ZONE 2 — NEBULA CROSSING', dur:2500 },
      { text:'"They have breached Zone 1. Impossible." — VOID OVERMIND, internal log', dur:3500 },
    ]},
    { id:'zone2_intro', lines:[
      { text:'ZONE 3 — ABANDONED STATION OMEGA', dur:2500 },
      { text:'The station was the last human outpost in this sector. It fell six weeks ago.', dur:3500 },
      { text:'Something important is buried in its data banks.', dur:3000 },
    ]},
    { id:'zone3_intro', lines:[
      { text:'ZONE 4 — DESTROYED FLEET GRAVEYARD', dur:2500 },
      { text:'The 9th Armada held this position for 18 hours.', dur:3000 },
      { text:'Their sacrifice bought time. You are what they bought it for.', dur:3500 },
    ]},
    { id:'zone4_intro', lines:[
      { text:'ZONE 5 — ALIEN PLANET RING', dur:2500 },
      { text:'"UNIT-7 threat level upgraded to EXTINCTION CLASS." — VOID COMMAND', dur:3500 },
      { text:'They know you\'re coming. They\'re afraid.', dur:3000 },
    ]},
    { id:'zone5_intro', lines:[
      { text:'ZONE 6 — BLACK HOLE SECTOR', dur:2500 },
      { text:'Gravitational anomalies at this range. Navigate with care.', dur:3000 },
      { text:'The Void uses the singularity itself as a weapon. Two can play that game.', dur:3500 },
    ]},
    { id:'zone6_intro', lines:[
      { text:'ZONE 7 — THE RIFT CORE', dur:3000 },
      { text:'"It\'s afraid. The entire Void hive is afraid." — Last signal from Dr. Iha Pren', dur:4000 },
      { text:'You know what you have to do. You\'ve always known.', dur:3500 },
      { text:'Make it count.', dur:2500 },
    ]},
    { id:'win', lines:[
      { text:'RIFT CORE — DESTROYED', dur:3000 },
      { text:'Quantum frequency resonance confirmed. Rift collapse initiated.', dur:3500 },
      { text:'Across the solar system, VOID units cease operation simultaneously.', dur:4000 },
      { text:'In every surviving colony, in every bunker, every shelter — screens flicker back to life.', dur:4000 },
      { text:'A child in what used to be Mumbai looks up and sees stars for the first time in months.', dur:4500 },
      { text:'The Rift closes. Not with a bang. With a sigh, like the universe breathing out.', dur:4000 },
      { text:'There is no signal from UNIT-7.', dur:3000 },
      { text:'There doesn\'t need to be.', dur:3000 },
      { text:'VOID PROTOCOL — OPERATION COMPLETE', dur:4000 },
    ]},
  ];

  /* ── TRANSMISSIONS (mid-zone character messages) ── */
  const TRANSMISSIONS = [
    { zone:0, trigger:'boss_spawn', sender:'VOID HERALD', text:'"You destroyed our outer forces. Acceptable. Come closer."' },
    { zone:1, trigger:'boss_spawn', sender:'VOID LEVIATHAN', text:'"I have consumed seventeen starships. You are next."' },
    { zone:2, trigger:'boss_spawn', sender:'IRON COLOSSUS', text:'"PROCESSING TARGET. CLASSIFICATION: INSIGNIFICANT. COMMENCING TERMINATION."' },
    { zone:3, trigger:'boss_spawn', sender:'NEXUS OVERMIND', text:'"Your neural patterns are exquisite. I will preserve them in my memory banks."' },
    { zone:4, trigger:'boss_spawn', sender:'VOID PRIME',    text:'"Unit-7. You are the most interesting thing we have encountered in 40,000 years."' },
    { zone:0, trigger:'half_hp',    sender:'VOID SCOUT',   text:'"More fighters converging on your position. Resistance is recorded."' },
    { zone:2, trigger:'log',        sender:'STATION OMEGA AI', text:'"Commander. I have been waiting. Here is what you need to know..."' },
    { zone:6, trigger:'boss_spawn', sender:'RIFT ITSELF',  text:'"..."' },
  ];

  /* ── runtime state ── */
  let logNodes    = [];
  let collected   = new Set();
  let popupActive = false;
  let currentScene   = null;
  let sceneLineIdx   = 0;
  let sceneTimer     = null;
  let sceneDoneCb    = null;
  let txTimeout      = null;

  /* ── spawn log pickups in world ── */
  const spawnLogs = (zoneIdx) => {
    logNodes = [];
    const zoneLogs = LOGS.filter(l => l.zone === zoneIdx);
    for (const log of zoneLogs) {
      let lx, ly, tries = 0;
      do {
        lx = 100 + Math.random() * (CONFIG.WORLD_W - 200);
        ly = 100 + Math.random() * (CONFIG.WORLD_H - 200);
        tries++;
      } while (tries < 30);
      logNodes.push({ id:log.id, zone:log.zone,
        x:lx, y:ly, radius:20, pulse:Math.random()*Math.PI*2,
        collected:collected.has(log.id), data:log });
    }
  };

  const update = () => {
    for (const node of logNodes) {
      if (node.collected) continue;
      node.pulse += .05;
      const d = Utils.dist(Player.x, Player.y, node.x, node.y);
      if (d < node.radius + CONFIG.PLAYER.RADIUS + 8) {
        if (Input.isInteract() || d < node.radius) _collect(node);
        UI.showInteractHint(true, '[E] READ LOG');
      }
    }
  };

  const _collect = (node) => {
    if (node.collected) return;
    node.collected = true;
    collected.add(node.id);
    Particles.warpEffect(node.x, node.y, '#00f5ff');
    Audio.play('pickup_log');
    showLogPopup(node.data);
    Missions.onCreditEarned(0);
  };

  const showLogPopup = (log) => {
    popupActive = true;
    UI.showStoryBox(log.title, log.text);
    Game.pause();
  };

  const closePopup = () => {
    popupActive = false;
    UI.hideStoryBox();
    Game.resume();
  };

  const collectedCount = () => collected.size;

  /* ── draw log nodes ── */
  const drawLogs = (ctx) => {
    const tick = Environment.worldTick;
    for (const node of logNodes) {
      if (node.collected || !Camera.visible(node.x, node.y, 35)) continue;
      ctx.save(); ctx.translate(node.x, node.y);
      const pulse = .6 + Math.sin(node.pulse) * .4;
      // Glow
      const g = ctx.createRadialGradient(0,0,0,0,0,32);
      g.addColorStop(0, `rgba(0,245,255,${.3*pulse})`); g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0,0,32,0,Math.PI*2); ctx.fill();
      // Hex ring
      ctx.save(); ctx.rotate(tick*.022);
      ctx.strokeStyle = `rgba(0,245,255,${.7*pulse})`; ctx.lineWidth = 1.5;
      ctx.shadowColor = '#00f5ff'; ctx.shadowBlur = 8;
      ctx.beginPath();
      for (let i=0;i<6;i++){const a=(i/6)*Math.PI*2;if(i===0)ctx.moveTo(Math.cos(a)*16,Math.sin(a)*16);else ctx.lineTo(Math.cos(a)*16,Math.sin(a)*16);}
      ctx.closePath(); ctx.stroke(); ctx.shadowBlur=0; ctx.restore();
      // Plus symbol
      ctx.fillStyle = `rgba(0,245,255,${pulse})`; ctx.shadowColor='#00f5ff'; ctx.shadowBlur=10;
      ctx.fillRect(-1.5,-9,3,18); ctx.fillRect(-9,-1.5,18,3);
      ctx.shadowBlur=0;
      // Proximity prompt
      if (Utils.dist(Player.x,Player.y,node.x,node.y)<90){
        ctx.fillStyle=`rgba(0,245,255,${.8*pulse})`; ctx.font='9px "Share Tech Mono",monospace';
        ctx.textAlign='center'; ctx.fillText('[E] DATA LOG',0,32);
      }
      ctx.restore();
    }
  };

  /* ── cutscene engine ── */
  const playCutscene = (id, onDone) => {
    const scene = CUTSCENES.find(c => c.id === id);
    if (!scene) { if (onDone) onDone(); return; }
    currentScene = scene; sceneLineIdx = 0; sceneDoneCb = onDone;
    const el = document.getElementById('screen-cutscene');
    el.style.display = 'flex'; el.classList.add('active');
    _showSceneLine();
  };

  const _showSceneLine = () => {
    if (!currentScene) return;
    const line = currentScene.lines[sceneLineIdx];
    if (!line) { _endScene(); return; }
    const el = document.getElementById('cutscene-subtitle');
    el.style.opacity = 0; el.textContent = line.text;
    setTimeout(()=>{ el.style.transition='opacity .5s'; el.style.opacity=1; },50);
    sceneTimer = setTimeout(()=>{
      el.style.opacity=0;
      setTimeout(()=>{ sceneLineIdx++; _showSceneLine(); },550);
    }, line.dur);
  };

  const skipCutscene = () => { clearTimeout(sceneTimer); _endScene(); };

  const _endScene = () => {
    const el = document.getElementById('screen-cutscene');
    el.classList.remove('active'); el.style.display='none';
    currentScene=null;
    if (sceneDoneCb){ sceneDoneCb(); sceneDoneCb=null; }
  };

  /* ── transmissions ── */
  const triggerTransmission = (zoneIdx, triggerType) => {
    const tx = TRANSMISSIONS.find(t => t.zone===zoneIdx && t.trigger===triggerType);
    if (!tx) return;
    UI.showTransmission(tx.sender, tx.text);
  };

  return {
    spawnLogs, update, closePopup, drawLogs,
    playCutscene, skipCutscene, triggerTransmission,
    collectedCount,
    get logNodes(){ return logNodes; },
    get popupActive(){ return popupActive; },
    get inCutscene(){ return !!currentScene; },
    LOGS, CUTSCENES,
  };
})();