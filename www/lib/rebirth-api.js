/* Rebirth content registry and mod loader.
   Load order: this file -> the content/ files (the base game tables) -> mods/mods.js (the mod list)
   -> each enabled mod's mod.js -> each mod's init(api) -> the game starts and reads the tables.
   See MODDING.md for the full guide. */
window.Rebirth = (function () {
  var R = {
    version: '0.8.0',
    content: {},      // every table the game reads, filled by the content/ files and changed by mods
    landmarks: {},    // landmark builders by type name: function (ctx, bx, bz, ...args)
    hooks: {},        // event name -> list of functions
    mods: [],         // mods that registered, in load order
    modList: [],      // set by mods/mods.js: [{ id, on }]
    loaded: [],       // ids of mods that loaded and ran their init without errors
    failed: [],       // { id, error }
    game: null        // live game helpers, set once the game has started (see MODDING.md)
  };

  R.addLandmark = function (type, builder) { R.landmarks[type] = builder; };
  R.on = function (event, fn) { (R.hooks[event] = R.hooks[event] || []).push(fn); };
  R.emit = function (event) {
    var list = R.hooks[event]; if (!list) return;
    var args = Array.prototype.slice.call(arguments, 1);
    for (var i = 0; i < list.length; i++) {
      try { list[i].apply(null, args); } catch (e) { console.warn('[Rebirth] a "' + event + '" hook failed', e); }
    }
  };
  // a mod's mod.js calls this: Rebirth.mod({ id, name, version, author, description, init: function (api) {} })
  R.mod = function (def) {
    if (!def || !def.id) { console.warn('[Rebirth] Rebirth.mod() needs an id'); return; }
    def.base = 'mods/' + def.id + '/'; R.mods.push(def);
  };

  // which mods are on: mods/mods.js sets the defaults, the in-game Mods list saves your own choices
  R.saved = function () { try { return JSON.parse(localStorage.getItem('rebirthMods') || '{}') || {}; } catch (e) { return {}; } };
  R.setEnabled = function (id, on) { var s = R.saved(); s[id] = !!on; try { localStorage.setItem('rebirthMods', JSON.stringify(s)); } catch (e) {} };
  R.isEnabled = function (entry) {
    if (/[?&]mods=(0|off)/.test(location.search)) return false;
    var s = R.saved(); return s[entry.id] !== undefined ? s[entry.id] : entry.on !== false;
  };

  function api(mod) {
    var C = R.content;
    function path(file) { return /^(https?:|data:|\/)/.test(file) ? file : mod.base + file; }
    return {
      id: mod.id, content: C, path: path,
      on: function (ev, fn) { R.on(ev, fn); },
      addGun: function (id, def) { C.guns[id] = def; },
      addMelee: function (id, def) { C.melee[id] = def; },
      addZombie: function (id, def) { C.zombies[id] = def; },
      addShopItem: function (field, name, desc, price) { C.shopGoods.push([field, name, desc, price]); },
      addCharacter: function (name, file, kind) {
        C.characters.files[name] = path(file);
        var list = { survivorMale: 'survivorsMale', survivorFemale: 'survivorsFemale', zombieMale: 'zombiesMale', zombieFemale: 'zombiesFemale' }[kind];
        if (list) C.characters[list].push(name);
      },
      addProp: function (type, def) { def.file = path(def.file); C.props[type] = def; },
      addFurniture: function (name, def) { C.furniture[name] = def; },
      addBuildingTheme: function (name, def) { C.buildingThemes[name] = def; },
      addLandmark: function (type, builder, placement) {
        R.addLandmark(type, builder);
        if (placement) { placement.type = type; C.landmarks.unshift(placement); }
      },
      log: function () { console.log.apply(console, ['[' + mod.id + ']'].concat([].slice.call(arguments))); }
    };
  }

  function loadScript(src, done) {
    var s = document.createElement('script'); s.src = src;
    s.onload = function () { done(null); }; s.onerror = function () { done(new Error('could not load ' + src)); };
    document.head.appendChild(s);
  }

  // called by the game: loads the enabled mods, runs their init, then starts the game
  R.start = function (game) {
    var list = (R.modList || []).filter(R.isEnabled), i = 0;
    function next() {
      if (i >= list.length) return finish();
      var entry = list[i++], before = R.mods.length;
      loadScript('mods/' + entry.id + '/mod.js', function (err) {
        if (err) { R.failed.push({ id: entry.id, error: err.message }); console.warn('[Rebirth] mod ' + entry.id + ':', err.message); }
        else if (R.mods.length === before) R.failed.push({ id: entry.id, error: 'mod.js did not call Rebirth.mod()' });
        next();
      });
    }
    function finish() {
      R.mods.forEach(function (m) {
        try { if (m.init) m.init(api(m)); R.loaded.push(m.id); }
        catch (e) { R.failed.push({ id: m.id, error: String(e && e.message || e) }); console.warn('[Rebirth] mod ' + m.id + ' init failed', e); }
      });
      game();
      R.emit('ready', R.game);
    }
    next();
  };
  return R;
})();
