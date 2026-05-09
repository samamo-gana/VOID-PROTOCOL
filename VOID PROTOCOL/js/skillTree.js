// skillTree.js — Persistent skill upgrade tree
const SkillTree = (() => {
  let levels={};

  const load=(saveData)=>{ levels={...(saveData.skills||{})}; };
  const getLvl=(id)=>levels[id]||0;
  const canUpgrade=(id,credits)=>{ const def=CONFIG.SKILL_TREE.find(s=>s.id===id);if(!def)return false;return getLvl(id)<def.max&&credits>=def.cost; };

  const upgrade=(id,saveData)=>{
    const def=CONFIG.SKILL_TREE.find(s=>s.id===id);
    if(!def||getLvl(id)>=def.max||saveData.credits<def.cost)return false;
    saveData.credits-=def.cost;
    levels[id]=getLvl(id)+1;
    saveData.skills={...levels};
    Save.save(saveData);
    applyToPlayer();
    Audio.play('pickup_weapon');
    return true;
  };

  const applyToPlayer=()=>{
    let hp=0,shield=0,speed=0,heat=0,dmg=0,cred=0,boost=0,combo=0;
    for(const def of CONFIG.SKILL_TREE){
      const lv=getLvl(def.id); if(!lv)continue;
      const total=def.value*lv;
      switch(def.effect){
        case 'hull':   hp+=total;    break;
        case 'shield': shield+=total;break;
        case 'speed':  speed+=total; break;
        case 'heat':   heat+=total;  break;
        case 'damage': dmg+=total;   break;
        case 'credits':cred+=total;  break;
        case 'boost':  boost+=total; break;
        case 'combo':  combo+=total; break;
      }
    }
    Player.bonusHp=hp; Player.bonusShield=shield; Player.bonusSpeed=speed;
    Player.bonusDmgPct=dmg; Player.bonusCreditsPct=cred;
    Player.bonusBoostCooldown=boost; Player.bonusComboMax=combo;
    Weapons.heatMult=Math.max(0.4,1-heat);
  };

  const buildUI=(saveData)=>{
    const container=document.getElementById('skill-tree-ui'); if(!container)return;
    container.innerHTML='';
    for(const def of CONFIG.SKILL_TREE){
      const lv=getLvl(def.id),maxed=lv>=def.max,affordable=saveData.credits>=def.cost;
      const div=document.createElement('div');
      div.className='skill-node'+(maxed?' maxed':'');
      div.innerHTML=`<div><div class="skill-name">${def.name}</div><div style="font-size:10px;color:rgba(200,230,255,.5)">${def.desc} (${lv}/${def.max})</div></div><div style="display:flex;gap:8px;align-items:center"><span class="skill-cost">${maxed?'MAX':'¢'+def.cost}</span><button id="skill-btn-${def.id}"${maxed||!affordable?' disabled':''}>UP</button></div>`;
      container.appendChild(div);
      if(!maxed){
        document.getElementById(`skill-btn-${def.id}`)?.addEventListener('click',()=>{
          if(upgrade(def.id,saveData)){
            document.getElementById('val-credits').textContent=saveData.credits;
            buildUI(saveData);
          }
        });
      }
    }
    document.getElementById('val-credits').textContent=saveData.credits;
  };

  return{load,getLvl,canUpgrade,upgrade,applyToPlayer,buildUI};
})();