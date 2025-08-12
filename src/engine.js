// src/engine.js

export default class GameEngine {
  constructor() {
    this.players = [];
    this.enemies = [];
    this.log = [];
    this.turn = 0;
  }

  push(msg) {
    this.log.unshift(msg);
    if (this.log.length > 200) this.log.pop();
  }

  getState() {
    return {
      players: JSON.parse(JSON.stringify(this.players)),
      enemies: JSON.parse(JSON.stringify(this.enemies)),
      log: this.log.slice(),
      turn: this.turn,
    };
  }

  // Build heroes from loadout
  initFromLoadout(payload) {
    this.players = payload.map((p) => {
      const t1 = (p.tier1 || []).slice(0, 2);
      while (t1.length < 2) t1.push(null);

      const t2 = (p.tier2 || []).slice(0, 1);
      while (t2.length < 1) t2.push(null);

      const spells = [t1[0] ?? null, t1[1] ?? null, t2[0] ?? null, null];

      return {
        id: p.id,
        classId: p.classId,
        hp: 20,
        maxHp: 20,
        armor: 0,
        slots: { t1, t2 },
        dieFaces: [
          { kind: "class", classId: p.classId },                // 0
          { kind: "spell", tier: 1, id: spells[0] || "blank" }, // 1
          { kind: "spell", tier: 1, id: spells[1] || "blank" }, // 2
          { kind: "spell", tier: 2, id: spells[2] || "blank" }, // 3
          { kind: "spell", tier: 1, id: spells[3] || "blank" }, // 4 (spare)
          { kind: "upgrade" },                                  // 5
        ],
        lastRoll: null,
      };
    });

    this.enemies = [];
    this.turn = 0;
    this.push(`Party created with ${this.players.length} hero(s).`);
  }

  // Simple encounter for testing armor interactions
  startEncounter() {
    this.turn = 1;
    this.enemies = [
      { id: 1, name: "Training Dummy", hp: 18, maxHp: 18, armor: 4, tier: 1 },
    ];
    this.push("Encounter started. A Training Dummy appears (HP 18, Armor 4).");
  }

  // D6 = 0..5
  rollFace(playerIndex) {
    const h = this.players[playerIndex];
    if (!h) return null;
    const d6 = Math.floor(Math.random() * 6);
    const face = h.dieFaces[d6];
    const res = { d6, face, playerId: h.id };
    h.lastRoll = res;
    return res;
  }

  // Armor-aware damage
  // type: 'physical' (Attack/Sweep/Bomb) or 'ignore' (Fireball/Poison)
  applyDamage(target, amount, type = "physical") {
    if (!target || amount <= 0) return { dealt: 0, absorbed: 0 };

    if (type === "ignore") {
      const dealt = Math.min(amount, target.hp);
      target.hp -= dealt;
      return { dealt, absorbed: 0 };
    }

    let remaining = amount;
    let absorbed = 0;

    if (target.armor > 0) {
      const soak = Math.min(target.armor, remaining);
      target.armor -= soak;
      absorbed += soak;
      remaining -= soak;
    }

    const dealt = Math.min(remaining, target.hp);
    target.hp -= dealt;
    return { dealt, absorbed };
  }

