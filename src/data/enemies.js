// Central registry for enemies, including sprite "index" in your 5x4 sheets.
// You can extend HP/Armor/AI here freely.

export const TIER1_ENEMIES = [
  { key: "goblin",          name: "Goblin",          index: 0,  hp: 10, armor: 0 },
  { key: "pack_rat",        name: "Pack Hunter Rat", index: 1,  hp: 9,  armor: 0 },
  { key: "thick_beetle",    name: "Thick-Hide Beetle", index: 2, hp: 11, armor: 2 },
  { key: "unstable_slime",  name: "Unstable Slime",  index: 3,  hp: 8,  armor: 0 },
  { key: "distracting_imp", name: "Distracting Imp", index: 4,  hp: 9,  armor: 1 },

  { key: "quickstep",   name: "Quickstep Gremlin", index: 5,  hp: 10, armor: 1 },
  { key: "torchling",   name: "Torchling",         index: 6,  hp: 9,  armor: 0 },
  { key: "rust_rat",    name: "Rust Rat",          index: 7,  hp: 8,  armor: 0 },
  { key: "cave_flea",   name: "Cave Flea",         index: 8,  hp: 7,  armor: 1 },
  { key: "lantern_ghoul", name: "Lantern Ghoul",   index: 9,  hp: 10, armor: 0 },

  { key: "thorn_crawler", name: "Thorn Crawler",   index: 10, hp: 9,  armor: 2 },
  { key: "dust_imp",     name: "Dust Imp",         index: 11, hp: 8,  armor: 0 },
  { key: "moss_goblin",  name: "Moss Goblin",      index: 12, hp: 9,  armor: 1 },
  { key: "bone_pecker",  name: "Bone Pecker",      index: 13, hp: 8,  armor: 0 },
  { key: "grime_slug",   name: "Grime Slug",       index: 14, hp: 10, armor: 1 },

  { key: "tunnel_snapper", name: "Tunnel Snapper", index: 15, hp: 11, armor: 2 },
  { key: "scorch_bug",     name: "Scorch Bug",     index: 16, hp: 8,  armor: 0 },
  { key: "cinder_rat",     name: "Cinder Rat",     index: 17, hp: 9,  armor: 0 },
  { key: "drip_slime",     name: "Drip Slime",     index: 18, hp: 8,  armor: 0 },
  { key: "stone_beetle",   name: "Stone Beetle",   index: 19, hp: 12, armor: 2 },
];

export const TIER2_ENEMIES = [
  { key: "savage_orc",       name: "Savage Orc",       index: 0,  hp: 12, armor: 1 },
  { key: "vampire_acolyte",  name: "Vampire Acolyte",  index: 1,  hp: 11, armor: 1 },
  { key: "dark_warden",      name: "Dark Warden",      index: 2,  hp: 14, armor: 3 },
  { key: "blight_spitter",   name: "Blight Spitter",   index: 3,  hp: 10, armor: 1 },
  { key: "ghost_knight",     name: "Ghost Knight",     index: 4,  hp: 12, armor: 4 },

  { key: "storm_caller",     name: "Storm Caller",     index: 5,  hp: 11, armor: 0 },
  { key: "flame_revenant",   name: "Flame Revenant",   index: 6,  hp: 12, armor: 1 },
  { key: "abyss_crawler",    name: "Abyss Crawler",    index: 7,  hp: 14, armor: 2 },
  { key: "rotting_brute",    name: "Rotting Brute",    index: 8,  hp: 16, armor: 1 },
  { key: "crystal_knight",   name: "Crystal Knight",   index: 9,  hp: 15, armor: 3 },

  { key: "frost_warg",       name: "Frost Warg",       index: 10, hp: 13, armor: 1 },
  { key: "vile_totem",       name: "Vile Totem",       index: 11, hp: 10, armor: 0 },
  { key: "iron_husk",        name: "Iron Husk",        index: 12, hp: 18, armor: 4 },
  { key: "blood_spider",     name: "Blood Spider",     index: 13, hp: 12, armor: 2 },
  { key: "sand_revenant",    name: "Sand Revenant",    index: 14, hp: 13, armor: 3 },

  { key: "cursed_archer",    name: "Cursed Archer",    index: 15, hp: 11, armor: 1 },
  { key: "runed_bear",       name: "Runed Bear",       index: 16, hp: 17, armor: 3 },
  { key: "blistering_myconid", name: "Blistering Myconid", index: 17, hp: 10, armor: 1 },
  { key: "marrow_fiend",     name: "Marrow Fiend",     index: 18, hp: 15, armor: 2 },
  { key: "wicked_collector", name: "Wicked Collector", index: 19, hp: 12, armor: 3 },
];

export const BOSS_ENEMIES = [
  { key: "lich_king",     name: "Lich King Var’Zhul", index: 0,  hp: 25, armor: 3 },
  { key: "bombardier",    name: "Infernal Bombardier", index: 1, hp: 30, armor: 2 },
  { key: "titan_stonefist",name: "Titan Stonefist",    index: 2,  hp: 40, armor: 5 },
  { key: "queen_shadows", name: "Queen of Shadows",   index: 3,  hp: 28, armor: 1 },
  { key: "the_maw",       name: "The Maw",            index: 4,  hp: 35, armor: 2 },

  { key: "arcane_reactor", name: "Arcane Reactor",    index: 5,  hp: 20, armor: 0 },
  { key: "eclipse_warden", name: "Eclipse Warden",    index: 6,  hp: 36, armor: 3 },
  { key: "blightroot",     name: "Blightroot",        index: 7,  hp: 30, armor: 2 },
  { key: "gravelord_varn", name: "Gravelord Varn",    index: 8,  hp: 42, armor: 4 },
  { key: "hungering_rift", name: "The Hungering Rift",index: 9,  hp: 30, armor: 0 },

  { key: "ashen_titan",    name: "Ashen Titan",       index: 10, hp: 45, armor: 5 },
  { key: "mirror_shade",   name: "Mirror Shade",      index: 11, hp: 33, armor: 1 },
  { key: "serpent_queen",  name: "Serpent Queen Xilix", index: 12, hp: 38, armor: 2 },
  { key: "clockwork_anomaly", name: "Clockwork Anomaly", index: 13, hp: 35, armor: 3 },
  { key: "storm_herald",   name: "Storm Herald",      index: 14, hp: 39, armor: 2 },

  { key: "iron_widow",     name: "Iron Widow",        index: 15, hp: 34, armor: 3 },
  { key: "dread_siren",    name: "Dread Siren",       index: 16, hp: 32, armor: 2 },
  { key: "ember_king",     name: "Ember King",        index: 17, hp: 44, armor: 2 },
  { key: "vault_guardian", name: "Vault Guardian",    index: 18, hp: 46, armor: 5 },
  { key: "oracle_rust",    name: "Oracle of Rust",    index: 19, hp: 36, armor: 3 },
];

// Quick lookup by key + tier
export function getEnemyByKey(tier, key) {
  const pool = tier === 1 ? TIER1_ENEMIES : tier === 2 ? TIER2_ENEMIES : BOSS_ENEMIES;
  return pool.find((e) => e.key === key) || null;
}
