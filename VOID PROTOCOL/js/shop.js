// shop.js — Item purchasing, ship/weapon unlock, tactical nuke
const Shop = (() => {
  const ITEMS=[
    {id:'repair_30',  name:'HULL REPAIR +30',     cost:80,  type:'repair', value:30 },
    {id:'repair_full',name:'FULL HULL REPAIR',    cost:200, type:'repair', value:999},
    {id:'shield_50',  name:'SHIELD RECHARGE +50', cost:120, type:'shield', value:50 },
    {id:'ammo_refill',name:'FULL AMMO REFILL',    cost:100, type:'ammo'            },
    {id:'nuke',       name:'TACTICAL NUKE ×1',    cost:300, type:'nuke'            },
  ];

  const SHIP_PRICES  =[0,800,1200,1600,2400];
  const WEAPON_PRICES=[0,300,450,600,900,1200];

  let saveData=null;
  const init=(sd)=>{ saveData=sd; };

  const buyItem=(id)=>{
    const item=ITEMS.find(i=>i.id===id);
    if(!item||!saveData||saveData.credits<item.cost){Audio.play('transmit');return false;}
    saveData.credits-=item.cost;
    switch(item.type){
      case 'repair': Player.heal(item.value); break;
      case 'shield': Player.addShield(item.value); break;
      case 'ammo':   Weapons.refillAmmo(); break;
      case 'nuke':   _deployNuke(); break;
    }
    Save.save(saveData);
    Audio.play('pickup_weapon');
    return true;
  };

  const buyShip=(id,sd)=>{
    const price=SHIP_PRICES[id]||0;
    if(!sd||sd.credits<price)return false;
    if(sd.unlockedShips.includes(id))return true;
    sd.credits-=price;
    sd.unlockedShips.push(id);
    Save.save(sd);
    return true;
  };

  const buyWeapon=(id,sd)=>{
    const price=WEAPON_PRICES[id]||0;
    if(!sd||sd.credits<price)return false;
    if(sd.unlockedWeapons.includes(id)){Weapons.unlock(id);return true;}
    sd.credits-=price;
    sd.unlockedWeapons.push(id);
    Weapons.unlock(id);
    Save.save(sd);
    return true;
  };

  const _deployNuke=()=>{
    for(const e of EnemyMgr.getAlive())e.takeDamage(9999);
    Camera.shake(18,25); Audio.play('explosion');
    Particles.warpEffect(Player.x,Player.y,'#ff2244');
    UI.showMessage('⚡ TACTICAL NUKE DEPLOYED',2000,'#ff0');
  };

  return{init,buyItem,buyShip,buyWeapon,ITEMS,SHIP_PRICES,WEAPON_PRICES};
})();