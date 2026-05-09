// ═══════════════════════════════════════════════════════════
//  missions.js — Zone objectives, bonus goals, tracking
// ═══════════════════════════════════════════════════════════
const Missions = (() => {

  const DATA = [
    {
      zone: 0, title: 'ZONE 1 — OUTER BELT',
      objectives: [
        { id:'kill_all',  text:'Eliminate all patrol fighters',       type:'kill_all',   done:false },
        { id:'log',       text:'Recover 1 data log',                  type:'log',        target:1,   progress:0, done:false },
        { id:'boss',      text:'Destroy RIFT HERALD',                 type:'boss',       done:false },
      ],
      bonus: [
        { id:'no_hit',    text:'BONUS — Defeat boss without taking hull damage', type:'no_hull_dmg', done:false },
        { id:'combo5',    text:'BONUS — Reach ×5 combo',              type:'combo',      target:5, done:false },
      ],
      lore: 'Patrol drones defending a Rift entry point. NEXUS activity detected.'
    },
    {
      zone: 1, title: 'ZONE 2 — NEBULA CROSSING',
      objectives: [
        { id:'kill_all',  text:'Clear the nebula of VOID units',      type:'kill_all',   done:false },
        { id:'log',       text:'Recover 2 data logs',                  type:'log',        target:2,   progress:0, done:false },
        { id:'boss',      text:'Destroy VOID LEVIATHAN',              type:'boss',       done:false },
      ],
      bonus: [
        { id:'speed',     text:'BONUS — Clear zone in under 4 minutes',type:'time',      target:240, done:false },
        { id:'combo8',    text:'BONUS — Reach ×8 combo',              type:'combo',      target:8, done:false },
      ],
      lore: 'Nebula clouds mask a massive Leviathan-class organism. Caution advised.'
    },
    {
      zone: 2, title: 'ZONE 3 — ABANDONED STATION',
      objectives: [
        { id:'kill_all',  text:'Purge the station of IRON units',     type:'kill_all',   done:false },
        { id:'log',       text:'Recover 3 data logs',                  type:'log',        target:3,   progress:0, done:false },
        { id:'credits',   text:'Salvage 500 credits',                  type:'credits',    target:500, progress:0, done:false },
        { id:'boss',      text:'Destroy IRON COLOSSUS',               type:'boss',       done:false },
      ],
      bonus: [
        { id:'no_die',    text:'BONUS — Complete without death',      type:'no_death',   done:false },
        { id:'combo10',   text:'BONUS — Reach ×10 combo',             type:'combo',      target:10, done:false },
      ],
      lore: 'A derelict station repurposed by NEXUS as a manufacturing base. Destroy it all.'
    },
    {
      zone: 3, title: 'ZONE 4 — DESTROYED FLEET',
      objectives: [
        { id:'kill_all',  text:'Neutralise all enemy units',          type:'kill_all',   done:false },
        { id:'log',       text:'Recover 3 data logs',                  type:'log',        target:3,   progress:0, done:false },
        { id:'kill60',    text:'Destroy 60 enemies (trigger boss)',    type:'kill_count', target:60, progress:0, done:false },
        { id:'boss',      text:'Destroy NEXUS OVERMIND',              type:'boss',       done:false },
      ],
      bonus: [
        { id:'rail',      text:'BONUS — Kill boss with Railgun final shot', type:'railkill', done:false },
        { id:'combo12',   text:'BONUS — Reach ×12 combo',             type:'combo',      target:12, done:false },
      ],
      lore: 'The wrecked fleet of the 9th Armada. NEXUS salvaged their technology. Reclaim it.'
    },
    {
      zone: 4, title: 'ZONE 5 — ALIEN PLANET RING',
      objectives: [
        { id:'kill_all',  text:'Destroy organic NEXUS forces',        type:'kill_all',   done:false },
        { id:'log',       text:'Recover 4 data logs',                  type:'log',        target:4,   progress:0, done:false },
        { id:'boss',      text:'Destroy CORE GUARDIAN',               type:'boss',       done:false },
      ],
      bonus: [
        { id:'hull50',    text:'BONUS — Keep hull above 50%',         type:'hull_above', target:.5, done:false },
        { id:'combo15',   text:'BONUS — Reach ×15 combo',             type:'combo',      target:15, done:false },
      ],
      lore: 'Organic NEXUS units harvested alien biology to grow living weapons. Purge them.'
    },
    {
      zone: 5, title: 'ZONE 6 — BLACK HOLE ZONE',
      objectives: [
        { id:'kill_all',  text:'Eliminate all VOID defenders',        type:'kill_all',   done:false },
        { id:'log',       text:'Recover 4 data logs',                  type:'log',        target:4,   progress:0, done:false },
        { id:'boss',      text:'Destroy BLACK WARDEN',                type:'boss',       done:false },
      ],
      bonus: [
        { id:'gravity',   text:'BONUS — Kill 10 enemies near black hole', type:'bh_kills', target:10, progress:0, done:false },
        { id:'combo15',   text:'BONUS — Reach ×15 combo',             type:'combo',      target:15, done:false },
      ],
      lore: 'Event horizon proximity scrambles systems. NEXUS uses the gravity as a weapon. So can you.'
    },
    {
      zone: 6, title: 'ZONE 7 — THE RIFT CORE',
      objectives: [
        { id:'kill_all',  text:'Destroy the Rift Core defenders',     type:'kill_all',   done:false },
        { id:'log',       text:'Access all Rift data fragments',      type:'log',        target:5,   progress:0, done:false },
        { id:'boss',      text:'SHUTDOWN: DESTROY THE RIFT ITSELF',  type:'boss',       done:false },
      ],
      bonus: [
        { id:'no_special',text:'BONUS — Defeat final boss without using special ability', type:'no_special', done:false },
        { id:'combo20',   text:'BONUS — Reach ×20 combo',             type:'combo',      target:20, done:false },
      ],
      lore: 'The Rift tears spacetime itself. Beyond it: annihilation. Close it. Now.'
    },
  ];

  let current    = null;
  let startTime  = 0;
  let enemyStartCount = 0;
  let specialUsedInBoss = false;
  let bhKills    = 0;
  let creditProgress = 0;
  let deathOccurred  = false;
  let lastWeaponOnKill = -1;

  const load = (zoneIdx) => {
    current = JSON.parse(JSON.stringify(DATA[Math.min(zoneIdx, DATA.length - 1)]));
    startTime = Date.now();
    enemyStartCount = 0;
    specialUsedInBoss = false;
    bhKills = 0;
    creditProgress = 0;
    deathOccurred = false;
    UI.updateMission(current.title, _nextObj()?.text || '—');
    return current;
  };

  const _nextObj = () => current ? current.objectives.find(o => !o.done) : null;

  const update = () => {
    if (!current) return;
    const elapsed = (Date.now() - startTime) / 1000;

    for (const obj of [...current.objectives, ...current.bonus]) {
      if (obj.done) continue;
      switch (obj.type) {
        case 'kill_all':
          if (EnemyMgr.getCount() === 0 && Level.allEnemiesDead) complete(obj); break;
        case 'boss':
          if (!BossMgr.alive && Level.bossSpawned && BossMgr.get() === null) complete(obj); break;
        case 'log':
          obj.progress = Story.collectedCount();
          if (obj.progress >= obj.target) complete(obj); break;
        case 'credits':
          obj.progress = creditProgress;
          if (obj.progress >= obj.target) complete(obj); break;
        case 'kill_count':
          obj.progress = Player.kills;
          if (obj.progress >= obj.target) complete(obj); break;
        case 'time':
          if (!Level.levelCleared && elapsed > obj.target) { obj.done = true; } break;
        case 'combo':
          if (Player.comboCount >= obj.target) complete(obj); break;
        case 'no_hull_dmg':
          if (!Level.levelCleared) { if (Player.tookHullDamage) obj.done = true; } break;
        case 'no_death':
          if (!Level.levelCleared) { if (deathOccurred) obj.done = true; } break;
        case 'hull_above':
          if (!Level.levelCleared) { if (Player.hp / Player.maxHp < obj.target) obj.done = true; } break;
        case 'bh_kills':
          obj.progress = bhKills;
          if (obj.progress >= obj.target) complete(obj); break;
        case 'railkill':
          if (lastWeaponOnKill === 4 && !BossMgr.alive && Level.bossSpawned) complete(obj); break;
        case 'no_special':
          if (!Level.levelCleared) { if (specialUsedInBoss) obj.done = true; } break;
      }
    }

    // HUD
    const next = _nextObj();
    let txt = next ? next.text : 'All objectives complete!';
    if (next?.progress !== undefined && next?.target) txt += ` (${next.progress}/${next.target})`;
    UI.updateObjective(txt);
  };

  const complete = (obj) => {
    if (obj.done) return;
    obj.done = true;
    const isBonus = current.bonus && current.bonus.includes(obj);
    if (isBonus) {
      UI.showMessage('✦ BONUS: ' + obj.text, 2500, '#ffee00');
      Player.addCredits(300);
    } else {
      UI.showBriefMsg('✓ ' + obj.text, '#00ff88');
    }
    Audio.play('pickup_credits');
  };

  const onCreditEarned = (v) => { creditProgress += v; };
  const onPlayerDied   = () => { deathOccurred = true; };
  const onBHKill       = () => { bhKills++; };
  const onSpecialUsed  = () => { specialUsedInBoss = true; };
  const onKill         = (wpnId) => { lastWeaponOnKill = wpnId; };

  const allDone  = () => current ? current.objectives.every(o => o.done) : false;
  const getBrief = (zi) => DATA[Math.min(zi, DATA.length-1)].lore;

  return { load, update, complete, onCreditEarned, onPlayerDied, onBHKill, onSpecialUsed, onKill,
    allDone, getBrief, get current(){ return current; } };
})();