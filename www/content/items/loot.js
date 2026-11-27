// Loot. rarity = the coloured ring under an item on the ground: 0 Common (none), 1 Uncommon, 2 Rare, 3 Epic.
// zombieDrops: each item a zombie drops first picks a group by chance (the chances add up to 1),
//   then an item in that group as [item, chance, min, max] (min/max = how many; leave out for one).
//   part = in that group, the chance it is the zombie's own rare part instead (only types with a partName).
// What open buildings hold is set per building type in content/world/building-themes.js.
Rebirth.content.loot = {
  rarity: { scrap: 0, ammo: 0, meds: 1, vparts: 1, cans: 1, gem: 2, tooth: 3, part: 3 },
  zombieDrops: [
    { chance: 0.58, items: [['scrap', 0.55, 2, 6], ['ammo', 0.45]] },
    { chance: 0.26, items: [['meds', 0.4], ['vparts', 0.35], ['cans', 0.25]] },
    { chance: 0.12, items: [['gem', 1]] },
    { chance: 0.04, part: 0.6, items: [['tooth', 1]] }
  ]
};