  // Resolve result (UI handles upgrade slot selection and offered spell)
  resolveRoll(playerIndex, result, onRequestUpgrade) {
    const h = this.players[playerIndex];
    if (!h || !result) return;

    const f = result.face;
    if (f.kind === "class") {
      this.push(`Hero ${h.id} used class ability: ${h.classId}.`);
      return;
    }

    if (f.kind === "upgrade") {
      // Ask UI which slot to upgrade; UI will then propose a random next-tier spell
      if (onRequestUpgrade) onRequestUpgrade(playerIndex);
      this.push(`Hero ${h.id} rolled Upgrade — select a spell slot to improve.`);
      return;
    }

    if (f.kind !== "spell") return;

    const name = f.id;
    const tier = f.tier || 1;

    if (name === "blank") {
      this.push(`Hero ${h.id} rolled a blank face.`);
      return;
    }

    const numbers = {
      attack: { 1: 2, 2: 4, 3: 6 },
      sweep: { 1: 1, 2: 2, 3: 4 },
      fireball: { 1: 1, 2: 3, 3: 5 },
      heal: { 1: 1, 2: 3, 3: 0 },
      armor: { 1: 2, 2: 6, 3: 0 },
      bomb: { 2: 6 }, // bomb only defined at T2 in the manual
    };

    const firstEnemy = this.enemies[0] || null;

    switch (name) {
      case "armor": {
        const gain = numbers.armor[tier] || 0;
        h.armor = Math.max(0, h.armor + gain);
        this.push(`Hero ${h.id} gains ${gain} Armor (now ${h.armor}).`);
        break;
      }

      case "heal": {
        const gain = numbers.heal[tier] || 0;
        const before = h.hp;
        h.hp = Math.min(h.maxHp, h.hp + gain);
        const actual = h.hp - before;
        this.push(`Hero ${h.id} heals ${actual} HP (now ${h.hp}/${h.maxHp}).`);
        break;
      }

      case "attack": {
        const dmg = numbers.attack[tier] || 0;
        if (!firstEnemy) {
          this.push(`Hero ${h.id} strikes (no target).`);
          break;
        }
        const { dealt, absorbed } = this.applyDamage(firstEnemy, dmg, "physical");
        this.push(
          `Hero ${h.id} attacks for ${dmg}. Armor absorbed ${absorbed}, ${dealt} HP dealt. ` +
          `${firstEnemy.name}: HP ${firstEnemy.hp}/${firstEnemy.maxHp}, Armor ${firstEnemy.armor}.`
        );
        this._checkEnemyDeath(firstEnemy);
        break;
      }

      case "sweep": {
        const dmg = numbers.sweep[tier] || 0;
        if (!this.enemies.length) {
          this.push(`Hero ${h.id} sweeps (no targets).`);
          break;
        }
        let totalDealt = 0, totalAbs = 0;
        for (const e of this.enemies) {
          const { dealt, absorbed } = this.applyDamage(e, dmg, "physical");
          totalDealt += dealt; totalAbs += absorbed;
          this._checkEnemyDeath(e);
        }
        this.push(
          `Hero ${h.id} uses Sweep (${dmg} each). Armor absorbed ${totalAbs}, total ${totalDealt} HP dealt.`
        );
        break;
      }

      case "fireball": {
        const dmg = numbers.fireball[tier] || 0;
        if (!firstEnemy) {
          this.push(`Hero ${h.id} casts Fireball (no target).`);
          break;
        }
        this.applyDamage(firstEnemy, dmg, "ignore");
        this.push(
          `Hero ${h.id} casts Fireball for ${dmg} (ignores armor). ` +
          `${firstEnemy.name}: HP ${firstEnemy.hp}/${firstEnemy.maxHp}, Armor ${firstEnemy.armor}.`
        );
        this._checkEnemyDeath(firstEnemy);
        break;
      }

      case "poison": {
        if (!firstEnemy) {
          this.push(`Hero ${h.id} applies Poison (no target).`);
          break;
        }
        this.applyDamage(firstEnemy, 1, "ignore");
        this.push(
          `Hero ${h.id} applies Poison (ignores armor): 1 dmg. ` +
          `${firstEnemy.name}: HP ${firstEnemy.hp}/${firstEnemy.maxHp}.`
        );
        this._checkEnemyDeath(firstEnemy);
        break;
      }

      case "bomb": {
        const dmg = numbers.bomb[tier] || 0;
        if (!firstEnemy) {
          this.push(`Hero ${h.id} throws a Bomb (no target).`);
          break;
        }
        const { dealt, absorbed } = this.applyDamage(firstEnemy, dmg, "physical");
        this.push(
          `Hero ${h.id} throws a Bomb for ${dmg}. Armor absorbed ${absorbed}, ${dealt} HP dealt. ` +
          `${firstEnemy.name}: HP ${firstEnemy.hp}/${firstEnemy.maxHp}, Armor ${firstEnemy.armor}.`
        );
        this._checkEnemyDeath(firstEnemy);
        break;
      }

      case "concentration": {
        this.push(`Hero ${h.id} rolls Concentration — next spell effect doubles (hook later).`);
        break;
      }

      default: {
        this.push(`Hero ${h.id} used ${name} (T${tier}).`);
      }
    }
  }

  _checkEnemyDeath(e) {
    if (e.hp <= 0) {
      this.push(`${e.name} is defeated!`);
      this.enemies = this.enemies.filter((x) => x.id !== e.id);
    }
  }

  // UI-driven upgrade commit
  commitUpgrade(playerIndex, slotIndex, acceptNew, newSpell) {
    const h = this.players[playerIndex];
    if (!h) return;
    if (slotIndex < 1 || slotIndex > 4) return;

    const old = h.dieFaces[slotIndex];
    if (!old || old.kind !== "spell") return;

    if (acceptNew && newSpell && newSpell.id !== "blank") {
      h.dieFaces[slotIndex] = { kind: "spell", tier: newSpell.tier, id: newSpell.id };
      this.push(`Hero ${h.id} upgraded slot ${slotIndex} to ${newSpell.id} (T${newSpell.tier}).`);
    } else {
      this.push(`Hero ${h.id} kept the old spell in slot ${slotIndex}.`);
    }
  }
}
