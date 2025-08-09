import { resolveSpell, SpellType } from './spells.js';
import { rollFace, defaultDie, classFaces, randomFaceByTier } from './dice.js';
import { Classes } from './classes.js';

export function attachEngine(app){
  app.buildHero = (name, classId) => ({
    id: Math.random().toString(36).slice(2,7),
    name, classId, hp:20, maxHp:20, armor:0, flags:{},
    die: [...defaultDie(), ...classFaces(classId)],
    forbidConcentration: classId==='barbarian'
  });

  app.rollFace = (hero) => rollFace(app.rand, hero);
  app.enemies = ()=> app.getEnemies ? app.getEnemies() : (app.enemies || []);
  app.chooseEnemy = ()=> app.enemies()?.find(e=>e.hp>0);
  app.chooseAlly  = ()=> app.party?.[0];

  app.applyDamage = (src, target, amount, opts={}) => {
    if(!target || target.hp<=0) return 0;
    if(target.flags?.immune && !opts.ignoreImmune){ app.push?.(`${target.name} is immune.`); return 0; }
    const armor = opts.ignoreArmor ? 0 : (target.armor||0);
    const dealt = Math.max(0, amount - armor);
    target.hp -= dealt;
    if(target.flags?.thorns && dealt>0 && src){ src.hp -= 2; app.push?.(`${target.name} thorns hit ${src.name} for 2.`); }
    return dealt;
  };
  app.heal = (who, n)=>{ who.hp = Math.min((who.maxHp||0), (who.hp||0)+n); };

  app.addPoison = (e)=>{ e.poison = {active:true}; };
  app.addBomb   = (e)=>{ e.bomb   = {active:true}; };

  app.upgradeFace = (hero)=>{
    const f = hero._lastFace || hero.die.find(x=>!x.blank);
    if(!f) return;
    const t = f.blank?1:Math.min(3,(f.tier||0)+1);
    const candidate = randomFaceByTier(t);
    app._upgradeChoice = { heroId: hero.id, oldFace: f, newFace: candidate };
  };
  app.commitUpgrade = (keepNew)=>{
    const u = app._upgradeChoice; if(!u) return;
    const hero = app.party.find(h=>h.id===u.heroId); if(!hero) return;
    const idx = hero.die.indexOf(u.oldFace); if(idx<0) return;
    hero.die[idx] = keepNew ? u.newFace : u.oldFace;
    app.push?.(`Upgrade ${keepNew?'accepted':'declined'} (${u.oldFace.name} → ${u.newFace.name}).`);
    app._upgradeChoice = null;
  };

  app.resolveFace = (hero, face) => {
    if(face.type===SpellType.CLASS){
      const ID = hero.classId;
      if(ID==='tank')  return Classes.tank.onFaceVisible(hero, app);
      if(ID==='king')  return Classes.king.onKing(hero, app, app.chooseEnemy);
      if(ID==='lich')  return Classes.lich.onLich(hero, app);
      if(ID==='paladin') return Classes.paladin.onPaladin(hero, app, app.chooseAlly);
      if(ID==='barbarian') return Classes.barbarian.onBarb(hero, app, (f)=>app.resolveFace(hero, f));
      if(ID==='thief') return Classes.thief.onFaceVisible(hero, app);
      if(ID==='judge') return Classes.judge.onJudge(hero, app, (f)=>app.resolveFace(hero, f));
      if(ID==='vampire') return app.push?.(`${hero.name}'s Vampire passive ready.`);
    }
    resolveSpell(app, hero, face);
  };

  app.endHeroTurn = (hero)=>{
    if(hero.classId==='thief')   Classes.thief.onTurnEnd(hero, app);
    if(hero.classId==='tank')    Classes.tank.onTurnEnd(hero, app);
    if(hero.classId==='paladin') Classes.paladin.onTurnEnd(hero, app);
    if(hero.classId==='lich')    Classes.lich.onTurnEnd(hero, app);
  };
}
