// Union Station: the old train hall with its red "Travel by Train" sign.
// Called by the city builder for the blocks listed in content/world/landmarks.js.
// ctx gives this builder the game's own building helpers (see MODDING.md, "Building helpers").
Rebirth.addLandmark('unionStation', function (ctx, bx, bz) {
    var HQ = ctx.HQ, T = ctx.T, buildingGeo = ctx.buildingGeo, colliders = ctx.colliders, facades = ctx.facades, glowAt = ctx.glowAt, roofMat = ctx.roofMat, scene = ctx.scene, textTex = ctx.textTex;

    var w = 15, d = 8, h = 8.5, f = facades[1];
    var m = new T.Mesh(buildingGeo(w, h, d), [f, f, roofMat, roofMat, f, f]); m.position.set(bx, 0.25 + h / 2, bz); m.castShadow = HQ; m.receiveShadow = true; scene.add(m);
    colliders.push({ x0: bx - w / 2, x1: bx + w / 2, z0: bz - d / 2, z1: bz + d / 2, h: h + 3 });
    [-1, 1].forEach(function (sd) { var ww = new T.Mesh(buildingGeo(3.5, 5, 7), [f, f, roofMat, roofMat, f, f]); ww.position.set(bx + sd * 6.2, 0.25 + 2.5, bz + 0.2); scene.add(ww); });
    var signM = new T.MeshBasicMaterial({ map: textTex(['UNION STATION', 'TRAVEL BY TRAIN'], 512, 136, 'rgba(0,0,0,0)', '#ff5a3c', 'Georgia, serif'), transparent: true, fog: true, side: T.FrontSide }), signG = new T.PlaneGeometry(9, 2.4);
    [0, Math.PI].forEach(function (flip) { var sign = new T.Mesh(signG, signM); sign.position.set(bx, 0.25 + h + 1.3, bz + d / 2 + 0.05); sign.rotation.y = flip; scene.add(sign); });
    glowAt(bx, 0.25 + h + 1.3, bz + d / 2 + 0.6, 0xff5a3c, 8, 0.25);
    var pl = new T.PointLight(0xff7a5a, 0.7, 14, 2); pl.position.set(bx, h, bz + d / 2 + 2); scene.add(pl);
});
