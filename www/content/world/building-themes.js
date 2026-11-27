// What goes inside each kind of open building: the shop sign over the door (and its colour),
// the furniture (names from content/world/furniture.js), and the loot it holds as [item, chance].
// Add a theme in a mod and the city will start using it for some of its open buildings.
Rebirth.content.buildingThemes = {
    store: { sign: 'MARKET', signColor: '#c9b24a', furn: ['shelf', 'shelf', 'shelf', 'counter', 'fridge', 'shelf'], loot: [['scrap', 0.3], ['ammo', 0.2], ['meds', 0.3], ['gem', 0.1], ['cans', 0.1]] },
    clinic: { sign: 'PHARMACY', signColor: '#5ac08a', furn: ['bed', 'bed', 'cabinet', 'cabinet', 'desk', 'bed'], loot: [['meds', 0.55], ['gem', 0.15], ['scrap', 0.2], ['ammo', 0.1]] },
    police: { sign: 'POLICE', signColor: '#5a8ad0', furn: ['locker', 'locker', 'desk', 'desk', 'cabinet', 'table'], loot: [['ammo', 0.6], ['meds', 0.1], ['scrap', 0.2], ['gem', 0.1]] },
    garage: { sign: 'AUTO REPAIR', signColor: '#d0703a', furn: ['bench', 'tires', 'drum', 'drum', 'tires', 'cabinet'], loot: [['vparts', 0.35], ['scrap', 0.35], ['cans', 0.2], ['ammo', 0.1]] },
    home: { sign: '', furn: ['couch', 'table', 'bed', 'fridge', 'cabinet', 'couch'], loot: [['scrap', 0.3], ['meds', 0.25], ['ammo', 0.25], ['gem', 0.1], ['tooth', 0.1]] }
  };
