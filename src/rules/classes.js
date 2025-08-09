export const Classes = {
  tank:{
    onFaceVisible(h,ctx){ h.armor=(h.armor||0)+3; h.flags={...(h.flags||{}), taunt:true, thorns:2}; ctx.push?.(`${h.name} taunts (+3 armor, thorns 2).`); },
    onTurnEnd(h){ h.armor=Math.max(0,(h.armor||0)-3); if(h.flags){delete h.flags.taunt; delete h.flags.thorns;} }
  },
  judge:{
    onJudge(h,ctx,resolve){ const a=ctx.rollFace(h); const b=ctx.rollFace(h); const pick=(b.blank?a:(a.blank?b:(b.tier>a.tier?b:a))); h._lastFace=pick; resolve(pick); }
  },
  thief:{
    onFaceVisible(h,ctx){ h.flags={...(h.flags||{}), invisible:true}; ctx.push?.(`${h.name} is invisible this turn.`); },
    onTurnEnd(h){ if(h.flags) delete h.flags.invisible; }
  },
  vampire:{ /* passive can be added later */ },
  king:{
    onKing(h,ctx,chooseTarget){ const t=chooseTarget?.('attack')||ctx.enemies?.()[0]; const dealt=ctx.applyDamage(h,t,2,{type:'attack'}); ctx.heal(h,1); h.armor=(h.armor||0)+2; ctx.push?.(`${h.name} Royal Decree: ${dealt} dmg, heal 1, +2 armor.`); }
  },
  lich:{ onLich(h,ctx){ ctx.push?.(`${h.name} summons a 1 HP ghoul (demo).`); }, onTurnEnd(){}, onDeath(){} },
  paladin:{
    onPaladin(h,ctx,chooseAlly){ const a=chooseAlly?.('heal')||h; ctx.heal(a,2); a.flags={...(a.flags||{}), immune:true}; ctx.push?.(`${h.name} shields ${a.name}: heal 2 & immunity (while face visible).`); },
    onTurnEnd(hero,ctx){ }
  },
  barbarian:{
    onBarb(h,ctx,resolve){ h.hp-=1; const f=ctx.rollFace(h); f._barbBonus=true; resolve(f); },
    forbidConcentration:true
  }
};
