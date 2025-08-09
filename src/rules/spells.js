export const SpellType = {
  ATTACK:'attack', HEAL:'heal', ARMOR:'armor',
  CONCENTRATE:'concentration', SWEEP:'sweep',
  FIREBALL:'fireball', POISON:'poison', BOMB:'bomb',
  UPGRADE:'upgrade', BLANK:'blank', CLASS:'class'
};

export function resolveSpell(ctx, caster, face){
  const t = face.type, tier = face.tier||1;
  const mult = caster._concStacks ? (2 ** caster._concStacks) : 1;
  const barb = face._barbBonus ? 2 : 0;

  if(t==='attack'){
    const base = tier===1?2:tier===2?4:6;
    const target = ctx.chooseEnemy?.() || (ctx.enemies?.()[0]);
    const dealt = ctx.applyDamage(caster, target, (base+barb)*mult, {type:'attack'});
    ctx.push?.(`${caster.name} attacks ${target?.name||'enemy'} for ${dealt}.`);
  }else if(t==='heal'){
    const base = tier===1?1:3;
    const ally = ctx.chooseAlly?.('heal') || caster;
    ctx.heal(ally, (base+barb)*mult);
  }else if(t==='armor'){
    const base = tier===1?2:6;
    caster.armor = (caster.armor||0) + (base+barb)*mult;
  }else if(t==='concentration'){
    if(caster.forbidConcentration){ caster.hp-=1; ctx.push?.(`${caster.name} cannot Concentrate (Barbarian).`); return; }
    caster._concStacks = (caster._concStacks||0) + 1;
  }else if(t==='sweep'){
    const base = tier===1?1:tier===2?2:4;
    ctx.enemies?.().forEach(e=>ctx.applyDamage(caster,e,(base+barb)*mult,{type:'attack'}));
  }else if(t==='fireball'){
    const base = tier===1?1:tier===2?3:5;
    const target = ctx.chooseEnemy?.() || (ctx.enemies?.()[0]);
    ctx.applyDamage(caster, target, (base+barb)*mult, {type:'fireball', ignoreArmor:true});
  }else if(t==='poison'){
    ctx.addPoison?.(ctx.chooseEnemy?.() || (ctx.enemies?.()[0]));
  }else if(t==='bomb'){
    ctx.addBomb?.(ctx.chooseEnemy?.() || (ctx.enemies?.()[0]));
  }else if(t==='upgrade'){
    ctx.upgradeFace?.(caster);
  }
  if(t!=='concentration') caster._concStacks=0;
}
