// src/engine.js

// ---- Face types (kept for clarity / future use) ----
export const FACE_TYPES = {
  CLASS: "class",
  SPELL: "spell",
  UPGRADE: "upgrade",
};

// Physical vs. true-damage classification
export function isPhysical(spellName) {
  // Physical: reduced by armor (and reduces armor first)
  // True: bypasses armor (fireball, poison)
  return ["attack", "sweep", "bomb"].includes(String(spellName));
}

// Simple RNG helpers
const d6 = () => 1 + Math.floor(Math.random() * 6);

// Clamp util
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

class GameEngine {
  constructor() {
    // Party of heroes
    this.party = []; // [{ id, name, classId, hp, maxHp, armor, loadout: [{tier,name}], status? }]
    // Enemies
    this._enemies = []; // [{ id, name, tier, hp, armor, spriteId, status? }]
    // Optional side-effect hooks (the app assigns these)
    this.push = (msg) => console.log("[LOG]", msg);
    this.emitVfx = () => {};
    this.toast = () => {};
    // Pending upgrade (if you want to coordinate with a UI flow)
    this._pendingUpgrade = null;
  }

  // ------------- ENCOUNTER MGMT -------------
  clearEnemies() {
    this._enemies = [];
  }

  spawnEnemy(e) {
    const en = {
      id: e.id ?? `E${this._enemies.length + 1}`,
      name: e.name ?? "Enemy",
      tier: e.tier ?? 1,
      hp: e.hp ?? 10,
      armor: e.armor ?? 0,
      spriteId: e.spriteId ?? 1,
      status: {
        poison: 0,
        bomb: 0,
      },
    };
    this._enemies.push(en);
    return en;
  }

  // ------------- BASIC COMBAT -------------
  // Apply damage with armor rules
  applyDamage(target, amount, { type = "attack", from = null } = {}) {
    if (!target || amount <= 0) return { damage: 0, armorSpent: 0 };
    const physical = type === "attack" || type === "sweep" || type === "bomb";

    let armorSpent = 0;
    let hpDamage = amount;

    if (physical) {
      const soak = Math.min(target.armor || 0, amount);
      armorSpent = soak;
      target.armor = Math.max(0, (target.armor || 0) - soak);
      hpDamage = amount - soak;
    }

    if (hpDamage > 0) {
      target.hp = Math.max(0, (target.hp || 0) - hpDamage);
    }

    // simple VFX signals if you wired them
    if (hpDamage > 0) this.emitVfx?.({ target: "enemy", type: "hit", enemyId: target.id });
    if (armorSpent > 0) this.emitVfx?.({ target: "enemy", type: "guard", enemyId: target.id });

    return { damage: hpDamage, armorSpent };
  }

  // Simple heal utility
  heal(target, amount) {
    if (!target || amount <= 0) return 0;
    const before = target.hp || 0;
    target.hp = clamp(before + amount, 0, target.maxHp || before + amount);
    this.emitVfx?.({ target: "hero", type: "heal", heroId: target.id });
    return target.hp - before;
  }

  // Enemies doing a basic attack to a hero
  enemyAttack(enemy, hero) {
    if (!enemy || !hero) return;
    const dmg = 4; // tune as needed
    const res = this.applyDamage(hero, dmg, { type: "attack", from: enemy.id });
    this.push?.(`${enemy.name} hits ${hero.name} for ${res.damage} (armor absorbed ${res.armorSpent}).`);
    // Optional: tick statuses on hero at end of attack
    this.stepStatusesFor(hero, { side: "hero" });
  }

  // ------------- STATUS: POISON & BOMB -------------
  // Apply poison stack (true damage over time)
  addPoison(target, stacks = 1) {
    if (!target) return;
    target.status = target.status || {};
    target.status.poison = (target.status.poison || 0) + Math.max(1, stacks);
  }

  // Apply bomb stack (physical on explode or pass)
  addBomb(target, stacks = 1) {
    if (!target) return;
    target.status = target.status || {};
    target.status.bomb = (target.status.bomb || 0) + Math.max(1, stacks);
  }

