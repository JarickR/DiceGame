// src/art/manifest.js
// Sprite sheet layout (unchanged)
export const SHEETS = {
  tier1:  { url: '/art/Tier1.png',       cols: 10, rows: 2 },
  tier2:  { url: '/art/Tier2.png',       cols: 5,  rows: 4 },
  boss:   { url: '/art/Boss.png',        cols: 5,  rows: 4 },
  items:  { url: '/art/Accessories.png', cols: 5,  rows: 4 },
};

// d20 → accessory frame index (0..19)
export const ACCESSORY_BY_D20 = {
  1:0, 2:1, 3:2, 4:3, 5:4,
  6:5, 7:6, 8:7, 9:8, 10:9,
  11:10,12:11,13:12,14:13,15:14,
  16:15,17:16,18:17,19:18,20:19
};

// Optional labels (index-aligned with sprite frame)
export const ACCESSORY_INFO = [
  { name: "Bronze Guard Ring",  key:"guardRing",     desc:"+2 armor at start of combat." },
  { name: "Lucky Token",        key:"luckyToken",    desc:"1 reroll per turn." },
  { name: "Focus Band",         key:"focusBand",     desc:"+1 to Concentration multiplier." },
  { name: "Burnt Ember Pendant",key:"emberPendant",  desc:"Attacks apply Burn (1 dmg/turn for 2 turns)." },
  { name: "Iron Knuckle",       key:"ironKnuckle",   desc:"+1 damage to Attack spells." },
  { name: "Glowing Charm",      key:"glowingCharm",  desc:"+1 HP healed by Heal spells." },
  { name: "Runed Bracelet",     key:"runedBracelet", desc:"Start each fight with +1 Concentration stack." },
  { name: "Mirror Charm",       key:"mirrorCharm",   desc:"Reflect the next spell targeting you (once per encounter)." },
  { name: "Sturdy Boots",       key:"sturdyBoots",   desc:"Ignore the first forced movement/knockdown each encounter." },
  { name: "Feather Cloak",      key:"featherCloak",  desc:"-1 damage from Sweep sources." },
  { name: "Moonlight Pendant",  key:"moonPendant",   desc:"At 1 HP, gain +2 to next spell this turn (once per turn)." },
  { name: "Thorned Locket",     key:"thornLocket",   desc:"Thorns: return 1 damage when hit by melee." },
  { name: "Arcane Loop",        key:"arcaneLoop",    desc:"1 extra Upgrade reroll per encounter." },
  { name: "Poison Fang Ring",   key:"poisonFang",    desc:"Poison you apply lasts +1 turn." },
  { name: "Stonecore Medallion",key:"stonecore",     desc:"+1 max armor capacity." },
  { name: "Searing Gem",        key:"searingGem",    desc:"Fireball +1 damage." },
  { name: "Echo Bell",          key:"echoBell",      desc:"Every 3rd cast repeats at 50% effect." },
  { name: "Soul Thread",        key:"soulThread",    desc:"Heal 1 when you deal 4+ damage." },
  { name: "Wind Sigil",         key:"windSigil",     desc:"First roll each turn can be rerolled (once)." },
  { name: "Totem of Rebirth",   key:"totemRebirth",  desc:"Once per run: survive fatal blow at 1 HP." }
];
