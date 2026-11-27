// Scanned street props (CC0), drawn as instanced models on Full graphics. Smaller settings use simple stand-ins.
// file = glTF (.json or .glb), fit = [width, height, depth] in metres the model is scaled to
//   (a 0 width/depth keeps its proportions and only matches the height), tint = colour multiplier, bright = brightness.
// Place them from a mod with ctx.prop(type, matrix, fallback) in a 'buildWorld' hook (see MODDING.md).
Rebirth.content.props = {
  barrier:  { file: 'assets/props/barrier.json',  fit: [2.0, 0.95, 0.62], bright: 0.55 },  // concrete road barrier
  barrel:   { file: 'assets/props/barrel.json',   fit: [0, 0.9, 0], tint: [0.75, 0.55, 0.45] },  // rusty oil drum
  tire:     { file: 'assets/props/tire.json',     fit: [0.75, 0.27, 0.75] },
  trashbag: { file: 'assets/props/trashbag.json', fit: [0, 0.5, 0] },
  trashcan: { file: 'assets/props/trashcan.json', fit: [0, 0.95, 0] },
  pallet:   { file: 'assets/props/pallet.json',   fit: [1.2, 0.14, 0.8] }
};
