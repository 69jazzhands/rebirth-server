/* Rebirth web app: keeps the game's files on the device so it opens instantly and plays offline.
   Each build has its own cache; a new build downloads only the files whose hash changed (from version.json),
   copies the rest from the old cache, then takes over and tells the game an update is ready. */
var BUILD = '202611280238', CACHE = 'rebirth-' + BUILD;
self.addEventListener('install', function (e) {
  e.waitUntil((async function () {
    var vj = await fetch('version.json', { cache: 'no-store' }), man = await vj.clone().json();
    var cache = await caches.open(CACHE), olds = (await caches.keys()).filter(function (k) { return k !== CACHE && k.indexOf('rebirth-') === 0; });
    var oldMan = null, oldCache = null;
    for (var i = 0; i < olds.length && !oldMan; i++) { var c = await caches.open(olds[i]), r = await c.match('version.json'); if (r) { oldMan = await r.json(); oldCache = c; } }
    var files = Object.keys(man.files), todo = [];
    for (var j = 0; j < files.length; j++) {
      var f = files[j], same = oldMan && oldMan.files[f] && oldMan.files[f][1] === man.files[f][1], hit = same && await oldCache.match(f);
      if (hit) await cache.put(f, hit); else todo.push(f);
    }
    for (var k = 0; k < todo.length; k += 6) await Promise.all(todo.slice(k, k + 6).map(function (f) { return cache.add(new Request(f, { cache: 'no-store' })); }));
    await cache.put('version.json', vj);
  })());
  self.skipWaiting();
});
self.addEventListener('activate', function (e) {
  e.waitUntil((async function () {
    var keys = await caches.keys(); await Promise.all(keys.filter(function (k) { return k !== CACHE && k.indexOf('rebirth-') === 0; }).map(function (k) { return caches.delete(k); }));
    await self.clients.claim();
    var man = await (await (await caches.open(CACHE)).match('version.json')).json();
    (await self.clients.matchAll()).forEach(function (c) { c.postMessage({ rebirthUpdate: man.version }); });
  })());
});
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || /^\/(v2|ws|healthcheck)/.test(u.pathname) || u.pathname.endsWith('/sw.js') || u.pathname.endsWith('/version.json')) return;
  var path = u.pathname.replace(/^\//, '') || 'index.html';
  if (e.request.mode === 'navigate') path = 'index.html';
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(path).then(function (hit) { return hit || fetch(e.request).then(function (r) { if (r.ok && r.type === 'basic') c.put(path, r.clone()); return r; }); });
  }));
});
