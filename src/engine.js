// src/engine.js

// ---- Face categories your UI can rely on ----
export const FACE_TYPES = {
  CLASS:   "class",   // class/emblem face (proc the class ability)
  SPELL:   "spell",   // a concrete spell face
  UPGRADE: "upgrade", // upgrade/wrench face
  BLANK:   "blank",   // empty slot (can be upgraded)
};

// Small utility: roll a d20 (handy for initiative etc.)
export function rollD20() {
  return Math.floor(Math.random() * 20) + 1;
}

/**
 * isPhysical(spellOrName)
 * Returns true if the spell should be reduced by armor (physical damage).
 * We treat "attack", "sweep", and "bomb" as physical.
 * Fireball & Poison bypass armor (handled elsewhere).
 *
 * Accepts a string ("attack") or a spell object ({ name: "attack" }).
 */
export function isPhysical(spellOrName) {
  const name =
    typeof spellOrName === "string"
      ? spellOrName
      : (spellOrName?.name || spellOrName?.id || spellOrName?.spell || "");

  const n = String(name).toLowerCase();
  return n === "attack" || n === "sweep" || n === "bomb";
}

export default class GameEngine {
  constructor() {
    this.party = [];
    this._enemies = [];

    // simple event hooks the UI can override
    this.push = (msg) => console.log("[LOG]", msg);
    this.toast = (msg) => console.log("[TOAST]", msg);
    this.onHeroHit = (id) => {}; // UI can flash a hero card when hit
  }

  // ------- party -------

  buildHero(name, classId) {
    return {
      id: `${classId}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      classId,
      hp: 10,
      maxHp: 10,
      armor: 0,
      // spell slots (null = blank)
      loadout: { t1: [null, null], t2: [null] },
      // status stacks
      status: { poison: [], bomb: [] },
      // initiative (can be set by UI at encounter start)
      init: null,
    };
  }

  // ------- enemies -------

  /**
   * Spawn an enemy. Pass { id, name, tier, armor, ai, spriteId }
   * - spriteId: 1..20 index into the tier sheet you’re using
   * - ai: "melee" | "caster" | "boss"
   */
  spawnEnemy(e) {
    const base = {
      hp: 12,
      armor: 0,
      tier: 1,
      ai: "melee",
      status: { poison: [], bomb: [] },
      spriteId: 1, // 1..20
      init: null,
    };
    const foe = { ...base, ...e };
    this._enemies.push(foe);
    this.push(`Enemy spawned: ${foe.name} (T${foe.tier})`);
    return foe;
  }

  clearEnemies() {
    this._enemies = [];
    this.push("Enemies cleared.");
  }

  // ------- helpers -------

  _aliveHeroes() {
    return this.party.filter((h) => h.hp > 0);
  }
  _aliveEnemies() {
    return this._enemies.filter((e) => e.hp > 0);
  }

  _pickTargetHero() {
    const alive = this._aliveHeroes();
    if (alive.length === 0) return null;
    // bias to lowest HP sometimes
    const sorted = [...alive].sort((a, b) => a.hp - b.hp);
    return Math.random() < 0.6
      ? sorted[0]
      : alive[Math.floor(Math.random() * alive.length)];
  }

  // ------- status processing (PSN/BMB) -------

  /**
   * Apply start-of-turn status for both sides:
   *  - Poison: deals 1 per stack ignoring armor, 1/6 chance to shed 1 stack
   *  - Bomb:   consume 1 stack; 2/3 pass to a random foe, else explode for 3 physical
   * Call once at the start of the enemy phase (and/or hero phase if desired).
   */
  _processStatusesAtTurnStart() {
    // enemies
    for (const e of this._aliveEnemies()) {
      // POISON on enemy
      if (e.status?.poison?.length) {
        const stacks = e.status.poison.length;
        e.hp = Math.max(0, (e.hp || 0) - stacks); // ignore armor
        this.push(`${e.name} suffers ${stacks} PSN.`);
        if (Math.random() < 1 / 6) {
          e.status.poison.pop();
          this.push(`${e.name} resists 1 PSN stack.`);
        }
      }
      // BOMB on enemy
      if (e.status?.bomb?.length) {
        e.status.bomb.pop(); // consume one stack each start
        if (Math.random() < 2 / 3) {
          // pass to hero
          const h = this._pickTargetHero();
          if (h) {
            h.status.bomb = h.status.bomb || [];
            h.status.bomb.push({ stacks: 1 });
            this.push(`${e.name} passes BMB to ${h.name}.`);
          }
        } else {
          // explode on self (physical 3)
          const dmg = 3;
          const taken = Math.max(0, dmg - (e.armor || 0));
          e.hp = Math.max(0, (e.hp || 0) - taken);
          this.push(`BMB explodes on ${e.name} for ${taken}.`);
        }
      }
    }

    // heroes
    for (const h of this._aliveHeroes()) {
      if (h.status?.poison?.length) {
        const stacks = h.status.poison.length;
        h.hp = Math.max(0, (h.hp || 0) - stacks); // ignore armor
        this.push(`${h.name} suffers ${stacks} PSN.`);
        if (Math.random() < 1 / 6) {
          h.status.poison.pop();
          this.push(`${h.name} resists 1 PSN stack.`);
        }
      }
      if (h.status?.bomb?.length) {
        h.status.bomb.pop();
        if (Math.random() < 2 / 3) {
          // pass to a random enemy
          const foes = this._aliveEnemies();
          if (foes.length) {
            const e = foes[Math.floor(Math.random() * foes.length)];
            e.status.bomb = e.status.bomb || [];
            e.status.bomb.push({ stacks: 1 });
            this.push(`${h.name} passes BMB to ${e.name}.`);
          }
        } else {
          // explode on hero (physical 3)
          const dmg = 3;
          const taken = Math.max(0, dmg - (h.armor || 0));
          h.hp = Math.max(0, (h.hp || 0) - taken);
          this.push(`BMB explodes on ${h.name} for ${taken}.`);
          this.onHeroHit?.(h.id);
        }
      }
    }
  }

  // ------- very simple enemy AI -------

  _enemyAttack(e) {
    const target = this._pickTargetHero();
    if (!target) return;

    if (e.ai === "caster") {
      // Ignores armor (fireball-like)
      const dmg = e.tier >= 2 ? 3 : 2;
      target.hp = Math.max(0, (target.hp || 0) - dmg);
      this.push(
        `${e.name} scorches ${target.name} for ${dmg} (ignores armor).`
      );
      this.onHeroHit?.(target.id);
    } else if (e.ai === "boss") {
      const dmg = 4;
      const taken = Math.max(0, dmg - (target.armor || 0));
      target.hp = Math.max(0, (target.hp || 0) - taken);
      this.push(`${e.name} smashes ${target.name} for ${taken}.`);
      this.onHeroHit?.(target.id);
    } else {
      // melee default (physical)
      const dmg = e.tier >= 2 ? 3 : 2;
      const taken = Math.max(0, dmg - (target.armor || 0));
      target.hp = Math.max(0, (target.hp || 0) - taken);
      this.push(`${e.name} hits ${target.name} for ${taken}.`);
      this.onHeroHit?.(target.id);
    }
  }

  async enemyTurn() {
    // status processing first (PSN/BMB ticks & passes)
    this._processStatusesAtTurnStart();

    const foes = this._aliveEnemies();
    if (foes.length === 0) {
      this.push("No enemies to act.");
      return;
    }

    for (const e of foes) {
      await new Promise((r) => setTimeout(r, 300)); // small pacing for UI
      if (e.hp <= 0) continue;
      this._enemyAttack(e);
    }
  }
}