  // Called at end of a unit’s turn (or after being hit, if you like)
  // Implements: Poison has a 1-in-6 chance to cure 1 stack; otherwise poison deals 1 true dmg per stack.
  // Bomb: 2-in-3 chance to PASS to a chosen target (if you supply one) or a random target; 1-in-3 chance to EXPLODE.
  stepStatusesFor(unit, { side = "hero", passTarget = null } = {}) {
    if (!unit) return;
    const status = (unit.status = unit.status || {});
    // --- Poison ---
    if ((status.poison || 0) > 0) {
      const cureRoll = d6();
      if (cureRoll === 1 && status.poison > 0) {
        status.poison -= 1;
        this.push?.(`${unit.name} resisted poison (cured 1 stack).`);
      } else {
        // True damage (bypasses armor)
        const dmg = status.poison;
        unit.hp = Math.max(0, (unit.hp || 0) - dmg);
        this.push?.(`${unit.name} takes ${dmg} poison damage.`);
      }
    }

    // --- Bomb ---
    if ((status.bomb || 0) > 0) {
      const bombRoll = Math.random(); // < 2/3 pass, else explode
      if (bombRoll < (2 / 3)) {
        // Pass a single stack to someone else on the other team
        const passed = Math.min(1, status.bomb);
        status.bomb -= passed;

        // choose a recipient
        const other = this.chooseOtherTeamTarget(unit, side, passTarget);
        if (other) {
          other.status = other.status || {};
          other.status.bomb = (other.status.bomb || 0) + passed;
          this.push?.(`${unit.name} passed a bomb stack to ${other.name}.`);
        } else {
          // nobody to pass to -> explode on self
          const dmg = passed * 3;
          this.applyTrueDamage(unit, dmg);
          this.push?.(`${unit.name}'s bomb exploded for ${dmg} (no valid target to pass).`);
        }
      } else {
        // Explode: deal physical damage, then remove all stacks
        const stacks = status.bomb;
        const dmg = stacks * 3; // tune
        status.bomb = 0;

        // Physical damage to the unit itself (so armor can absorb)
        const res = this.applyDamage(unit, dmg, { type: "bomb" });
        this.push?.(`${unit.name}'s bomb exploded for ${res.damage} (armor absorbed ${res.armorSpent}).`);
      }
    }
  }

  // Helper: pick “other team” target
  chooseOtherTeamTarget(unit, side, explicit) {
    if (explicit) return explicit;
    if (side === "hero") {
      // pass bomb to an enemy
      const candidates = this._enemies.filter((e) => (e.hp || 0) > 0);
      return candidates[Math.floor(Math.random() * candidates.length)] || null;
    } else {
      // enemy side -> pass to a hero
      const candidates = (this.party || []).filter((h) => (h.hp || 0) > 0);
      return candidates[Math.floor(Math.random() * candidates.length)] || null;
    }
  }

  // Utility: true damage (bypasses armor)
  applyTrueDamage(target, amount) {
    if (!target || amount <= 0) return 0;
    const before = target.hp || 0;
    target.hp = Math.max(0, before - amount);
    return before - target.hp;
  }

  // ------------- SPELL CASTS -------------
  // Minimal spell resolution matching your rules
  cast(hero, face) {
    if (!hero || !face || face.kind !== "spell") return;
    const { name, tier } = face;

    // Pick a target: first living enemy by default
    const enemy = this._enemies.find((e) => (e.hp || 0) > 0);

    switch (name) {
      case "attack": {
        if (!enemy) { this.push?.(`${hero.name} swings at nothing.`); return; }
        const dmg = tier >= 2 ? 6 : 5;
        const res = this.applyDamage(enemy, dmg, { type: "attack", from: hero.id });
        this.push?.(`${hero.name} ATTACK hits ${enemy.name} for ${res.damage} (armor ${res.armorSpent}).`);
        break;
      }
      case "sweep": {
        const dmg = tier >= 2 ? 3 : 2;
        let hits = 0;
        this._enemies.forEach((e) => {
          if ((e.hp || 0) <= 0) return;
          const res = this.applyDamage(e, dmg, { type: "sweep", from: hero.id });
          if (res.damage > 0) hits++;
        });
        this.push?.(`${hero.name} SWEEP hits ${hits} enemies for ~${dmg}.`);
        break;
      }
      case "heal": {
        const amount = tier >= 2 ? 6 : 5;
        const healed = this.heal(hero, amount);
        this.push?.(`${hero.name} heals ${healed} HP.`);
        break;
      }
      case "armor": {
        const amount = tier >= 2 ? 3 : 2;
        hero.armor = (hero.armor || 0) + amount;
        this.emitVfx?.({ target: "hero", type: "guard", heroId: hero.id });
        this.push?.(`${hero.name} gains ${amount} ARMOR (total ${hero.armor}).`);
        break;
      }
      case "fireball": {
        if (!enemy) { this.push?.(`${hero.name} casts Fireball but finds no target.`); return; }
        const dmg = tier >= 2 ? 7 : 6; // TRUE damage
        const dealt = this.applyTrueDamage(enemy, dmg);
        this.emitVfx?.({ target: "enemy", type: "burn", enemyId: enemy.id });
        this.push?.(`${hero.name} FIREBALL deals ${dealt} true dmg to ${enemy.name}.`);
        break;
      }
      case "poison": {
        if (!enemy) { this.push?.(`${hero.name} applies poison to nobody.`); return; }
        this.addPoison(enemy, 1);
        this.push?.(`${hero.name} inflicts 1 PSN stack on ${enemy.name}.`);
        break;
      }
      case "bomb": {
        if (!enemy) { this.push?.(`${hero.name} plants a bomb on nobody.`); return; }
        this.addBomb(enemy, 1);
        this.push?.(`${hero.name} plants 1 BMB stack on ${enemy.name}.`);
        break;
      }
      case "concentration": {
        // You can insert your “next spell enhanced” logic here
        this.push?.(`${hero.name} concentrates (placeholder).`);
        break;
      }
      case "blank":
      default: {
        this.push?.(`${hero.name} rolled a blank / unsupported spell: ${name}.`);
      }
    }

    // Optional: tick statuses for enemies after player action
    this._enemies.forEach((e) => this.stepStatusesFor(e, { side: "enemy" }));
  }

