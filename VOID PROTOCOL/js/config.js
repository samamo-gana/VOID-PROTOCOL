// ═══════════════════════════════════════════════════════════
//  config.js — VOID PROTOCOL game constants
// ═══════════════════════════════════════════════════════════
const CONFIG = {
  WORLD_W: 4000, WORLD_H: 4000,
  TARGET_FPS: 60,

  SHIPS: [
    { id:0, name:'PHANTOM-X',    desc:'Balanced interceptor. Standard loadout.',                          hp:100, speed:4.2, shield:30, slots:2, special:'AFTERBURNER',   color:'#00f5ff', accentColor:'#0055ff', unlocked:true  },
    { id:1, name:'WRAITH-II',    desc:'Speed-class ghost ship. Fragile but lethal.',                      hp:70,  speed:5.8, shield:10, slots:2, special:'PHASE SHIFT',   color:'#8800ff', accentColor:'#ff00cc', unlocked:false },
    { id:2, name:'IRON-TITAN',   desc:'Heavy assault frame. Maximum firepower.',                          hp:180, speed:2.9, shield:60, slots:3, special:'SHIELD NOVA',   color:'#ff6600', accentColor:'#ffaa00', unlocked:false },
    { id:3, name:'NOVA-RAPTOR',  desc:'Experimental Rift tech. Unstable but devastating.',               hp:90,  speed:5.0, shield:40, slots:3, special:'RIFT PULSE',    color:'#00ff88', accentColor:'#00ffff', unlocked:false },
    { id:4, name:'ECLIPSE-VOID', desc:'Stolen NEXUS frame. Unknown capabilities. Handle with care.',     hp:120, speed:4.6, shield:50, slots:3, special:'VOID MIRROR',   color:'#ffffff', accentColor:'#ff0055', unlocked:false },
  ],

  WEAPONS: [
    { id:0, name:'PULSE LASER',    key:'1', dmg:18,  rate:8,   heat:4,  spd:16, ammo:-1,  maxAmmo:-1,  color:'#00f5ff', type:'laser',   burst:1, spread:0.02, unlocked:true  },
    { id:1, name:'PLASMA RIFLE',   key:'2', dmg:32,  rate:18,  heat:10, spd:13, ammo:40,  maxAmmo:40,  color:'#8800ff', type:'plasma',  burst:1, spread:0.03, unlocked:false },
    { id:2, name:'SHOTGUN LASER',  key:'3', dmg:14,  rate:22,  heat:15, spd:11, ammo:16,  maxAmmo:16,  color:'#ff6600', type:'shotgun', burst:6, spread:0.28, unlocked:false },
    { id:3, name:'HOMING MISSILE', key:'4', dmg:60,  rate:55,  heat:8,  spd:9,  ammo:8,   maxAmmo:8,   color:'#ff2244', type:'missile', burst:1, spread:0,    unlocked:false, homing:true },
    { id:4, name:'RAILGUN',        key:'5', dmg:180, rate:90,  heat:40, spd:28, ammo:5,   maxAmmo:5,   color:'#ffee00', type:'rail',   burst:1, spread:0,    unlocked:false, piercing:true },
    { id:5, name:'CHARGED CANNON', key:'6', dmg:120, rate:0,   heat:25, spd:10, ammo:10,  maxAmmo:10,  color:'#ff8800', type:'charge', burst:1, spread:0,    unlocked:false, charged:true, chargeDuration:90 },
  ],

  MAX_HEAT:      100,
  HEAT_DECAY:    1.2,
  OVERHEAT_COOL: 180, // frames to cool

  PLAYER: {
    RADIUS:          14,
    INVINCIBLE:      50,
    BOOST_DURATION:  22,
    BOOST_COOLDOWN:  90,
    BOOST_SPEED:     2.4,
    MAX_CREDITS:     999999,
  },

  ENEMIES: {
    FIGHTER:     { hp:50,  spd:2.4, dmg:10, rate:80,  range:420, score:100,  size:15, color:'#ff4444', credits:8  },
    KAMIKAZE:    { hp:30,  spd:4.5, dmg:35, rate:0,   range:600, score:150,  size:12, color:'#ff8800', credits:12 },
    SNIPER_DONE: { hp:45,  spd:1.5, dmg:50, rate:220, range:800, score:200,  size:13, color:'#ffee00', credits:15 },
    SHIELDER:    { hp:80,  spd:1.8, dmg:12, rate:100, range:380, score:250,  size:18, color:'#0088ff', credits:18 },
    TELEPORTER:  { hp:60,  spd:3.0, dmg:20, rate:90,  range:450, score:300,  size:14, color:'#8800ff', credits:20 },
    SWARM:       { hp:18,  spd:3.8, dmg:8,  rate:60,  range:300, score:50,   size:10, color:'#ff44aa', credits:5  },
    CRUISER:     { hp:250, spd:1.2, dmg:28, rate:70,  range:500, score:600,  size:32, color:'#aaaaaa', credits:40 },
    ELITE:       { hp:140, spd:3.2, dmg:22, rate:65,  range:520, score:500,  size:20, color:'#00ff88', credits:35 },
    ORGANIC:     { hp:90,  spd:2.8, dmg:18, rate:75,  range:400, score:300,  size:22, color:'#88ff00', credits:22 },
  },

  BOSSES: [
    { id:0, name:'RIFT HERALD',       hp:1200, spd:2.0, dmg:28, size:60, phases:2, score:5000,  credits:300, color:'#ff4444' },
    { id:1, name:'VOID LEVIATHAN',    hp:2400, spd:1.6, dmg:40, size:80, phases:3, score:10000, credits:600, color:'#8800ff' },
    { id:2, name:'IRON COLOSSUS',     hp:4000, spd:1.2, dmg:55, size:95, phases:3, score:18000, credits:1000,color:'#ff6600' },
    { id:3, name:'NEXUS OVERMIND',    hp:6500, spd:1.8, dmg:70, size:110,phases:4, score:30000, credits:1500,color:'#00f5ff' },
    { id:4, name:'THE RIFT ITSELF',   hp:10000,spd:2.4, dmg:90, size:130,phases:4, score:60000, credits:3000,color:'#ffffff' },
  ],

  ZONES: [
    { id:0, name:'OUTER BELT',        bg:'asteroid',  tint:'rgba(20,30,60,.5)',   music:0 },
    { id:1, name:'NEBULA CROSSING',   bg:'nebula',    tint:'rgba(40,0,60,.5)',    music:1 },
    { id:2, name:'ABANDONED STATION', bg:'station',   tint:'rgba(10,40,20,.5)',   music:2 },
    { id:3, name:'DESTROYED FLEET',   bg:'wreckage',  tint:'rgba(60,20,0,.5)',    music:3 },
    { id:4, name:'ALIEN PLANET RING', bg:'planet',    tint:'rgba(0,40,60,.5)',    music:4 },
    { id:5, name:'BLACK HOLE ZONE',   bg:'blackhole', tint:'rgba(0,0,0,.8)',      music:5 },
    { id:6, name:'THE RIFT CORE',     bg:'rift',      tint:'rgba(80,0,80,.6)',    music:6 },
  ],

  LEVEL_POOL: [
    ['FIGHTER','KAMIKAZE'],
    ['FIGHTER','SNIPER_DONE','SHIELDER'],
    ['FIGHTER','TELEPORTER','SHIELDER','SWARM'],
    ['KAMIKAZE','SNIPER_DONE','ELITE','SWARM'],
    ['ELITE','CRUISER','TELEPORTER','ORGANIC'],
    ['ELITE','CRUISER','ORGANIC','SWARM'],
    ['ELITE','CRUISER','ORGANIC','TELEPORTER'],
  ],
  LEVEL_COUNTS: [10, 14, 18, 22, 26, 30, 40],

  SKILL_TREE: [
    { id:'hull_1',     name:'Reinforced Hull',       desc:'+15 max hull',         cost:80,  max:3, effect:'hull',     value:15  },
    { id:'shield_1',   name:'Shield Booster',        desc:'+10 max shield',       cost:100, max:3, effect:'shield',   value:10  },
    { id:'speed_1',    name:'Thruster Upgrade',       desc:'+0.3 speed',           cost:120, max:3, effect:'speed',    value:0.3 },
    { id:'heat_1',     name:'Coolant System',         desc:'-15% heat gen',        cost:150, max:3, effect:'heat',     value:0.15},
    { id:'dmg_1',      name:'Weapon Amplifier',       desc:'+10% damage',          cost:200, max:3, effect:'damage',   value:0.1 },
    { id:'cred_1',     name:'Salvage AI',             desc:'+20% credits',         cost:160, max:2, effect:'credits',  value:0.2 },
    { id:'boost_1',    name:'Boost Cells',            desc:'-20f boost cooldown',  cost:180, max:2, effect:'boost',    value:20  },
    { id:'combo_1',    name:'Combo Multiplier',       desc:'+0.5 max combo mult',  cost:220, max:3, effect:'combo',    value:0.5 },
    { id:'missile_1',  name:'Missile Rack',           desc:'+3 missile capacity',  cost:250, max:2, effect:'missile',  value:3   },
    { id:'special_1',  name:'Special Recharge',       desc:'-15% special cooldown',cost:300, max:2, effect:'special',  value:0.15},
  ],

  ACHIEVEMENTS: [
    { id:'first_kill',   name:'First Blood',       desc:'Destroy your first enemy',          icon:'💥', secret:false },
    { id:'10kills',      name:'Rookie Pilot',      desc:'Destroy 10 enemies in one run',     icon:'✈️',  secret:false },
    { id:'50kills',      name:'Ace Pilot',         desc:'Destroy 50 enemies in one run',     icon:'⭐', secret:false },
    { id:'boss1',        name:'Herald Slayer',     desc:'Defeat the Rift Herald',            icon:'🏆', secret:false },
    { id:'noHit_boss',   name:'Untouchable',       desc:'Defeat any boss without being hit', icon:'🛡️', secret:true  },
    { id:'comboX10',     name:'Combo Maniac',      desc:'Reach a ×10 combo',                icon:'🔥', secret:false },
    { id:'allWeapons',   name:'Arsenal Complete',  desc:'Unlock all weapons',               icon:'⚔️',  secret:false },
    { id:'allZones',     name:'Void Walker',       desc:'Complete all 7 zones',             icon:'🌌', secret:false },
    { id:'credits_1k',   name:'Rich Pilot',        desc:'Collect 1000 total credits',       icon:'💰', secret:false },
    { id:'noShip_lost',  name:'Ghost Run',         desc:'Complete a zone without taking hull damage', icon:'👻', secret:true },
    { id:'win',          name:'Rift Closed',       desc:'Destroy The Rift Itself and win',  icon:'🌟', secret:false },
  ],

  CAMERA: { LERP:0.08, SHAKE_DECAY:0.87 },
  PARTICLES: { MAX:1200 },
};
Object.freeze(CONFIG);