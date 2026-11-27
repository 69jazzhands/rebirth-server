// Guns and melee weapons. Add your own in a mod with Rebirth.content.guns.<id> = {...} or Rebirth.content.melee.<id> = {...}.
// Guns: dmg per pellet, cool = seconds between shots, mag = magazine size, reload seconds, pellets per shot, spread (radians),
//       pierce = extra zombies a bullet goes through, range (m), cost = shop price (0 = start weapon), box = rounds per ammo box, acost = ammo box price,
//       pickup = rounds in an ammo box found on the street, model = [length, has magazine 0/1], stock = shoulder stock in first person,
//       feel = spread growth per shot (bloom), its cap (maxBloom), recoil (kick) and extra spread while moving (move).
//       start: true = every survivor begins with it (with startAmmo spare rounds).
// Melee: dmg, cool = seconds between swings, reach (m), arc = swing width (radians), targets = zombies hit per swing,
//        cut = can take limbs off, knock = shove distance, cost, len = model length (m), col = head colour, desc = shop text.
//        model: optional function (g, kit) that builds your own 3D model; see MODDING.md.
Rebirth.content.guns = {
    pistol: { name: 'Pistol', start: true, startAmmo: 24, an: 'Pistol rounds', dmg: 32, cool: 0.24, mag: 12, reload: 1.4, pellets: 1, spread: 0, pierce: 0, range: 45, cost: 0, box: 12, acost: 30, pickup: 8, model: [0.22, 0], feel: { bloom: 0.012, maxBloom: 0.05, kick: 0.012, move: 0.02 } },
    smg: { name: 'SMG', an: 'SMG rounds', dmg: 20, cool: 0.09, mag: 30, reload: 1.8, pellets: 1, spread: 0.02, pierce: 0, range: 40, cost: 450, box: 30, acost: 40, pickup: 15, model: [0.36, 1], feel: { bloom: 0.006, maxBloom: 0.06, kick: 0.007, move: 0.025 } },
    shotgun: { name: 'Shotgun', an: 'Shotgun shells', dmg: 36, cool: 0.75, mag: 6, reload: 2.2, pellets: 5, spread: 0.07, pierce: 0, range: 22, cost: 300, box: 8, acost: 40, pickup: 4, model: [0.62, 0], stock: true, feel: { bloom: 0.0, maxBloom: 0.02, kick: 0.045, move: 0.015 } },
    rifle: { name: 'Rifle', an: 'Rifle rounds', dmg: 90, cool: 0.6, mag: 8, reload: 2.0, pellets: 1, spread: 0, pierce: 2, range: 60, cost: 600, box: 10, acost: 50, pickup: 4, model: [0.74, 1], stock: true, feel: { bloom: 0.03, maxBloom: 0.06, kick: 0.03, move: 0.04 } }
  };

Rebirth.content.melee = {
    knife:   { name: 'Knife',        dmg: 30,  cool: 0.34, reach: 1.6, arc: 1.1, targets: 1, cut: true,  knock: 0.1, cost: 60,  len: 0.22, col: 0xb8bcc0, desc: 'Fast, quiet stabs. Short reach.' },
    bat:     { name: 'Baseball Bat', dmg: 44,  cool: 0.6,  reach: 2.0, arc: 1.8, targets: 2, cut: false, knock: 0.7, cost: 120, len: 0.82, col: 0x9a7a4a, desc: 'Wide swing that knocks zombies back.' },
    crowbar: { name: 'Crowbar',      dmg: 50,  cool: 0.62, reach: 1.9, arc: 1.5, targets: 2, cut: false, knock: 0.45, cost: 150, len: 0.62, col: 0x404448, desc: 'Solid steel. Never breaks.' },
    machete: { name: 'Machete',      dmg: 56,  cool: 0.5,  reach: 2.1, arc: 1.8, targets: 2, cut: true,  knock: 0.2, cost: 220, len: 0.6,  col: 0xc0c4c8, desc: 'Long blade. Takes arms off.' },
    axe:     { name: 'Fire Axe',     dmg: 86,  cool: 0.85, reach: 2.2, arc: 1.6, targets: 2, cut: true,  knock: 0.4, cost: 320, len: 0.85, col: 0xb02a20, desc: 'Heavy chops through limbs and heads.' },
    sledge:  { name: 'Sledgehammer', dmg: 115, cool: 1.15, reach: 2.3, arc: 2.0, targets: 3, cut: false, knock: 1.3, cost: 380, len: 0.9,  col: 0x2a2c30, desc: 'Slow. Bursts heads and sends zombies flying.' }
  };
