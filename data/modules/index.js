// Rebirth game server module (Nakama JavaScript runtime).
// Friends, online status and shared worlds use Nakama's built-in features; this file adds:
//  - "invite": send a friend a "join my game" invite (only to mutual friends)
//  - Epic Games login: the Epic launcher's exchange code is swapped for the player's Epic account
//    on the server, so a player can't pretend to be someone else's Epic account.

var INVITE_CODE = 101;

function rpcInvite(ctx, logger, nk, payload) {
  if (!ctx.userId) throw Error('not signed in');
  var req = {};
  try { req = JSON.parse(payload || '{}'); } catch (e) { throw Error('bad request'); }
  var to = String(req.to || '');
  if (!to) throw Error('no friend given');
  // only mutual friends (state 0) can be invited
  var ok = false, cursor = '';
  for (var page = 0; page < 10 && !ok; page++) {
    var list = nk.friendsList(ctx.userId, 100, 0, cursor);
    (list.friends || []).forEach(function (f) { if (f.user && f.user.userId === to) ok = true; });
    cursor = list.cursor; if (!cursor) break;
  }
  if (!ok) throw Error('you can only invite friends');
  var room = String(req.room || '').slice(0, 40), name = String(req.name || '').slice(0, 18);
  nk.notificationSend(to, name + ' invited you to their game', { room: room, from: ctx.userId, name: name, plat: String(req.plat || '').slice(0, 12) }, INVITE_CODE, ctx.userId, true);   // kept until read, so the phone app can notify players who aren't in the game
  return JSON.stringify({ sent: true });
}

// Epic Games Store: the launcher starts the game with -AUTH_PASSWORD=<exchange code>.
// The client signs in with custom id "epicx:<exchange code>"; the server trades it for the Epic account id.
function beforeAuthCustom(ctx, logger, nk, req) {
  var id = req.account && req.account.id || '';
  if (id.indexOf('steamw:') === 0) return steamAuth(ctx, logger, nk, req, id.slice(7));
  if (id.indexOf('epicx:') !== 0) {
    if (id.indexOf('epic_') === 0 || id.indexOf('steam_') === 0) throw Error('Steam and Epic accounts sign in through their launcher');
    return req;
  }
  var cid = ctx.env['EPIC_CLIENT_ID'], secret = ctx.env['EPIC_CLIENT_SECRET'], dep = ctx.env['EPIC_DEPLOYMENT_ID'];
  if (!cid || !secret || !dep) throw Error('Epic login is not set up on this server yet');
  var body = 'grant_type=exchange_code&exchange_code=' + encodeURIComponent(id.slice(6)) + '&deployment_id=' + encodeURIComponent(dep) + '&scope=basic_profile%20friends_list%20presence';
  var res = nk.httpRequest('https://api.epicgames.dev/epic/oauth/v2/token', 'post', {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': 'Basic ' + nk.base64Encode(cid + ':' + secret)
  }, body, 8000);
  if (res.code !== 200) { logger.warn('Epic token exchange failed: %d %s', res.code, res.body); throw Error('Epic login failed'); }
  var tok = JSON.parse(res.body);
  if (!tok.account_id) throw Error('Epic login failed');
  req.account.id = 'epic_' + tok.account_id;
  return req;
}

// Steam: the PC game gets a Web API ticket for identity "rebirth" and signs in with custom id "steamw:<ticket>".
// The server checks it with Valve and swaps it for "steam_<SteamID>".
function steamCfg(ctx) { return { key: ctx.env['STEAM_PUBLISHER_KEY'], app: ctx.env['STEAM_APP_ID'] }; }
function steamAuth(ctx, logger, nk, req, ticket) {
  var c = steamCfg(ctx);
  if (!c.key || !c.app) throw Error('Steam login is not set up on this server yet');
  var url = 'https://partner.steam-api.com/ISteamUserAuth/AuthenticateUserTicket/v1/?key=' + encodeURIComponent(c.key) + '&appid=' + encodeURIComponent(c.app) + '&ticket=' + encodeURIComponent(ticket) + '&identity=rebirth';
  var res = nk.httpRequest(url, 'get', {}, '', 8000);
  var body = {}; try { body = JSON.parse(res.body); } catch (e) {}
  var p = body.response && body.response.params;
  if (res.code !== 200 || !p || p.result !== 'OK' || !p.steamid) { logger.warn('Steam ticket rejected: %d %s', res.code, res.body); throw Error('Steam login failed'); }
  req.account.id = 'steam_' + p.steamid;
  return req;
}
// after a Steam sign-in, Steam friends who also play Rebirth become Rebirth friends automatically
function afterAuthCustom(ctx, logger, nk, session, req) {
  var id = req && req.account && req.account.id || '';
  if (id.indexOf('steam_') !== 0) return;
  try {
    var c = steamCfg(ctx), sid = id.slice(6);
    var res = nk.httpRequest('https://partner.steam-api.com/ISteamUser/GetFriendList/v1/?key=' + encodeURIComponent(c.key) + '&steamid=' + sid + '&relationship=friend', 'get', {}, '', 8000);
    if (res.code !== 200) return;
    var fl = (JSON.parse(res.body).friendslist || {}).friends || [];
    if (!fl.length) return;
    var ids = fl.slice(0, 2000).map(function (f) { return 'steam_' + f.steamid; });
    var me = nk.sqlQuery('SELECT id, username FROM users WHERE custom_id = $1', [id])[0];
    if (!me) return;
    var rows = nk.sqlQuery('SELECT id, username FROM users WHERE custom_id = ANY($1)', [ids]);
    rows.forEach(function (r) {
      try { nk.friendsAdd(me.id, me.username, [r.id], []); nk.friendsAdd(r.id, r.username, [me.id], []); } catch (e) {}
    });
    if (rows.length) logger.info('Linked %d Steam friends for %s', rows.length, me.id);
  } catch (e) { logger.warn('Steam friend import failed: %s', e.message); }
}

function InitModule(ctx, logger, nk, initializer) {
  initializer.registerAfterAuthenticateCustom(afterAuthCustom);
  initializer.registerRpc('invite', rpcInvite);
  initializer.registerBeforeAuthenticateCustom(beforeAuthCustom);
  logger.info('Rebirth server module loaded.');
}
