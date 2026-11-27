// Rail yard: tracks, sleepers and parked freight cars west of downtown.
// Called by the city builder for the blocks listed in content/world/landmarks.js.
// ctx gives this builder the game's own building helpers (see MODDING.md, "Building helpers").
Rebirth.addLandmark('railYard', function (ctx, bx, bz) {
    var RNG = ctx.RNG, boxGeo = ctx.boxGeo, colliders = ctx.colliders, flat = ctx.flat, mat = ctx.mat, pick = ctx.pick, railM = ctx.railM, rnd = ctx.rnd, sleeperM = ctx.sleeperM, stat = ctx.stat;

    flat(mat(0x34302b), bx, bz, 0.26, 16.6, 16.6);
    [-3.2, 3.2].forEach(function (tx) {
      [-0.72, 0.72].forEach(function (rx) { stat(boxGeo(0.09, 0.14, 17), railM, bx + tx + rx, 0.33, bz); });
      for (var k = -8; k <= 8; k += 0.9) stat(boxGeo(2.1, 0.08, 0.26), sleeperM, bx + tx, 0.27, bz + k);
    });
    if (RNG() < 0.7) { var tx2 = pick([-3.2, 3.2]), oz = rnd(-2, 2), col = pick([0x5a2e22, 0x3a4a4a, 0x6a5a3a, 0x2e3a52]);
      stat(boxGeo(2.7, 2.9, 11.5), mat(col), bx + tx2, 0.25 + 0.6 + 1.45, bz + oz); stat(boxGeo(2.2, 0.5, 11), mat(0x1a1a1a), bx + tx2, 0.25 + 0.4, bz + oz);
      colliders.push({ x0: bx + tx2 - 1.4, x1: bx + tx2 + 1.4, z0: bz + oz - 5.8, z1: bz + oz + 5.8, h: 3.8 }); }
});
