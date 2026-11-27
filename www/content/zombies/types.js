// Zombie types. The first one marked default is the everyday walker; the rest replace it by chance.
//   appearsAfter = seconds into a run before this type can show up, chance = its share of spawns (0.18 = 18%),
//   hp, speed (m/s, or [min, max]), dmg = damage per hit, radius = body size for collisions, cooldown = seconds between special moves,
//   skin / shirt / pants / hair (0 = bald) = colours on simple graphics, blood = false for a clean body, scale = height, bulk = width,
//   tint = colour multiplied over the realistic model, models = optional list of character names to use (content/characters/characters.js),
//   xp = experience for a kill, drops = how many items it drops (one more half the time), bonusDrops = extra items every time,
//   partName / partColor = the rare part it can drop for the Blacksmith (no partName = never drops one),
//   ai = which built-in behaviour it uses: walker, runner, brute (heavy hits), screamer (calls others), stalker (hunts you), spitter (ranged acid).
// The order matters in multiplayer: everyone in a room must have the same list, so add new types at the end.
Rebirth.content.zombies = {
  walker:   { default: true, hp: 64, speed: [1.1, 1.6], dmg: 10, radius: 0.38, cooldown: 2, xp: 1, drops: 2,
              desc: 'Slow and shambling. Dangerous in groups.' },
  runner:   { appearsAfter: 30, chance: 0.18, hp: 36, speed: [3.6, 4.2], dmg: 8, scale: 0.88, skin: 0x9aa86a, shirt: 0x6d2f2a, tint: 0xf0b8a8,
              xp: 2, drops: 2, partName: 'Runner tendon', partColor: 0xb8c94a, desc: 'Recently turned. Sprints at you.' },
  brute:    { appearsAfter: 50, chance: 0.09, hp: 260, speed: 0.95, dmg: 28, radius: 0.6, scale: 1.3, bulk: 1.45, skin: 0x5e7050, shirt: 0x2f3329, tint: 0x8a9a80,
              xp: 3, drops: 5, bonusDrops: [['tooth', 1]], partName: 'Brute bone', partColor: 0x8a9a6a, desc: 'Huge and slow. Hits very hard.' },
  screamer: { appearsAfter: 60, chance: 0.08, hp: 70, speed: 1.0, dmg: 8, cooldown: 3, scale: 0.9, hair: 0, skin: 0xa98ab8, shirt: 0x4a2a5a, tint: 0xd0a8f0,
              xp: 3, drops: 3, partName: 'Screamer cord', partColor: 0xb070d0, desc: 'Its scream calls more zombies.' },
  stalker:  { appearsAfter: 60, chance: 0.08, hp: 52, speed: 3.3, dmg: 22, scale: 0.86, hair: 0, blood: false, skin: 0xb8c0ba, shirt: 0x3a3f3c, pants: 0x2a2e2c, tint: 0xc8d0d0,
              xp: 3, drops: 3, partName: 'Stalker hide', partColor: 0xc0c8c2, desc: 'Pale and quiet. Hunts you down.' },
  spitter:  { appearsAfter: 60, chance: 0.08, hp: 56, speed: 1.6, dmg: 8, cooldown: 1.5, scale: 0.9, skin: 0x3fae8a, shirt: 0x2a4a3a, tint: 0x90f0c0,
              xp: 3, drops: 3, partName: 'Spitter gland', partColor: 0x3fe0a0, desc: 'Spits acid from range.' }
};
