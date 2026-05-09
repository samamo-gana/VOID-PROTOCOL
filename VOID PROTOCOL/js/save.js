// save.js — Persistent save via localStorage
const Save = (() => {
  const KEY = 'void_protocol_v2';
  const defaults = () => ({
    credits:0, skills:{}, unlockedShips:[0], unlockedWeapons:[0],
    completedZones:[], achievements:[],
    stats:{totalKills:0,totalCredits:0,totalTime:0,runsCompleted:0,bossesKilled:0},
    selectedShip:0,
  });
  const load=()=>{ try{const d=JSON.parse(localStorage.getItem(KEY));return d?{...defaults(),...d}:defaults();}catch(e){return defaults();} };
  const save=(data)=>{ try{localStorage.setItem(KEY,JSON.stringify(data));}catch(e){} };
  const reset=()=>{ localStorage.removeItem(KEY); };
  return{load,save,reset,defaults};
})();