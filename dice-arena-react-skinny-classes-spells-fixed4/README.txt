Dice Arena Code Patch — Classes + Spells + Upgrades

Adds:
- Full class faces and hooks (Thief, Judge, Tank, Vampire, King, Lich + ghouls, Paladin, Barbarian rules)
- Tiered Spells: Attack, Heal, Armor, Concentration (stacking), Sweep, Fireball, Poison, Bomb, Upgrade, Blank
- Poison/Bomb dice per rules
- Upgrade chooser (keep old or take new)
- Dice builder for players (default + class face)

Files:
- src/rules/classes.js
- src/rules/spells.js
- src/rules/dice.js
- src/rules/engine.js
- src/ui/UpgradeChooser.jsx

Integration:
In App.jsx (top):
  import UpgradeChooser from './ui/UpgradeChooser.jsx'
  import { attachEngine } from './rules/engine.js'

Inside component, after state setup:
  const [upgradeChoice,setUpgradeChoice] = useState(null)
  const app = { push, party, setParty, enemies, setEnemies, rand, log:push }
  attachEngine(app)
  // wrap engine upgrade modal to state
  app._upgradeChoice = null
  app.upgradeFace = (hero)=>{ const base=hero._lastFace || hero.die[0]; const t=base.blank?1:Math.min(3,(base.tier||0)+1); const {randomFaceByTier}=await import('./rules/dice.js') }
(See code notes: you can call app.commitUpgrade(true/false) from UpgradeChooser buttons)

Note: You may need to wire these calls in your UI:
- On hero roll: const face = app.rollFace(hero); app.resolveFace(hero, face)
- After hero action: app.endHeroTurn(hero)
- At start of enemy turn: resolve poison/bomb on all entities
