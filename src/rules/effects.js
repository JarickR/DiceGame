// src/rules/effects.js
import { ACCESSORY_INFO } from "../art/manifest.js";

/**
 * Build a fresh passive state from a hero's inventory.
 * Call when inventory changes or encounter starts.
 */
export function computePassives(hero) {
  const p = freshPassives();

  for (const idx of hero.inventory || []) {
    const info = ACCESSORY_INFO[idx] || {};
    switch (info.key) {
      case "guardRing":     p.startArmor += 2; break;
      case "luckyToken":    p.rerollsPerTurn += 1; break;
      case "focusBand":     p.concBonus += 1; break;
      case "emberPendant":  p.applyBurn = true; break;
      case "ironKnuckle":   p.attackBonus += 1; break;
      case "glowingCharm":  p.healBonus += 1; break;
      case "runedBracelet": p.startConcStacks += 1; break;
      case "mirrorCharm":   p.reflectOnce = true; break;
      case "sturdyBoots":   p.ignoreFirstKnock = true; break;
      case "featherCloak":  p.sweepReduce += 1; break;
      case "moonPendant":   p.clutchBoost = true; break;
      case "thornLocket":   p.thorns += 1; break;
      case "arcaneLoop":    p.extraUpgradeReroll += 1; break;
      case "poisonFang":    p.poisonExtraTurns += 1; break;
      case "stonecore":     p.armorCap += 1; break;
      case "searingGem":    p.fireballBonus += 1; break;
      case "echoBell":      p.echoEvery = 3; break;
      case "soulThread":    p.vampOnBigHit += 1; break;
      case "windSigil":     p.firstRollReroll += 1; break;
      case "totemRebirth":  p.cheatDeath += 1; break;
      default: break;
    }
  }

  return p;
}

export function freshPassives(){
  return {
    // numeric stacks
    startArmor: 0,
    startConcStacks: 0,
    rerollsPerTurn: 0,
    attackBonus: 0,
    healBonus: 0,
    thorns: 0,
    armorCap: 0,
    fireballBonus: 0,
    sweepReduce: 0,
    poisonExtraTurns: 0,
    vampOnBigHit: 0,
    extraUpgradeReroll: 0,
    firstRollReroll: 0,

    // booleans / special
    applyBurn: false,
    reflectOnce: false,
    ignoreFirstKnock: false,
    clutchBoost: false,
    echoEvery: 0,   // N casts → echo at 50%
    cheatDeath: 0,  // once per run
  };
}

/** Call at encounter start to apply passive starting effects. */
export function applyEncounterStart(hero){
  const p = hero.passives || freshPassives();
  if (p.startArmor) hero.armor = Math.min((hero.armor||0) + p.startArmor,  (2 + p.armorCap)); // simple cap: base 2 + cap bonus
  if (p.startConcStacks) hero._concStacks = (hero._concStacks || 0) + p.startConcStacks;
}
