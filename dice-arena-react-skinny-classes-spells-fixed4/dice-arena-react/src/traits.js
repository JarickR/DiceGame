// Phase-1 traits + statuses
export const Status = {
  DURATION:'duration', BLEED:'bleed', HEAL_BLOCK:'healBlock', NO_REROLL:'noReroll',
  FIRST_REDUCE:'firstReduce', UNTAR_LAST:'untargetableUnlessLast', REFLECT_1:'reflect1', ARMOR_SHRED:'armorShred'
}
export function addStatus(e,k,p){ e.flags=e.flags||{}; e.flags[k]=(p===undefined?true:p) }
export function getStatus(e,k){ return e?.flags?.[k] }
export function clearStatus(e,k){ if(e?.flags) delete e.flags[k] }
function clamp(v){ return v<0?0:v }

export const Traits = {
  berserker:{ onAttack(att){ const half=Math.floor((att.maxHp||att.hp)/2)||1; if(att.hp<=half) return {dmgBonus:2} } },
  lifedrain:{ onAfterAttack(att,dealt,ctx){ if(dealt>0){ const heal=Math.floor(dealt/2); att.hp=(att.hp||0)+heal; ctx.log?.(`${att.name} lifedrains for ${heal}.`) } } },
  guardian:{ onRoundStart(self,ctx){ const a=(ctx.enemies||[]).filter(x=>x!==self&&x.hp>0); if(!a.length) return; const low=a.reduce((m,x)=>x.hp<m.hp?x:m,a[0]); addStatus(low,Status.FIRST_REDUCE,{amount:999,used:false}); ctx.log?.(`${self.name} guards ${low.name}.`) } },
  corrosive:{ onAfterAttack(att,dealt,ctx,target){ if(dealt>0){ target.armor=clamp((target.armor||0)-1); const cur=getStatus(target,Status.ARMOR_SHRED)||{stacks:0}; cur.stacks+=1; addStatus(target,Status.ARMOR_SHRED,cur); ctx.log?.(`${att.name} corrodes ${target.name} (-1 armor).`) } } },
  phantomGuard:{ onBattleCalc(self){ addStatus(self,Status.UNTAR_LAST,true) } },
  staticField:{ onAfterAttack(att,dealt,ctx,target){ addStatus(target,Status.NO_REROLL,{duration:1}); ctx.log?.(`${target.name} cannot use Concentration next turn.`) } },
  infernoPulse:{ onAfterAttack(att,dealt,ctx,target){ if((target.armor||0)>0) ctx.splashPlayers?.(2,target,`${att.name}'s Inferno Pulse splashes`) } },
  bleed:{ onAfterAttack(att,dealt,ctx,target){ const cur=getStatus(target,Status.BLEED)||{stacks:0,dmg:1}; cur.stacks+=1; addStatus(target,Status.BLEED,cur); ctx.log?.(`${target.name} is bleeding (${cur.stacks}).`) } },
  decay:{ onBattleCalc(self){ addStatus(self,Status.HEAL_BLOCK,true) } },
  reflect1:{ onDamaged(self,amt,ctx,src){ if(amt>0) ctx.damage?.(src,1,`${self.name} reflects 1 to ${src.name}`) } },
  chillAura:{ onAfterAttack(att,dealt,ctx,target){ addStatus(target,Status.NO_REROLL,{duration:1}); ctx.log?.(`${target.name} loses their next reroll.`) } },
  corruptField:{ onBattleCalc(self,ctx){ ctx.flags.noHealing=true } },
  steelCore:{ onRoundStart(self){ addStatus(self,Status.FIRST_REDUCE,{amount:999,used:false}) } },
  thickHide:{ onRoundStart(self){ addStatus(self,Status.FIRST_REDUCE,{amount:1,used:false}) } },
  shellGuard:{ onRoundStart(self){ addStatus(self,Status.FIRST_REDUCE,{amount:2,used:false}) } },
  unstable:{ onDeath(self,k,ctx){ ctx.splashPlayers?.(1,null,`${self.name} bursts`) } },
  barbed:{ onDamaged(self,amt,ctx,src){ if(amt>0) ctx.damage?.(src,1,`${self.name} barbs ${src.name} for 1`) } },
  crackbone:{ onAttack(att,target){ if((target.armor||0)>0) return {ignoreArmor:true} } },
  stoneSkin:{ onBattleCalc(self){ /* immune to conc handled elsewhere */ } },
  haunt:{ onBattleCalc(self){ addStatus(self,Status.UNTAR_LAST,true) } }
}

export function inferTraitsFromText(e){
  const t=(e.trait||'').toLowerCase(), out=[]; const add=k=>!out.includes(k)&&out.push(k)
  if(t.includes('berserk')) add('berserker')
  if(t.includes('lifedrain')||(t.includes('heal')&&t.includes('half'))) add('lifedrain')
  if(t.includes('guard')) add('guardian')
  if(t.includes('corrosive')||t.includes('remove 1 armor')||t.includes('removes 1 armor')) add('corrosive')
  if(t.includes('untargetable')) add('phantomGuard')
  if(t.includes('static field')) add('staticField')
  if(t.includes('inferno pulse')||t.includes('splash')) add('infernoPulse')
  if(t.includes('bleed')) add('bleed')
  if(t.includes('reduce')&&t.includes('healing')) add('decay')
  if(t.includes('reflect')) add('reflect1')
  if(t.includes('chill')||t.includes('no reroll')) add('chillAura')
  if(t.includes('no healing')||t.includes('prevents any healing')) add('corruptField')
  if(t.includes('first spell')&&t.includes('no effect')) add('steelCore')
  if(t.includes('first 1 damage')) add('thickHide')
  if(t.includes('reduces first damage by 2')) add('shellGuard')
  if(t.includes('on death, deal 1 damage')||t.includes('explodes on death')) add('unstable')
  if(t.includes('barb')||t.includes('retali')) add('barbed')
  if(t.includes('crackbone')) add('crackbone')
  if(t.includes('stone skin')||t.includes('immune to concentration')) add('stoneSkin')
  if(t.includes('cannot be targeted if any other enemy is alive')||t.includes('haunt')) add('haunt')
  return out
}

export function tickStatuses(entity, ctx){
  if(!entity||!entity.flags) return
  const b=entity.flags[Status.BLEED]
  if(b&&b.stacks){
    const dmg=b.dmg||b.stacks; entity.hp-=dmg; ctx?.log?.(`${entity.name} bleeds for ${dmg}.`)
    b.stacks=Math.max(0,(b.stacks||0)-1); if(b.stacks<=0) delete entity.flags[Status.BLEED]
  }
  for(const k of Object.keys(entity.flags)){
    const v=entity.flags[k]; if(v&&typeof v==='object'&&v.duration){ v.duration-=1; if(v.duration<=0) delete entity.flags[k] }
  }
}
