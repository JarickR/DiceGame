import { SpellType } from './spells.js';

export function defaultDie(){
  return [
    {name:'Blank', type:SpellType.BLANK, tier:0, blank:true},
    {name:'Attack', type:SpellType.ATTACK, tier:1},
    {name:'Armor', type:SpellType.ARMOR, tier:1},
    {name:'Heal', type:SpellType.HEAL, tier:2},
    {name:'Concentration', type:SpellType.CONCENTRATE, tier:2},
    {name:'Upgrade', type:SpellType.UPGRADE, tier:1},
  ];
}

export function classFaces(id){
  const f = (name)=>[{name, type:SpellType.CLASS, tier:1, classId:id}];
  switch(id){
    case 'thief': return f('Thief');
    case 'judge': return f('Judge');
    case 'tank': return f('Tank');
    case 'vampire': return f('Vampire');
    case 'king': return f('King');
    case 'lich': return f('Lich');
    case 'paladin': return f('Paladin');
    case 'barbarian': return f('Barbarian');
    default: return [];
  }
}

export function randomFaceByTier(tier){
  const byTier = {
    1:[ {name:'Attack',type:SpellType.ATTACK,tier:1},{name:'Armor',type:SpellType.ARMOR,tier:1},{name:'Sweep',type:SpellType.SWEEP,tier:1},{name:'Heal',type:SpellType.HEAL,tier:1},{name:'Upgrade',type:SpellType.UPGRADE,tier:1} ],
    2:[ {name:'Attack',type:SpellType.ATTACK,tier:2},{name:'Armor',type:SpellType.ARMOR,tier:2},{name:'Concentration',type:SpellType.CONCENTRATE,tier:2},{name:'Sweep',type:SpellType.SWEEP,tier:2},{name:'Fireball',type:SpellType.FIREBALL,tier:2},{name:'Poison',type:SpellType.POISON,tier:2},{name:'Bomb',type:SpellType.BOMB,tier:2},{name:'Heal',type:SpellType.HEAL,tier:2} ],
    3:[ {name:'Attack',type:SpellType.ATTACK,tier:3},{name:'Sweep',type:SpellType.SWEEP,tier:3},{name:'Fireball',type:SpellType.FIREBALL,tier:3} ]
  };
  const list = byTier[tier] || byTier[1];
  return list[Math.floor(Math.random()*list.length)];
}

export function rollFace(rand, hero){
  const i = Math.floor(rand() * hero.die.length);
  const face = hero.die[i];
  hero._lastFace = face;
  return face;
}
