// Where the landmark buildings stand. The city is a grid of 24 m blocks; block = [x, z] of the block centre.
// type = a builder registered with Rebirth.addLandmark (the files in content/world/buildings/), args = extra values for it.
// match(bx, bz, diagonalCuts) can be used instead of block to claim several blocks; diagonalCuts is true where a
// diagonal street crosses the block. The first entry that matches a block wins, and the normal city is not built there.
Rebirth.content.landmarks = [
  { type: 'stateCapitol', block: [12, -12] },                // Colorado State Capitol
  { type: 'civicPark', block: [-36, -12] },                  // Civic Center Park, south lawn
  { type: 'civicPark', block: [-36, 12], args: [true] },     // Civic Center Park, colonnade side
  { type: 'unionStation', block: [-84, -108] },              // Union Station
  { type: 'railYard', match: function (bx, bz, diagonalCuts) { return bx === -108 && bz > -24 && !diagonalCuts; } }  // rail yard
];
