// Example mod: a new melee weapon with its own model, a new zombie type, a street barricade and a kill message.
// Copy this folder, rename it, change the id below, and add it to mods/mods.js to start your own mod.
Rebirth.mod({
  id: 'example-pack',
  name: 'Example Pack',
  version: '1.0.0',
  author: 'Rebirth',
  description: 'Adds a shovel, hazmat zombies and a barricade near the trader.',

  init: function (api) {
    // 1. A melee weapon. It shows up at the trader under Melee weapons.
    api.addMelee('shovel', {
      name: 'Shovel', dmg: 48, cool: 0.7, reach: 2.1, arc: 1.7, targets: 2, cut: true, knock: 0.6, cost: 140,
      len: 0.95, col: 0x5a5e62, desc: 'Long reach. The edge can take a limb off.',
      // its head, built pointing down from the hand: the game draws the wooden handle, and kit.tip is where it ends
      model: function (g, kit) {
        kit.part(kit.boxGeo(0.16, 0.2, 0.012), kit.mat(0x5a5e62), 0, kit.tip - 0.1, 0.03);   // blade
        kit.part(kit.boxGeo(0.03, 0.05, 0.03), kit.dark, 0, kit.tip + 0.01, 0.03);            // collar
      }
    });

    // 2. A zombie type: slow and tough, in a yellow hazmat suit. It behaves like a walker.
    api.addZombie('hazmat', {
      ai: 'walker', appearsAfter: 40, chance: 0.05, hp: 140, speed: [0.9, 1.2], dmg: 12,
      skin: 0x8a9a70, shirt: 0xd8c040, pants: 0xd8c040, hair: 0, tint: 0xf0dc70, scale: 1.02, bulk: 1.15,
      xp: 2, drops: 3, bonusDrops: [['meds', 1]], partName: 'Hazmat filter', partColor: 0xe8d050,
      desc: 'Was trying to contain the outbreak.'
    });

    // 3. A barricade of concrete barriers and drums, built with the city (same spot for every player).
    api.on('buildWorld', function (ctx) {
      var placed = 0;
      for (var t = 0; t < 40 && placed < 4; t++) {
        var x = 6 + ctx.rnd(-3, 3), z = 22 + ctx.rnd(-3, 3);
        if (!ctx.freeGround(x, z, 1.4)) continue;
        var y = ctx.groundY(x, z), turn = ctx.rnd(-0.3, 0.3);
        if (placed % 2 === 0) {
          ctx.prop('barrier', ctx.frameM(x, y, z, turn), function () {           // simple box on lower graphics
            ctx.stat(ctx.boxGeo(2.0, 0.95, 0.62), ctx.mat(0x8a8780), x, y + 0.47, z, 0, turn, 0);
          });
          ctx.colliders.push({ x0: x - 1, x1: x + 1, z0: z - 0.35, z1: z + 0.35, h: y + 0.95 });
        } else ctx.placeFurn('drum', x, z, turn, false, y);
        placed++;
      }
    });

    // 4. React to the game: a message every 25 kills.
    api.on('zombieKilled', function (z) {
      var g = Rebirth.game;
      if (g && g.kills % 25 === 0) g.say(g.kills + ' kills. The Example Pack salutes you.');
    });
  }
});
