# Modding Rebirth

Rebirth keeps its game content in plain JavaScript files, sorted by kind. The game reads these files when it starts. A mod is a small folder that adds to them or changes them.

## Where everything lives

```
index.html                         the game engine
lib/rebirth-api.js                 the content registry and mod loader
content/
  items/weapons.js                 guns and melee weapons (damage, speed, price, ammo, feel)
  items/shop.js                    supplies the trader sells
  items/loot.js                    what zombies drop, and the rarity rings
  zombies/types.js                 zombie types: health, speed, damage, looks, spawn chance, drops
  characters/characters.js         which 3D people are used for the player, trader, survivors and zombies
  world/streets.js                 street names and the diagonal avenues
  world/landmarks.js               which city blocks hold landmark buildings
  world/buildings/*.js             one file per landmark building (Capitol, Civic Center Park, Union Station, rail yard)
  world/building-themes.js         kinds of open building: sign, furniture and loot (market, pharmacy, police, garage, home)
  world/furniture.js               furniture pieces and how each is built
  world/props.js                   scanned street props (barriers, barrels, tyres, trash, pallets)
assets/
  chars/                           character models (MakeHuman, glTF)
  props/                           prop models (glTF)
  textures/                        surface photos, plus ktx/ for the compressed versions
mods/
  mods.js                          the list of mods
  example-pack/mod.js              an example mod to copy
```

You can edit the content files directly to change the base game. A mod is the better way to share changes, because it keeps working when the game updates.

## Making a mod

1. Copy `mods/example-pack` to `mods/your-mod-id`.
2. Change the `id` in `mod.js` to match the folder name.
3. Add the mod to `mods/mods.js`: `{ id: 'your-mod-id', on: true }`.
4. Start the game. Your mod appears under **Settings > Mods**, where players can turn it on or off. Changes apply after a restart.

```js
Rebirth.mod({
  id: 'your-mod-id',
  name: 'Your Mod',
  version: '1.0.0',
  author: 'You',
  description: 'One line shown in Settings > Mods.',
  init: function (api) {
    // add things here
  }
});
```

If a mod has an error, the game still starts. **Settings > Mods** shows "Could not load" with the reason, and details go to the browser console.

To start the game with every mod off, add `?mods=off` to the address.

## The api

| Call | What it does |
|---|---|
| `api.addGun(id, def)` | A new gun, sold at the trader. Fields are listed at the top of `content/items/weapons.js`. |
| `api.addMelee(id, def)` | A new melee weapon, sold at the trader. |
| `api.addZombie(id, def)` | A new zombie type. Fields are listed at the top of `content/zombies/types.js`. |
| `api.addShopItem(field, name, desc, price)` | A trader supply. `field` is the inventory count it adds to (`meds`, `cans`, `vparts`, `gas`, or your own). |
| `api.addCharacter(name, file, kind)` | A 3D person from your mod folder. `kind` is `survivorMale`, `survivorFemale`, `zombieMale` or `zombieFemale`. |
| `api.addProp(type, def)` | A street prop model from your mod folder: `{ file, fit: [w, h, d] }`. |
| `api.addFurniture(name, def)` | A furniture piece: `{ d: [w, h, d], m: colour, build: function (k) {...} }`. |
| `api.addBuildingTheme(name, def)` | A kind of open building: `{ sign, signColor, furn: [...], loot: [[item, chance], ...] }`. |
| `api.addLandmark(type, builder, placement)` | A landmark building and where it stands (see below). |
| `api.on(event, fn)` | React to the game (see Events). |
| `api.path(file)` | The full path of a file in your mod folder. |
| `api.content` | Every content table, if you want to change existing things. |
| `api.log(...)` | Writes to the console with your mod's name. |

To change something that already exists, edit `api.content` directly. For example, `api.content.guns.pistol.dmg = 40` or `api.content.zombies.runner.chance = 0.3`.

### Melee models

Built-in melee weapons have their own shapes. A new one gets a plain grey head unless you give it a `model` function. The game always draws the wooden handle (its length comes from `handle`, or 3/4 of `len`). Your function adds the head, pointing down from the hand:

```js
model: function (g, kit) {
  kit.part(kit.boxGeo(0.16, 0.2, 0.012), kit.mat(0x5a5e62), 0, kit.tip - 0.1, 0.03);
}
```

The `kit` gives you:

- `part(geometry, material, x, y, z, rx)`
- `T` (three.js) and `mat(colour)`
- shapes: `boxGeo(w, h, d)` and `taper(r1, r2, h)`
- materials: `wood`, `steel` and `dark`
- positions: `tip` (where the handle ends) and `handle`
- `firstPerson`

### Zombie behaviour

Set `ai` to one of the built-in behaviours: `walker`, `runner`, `brute`, `screamer`, `stalker` or `spitter`. For something new, use the `zombieSpawned` and `tick` events.

