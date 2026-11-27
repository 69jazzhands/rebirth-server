// Civic Center Park: lawns, paths and an optional Greek-style colonnade.
// Called by the city builder for the blocks listed in content/world/landmarks.js.
// ctx gives this builder the game's own building helpers (see MODDING.md, "Building helpers").
Rebirth.addLandmark('civicPark', function (ctx, bx, bz, colonnade) {
    var NOKERB = ctx.NOKERB, RNG = ctx.RNG, boxGeo = ctx.boxGeo, colliders = ctx.colliders, deadTree = ctx.deadTree, flat = ctx.flat, lawnM = ctx.lawnM, pathM = ctx.pathM, stat = ctx.stat, stoneM = ctx.stoneM, taper = ctx.taper, waterM = ctx.waterM;

    flat(lawnM, bx, bz, 0.26, 16.6, 16.6);
    flat(pathM, bx, bz, 0.27, 16.6, 2); flat(pathM, bx, bz, 0.27, 2, 16.6);
    // a curved colonnade (the Greek Amphitheater / Voorhies Memorial)
    for (var i = 0; i <= 8; i++) { var a = Math.PI * (0.15 + 0.7 * i / 8) + (colonnade ? 0 : Math.PI), cx = bx + Math.cos(a) * 6.2, cz = bz + Math.sin(a) * 6.2;
      stat(taper(0.26, 0.3, 4.2), stoneM, cx, 0.25 + 2.1, cz); colliders.push({ x0: cx - 0.3, x1: cx + 0.3, z0: cz - 0.3, z1: cz + 0.3, h: 4.5 }); }
    for (var j = 0; j < 8; j++) { var a2 = Math.PI * (0.15 + 0.7 * (j + 0.5) / 8) + (colonnade ? 0 : Math.PI); stat(boxGeo(2.5, 0.45, 0.9), stoneM, bx + Math.cos(a2) * 6.2, 4.55, bz + Math.sin(a2) * 6.2, 0, -a2 + Math.PI / 2, 0); }
    stat(taper(1.6, 1.7, 0.5), stoneM, bx, 0.5, bz); stat(taper(1.3, 1.3, 0.52), waterM, bx, 0.52, bz); colliders.push({ x0: bx - 1.6, x1: bx + 1.6, z0: bz - 1.6, z1: bz + 1.6, h: 0.8 });
    [[-5.5, -5.5], [5.5, -5.5], [-5.5, 5.5], [5.5, 5.5]].forEach(function (q) { if (RNG() < 0.8) deadTree(bx + q[0], bz + q[1]); });
    NOKERB['park' + bx + bz] = 1;
});
