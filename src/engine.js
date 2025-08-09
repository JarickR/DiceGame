// src/engine.js
import { attachEngine } from './rules/engine.js';

export default class GameEngine {
  constructor() {
    this.rand = Math.random;
    this.push = console.log;
    this.party = [];
    this._enemies = [];
  }

  get enemies() { return this._enemies; }
  set enemies(value) { this._enemies = Array.isArray(value) ? value : []; }

  init() { attachEngine(this); }

  spawnEnemy(enemy) {
    if (!this._enemies) this._enemies = [];
    this._enemies.push(enemy);
  }
  clearEnemies() { this._enemies = []; }
  listEnemies() { return this._enemies || []; }
}