### Loot items

Zombie drops and building loot can be: `scrap`, `ammo`, `meds`, `vparts`, `cans`, `gem` and `tooth`.

## Building the world

The city is built the same way for every player from a shared random seed. Mods that add buildings or props do it in the `buildWorld` event, which gets `ctx`: the game's own building helpers.

```js
api.on('buildWorld', function (ctx) {
  var x = 6, z = 22;
  if (!ctx.freeGround(x, z, 1.4)) return;
  ctx.placeFurn('drum', x, z, 0, false, ctx.groundY(x, z));
});
```

Always use `ctx.rnd`, `ctx.pick` and `ctx.RNG` for random numbers here, not `Math.random`. That way everyone in a multiplayer room gets the same world.

Useful `ctx` helpers:

- **Placing and checking:**
  - `freeGround(x, z, r)` checks the spot is clear.
  - `groundY(x, z)` gives the ground height.
  - `inDiag(x, z, m)` is true on a diagonal street.
  - `districtAt(x, z)` names the district.
- **Building things:**
  - `stat(geometry, material, x, y, z, rx, ry, rz, sx, sy, sz)` adds static scenery. It is merged for speed.
  - `prop(type, matrix, fallback)` adds a scanned prop. The fallback builds a simple stand-in on lower graphics.
  - `frameM(x, y, z, turn)` makes the matrix for `prop`.
  - `placeFurn(type, x, z, turn, tipped, y)` adds furniture with a collider.
  - `addBuilding(x, z, w, d, h)` adds a sealed building.
  - `openBuilding(x, z, w, d, h, bx, bz)` adds a building you can enter, with rooms and loot.
  - `signMesh(text, x, y, z, turn)` adds a shop sign.
- **Fire and light:** `burningBarrel(x, z)`, `addFire(x, y, z, light)`, `glowAt(x, y, z, colour, size, opacity)`.
- **Debris:** `deadTree(x, z)`, `wreck(...)`, `rubblePile(...)`.
- **Collisions:** `colliders` is the list of solid boxes. Push `{ x0, x1, z0, z1, h }` to make something solid.
- **Low-level:**
  - Shapes: `boxGeo`, `uvBox`, `taper`, `buildingGeo`.
  - Materials: `mat(colour)`, `facades`.
  - Raw access: `scene`, `T`.
  - Settings: `HQ` (Full graphics) and `LITE` (low graphics).

### Landmark buildings

A landmark takes over a whole 24 m city block. The builder gets `ctx`, the block centre, and any `args`:

```js
api.addLandmark('survivorCamp', function (ctx, bx, bz) {
  ctx.stat(ctx.boxGeo(8, 0.2, 8), ctx.mat(0x4a3a2a), bx, 0.1, bz);
  ctx.burningBarrel(bx, bz);
}, { block: [36, 36] });
```

Block centres are the multiples of 24 plus 12, from -108 to 108. Instead of `block`, the placement can use `match: function (bx, bz, diagonalCuts) { return ...; }` to claim several blocks. The base game's landmarks in `content/world/buildings/` are good examples.

## Events

| Event | Gets | When |
|---|---|---|
| `ready` | `Rebirth.game` | The game has started. |
| `buildWorld` | `ctx` | While the city is built. Add buildings and props here. |
| `zombieSpawned` | the zombie | A zombie appears. `z.type`, `z.ai`, `z.hp`, `z.sp` (speed), `z.dmg`, `z.h` (its body) |
| `zombieKilled` | the zombie | A zombie dies. |
| `tick` | seconds since the last frame | Every frame. Keep it light. |

## Live game helpers

`Rebirth.game` is ready once the game starts:

- **Read:** `player` (position `x`, `z`, `hp`, `inv` inventory, `weapon`), `zombies`, `time`, `kills`.
- **Do:**
  - `say(text)` shows a message.
  - `addXp(n)` gives experience.
  - `spawnZombie(type, x, z)` spawns a zombie.
  - `give(field, n)` adds to an inventory count.
  - `dropLoot(x, z, item, n)` drops an item.
- **Raw access:** `scene` and `THREE`.

## Multiplayer

Everyone in a room needs the same mods on. The zombie type list and the city layout must match, so add new zombie types at the end of the list and don't reorder existing ones.

## Sharing a mod

Zip your mod's folder. Players unzip it into `mods/` and add one line to `mods/mods.js`.

**PC version:** make a folder called `mods` next to `Rebirth.exe` and put mod folders in it. The PC game looks there first.

To add mods, put a `mods.js` in that folder that lists them. Copy the list from the example above and keep `example-pack` in it if you want it too. That list replaces the built-in one.

**Phone apps:** they don't load outside mods yet.