  // ------------- CLASS ABILITIES -------------
  activateClass(hero) {
    if (!hero || !hero.classId) return;
    const c = String(hero.classId);

    switch (c) {
      case "tank": {
        hero.armor = (hero.armor || 0) + 2;
        this.emitVfx?.({ target: "hero", type: "guard", heroId: hero.id });
        this.push?.(`${hero.name} (Tank) gains +2 ARMOR (total ${hero.armor}).`);
        break;
      }
      case "king": {
        hero.armor = (hero.armor || 0) + 1;
        const healed = this.heal(hero, 1);
        this.push?.(`${hero.name} (King) +1 ARMOR, +${healed} HP.`);
        break;
      }
      case "paladin": {
        hero.armor = (hero.armor || 0) + 1;
        const healed = this.heal(hero, 2);
        this.push?.(`${hero.name} (Paladin) +1 ARMOR, heals ${healed}.`);
        break;
      }
      case "barbarian": {
        // Example: deal 2 physical to first enemy
        const enemy = this._enemies.find((e) => (e.hp || 0) > 0);
        if (enemy) {
          const res = this.applyDamage(enemy, 2, { type: "attack", from: hero.id });
          this.push?.(`${hero.name} (Barbarian) rages for ${res.damage}.`);
        } else {
          this.push?.(`${hero.name} (Barbarian) rages but finds no foe.`);
        }
        break;
      }
      case "lich": {
        // Example: apply poison stack to first enemy
        const enemy = this._enemies.find((e) => (e.hp || 0) > 0);
        if (enemy) {
          this.addPoison(enemy, 1);
          this.push?.(`${hero.name} (Lich) spreads 1 PSN to ${enemy.name}.`);
        }
        break;
      }
      case "vampire": {
        // Example: lifesteal 2 on first enemy
        const enemy = this._enemies.find((e) => (e.hp || 0) > 0);
        if (enemy) {
          const res = this.applyDamage(enemy, 2, { type: "attack", from: hero.id });
          const healed = this.heal(hero, Math.min(2, res.damage));
          this.push?.(`${hero.name} (Vampire) steals ${healed} HP.`);
        }
        break;
      }
      case "judge": {
        // Example: true strike 3 to first enemy
        const enemy = this._enemies.find((e) => (e.hp || 0) > 0);
        if (enemy) {
          const dealt = this.applyTrueDamage(enemy, 3);
          this.push?.(`${hero.name} (Judge) smites for ${dealt} true damage.`);
        }
        break;
      }
      case "thief": {
        // Example: +1 bomb stack to first enemy
        const enemy = this._enemies.find((e) => (e.hp || 0) > 0);
        if (enemy) {
          this.addBomb(enemy, 1);
          this.push?.(`${hero.name} (Thief) plants a sneaky bomb (BMB+1).`);
        }
        break;
      }
      default: {
        this.push?.(`${hero.name} uses ${c} ability (no-op).`);
      }
    }

    // enemies suffer status ticks after class activation too (optional)
    this._enemies.forEach((e) => this.stepStatusesFor(e, { side: "enemy" }));
  }

  // ------------- UPGRADE FLOW -------------
  triggerUpgradeUI(heroId) {
    // App UI handles: choose which slot to upgrade -> pull a random from next tier pool -> accept or keep old
    this._pendingUpgrade = { heroId, at: Date.now() };
    this.toast?.("Choose a spell slot to upgrade!");
    this.push?.(`Upgrade available for ${heroId}.`);
  }
}

export default GameEngine;
