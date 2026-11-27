// Colorado State Capitol: dome, columns and steps on the Civic Center block.
// Called by the city builder for the blocks listed in content/world/landmarks.js.
// ctx gives this builder the game's own building helpers (see MODDING.md, "Building helpers").
Rebirth.addLandmark('stateCapitol', function (ctx, bx, bz) {
    var CAPITOL = ctx.CAPITOL, HEMI = ctx.HEMI, HQ = ctx.HQ, SPH = ctx.SPH, T = ctx.T, boxGeo = ctx.boxGeo, buildingGeo = ctx.buildingGeo, colliders = ctx.colliders, facades = ctx.facades, glowAt = ctx.glowAt, goldM = ctx.goldM, roofMat = ctx.roofMat, scene = ctx.scene, stat = ctx.stat, stoneM = ctx.stoneM, taper = ctx.taper;

    var bw = 15, bd = 11, bh = 7.5, x0 = bx + 1;
    var base = new T.Mesh(buildingGeo(bw, bh, bd), [facades[0], facades[0], roofMat, roofMat, facades[0], facades[0]]); base.position.set(x0, 0.25 + bh / 2, bz); base.castShadow = HQ; base.receiveShadow = true; scene.add(base);
    colliders.push({ x0: x0 - bw / 2, x1: x0 + bw / 2, z0: bz - bd / 2, z1: bz + bd / 2, h: bh + 9 });
    // west portico facing Broadway, with steps
    for (var i = 0; i < 6; i++) { var cz = bz - 3.75 + i * 1.5; stat(taper(0.3, 0.34, 5.6), stoneM, x0 - bw / 2 - 1.5, 0.25 + 2.8, cz); colliders.push({ x0: x0 - bw / 2 - 1.85, x1: x0 - bw / 2 - 1.15, z0: cz - 0.35, z1: cz + 0.35, h: 6 }); }
    stat(boxGeo(2.6, 0.9, 9.4), stoneM, x0 - bw / 2 - 1.3, 0.25 + 6.05, bz);
    stat(boxGeo(2.6, 0.12, 9.4), stoneM, x0 - bw / 2 - 1.3, 0.31, bz); stat(boxGeo(1.4, 0.12, 9.4), stoneM, x0 - bw / 2 - 3.1, 0.18, bz);
    // drum, gold dome and lantern
    stat(taper(3.4, 3.6, 1.2), stoneM, x0, 0.25 + bh + 0.6, bz);
    stat(taper(2.7, 2.7, 3.2), stoneM, x0, 0.25 + bh + 2.8, bz);
    for (var c = 0; c < 12; c++) { var a = c / 12 * Math.PI * 2; stat(taper(0.14, 0.16, 3.2), stoneM, x0 + Math.cos(a) * 2.95, 0.25 + bh + 2.8, bz + Math.sin(a) * 2.95); }
    var domeY = 0.25 + bh + 4.4; stat(HEMI, goldM, x0, domeY, bz, 0, 0, 0, 2.9, 3.4, 2.9);
    stat(taper(0.45, 0.55, 1.3), stoneM, x0, domeY + 3.9, bz); stat(SPH, goldM, x0, domeY + 4.75, bz, 0, 0, 0, 0.42, 0.42, 0.42);
    glowAt(x0, domeY + 1.5, bz, 0xffd98a, 9, 0.18);
    var lt = new T.PointLight(0xffd59a, 0.9, 16, 2); lt.position.set(x0 - 6, 3, bz); scene.add(lt);
    CAPITOL.x = x0; CAPITOL.z = bz;
});
