// src/rules/engine.js
import { resolveSpell, SpellType } from './spells.js';
import { rollFace, defaultDie, classFaces, randomFaceByTier } from './dice.js';
import { Classes } from './classes.js';
import { computePassives, applyEncounterStart } from './effects.js';

export function attachEngine(app){
  const enemies = () => (app.getEnemies?.() ?? app._enemies ?? []);
  app.enemiesFn = enemies;

  // ====== Encounter lifecycle (very lightweight) ======
  app.startEncounter = () => {
    for (const h of (app.party || [])) {
      // recompute passives from inventory and apply start-of-encounter effects
      h.passives = computePassives(h);
      applyEncounterStart(h);
      h._castsThisEncounter = 0;
      h._firstRollUsed = false;
      h._reflected = false;
    }
    app.push?.("Encounter started.");
  };

  // ====== Builders ======
  app.buildHero = (name, classId) => {
    const hero = {
      id: Math.random().toString(36).slice(2,7),
      name, classId, hp:20, maxHp:20, armor:0, flags:{},
      die: [...defaultDie(), ...classFaces(classId)],
      forbidConcentration: classId === 'barbarian',
      inventory: [],
      passives: null,
      _concStacks: 0
    };
    // initial compute (in case UI shows tooltips before battle)
    hero.passives = computePassives(hero);
    return hero;
  };

  // ====== Dice / rolls ======
  app.rollFace = (hero) => {
    if (!hero) return null;

    // Wind Sigil: first roll can be rerolled once
    let r = rollFace(app.rand ?? Math.random, hero);
    if (hero.passives?.firstRollReroll && !hero._firstRollUsed) {
      hero._firstRollUsed = true;
      const r2 = rollFace(app.rand ?? Math.random, hero);
      app.push?.(`${hero.name} used Wind Sigil to reroll first face.`);
      r = r2;
    }
    hero._lastFace = r;
    return r;
  };
  app.rollD20 = () => Math.floor((app.rand ?? Math.random)() * 20) + 1;

  // ====== Targeting ======
  app.chooseEnemy = () => enemies().find(e => e?.hp > 0) || null;
  app.chooseAlly  = () => app.party?.find(p => p?.hp > 0) ?? null;

  // ====== Core damage/heal with passives ======
  app.applyDamage = (src, target, amount, opts={}) => {
    if(!target || target.hp<=0) return 0;

    // Feather Cloak: reduce Sweep by 1
    if (opts.type === 'sweep' && src && src !== target) {
      const reduce = src?.passives?.sweepReduce || 0;
      amount = Math.max(0, amount - reduce);
    }

    const armor = opts.ignoreArmor ? 0 : (target.armor||0);
    const dealt = Math.max(0, amount - armor);
    target.hp -= dealt;

    // Thorns when hit (melee-ish)
    if (opts.type === 'attack' && target.passives?.thorns && dealt>0 && src) {
      const th = target.passives.thorns;
      src.hp = Math.max(0, (src.hp||0) - th);
      app.push?.(`${target.name}'s thorns hit ${src.name} for ${th}.`);
    }

    // Soul Thread: heal 1 on 4+ damage
    if (src?.passives?.vampOnBigHit && dealt >= 4) {
      src.hp = Math.min(src.maxHp, (src.hp||0) + 1);
      app.push?.(`${src.name} siphons 1 HP (Soul Thread).`);
    }

    // Burn application from Ember Pendant on attacks
    if (src?.passives?.applyBurn && opts.type === 'attack' && dealt>0) {
      target._burn = Math.max(target._burn||0, 2); // 2 turns
      app.push?.(`${target.name} is Burning (2 turns).`);
    }

    // Death handling
    if (target.hp <= 0) {
      // Totem of Rebirth (cheat death) for heroes
      if (target.passives?.cheatDeath && !target._usedCheatDeath) {
        target._usedCheatDeath = true;
        target.hp = 1;
        app.push?.(`${target.name} survives at 1 HP (Totem of Rebirth)!`);
      } else {
        target.hp = 0;
        app.onEnemyDefeated?.(target, src);
      }
    }

    return dealt;
  };

  app.heal = (who, n)=>{
    if(!who) return;
    const bonus = who.passives?.healBonus || 0;
    who.hp = Math.min((who.maxHp||0), (who.hp||0) + n + bonus);
  };

  // ====== Upgrades ======
  app.upgradeFace = (hero)=>{
    const f = hero?._lastFace || hero?.die?.find(x=>!x.blank);
    if(!hero || !f) return;
    const t = f.blank?1:Math.min(3,(f.tier||0)+1);
    const candidate = randomFaceByTier(t);
    app._upgradeChoice = { heroId: hero.id, oldFace: f, newFace: candidate, _extraRerolls: hero.passives?.extraUpgradeReroll || 0 };
  };
  app.commitUpgrade = (keepNew)=>{
    const u = app._upgradeChoice; if(!u) return;
    const hero = app.party?.find(h=>h.id===u.heroId); if(!hero) return;

    // If declined and we have extra upgrade rerolls, roll again
    if (!keepNew && u._extraRerolls > 0) {
      const t = u.oldFace.blank?1:Math.min(3,(u.oldFace.tier||0)+1);
      const candidate = randomFaceByTier(t);
      app._upgradeChoice = { ...u, newFace: candidate, _extraRerolls: u._extraRerolls - 1 };
      app.push?.(`Arcane Loop reroll used — drew another upgrade candidate.`);
      return;
    }

    const idx = hero.die.indexOf(u.oldFace); if(idx<0) return;
    hero.die[idx] = keepNew ? u.newFace : u.oldFace;
    app.push?.(`Upgrade ${keepNew?'accepted':'declined'} (${u.oldFace.name} → ${u.newFace.name}).`);
    app._upgradeChoice = null;
  };

  // ====== Core spell resolution with passives taps ======
  app.resolveFace = (hero, face) => {
    if(!hero || !face) return;

    // Moon Pendant: clutch boost when at 1 HP
    let extra = 0;
    if (hero.passives?.clutchBoost && hero.hp === 1) extra += 2;

    // Attack / Fireball bonuses
    if (face.type === 'attack')  face._bonus = (face._bonus||0) + (hero.passives?.attackBonus || 0) + extra;
    if (face.type === 'fireball')face._bonus = (face._bonus||0) + (hero.passives?.fireballBonus || 0) + extra;

    // Concentration bonuses
    if (face.type === 'concentration') {
      hero._concStacks = (hero._concStacks || 0) + 1 + (hero.passives?.concBonus || 0);
      app.push?.(`${hero.name} gains Concentration stack (+${1 + (hero.passives?.concBonus||0)}).`);
      return; // concentration just stacks; resolution happens on next spell
    }

    // Class faces pass through (they may call resolveSpell internally)
    if(face.type === SpellType.CLASS){
      const ID = hero.classId;
      if(ID === 'tank')      return Classes.tank.onFaceVisible(hero, app);
      if(ID === 'king')      return Classes.king.onKing(hero, app, app.chooseEnemy);
      if(ID === 'lich')      return Classes.lich.onLich(hero, app);
      if(ID === 'paladin')   return Classes.paladin.onPaladin(hero, app, app.chooseAlly);
      if(ID === 'barbarian') return Classes.barbarian.onBarb(hero, app, (f)=>app.resolveFace(hero, f));
      if(ID === 'thief')     return Classes.thief.onFaceVisible(hero, app);
      if(ID === 'judge')     return Classes.judge.onJudge(hero, app, (f)=>app.resolveFace(hero, f));
      if(ID === 'vampire')   return app.push?.(`${hero.name}'s Vampire passive ready.`);
    }

    // Reflect (defense): handled when targeted — here we just resolve hero's cast
    resolveSpell(app, hero, face);

    // Echo Bell: every Nth cast repeats at 50%
    hero._castsThisEncounter = (hero._castsThisEncounter || 0) + 1;
    const N = hero.passives?.echoEvery || 0;
    if (N > 0 && hero._castsThisEncounter % N === 0) {
      const half = { ...face, _echo:true, _mult: 0.5, _bonus: Math.floor((face._bonus||0) * 0.5) };
      app.push?.(`Echo Bell repeats ${face.name} at 50% effect.`);
      resolveSpell(app, hero, half);
    }
  };

  app.endHeroTurn = (hero)=>{
    if(!hero) return;

    // Example: apply burn on all enemies at end of hero turn (ticks down on enemies)
    for (const e of enemies()) {
      if (e._burn) {
        e.hp = Math.max(0, e.hp - 1);
        e._burn -= 1;
        app.push?.(`${e.name} takes 1 Burn.`);
        if (e.hp <= 0) app.onEnemyDefeated?.(e, hero);
      }
    }

    // reset per-turn rerolls (Lucky Token)
    hero._turnRerollsLeft = hero.passives?.rerollsPerTurn || 0;
  };

  // ====== Enemy ops ======
  app.spawnEnemy = (enemy) => { app._enemies = [...(app._enemies||[]), enemy]; };
  app.clearEnemies = () => { app._enemies = []; };
  app.listEnemies = () => enemies();

  // ====== Accessory Loot ======
  app.offerAccessory = (hero, d20, mapD20ToItemIndex) => {
    if (!hero) return;
    const itemIndex = mapD20ToItemIndex?.(d20);
    app._lootOffer = { heroId: hero.id, d20, itemIndex };
    app.push?.(`${hero.name} found an accessory (d20=${d20}).`);
  };

  app.commitAccessory = (accept) => {
    const L = app._lootOffer; if (!L) return;
    const hero = app.party?.find(h => h.id === L.heroId); if (!hero) { app._lootOffer=null; return; }

    if (accept) {
      if (!Array.isArray(hero.inventory)) hero.inventory = [];
      if (hero.inventory.length >= 2) {
        app.push?.(`${hero.name} already has 2 accessories. (Drop UI TBD)`);
      } else {
        hero.inventory.push(L.itemIndex);
        hero.passives = computePassives(hero); // recompute passives immediately
        app.push?.(`${hero.name} equipped ${L.itemIndex+1}.`);
      }
    } else {
      app.push?.(`${hero.name} skipped the accessory.`);
    }
    app._lootOffer = null;
  };

  // When an enemy dies
  app.onEnemyDefeated = (enemy /*, killer*/) => {
    app._enemies = (app._enemies || []).filter(e => e !== enemy);

    // Simple: Tier-2 drops 1 optional accessory
    if (enemy?.tier === 2) {
      const hero = app.party?.[0];
      const d20 = app.rollD20();
      app._pendingD20 = d20;
      app._triggerLootOffer?.(hero, d20);
    }
    app.push?.(`${enemy?.name || 'Enemy'} defeated.`);
  };

  app.push?.("Rules engine attached (passives & loot).");
}
