// Furniture placed inside open buildings. Each piece is built from boxes in its own space and gets a box collider.
// d = [width, height, depth] in metres, m = colour, build(k) adds its parts. k gives you:
//   k.W, k.H, k.D (the size), k.m (its colour material), k.dark, k.b(w, h, d, x, y, z, material, turn) to add a box,
//   k.add(geometry, material, x, y, z, rx, ry, rz) for any shape, plus k.type, k.mat, k.boxGeo, k.taper, k.rnd, k.pick, k.RNG.
// Room themes in content/world/building-themes.js decide which pieces go in which kind of building.
Rebirth.content.furniture = {
  // store shelf with goods
  shelf: { d: [1.8, 1.9, 0.5], m: 0x4a4f55, build: function (k) { k.b(0.05, k.H, k.D, -k.W / 2, k.H / 2, 0); k.b(0.05, k.H, k.D, k.W / 2, k.H / 2, 0); k.b(k.W, k.H, 0.03, 0, k.H / 2, -k.D / 2); for (var s = 0; s < 4; s++) { var sy = 0.1 + s * 0.55; k.b(k.W, 0.04, k.D, 0, sy, 0); for (var gx = -k.W / 2 + 0.2; gx < k.W / 2 - 0.1; gx += 0.28) if (k.RNG() < 0.35) k.b(0.18, k.rnd(0.12, 0.3), 0.2, gx, sy + 0.15, k.rnd(-0.1, 0.1), k.mat(k.pick(k.GOODS))); } } },
  // shop counter
  counter: { d: [2.2, 1.0, 0.7], m: 0x5a4430, build: function (k) { k.b(k.W, k.H - 0.05, k.D, 0, (k.H - 0.05) / 2, 0); k.b(k.W + 0.1, 0.05, k.D + 0.1, 0, k.H - 0.025, 0, k.mat(0x2a2622)); } },
  // fridge
  fridge: { d: [0.8, 1.9, 0.7], m: 0x8a8c86, build: function (k) { k.b(k.W, k.H, k.D, 0, k.H / 2, 0); k.b(0.03, 0.4, 0.04, k.W / 2 - 0.1, 1.3, k.D / 2 + 0.02, k.dark); k.b(k.W, 0.02, 0.01, 0, 1.15, k.D / 2 + 0.005, k.dark); } },
  // bed (sometimes bloodied)
  bed: { d: [0.95, 0.55, 2.0], m: 0x6a6e72, build: function (k) { k.b(k.W, 0.3, k.D, 0, 0.15, 0); k.b(k.W - 0.05, 0.2, k.D - 0.1, 0, 0.4, 0, k.mat(0x8a8274)); k.b(k.W - 0.2, 0.1, 0.35, 0, 0.55, -k.D / 2 + 0.25, k.mat(0x9a9a8e)); if (k.RNG() < 0.5) k.b(0.6, 0.02, 0.7, 0.05, 0.51, 0.2, k.mat(0x4a0c0a)); } },
  // filing cabinet
  cabinet: { d: [1.0, 1.8, 0.45], m: 0x8e8c82, build: function (k) { k.b(k.W, k.H, k.D, 0, k.H / 2, 0); k.b(0.02, k.H - 0.1, 0.01, 0, k.H / 2, k.D / 2 + 0.005, k.dark); if (k.type === 'locker') for (var v = 0; v < 3; v++) k.b(0.3, 0.02, 0.01, -0.25, k.H - 0.2 - v * 0.06, k.D / 2 + 0.006, k.dark); if (k.RNG() < 0.4) k.b(k.W / 2, k.H - 0.1, 0.03, k.W / 2 + 0.25, k.H / 2, k.D / 2 + 0.25, k.m, -1.1); } },
  // office desk
  desk: { d: [1.4, 0.76, 0.7], m: 0x5a4430, build: function (k) { k.b(k.W, 0.05, k.D, 0, k.H - 0.025, 0); if (k.type === 'desk') { k.b(0.05, k.H - 0.05, k.D, -k.W / 2 + 0.03, (k.H - 0.05) / 2, 0); k.b(0.4, k.H - 0.05, k.D, k.W / 2 - 0.2, (k.H - 0.05) / 2, 0); } else [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { k.b(0.06, k.H - 0.05, 0.06, q[0] * (k.W / 2 - 0.06), (k.H - 0.05) / 2, q[1] * (k.D / 2 - 0.06)); }); if (k.RNG() < 0.5) k.b(0.3, 0.02, 0.22, k.rnd(-0.3, 0.3), k.H + 0.01, 0, k.mat(0xb8b2a0), k.rnd(0, 3)); } },
  // metal locker
  locker: { d: [1.0, 1.9, 0.5], m: 0x3e4c5a, build: function (k) { k.b(k.W, k.H, k.D, 0, k.H / 2, 0); k.b(0.02, k.H - 0.1, 0.01, 0, k.H / 2, k.D / 2 + 0.005, k.dark); if (k.type === 'locker') for (var v = 0; v < 3; v++) k.b(0.3, 0.02, 0.01, -0.25, k.H - 0.2 - v * 0.06, k.D / 2 + 0.006, k.dark); if (k.RNG() < 0.4) k.b(k.W / 2, k.H - 0.1, 0.03, k.W / 2 + 0.25, k.H / 2, k.D / 2 + 0.25, k.m, -1.1); } },
  // work bench with tools
  bench: { d: [2.0, 0.9, 0.7], m: 0x4a3a2a, build: function (k) { k.b(k.W, 0.06, k.D, 0, k.H - 0.03, 0); k.b(k.W - 0.1, 0.5, k.D - 0.1, 0, 0.3, 0, k.mat(0x2e3238)); for (var t = 0; t < 3; t++) k.b(k.rnd(0.15, 0.4), 0.08, 0.12, k.rnd(-0.8, 0.8), k.H + 0.04, k.rnd(-0.2, 0.2), k.mat(k.pick([0x8a2a22, 0x5a5e62, 0x9a7a2a]))); } },
  // couch
  couch: { d: [2.0, 0.8, 0.85], m: 0x4a3a44, build: function (k) { k.b(k.W, 0.42, k.D, 0, 0.21, 0); k.b(k.W, 0.5, 0.22, 0, 0.6, -k.D / 2 + 0.11); k.b(0.22, 0.25, k.D, -k.W / 2 + 0.11, 0.54, 0); k.b(0.22, 0.25, k.D, k.W / 2 - 0.11, 0.54, 0); } },
  // table
  table: { d: [1.2, 0.75, 0.8], m: 0x5a4430, build: function (k) { k.b(k.W, 0.05, k.D, 0, k.H - 0.025, 0); if (k.type === 'desk') { k.b(0.05, k.H - 0.05, k.D, -k.W / 2 + 0.03, (k.H - 0.05) / 2, 0); k.b(0.4, k.H - 0.05, k.D, k.W / 2 - 0.2, (k.H - 0.05) / 2, 0); } else [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { k.b(0.06, k.H - 0.05, 0.06, q[0] * (k.W / 2 - 0.06), (k.H - 0.05) / 2, q[1] * (k.D / 2 - 0.06)); }); if (k.RNG() < 0.5) k.b(0.3, 0.02, 0.22, k.rnd(-0.3, 0.3), k.H + 0.01, 0, k.mat(0xb8b2a0), k.rnd(0, 3)); } },
  // oil drum (scanned barrel model on Full graphics)
  drum: { d: [0.6, 0.9, 0.6], m: 0x5a3a22, build: function (k) { k.add(k.taper(0.3, 0.3, 0.9), k.m, 0, 0.45, 0, 0, 0, 0); } },
  // stack of tyres (scanned tyre model on Full graphics)
  tires: { d: [0.75, 0.9, 0.75], m: 0x141414, build: function (k) { for (var n = 0; n < 3; n++) k.add(k.taper(0.37, 0.37, 0.26), k.m, 0, 0.14 + n * 0.28, 0, 0, 0, 0); } }
};
