// achievements.js — Achievement unlock + persistence
const Achievements = (() => {
  let unlocked=new Set();

  const load=(saveData)=>{ unlocked=new Set(saveData.achievements||[]); };

  const notify=(event,value)=>{
    switch(event){
      case 'kill':
        if(value>=1)  _unlock('first_kill');
        if(value>=10) _unlock('10kills');
        if(value>=50) _unlock('50kills');
        break;
      case 'boss_killed':
        _unlock('boss1');
        break;
      case 'combo':
        if(value>=10)_unlock('comboX10');
        break;
      case 'all_weapons':
        if(value>=CONFIG.WEAPONS.length)_unlock('allWeapons');
        break;
      case 'all_zones':
        if(value>=7)_unlock('allZones');
        break;
      case 'credits':
        if(value>=1000)_unlock('credits_1k');
        break;
      case 'no_hull':
        _unlock('noShip_lost');
        break;
      case 'win':
        _unlock('win');
        break;
    }
  };

  const _unlock=(id)=>{
    if(unlocked.has(id))return;
    const def=CONFIG.ACHIEVEMENTS.find(a=>a.id===id); if(!def)return;
    unlocked.add(id);
    UI.showAchievementToast(def.name);
    Audio.play('achievement');
    const sd=Save.load();
    if(!sd.achievements.includes(id)){ sd.achievements.push(id); Save.save(sd); }
  };

  const isUnlocked=(id)=>unlocked.has(id);

  const buildArchiveUI=()=>{
    const container=document.getElementById('archives-content'); if(!container)return;
    container.innerHTML='';
    for(const def of CONFIG.ACHIEVEMENTS){
      const got=isUnlocked(def.id);
      const div=document.createElement('div');
      div.className='ach-entry'+(got?'':' locked-ach');
      div.innerHTML=`<div class="ach-icon-big">${got?def.icon:'🔒'}</div><div class="ach-text"><div class="ach-name-list">${def.secret&&!got?'???':def.name}</div><div class="ach-desc">${def.secret&&!got?'Secret achievement':def.desc}</div></div>`;
      container.appendChild(div);
    }
  };

  return{load,notify,isUnlocked,buildArchiveUI,get unlocked(){return unlocked;}};
})();