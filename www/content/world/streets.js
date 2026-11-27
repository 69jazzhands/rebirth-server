// Street names (Denver) and the diagonal corridors. The grid has a road every 24 m from -120 to +96.
// ns: streets running north-south, keyed by their x position. ew: avenues running east-west, keyed by z.
// diagonals: k = 1 runs one way, -1 the other; c = where it crosses; road/band widths in metres; z0/z1 limit its length.
Rebirth.content.streets = {};
Rebirth.content.streets.ns = { '-120': 'Osage St', '-96': 'Mariposa St', '-72': 'Santa Fe Dr', '-48': 'Delaware St', '-24': 'Bannock St', '0': 'Broadway', '24': 'Lincoln St', '48': 'Grant St', '72': 'Logan St', '96': 'Corona St' };
Rebirth.content.streets.ew = { '-120': 'Bayaud Ave', '-96': '18th Ave', '-72': '17th Ave', '-48': '16th Ave', '-24': 'E Colfax Ave', '0': '14th Ave', '24': '11th Ave', '48': '8th Ave', '72': '6th Ave', '96': '3rd Ave' };
Rebirth.content.streets.diagonals = [
    { name: 'Speer Blvd', k: 1, c: -84, road: 7, band: 10, creek: true },
    { name: '16th St Mall', k: 1, c: 24, road: 5, band: 3.6, mall: true, z0: -93, z1: -29 },   // Union Station down to Broadway and Colfax
    { name: 'California St', k: -1, c: -132, road: 6, band: 4, z0: -120, z1: -24 },
    { name: 'Champa St', k: -1, c: -36, road: 6, band: 4, z0: -120, z1: -24 }
  ];
