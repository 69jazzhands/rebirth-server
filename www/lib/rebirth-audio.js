/* Rebirth audio: every sound in the game, made live in code with Web Audio (no sound files to download).
   Works the same in browsers, the iPhone home-screen app, the Android app and the PC app.

   RebirthAudio.unlock()                       call from a tap/click/key (phones only allow sound after one)
   RebirthAudio.listener(x, y, z, fx, fy, fz)  where the camera is and which way it looks, every frame
   RebirthAudio.play(name, pos, opts)          a one-shot sound; pos = {x,y,z} or null for "in your head" sounds
                                               opts: { vol, muffle (behind a wall), kind (zombie type / weapon / surface) }
   RebirthAudio.engine(on, speed, pos)         the car you're driving
   RebirthAudio.mood(level, opts)              music + ambience: level 0 calm, 1 heard, 2 spotted, 3 swarm
                                               opts: { safe, menu, inside, hp (0..1), tired, near (closest aware zombie, m) }
   RebirthAudio.stinger(strength)              a horror hit (jump scares, Brute roars, Screamer calls)
   RebirthAudio.volumes({ master, music, sfx }) 0..1 each
*/
(function () {
  'use strict';
  var AC = window.AudioContext || window.webkitAudioContext;
  var A = window.RebirthAudio = { ok: !!AC, ready: false, vol: { master: 0.9, music: 0.6, sfx: 0.9 } };
  if (!AC) { ['unlock', 'listener', 'play', 'engine', 'mood', 'stinger', 'volumes', 'tick', 'suspend'].forEach(function (k) { A[k] = function () {}; }); return; }

  var ctx = null, out, master, sfxBus, musBus, ambBus, verb, verbIn, menuLP, NOISE, BROWN, voices = 0, zVoices = 0;
  try { var sv = JSON.parse(localStorage.getItem('rebirthVol') || 'null'); if (sv) for (var k in sv) A.vol[k] = +sv[k]; } catch (e) {}

  function R(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  function build() {
    ctx = new AC({ latencyHint: 'interactive' });
    A.ctx = ctx;
    // iPhone: play even with the ringer switch on silent (Safari 16.4+)
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    var sr = ctx.sampleRate;
    NOISE = ctx.createBuffer(1, sr * 2, sr); var d = NOISE.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    BROWN = ctx.createBuffer(1, sr * 4, sr); var b = BROWN.getChannelData(0), l = 0; for (i = 0; i < b.length; i++) { l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02; b[i] = l * 3.5; }
    // master chain: menus muffle everything, a soft limiter keeps explosions from clipping on phone speakers
    menuLP = ctx.createBiquadFilter(); menuLP.type = 'lowpass'; menuLP.frequency.value = 20000;
    var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -10; comp.knee.value = 8; comp.ratio.value = 6; comp.attack.value = 0.003; comp.release.value = 0.25;
    master = ctx.createGain(); master.gain.value = A.vol.master;
    menuLP.connect(comp); comp.connect(master); master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = A.vol.sfx; sfxBus.connect(menuLP);
    ambBus = ctx.createGain(); ambBus.gain.value = A.vol.sfx * 0.8; ambBus.connect(menuLP);
    musBus = ctx.createGain(); musBus.gain.value = A.vol.music; musBus.connect(menuLP);
    // one shared reverb: the empty city
    verb = ctx.createConvolver(); verb.buffer = impulse(2.6, 2.4); verbIn = ctx.createGain(); verbIn.gain.value = 1;
    verbIn.connect(verb); var vOut = ctx.createGain(); vOut.gain.value = 0.55; verb.connect(vOut); vOut.connect(menuLP);
    ambience.start(); music.build();
    A._dbg = { master: master, names: Object.keys(S), music: music, amb: ambience };
  }
  function impulse(sec, decay) {
    var sr = ctx.sampleRate, n = Math.floor(sr * sec), buf = ctx.createBuffer(2, n, sr);
    for (var c = 0; c < 2; c++) { var d = buf.getChannelData(c); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay) * (i < sr * 0.012 ? i / (sr * 0.012) : 1); }
    return buf;
  }

  A.unlock = function () {
    try {
      if (!ctx) build();
      if (ctx.state !== 'running') ctx.resume();
      if (!A._primed) { A._primed = true; var s = ctx.createBufferSource(); s.buffer = ctx.createBuffer(1, 1, 22050); s.connect(ctx.destination); s.start(0); }
      A.ready = true;
    } catch (e) {}
  };
  // phones freeze audio when the app goes to the background; bring it back when it returns
  A.suspend = function (off) { if (!ctx) return; try { if (off) ctx.suspend(); else ctx.resume(); } catch (e) {} };
  document.addEventListener('visibilitychange', function () { A.suspend(document.hidden); });
  window.addEventListener('pageshow', function () { A.suspend(false); });
  ['pointerdown', 'touchend', 'keydown', 'click'].forEach(function (ev) { window.addEventListener(ev, function () { A.unlock(); }, { passive: true, capture: true }); });

  A.volumes = function (v) {
    for (var k in v) A.vol[k] = Math.max(0, Math.min(1, +v[k]));
    try { localStorage.setItem('rebirthVol', JSON.stringify(A.vol)); } catch (e) {}
    if (!ctx) return; var t = ctx.currentTime;
    master.gain.setTargetAtTime(A.vol.master, t, 0.05); sfxBus.gain.setTargetAtTime(A.vol.sfx, t, 0.05);
    ambBus.gain.setTargetAtTime(A.vol.sfx * 0.8, t, 0.05); musBus.gain.setTargetAtTime(A.vol.music, t, 0.05); if (A._radioBus) A._radioBus.gain.setTargetAtTime(A.vol.radio, t, 0.05);
  };

  /* ---------- listener + 3D placement ---------- */
  var LP = { x: 0, y: 1.6, z: 0 };
  A.listener = function (x, y, z, fx, fy, fz) {
    LP.x = x; LP.y = y; LP.z = z; if (!ctx) return; var L = ctx.listener, t = ctx.currentTime;
    if (L.positionX) { L.positionX.setValueAtTime(x, t); L.positionY.setValueAtTime(y, t); L.positionZ.setValueAtTime(z, t); L.forwardX.setValueAtTime(fx, t); L.forwardY.setValueAtTime(fy, t); L.forwardZ.setValueAtTime(fz, t); L.upX.setValueAtTime(0, t); L.upY.setValueAtTime(1, t); L.upZ.setValueAtTime(0, t); }
    else { L.setPosition(x, y, z); L.setOrientation(fx, fy, fz, 0, 1, 0); }
  };
  // the end of every sound's chain: in your head (2D) or placed in the world, muffled through walls
  function place(node, pos, opts, bus) {
    bus = bus || sfxBus; opts = opts || {};
    var g = ctx.createGain(); g.gain.value = opts.vol === undefined ? 1 : opts.vol; node.connect(g);
    var last = g;
    if (opts.muffle) { var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 650; lp.Q.value = 0.4; g.connect(lp); last = lp; g.gain.value *= 0.7; }
    if (pos) {
      var p = ctx.createPanner(); p.panningModel = 'equalpower'; p.distanceModel = 'inverse'; p.refDistance = opts.ref || 2.5; p.maxDistance = 200; p.rolloffFactor = opts.roll || 1.15;
      if (p.positionX) { p.positionX.value = pos.x; p.positionY.value = pos.y === undefined ? 1.2 : pos.y; p.positionZ.value = pos.z; } else p.setPosition(pos.x, pos.y === undefined ? 1.2 : pos.y, pos.z);
      last.connect(p); last = p;
    }
    last.connect(bus);
    if (opts.verb) { var s = ctx.createGain(); s.gain.value = opts.verb * (opts.muffle ? 0.5 : 1); last.connect(s); s.connect(verbIn); }
    return g;
  }
  function dist(pos) { return pos ? Math.hypot(pos.x - LP.x, pos.z - LP.z) : 0; }

  /* ---------- building blocks ---------- */
  function noise(t, dur, brown) { var s = ctx.createBufferSource(); s.buffer = brown ? BROWN : NOISE; s.loop = true; s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05); return s; }
  function osc(type, f, t, dur) { var o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(t + dur + 0.05); return o; }
  function filt(type, f, q) { var b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q || 0.7; return b; }
  function env(t, a, peak, dec, hold) { var g = ctx.createGain(), p = g.gain; p.setValueAtTime(0.0001, t); p.linearRampToValueAtTime(peak, t + a); if (hold) p.setValueAtTime(peak, t + a + hold); p.exponentialRampToValueAtTime(0.0001, t + a + (hold || 0) + dec); return g; }
  function chain() { for (var i = 0; i < arguments.length - 1; i++) arguments[i].connect(arguments[i + 1]); return arguments[arguments.length - 1]; }
  var curves = {};
  function shaper(k) { if (!curves[k]) { var n = 1024, c = new Float32Array(n); for (var i = 0; i < n; i++) { var x = i / (n - 1) * 2 - 1; c[i] = (1 + k) * x / (1 + k * Math.abs(x)); } curves[k] = c; } var w = ctx.createWaveShaper(); w.curve = curves[k]; w.oversample = '2x'; return w; }
  function sum() { return ctx.createGain(); }

  // a burst of filtered noise: clicks, cracks, thuds, whooshes
  function burst(t, o) {
    var s = noise(t, o.dur + (o.a || 0.002) + 0.05, o.brown), f = filt(o.type || 'bandpass', o.f || 1000, o.q || 1);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + (o.sweep || o.dur));
    var e = env(t, o.a || 0.002, o.g || 0.5, o.dur, o.hold); s.connect(f); f.connect(e); return e;
  }
  // a pitched thump that drops (gun bodies, footsteps on wood, explosions, heartbeats)
  function thump(t, f1, f2, dur, g, type) { var o = osc(type || 'sine', f1, t, dur); o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur); var e = env(t, 0.003, g, dur); o.connect(e); return e; }
  // metal: inharmonic partials ringing out (clanks, anvils, coins, glass)
  function metal(t, f, dur, g, ratios) {
    var m = sum(); (ratios || [1, 2.76, 5.4, 8.93]).forEach(function (r, i) { var o = osc('sine', f * r, t, dur); var e = env(t, 0.001, g / (i + 1.2), dur / (1 + i * 0.6)); o.connect(e); e.connect(m); });
    return m;
  }

  /* ---------- voices: zombies, people, animals ----------
     A buzzing vocal cord (saw) made rough by noise (the "nonlinear" sound of real screams),
     shaped by mouth resonances (formants) and an envelope. */
  var VOW = { uh: [600, 1040, 2250], ah: [800, 1200, 2600], oo: [380, 820, 2300], ee: [320, 2300, 3000], aw: [560, 880, 2500] };
  function voice(t, o) {
    var dur = o.dur, f0 = o.f0, out = sum();
    var src = osc('sawtooth', f0, t, dur);
    if (o.f1) src.frequency.exponentialRampToValueAtTime(o.f1, t + dur * (o.bend || 0.8));
    if (o.vib) { var lfo = osc('sine', o.vibR || 6, t, dur), lg = ctx.createGain(); lg.gain.value = f0 * o.vib; lfo.connect(lg); lg.connect(src.frequency); }
    if (o.rough) { var nz = noise(t, dur), ng = ctx.createGain(), nf = filt('lowpass', 900); ng.gain.value = f0 * o.rough; chain(nz, nf, ng); ng.connect(src.frequency); }
    var dist = shaper(o.grit || 2), pre = ctx.createGain(); pre.gain.value = 0.9; chain(src, pre, dist);
    var e = env(t, o.a || 0.06, o.g || 0.5, Math.max(0.05, dur - (o.a || 0.06) - (o.hold || 0)), o.hold || 0);
    var F = VOW[o.v || 'uh'];
    F.forEach(function (fr, i) { var bp = filt('bandpass', fr * (o.fs || 1), i ? 7 : 5), gg = ctx.createGain(); gg.gain.value = [1, 0.6, 0.3][i]; chain(dist, bp, gg, e); });
    if (o.breath) { var br = noise(t, dur), bf = filt('bandpass', 1400 * (o.fs || 1), 0.8), bg = ctx.createGain(); bg.gain.value = o.breath; chain(br, bf, bg, e); }
    e.connect(out); return out;
  }

  /* ---------- the sound list ---------- */
  var S = {};
  // ---- interface ----
  S.click = function (t) { return burst(t, { type: 'highpass', f: 2500, dur: 0.018, g: 0.12 }); };
  S.pickup = function (t) { var m = sum(); burst(t, { f: 1800, q: 2, dur: 0.03, g: 0.2 }).connect(m); thump(t + 0.02, 520, 380, 0.08, 0.12, 'triangle').connect(m); return m; };
  S.coin = function (t) { var m = sum(); metal(t, 2350, 0.35, 0.18, [1, 1.5, 2.71]).connect(m); metal(t + 0.07, 2900, 0.4, 0.14, [1, 1.5, 2.71]).connect(m); return m; };
  S.metalpick = function (t) { var m = sum(); metal(t, R(700, 900), 0.25, 0.22).connect(m); burst(t, { f: 2600, q: 3, dur: 0.04, g: 0.2 }).connect(m); return m; };
  S.levelup = function (t) { var m = sum(); [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { var o = osc('triangle', f, t + i * 0.09, 0.9), e = env(t + i * 0.09, 0.01, 0.14, 0.8); o.connect(e); e.connect(m); }); return m; };
  S.error = function (t) { var o = osc('square', 180, t, 0.18), e = env(t, 0.005, 0.07, 0.16), f = filt('lowpass', 900); chain(o, f, e); return e; };
  S.invite = function (t) { var m = sum(); [880, 1318.5].forEach(function (f, i) { var o = osc('sine', f, t + i * 0.16, 0.6), e = env(t + i * 0.16, 0.01, 0.16, 0.55); o.connect(e); e.connect(m); }); return m; };
  S.switch = function (t) { var m = sum(); burst(t, { type: 'highpass', f: 3000, dur: 0.012, g: 0.25 }).connect(m); burst(t + 0.05, { type: 'highpass', f: 2200, dur: 0.012, g: 0.18 }).connect(m); return m; };
  S.cloth = function (t) { return burst(t, { f: 1600, f2: 900, q: 0.6, a: 0.04, dur: 0.18, g: 0.1 }); };
  // ---- your body ----
  S.step = function (t, o) {
    var k = o.kind || 'street', m = sum(), g = (o.crouch ? 0.35 : o.run ? 1.15 : 0.75) * R(0.8, 1.1);
    if (k === 'inside') { thump(t, R(150, 190), 90, 0.09, 0.22 * g).connect(m); burst(t, { f: 700, q: 1.5, dur: 0.05, g: 0.18 * g }).connect(m); if (Math.random() < 0.15) burst(t + 0.03, { f: 420, f2: 300, q: 6, dur: 0.18, g: 0.06 }).connect(m); }
    else if (k === 'grass') burst(t, { f: 2600, q: 0.8, a: 0.01, dur: 0.09, g: 0.22 * g }).connect(m);
    else { burst(t, { f: R(1500, 2200), q: 1.1, dur: 0.045, g: 0.3 * g }).connect(m); thump(t, 95, 60, 0.05, 0.2 * g).connect(m); if (Math.random() < 0.25) burst(t + 0.01, { type: 'highpass', f: 5000, dur: 0.03, g: 0.08 * g }).connect(m); }
    return m;
  };
  S.hurt = function (t, o) { var m = sum(); voice(t, { f0: R(125, 150), f1: 95, dur: 0.28, v: 'uh', rough: 0.08, grit: 3, g: 0.45, a: 0.01 }).connect(m); thump(t, 110, 50, 0.12, 0.5).connect(m); return m; };
  S.death = function (t) { var m = sum(); voice(t, { f0: 140, f1: 70, dur: 1.1, v: 'ah', rough: 0.15, grit: 4, g: 0.45, a: 0.02, bend: 1 }).connect(m); thump(t, 70, 25, 1.2, 0.8).connect(m); return m; };
  S.cough = function (t) { var m = sum(); for (var i = 0; i < 3; i++) burst(t + i * R(0.22, 0.3), { f: 900, q: 0.8, a: 0.005, dur: 0.12, g: 0.25 }).connect(m); return m; };
  S.heal = function (t) { var m = sum(); var s = noise(t, 0.45), f = filt('bandpass', 2200, 0.7), am = osc('square', 38, t, 0.45), ag = ctx.createGain(); ag.gain.value = 0; am.connect(ag.gain); var e = env(t, 0.01, 0.25, 0.35, 0.05); chain(s, f, ag, e); e.connect(m); [659.25, 987.77].forEach(function (fr, i) { var o = osc('sine', fr, t + 0.5 + i * 0.12, 0.7), e2 = env(t + 0.5 + i * 0.12, 0.01, 0.08, 0.6); o.connect(e2); e2.connect(m); }); return m; };
  S.stim = function (t) { return burst(t, { type: 'highpass', f: 3000, a: 0.01, dur: 0.35, g: 0.3 }); };
  S.eat = function (t) { var m = sum(); for (var i = 0; i < 3; i++) burst(t + i * 0.18, { f: 1200, q: 1.5, dur: 0.06, g: 0.2 }).connect(m); return m; };
  // ---- guns: a sharp crack, a body, a low punch, then the street echoing it back ----
  var GUN = { pistol: [0.07, 0.25, 140, 0.9, 1], smg: [0.05, 0.16, 120, 0.7, 0.8], shotgun: [0.12, 0.55, 90, 1.25, 1.4], rifle: [0.09, 0.4, 110, 1.15, 1.5], turret: [0.04, 0.14, 160, 0.5, 0.7] };
  S.shot = function (t, o) {
    var p = GUN[o.kind] || GUN.pistol, m = sum(), far = o.far || 0;
    burst(t, { type: 'highpass', f: far ? 1500 : 2200, dur: p[0], g: 0.9 * p[3] * (1 - far * 0.6) }).connect(m);
    burst(t, { type: 'lowpass', f: far ? 700 : 1800, dur: p[1], g: 0.8 * p[3] }).connect(m);
    thump(t, p[2], 38, p[1] * 0.8, 0.9 * p[3]).connect(m);
    return m;
  };
  S.shell = function (t) { var m = sum(); metal(t, R(3800, 4400), 0.12, 0.05, [1, 1.9]).connect(m); metal(t + R(0.08, 0.14), R(3600, 4200), 0.1, 0.035, [1, 1.9]).connect(m); return m; };
  S.dry = function (t) { return burst(t, { type: 'highpass', f: 3500, dur: 0.015, g: 0.35 }); };
  S.magout = function (t) { var m = sum(); burst(t, { type: 'highpass', f: 3000, dur: 0.012, g: 0.4 }).connect(m); burst(t + 0.02, { f: 1500, f2: 900, q: 1.2, dur: 0.09, g: 0.18 }).connect(m); return m; };
  S.magin = function (t) { var m = sum(); burst(t, { f: 1800, q: 1.5, dur: 0.03, g: 0.4 }).connect(m); burst(t + 0.035, { type: 'highpass', f: 2600, dur: 0.02, g: 0.45 }).connect(m); thump(t + 0.035, 240, 140, 0.05, 0.2).connect(m); return m; };
  S.rack = function (t, o) {
    var m = sum(), pump = o.kind === 'shotgun', bolt = o.kind === 'rifle';
    burst(t, { f: pump ? 900 : 1500, f2: pump ? 1500 : 2600, q: 1.2, dur: pump ? 0.12 : 0.08, g: 0.3 }).connect(m);
    burst(t + (pump ? 0.16 : bolt ? 0.14 : 0.1), { type: 'highpass', f: 2000, dur: 0.025, g: 0.55 }).connect(m);
    thump(t + (pump ? 0.16 : 0.1), pump ? 160 : 260, 120, 0.06, 0.25).connect(m);
    return m;
  };
  S.shellin = function (t) { var m = sum(); burst(t, { f: 2200, q: 2, dur: 0.03, g: 0.3 }).connect(m); thump(t + 0.02, 300, 200, 0.04, 0.15).connect(m); return m; };
  // ---- melee ----
  S.swing = function (t, o) { var heavy = o.kind === 'heavy'; return burst(t, { f: heavy ? 350 : 600, f2: heavy ? 1100 : 2200, sweep: heavy ? 0.22 : 0.14, q: 1.4, a: 0.06, dur: heavy ? 0.22 : 0.14, g: heavy ? 0.4 : 0.28 }); };
  S.hit = function (t, o) {
    var m = sum(), blade = o.kind === 'blade', heavy = o.kind === 'heavy';
    thump(t, heavy ? 85 : 120, 45, heavy ? 0.22 : 0.13, heavy ? 0.9 : 0.6).connect(m);
    burst(t, { type: 'lowpass', f: 600, dur: 0.1, g: 0.5 }).connect(m);
    burst(t + 0.005, { f: 900, q: 3, dur: 0.12, g: 0.35 }).connect(m);   // wet
    if (blade) burst(t, { type: 'highpass', f: 3500, a: 0.004, dur: 0.07, g: 0.35 }).connect(m);
    if (heavy || Math.random() < 0.35) burst(t + 0.02, { f: 2400, q: 2, dur: 0.04, g: 0.3 }).connect(m);   // bone
    return m;
  };
  S.impact = function (t, o) {
    if (o.kind === 'hard') { var m = sum(); burst(t, { type: 'highpass', f: 2500, dur: 0.03, g: 0.3 }).connect(m); if (Math.random() < 0.4) metal(t, R(1800, 3500), 0.2, 0.06).connect(m); return m; }
    var w = sum(); burst(t, { f: 800, q: 2.5, dur: 0.07, g: 0.45 }).connect(w); thump(t, 130, 60, 0.07, 0.35).connect(w); return w;
  };
  // ---- explosions ----
  S.explosion = function (t, o) {
    var m = sum(), big = o.kind === 'car' ? 1.3 : 1;
    thump(t, 70, 22, 1.3 * big, 1.2).connect(m);
    var r = noise(t, 2.6, true), f = filt('lowpass', 1400), e = env(t, 0.005, 1.4 * big, 2.2 * big); f.frequency.setValueAtTime(1400, t); f.frequency.exponentialRampToValueAtTime(140, t + 1.8); chain(r, shaper(6), f, e); e.connect(m);
    burst(t, { type: 'highpass', f: 1500, dur: 0.25, g: 0.9 }).connect(m);
    for (var i = 0; i < 14; i++) burst(t + 0.15 + Math.random() * 1.6, { f: R(1500, 5000), q: 2, dur: 0.02, g: R(0.05, 0.18) }).connect(m);   // debris
    if (o.kind === 'car') metal(t + 0.1, 320, 1.4, 0.25).connect(m);
    return m;
  };
  S.earring = function (t) { var o = osc('sine', 3600, t, 4), e = env(t, 0.05, 0.07, 3.8); o.connect(e); return e; };
  S.throw = function (t) { return burst(t, { f: 500, f2: 1500, q: 1, a: 0.05, dur: 0.2, g: 0.3 }); };
  S.beep = function (t) { var o = osc('square', 2100, t, 0.05), e = env(t, 0.002, 0.06, 0.05); o.connect(e); return e; };
  S.collapse = function (t) {
    var m = sum(), r = noise(t, 4.5, true), f = filt('lowpass', 500), e = env(t, 0.3, 1.3, 3.8, 0.4); chain(r, shaper(4), f, e); e.connect(m);
    thump(t, 50, 20, 2.5, 1).connect(m);
    for (var i = 0; i < 22; i++) burst(t + Math.random() * 3.5, { f: R(600, 4000), q: 1.5, dur: R(0.02, 0.08), g: R(0.08, 0.3) }).connect(m);
    metal(t + 0.4, 180, 2.5, 0.25, [1, 1.33, 2.1]).connect(m);
    return m;
  };
  S.glass = function (t) { var m = sum(); for (var i = 0; i < 9; i++) metal(t + Math.random() * 0.4, R(2500, 6500), R(0.15, 0.5), R(0.04, 0.1), [1, 2.3]).connect(m); burst(t, { type: 'highpass', f: 3000, dur: 0.08, g: 0.4 }).connect(m); return m; };
  // ---- engineer, forge, base ----
  S.clank = function (t) { var m = sum(); metal(t, R(380, 520), 0.5, 0.35).connect(m); thump(t, 160, 70, 0.1, 0.4).connect(m); return m; };
  S.anvil = function (t) { var m = sum(); for (var i = 0; i < 3; i++) metal(t + i * 0.32, R(900, 1050), 0.9, 0.3, [1, 2.4, 3.9, 6.1]).connect(m); burst(t + 1.1, { type: 'highpass', f: 2000, a: 0.02, dur: 0.6, g: 0.2 }).connect(m); return m; };
  S.turret = function (t) { var m = sum(); S.clank(t).connect(m); var o = osc('sawtooth', 220, t + 0.15, 0.6), f = filt('lowpass', 1200), e = env(t + 0.15, 0.05, 0.08, 0.5); o.frequency.exponentialRampToValueAtTime(520, t + 0.7); chain(o, f, e); e.connect(m); return m; };
  S.trap = function (t) { var m = sum(); metal(t, 700, 0.4, 0.35, [1, 1.7, 3.2]).connect(m); thump(t, 140, 60, 0.12, 0.6).connect(m); burst(t, { type: 'highpass', f: 2500, dur: 0.03, g: 0.5 }).connect(m); return m; };
  S.build = function (t) { var m = sum(); for (var i = 0; i < 3; i++) { thump(t + i * 0.18, 190, 110, 0.08, 0.45).connect(m); burst(t + i * 0.18, { f: 1200, q: 1, dur: 0.04, g: 0.2 }).connect(m); } return m; };
  S.torch = function (t) { var s = noise(t, 1.2), f = filt('bandpass', 900, 0.5), e = env(t, 0.08, 0.35, 0.9, 0.2); chain(s, f, e); return e; };
  // ---- cars ----
  S.door = function (t) { var m = sum(); thump(t, 120, 60, 0.12, 0.6).connect(m); burst(t, { type: 'lowpass', f: 800, dur: 0.08, g: 0.4 }).connect(m); metal(t + 0.01, 900, 0.15, 0.06).connect(m); return m; };
  S.carstart = function (t) { var m = sum(), o = osc('sawtooth', 14, t, 1.1), f = filt('lowpass', 500), e = env(t, 0.05, 0.3, 1.0); o.frequency.setValueAtTime(14, t); o.frequency.linearRampToValueAtTime(22, t + 0.6); o.frequency.linearRampToValueAtTime(38, t + 0.9); chain(o, shaper(3), f, e); e.connect(m); return m; };
  S.crash = function (t, o) { var m = sum(), k = o.vol || 1; thump(t, 90, 30, 0.4, 1).connect(m); burst(t, { type: 'lowpass', f: 2500, dur: 0.35, g: 0.9 }).connect(m); metal(t + 0.01, R(250, 400), 0.9, 0.35, [1, 1.41, 2.3, 3.7]).connect(m); if (k > 0.6) S.glass(t + 0.03).connect(m); return m; };
  S.horn = function (t) { var m = sum(); [392, 494].forEach(function (f) { var o = osc('square', f, t, 0.6), e = env(t, 0.01, 0.12, 0.1, 0.45), lp = filt('lowpass', 1800); chain(o, lp, e); e.connect(m); }); return m; };
  S.alarm = function (t) { var m = sum(), o = osc('square', 700, t, 6), lp = filt('lowpass', 1500), e = env(t, 0.05, 0.15, 0.3, 5.5); for (var i = 0; i < 24; i++) o.frequency.setValueAtTime(i % 2 ? 950 : 700, t + i * 0.25); chain(o, lp, e); e.connect(m); return m; };
  // ---- zombies: each type sounds different so you can tell them apart by ear ----
  var ZV = {
    walker:   { idle: function (t) { return voice(t, { f0: R(70, 95), f1: R(55, 70), dur: R(1.1, 1.9), v: pick(['uh', 'aw', 'oo']), rough: 0.18, grit: 3, g: 0.45, a: 0.25, breath: 0.25 }); },
                alert: function (t) { return voice(t, { f0: 75, f1: 125, dur: 1.2, v: 'aw', rough: 0.22, grit: 4, g: 0.6, a: 0.15, bend: 0.7 }); },
                attack: function (t) { return voice(t, { f0: 120, f1: 80, dur: 0.45, v: 'ah', rough: 0.35, grit: 6, g: 0.6, a: 0.02 }); },
                death: function (t) { return voice(t, { f0: 90, f1: 40, dur: 1.0, v: 'uh', rough: 0.4, grit: 5, g: 0.5, a: 0.02, bend: 1, breath: 0.4 }); } },
    runner:   { idle: function (t) { var m = sum(); for (var i = 0; i < 4; i++) voice(t + i * 0.32, { f0: 150, dur: 0.22, v: 'ee', rough: 0.5, grit: 2, g: 0.18, a: 0.03, breath: 1.4 }).connect(m); return m; },
                alert: function (t) { return voice(t, { f0: 420, f1: 900, dur: 0.75, v: 'ah', rough: 0.45, grit: 8, g: 0.75, a: 0.02, vib: 0.04, vibR: 9, bend: 0.4 }); },
                attack: function (t) { return voice(t, { f0: 300, f1: 180, dur: 0.3, v: 'ee', rough: 0.5, grit: 8, g: 0.6, a: 0.01 }); },
                death: function (t) { return voice(t, { f0: 260, f1: 90, dur: 0.5, v: 'ah', rough: 0.5, grit: 6, g: 0.5, a: 0.01, bend: 1 }); } },
    brute:    { idle: function (t) { return voice(t, { f0: R(48, 58), f1: 42, dur: R(1.4, 2.2), v: 'oo', rough: 0.25, grit: 8, g: 0.7, a: 0.3, fs: 0.75, breath: 0.3 }); },
                alert: function (t) { var m = sum(); voice(t, { f0: 60, f1: 95, dur: 1.6, v: 'aw', rough: 0.4, grit: 12, g: 1, a: 0.12, fs: 0.75, bend: 0.5 }).connect(m); thump(t, 50, 28, 1.2, 0.6).connect(m); return m; },
                attack: function (t) { var m = sum(); voice(t, { f0: 70, f1: 50, dur: 0.6, v: 'ah', rough: 0.4, grit: 12, g: 0.9, a: 0.02, fs: 0.75 }).connect(m); thump(t + 0.25, 60, 25, 0.5, 1.1).connect(m); return m; },
                death: function (t) { var m = sum(); voice(t, { f0: 65, f1: 30, dur: 1.8, v: 'oo', rough: 0.4, grit: 10, g: 0.8, a: 0.03, fs: 0.75, bend: 1 }).connect(m); thump(t + 0.9, 55, 22, 0.8, 1.2).connect(m); return m; } },
    screamer: { idle: function (t) { return voice(t, { f0: R(240, 300), f1: 200, dur: 1.1, v: 'oo', rough: 0.12, grit: 2, g: 0.3, a: 0.2, vib: 0.05, vibR: 5, breath: 0.6 }); },
                alert: function (t) { return voice(t, { f0: 950, f1: 1350, dur: 1.7, v: 'ah', rough: 0.35, grit: 10, g: 1.1, a: 0.04, vib: 0.06, vibR: 7, bend: 0.3, fs: 1.2 }); },
                attack: function (t) { return voice(t, { f0: 500, f1: 300, dur: 0.4, v: 'ee', rough: 0.4, grit: 8, g: 0.6, a: 0.01 }); },
                death: function (t) { return voice(t, { f0: 800, f1: 150, dur: 0.6, v: 'ah', rough: 0.5, grit: 8, g: 0.7, a: 0.01, bend: 1 }); } },
    stalker:  { idle: function (t) { var m = sum(), n = 3 + Math.floor(Math.random() * 5), tt = t; for (var i = 0; i < n; i++) { burst(tt, { f: R(2200, 3200), q: 9, dur: 0.012, g: 0.5 }).connect(m); tt += R(0.05, 0.13); } return m; },
                alert: function (t) { return burst(t, { type: 'highpass', f: 2600, a: 0.08, dur: 0.6, g: 0.45 }); },
                attack: function (t) { var m = sum(); burst(t, { type: 'highpass', f: 2000, a: 0.01, dur: 0.25, g: 0.6 }).connect(m); voice(t + 0.05, { f0: 200, f1: 120, dur: 0.3, v: 'ee', rough: 0.6, grit: 8, g: 0.5, a: 0.01 }).connect(m); return m; },
                death: function (t) { return voice(t, { f0: 180, f1: 60, dur: 0.6, v: 'uh', rough: 0.6, grit: 6, g: 0.5, a: 0.01, bend: 1, breath: 0.5 }); } },
    spitter:  { idle: function (t) { var m = sum(), o = voice(t, { f0: R(80, 100), dur: 1.0, v: 'oo', rough: 0.3, grit: 3, g: 0.4, a: 0.1 }), am = osc('square', R(9, 14), t, 1.1), ag = ctx.createGain(); ag.gain.value = 0.3; am.connect(ag.gain); o.connect(ag); ag.connect(m); return m; },   // bubbling throat
                alert: function (t) { return voice(t, { f0: 110, f1: 160, dur: 0.6, v: 'aw', rough: 0.5, grit: 6, g: 0.6, a: 0.05, breath: 0.8 }); },
                attack: function (t) { var m = sum(); voice(t, { f0: 130, dur: 0.35, v: 'uh', rough: 0.6, grit: 5, g: 0.45, a: 0.03, breath: 1 }).connect(m); burst(t + 0.35, { f: 1300, q: 1, a: 0.005, dur: 0.12, g: 0.6 }).connect(m); return m; },
                death: function (t) { var m = sum(); burst(t, { type: 'lowpass', f: 1200, dur: 0.25, g: 0.7 }).connect(m); voice(t, { f0: 90, f1: 40, dur: 0.7, v: 'oo', rough: 0.5, grit: 4, g: 0.4, a: 0.01, bend: 1 }).connect(m); return m; } }
  };
  ['idle', 'alert', 'attack', 'death'].forEach(function (k) { S['z_' + k] = function (t, o) { var z = ZV[o.kind] || ZV.walker; return (z[k] || ZV.walker[k])(t); }; });
  S.z_hurt = function (t, o) { var f = { runner: 260, brute: 70, screamer: 520, stalker: 200, spitter: 120 }[o.kind] || 105; return voice(t, { f0: f, f1: f * 0.7, dur: 0.3, v: 'ah', rough: 0.4, grit: 6, g: 0.4, a: 0.01 }); };
  S.z_step = function (t, o) { if (o.kind === 'brute') { var m = sum(); thump(t, 48, 26, 0.3, 0.9).connect(m); burst(t, { type: 'lowpass', f: 300, dur: 0.12, g: 0.4 }).connect(m); return m; } return burst(t, { f: R(1200, 1800), q: 1, dur: 0.035, g: 0.25 }); };
  S.spit = function (t) { var m = sum(); ZV.spitter.attack(t).connect(m); return m; };
  S.acid = function (t) { var m = sum(), s = noise(t, 1.0), f = filt('highpass', 3500), e = env(t, 0.01, 0.35, 0.9), am = osc('square', 23, t, 1), ag = ctx.createGain(); ag.gain.value = 0.5; am.connect(ag.gain); chain(s, f, ag, e); e.connect(m); burst(t, { type: 'lowpass', f: 1500, dur: 0.08, g: 0.5 }).connect(m); return m; };
  // ---- the world ----
  S.bark = function (t) { var m = sum(); for (var i = 0; i < 2 + (Math.random() < 0.5); i++) voice(t + i * R(0.3, 0.5), { f0: R(380, 480), f1: 300, dur: 0.16, v: 'ah', rough: 0.3, grit: 5, g: 0.5, a: 0.01 }).connect(m); return m; };
  S.creak = function (t) { var o = osc('sawtooth', R(140, 220), t, 1.6), f = filt('bandpass', 900, 4), e = env(t, 0.3, 0.2, 1.2), lfo = osc('sine', 11, t, 1.6), lg = ctx.createGain(); lg.gain.value = 6; lfo.connect(lg); lg.connect(o.frequency); o.frequency.linearRampToValueAtTime(R(100, 160), t + 1.5); chain(o, f, e); return e; };
  S.heli = function (t) { var s = noise(t, 9), f = filt('lowpass', 260), am = osc('sine', 17, t, 9), ag = ctx.createGain(); ag.gain.value = 0.5; am.connect(ag.gain); var e = env(t, 3.5, 0.6, 5, 0.5); chain(s, f, ag, e); return e; };
  S.thunder = function (t) { var s = noise(t, 6, true), f = filt('lowpass', 350), e = env(t, 0.15, 1.2, 5.5); chain(s, f, e); return e; };
  S.radio = function (t) { var m = sum(), s = noise(t, 1.4), f = filt('bandpass', 1800, 0.8), e = env(t, 0.02, 0.18, 1.2, 0.1), am = osc('square', R(7, 15), t, 1.4), ag = ctx.createGain(); ag.gain.value = 0.4; am.connect(ag.gain); chain(s, f, ag, e); e.connect(m); return m; };
  S.scream_far = function (t) { return voice(t, { f0: R(500, 700), f1: 900, dur: 1.2, v: 'ah', rough: 0.25, grit: 6, g: 0.5, a: 0.05, vib: 0.04 }); };

  // which sounds go to the reverb, and how much
  var VERB = { shot: 0.5, explosion: 0.7, collapse: 0.6, z_alert: 0.25, scream_far: 0.6, bark: 0.4, crash: 0.3, alarm: 0.5, thunder: 0.3, creak: 0.4, trap: 0.15, hit: 0.08, z_attack: 0.12, z_death: 0.15, heli: 0.2, glass: 0.25 };
  var ZONE = { z_idle: 1, z_alert: 1, z_attack: 1, z_death: 1, z_hurt: 1 };

  A.play = function (name, pos, opts) {
    if (!ctx || ctx.state !== 'running' || !S[name]) return;
    opts = opts || {};
    var d = dist(pos);
    if (d > (opts.range || 90)) return;
    if (voices > 40 && d > 12) return;                         // too busy: drop far sounds first
    var isZ = ZONE[name]; if (isZ && zVoices >= 7 && name === 'z_idle') return;
    var t = ctx.currentTime + (opts.delay || 0) + (pos && opts.sonic ? d / 343 : 0);
    var node; try { node = S[name](t, opts); } catch (e) { return; }
    if (!node) return;
    var vb = opts.verb !== undefined ? opts.verb : VERB[name] || 0;
    if (name === 'shot' && !opts.far) opts.ref = 4;
    place(node, pos, { vol: opts.vol, muffle: opts.muffle, verb: vb, ref: opts.ref, roll: opts.roll });
    voices++; if (isZ) zVoices++;
    var life = (opts.life || 2.5) * 1000;
    setTimeout(function () { voices--; if (isZ) zVoices--; }, life);
  };

  // testing: render one sound offline, sample by sample (used by the automated checks, not the game)
  A._render = function (name, opts, sec) {
    var live = ctx, off = new OfflineAudioContext(1, Math.floor(44100 * (sec || 2)), 44100);
    ctx = off; var node; try { node = S[name](0, opts || {}); node.connect(off.destination); } finally { ctx = live; }
    return off.startRendering().then(function (b) { return b.getChannelData(0); });
  };
  /* ---------- the car you drive ---------- */
  var eng = null;
  A.engine = function (on, speed, pos) {
    if (!ctx || ctx.state !== 'running') return;
    var t = ctx.currentTime;
    if (!on) { if (eng) { eng.g.gain.setTargetAtTime(0, t, 0.15); var e0 = eng; eng = null; setTimeout(function () { try { e0.stop(); } catch (er) {} }, 900); } return; }
    if (!eng) {
      var o1 = ctx.createOscillator(), o2 = ctx.createOscillator(); o1.type = 'sawtooth'; o2.type = 'square';
      var lp = filt('lowpass', 500, 1.5), g = ctx.createGain(); g.gain.value = 0; var road = noise(t, 3600), rf = filt('lowpass', 300), rg = ctx.createGain(); rg.gain.value = 0;
      o1.connect(lp); var o2g = ctx.createGain(); o2g.gain.value = 0.4; o2.connect(o2g); o2g.connect(lp); var sh = shaper(2); lp.connect(sh); sh.connect(g); road.connect(rf); rf.connect(rg); rg.connect(g);
      o1.start(t); o2.start(t);
      place(g, null, { vol: 1 });
      eng = { o1: o1, o2: o2, lp: lp, g: g, rg: rg, stop: function () { o1.stop(); o2.stop(); road.stop(); } };
      g.gain.setTargetAtTime(0.32, t, 0.4);
    }
    var s = Math.abs(speed), gear = Math.min(4, Math.floor(s / 6)), inG = (s - gear * 6) / 6, rpm = 0.18 + 0.75 * (gear >= 4 ? Math.min(1, s / 30) : inG) + 0.05 * gear;
    var f = 26 + rpm * 75;
    eng.o1.frequency.setTargetAtTime(f, t, 0.08); eng.o2.frequency.setTargetAtTime(f * 0.5, t, 0.08);
    eng.lp.frequency.setTargetAtTime(280 + rpm * 1400, t, 0.1); eng.rg.gain.setTargetAtTime(Math.min(0.5, s / 40), t, 0.2);
  };

  /* ---------- ambience: wind, the dead city, distant trouble ---------- */
  var ambience = {
    start: function () {
      var t = ctx.currentTime;
      var w = noise(t, 1e6), wf = filt('bandpass', 500, 0.8), wg = ctx.createGain(); wg.gain.value = 0.09;
      var lfo = osc('sine', 0.07, t, 1e6), lg = ctx.createGain(); lg.gain.value = 260; lfo.connect(lg); lg.connect(wf.frequency);
      var lfo2 = osc('sine', 0.11, t, 1e6), lg2 = ctx.createGain(); lg2.gain.value = 0.045; lfo2.connect(lg2); lg2.connect(wg.gain);
      var whistle = noise(t, 1e6), hf = filt('bandpass', 2400, 14), hg = ctx.createGain(); hg.gain.value = 0.02; var l3 = osc('sine', 0.05, t, 1e6), l3g = ctx.createGain(); l3g.gain.value = 0.02; l3.connect(l3g); l3g.connect(hg.gain);
      var hum = noise(t, 1e6, true), hm = filt('lowpass', 130), hmg = ctx.createGain(); hmg.gain.value = 0.18;   // the far-off city / the uneasy low end (stronger on headphones)
      this.windLP = filt('lowpass', 20000); this.bed = ctx.createGain(); this.bed.gain.value = 1;
      chain(w, wf, wg, this.windLP); chain(whistle, hf, hg, this.windLP); chain(hum, hm, hmg, this.windLP); chain(this.windLP, this.bed, ambBus);
      // night insects that go quiet when zombies are close (nature noticing before you do)
      this.bugs = ctx.createGain(); this.bugs.gain.value = 0.0; this.bugs.connect(ambBus);
      this.bugT = 0; this.evT = R(6, 12); this.coughT = 15;
    },
    update: function (dt, m) {
      var t = ctx.currentTime, inside = m.inside, quiet = m.level >= 2 ? 0.35 : m.level === 1 ? 0.7 : 1;
      this.windLP.frequency.setTargetAtTime(inside ? 500 : 20000, t, 0.4);
      this.bed.gain.setTargetAtTime((inside ? 0.6 : 1) * (m.level >= 2 ? 0.55 : 1), t, 1.2);   // the city goes quiet when you're hunted
      this.bugs.gain.setTargetAtTime(inside || m.near < 14 || m.level >= 1 ? 0 : 0.5, t, m.near < 14 ? 0.3 : 3);
      this.bugT -= dt;
      if (this.bugT <= 0) { this.bugT = R(0.4, 1.4); var f = R(4000, 4800), n = 3 + Math.floor(Math.random() * 4); for (var i = 0; i < n; i++) { var o = osc('sine', f, t + i * 0.055, 0.04), e = env(t + i * 0.055, 0.004, 0.02, 0.03); o.connect(e); e.connect(this.bugs); } }
      this.evT -= dt;
      if (this.evT <= 0 && !m.menu) {
        this.evT = R(7, 20);
        var a = Math.random() * 6.283, r = R(45, 110), pos = { x: LP.x + Math.cos(a) * r, y: 3, z: LP.z + Math.sin(a) * r }, roll = Math.random(), far = { vol: 0.9 * quiet, range: 200, roll: 0.6, ref: 12, muffle: true };
        if (roll < 0.25) A.play('shot', pos, { kind: pick(['pistol', 'rifle', 'shotgun']), far: 1, vol: 0.55 * quiet, range: 200, roll: 0.6, ref: 14, verb: 0.9, sonic: true });
        else if (roll < 0.4) A.play('bark', pos, far);
        else if (roll < 0.52) A.play('creak', { x: LP.x + Math.cos(a) * 14, y: 4, z: LP.z + Math.sin(a) * 14 }, { vol: 0.5 * quiet });
        else if (roll < 0.62) A.play('alarm', pos, { vol: 0.35 * quiet, range: 200, roll: 0.6, ref: 14, muffle: true, life: 7 });
        else if (roll < 0.72) A.play('scream_far', pos, far);
        else if (roll < 0.8) A.play('glass', { x: LP.x + Math.cos(a) * 30, y: 3, z: LP.z + Math.sin(a) * 30 }, { vol: 0.5 * quiet });
        else if (roll < 0.86) A.play('heli', pos, { vol: 0.5, range: 200, roll: 0.4, ref: 20, life: 10 });
        else if (roll < 0.9) A.play('thunder', null, { vol: 0.5, life: 7 });
        else A.play('z_idle', { x: LP.x + Math.cos(a) * 25, y: 1.5, z: LP.z + Math.sin(a) * 25 }, { kind: pick(['walker', 'walker', 'brute', 'runner']), muffle: true, vol: 0.7 * quiet });
      }
    }
  };

  /* ---------- music: one piece in layers that follow how aware the zombies are of you ----------
     calm (a lonely plucked theme, long silences) -> uneasy (low drone, a thin high cluster) -> hunted (tremolo strings,
     a pulse, dissonance climbing) -> swarm (drums, a distorted cluster, metal screeches). Up fast, down slowly. */
  var NOTE = { D2: 73.42, A2: 110, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196, A3: 220, Bb3: 233.08, C4: 261.63, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, G4: 392, A4: 440, Bb4: 466.16, C5: 523.25, D5: 587.33 };
  var plucks = {};
  function pluckBuf(f) {
    if (plucks[f]) return plucks[f];
    var sr = ctx.sampleRate, n = Math.floor(sr * 3), buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0), N = Math.round(sr / f), i;
    for (i = 0; i < N; i++) d[i] = (Math.random() * 2 - 1) * 0.6;
    for (i = N; i < n; i++) d[i] = 0.4985 * (d[i - N] + d[i - N + 1]);
    return (plucks[f] = buf);
  }
  var music = {
    L: [], level: 0, lvT: 0, built: false,
    build: function () {
      for (var i = 0; i < 4; i++) { var g = ctx.createGain(); g.gain.value = 0; g.connect(musBus); var s = ctx.createGain(); s.gain.value = 0.6; g.connect(s); s.connect(verbIn); this.L.push(g); }
      this.tone = filt('lowpass', 20000); this.tone.connect(musBus);
      this.nextPluck = 2; this.beat = 0; this.nextBeat = 0; this.screechT = 4; this.riseT = 0; this.falseT = R(60, 140); this.heartT = 0; this.breathT = 0;
      this.built = true;
    },
    // the sustained layers start the first time they're needed and then keep running quietly
    ensure: function (n) {
      var t = ctx.currentTime, L = this.L;
      if (n >= 1 && !this.drone) {
        var dg = ctx.createGain(); dg.gain.value = 0.22; var lp = filt('lowpass', 380, 2); var lfo = osc('sine', 0.06, t, 1e6), lg = ctx.createGain(); lg.gain.value = 220; lfo.connect(lg); lg.connect(lp.frequency);
        [NOTE.D2, NOTE.D2 * 1.006, NOTE.A2 * 0.997, NOTE.D3 * 1.003].forEach(function (f) { osc('sawtooth', f, t, 1e6).connect(lp); });
        chain(lp, dg, L[1]);
        var cg = ctx.createGain(); cg.gain.value = 0.035; [1174.66, 1244.51, 1318.51].forEach(function (f, i) { var o = osc('triangle', f, t, 1e6), g = ctx.createGain(); g.gain.value = 0; var l = osc('sine', 0.05 + i * 0.031, t, 1e6), lgg = ctx.createGain(); lgg.gain.value = 0.5; l.connect(lgg); lgg.connect(g.gain); o.connect(g); g.connect(cg); });
        cg.connect(L[1]); this.drone = true;
      }
      if (n >= 2 && !this.strings) {
        var sg = ctx.createGain(); sg.gain.value = 0; var trem = osc('sine', 11, t, 1e6), tg = ctx.createGain(); tg.gain.value = 0.05; trem.connect(tg); tg.connect(sg.gain);
        var bp = filt('bandpass', 1900, 0.7); [NOTE.A3, NOTE.Bb3, NOTE.D4, NOTE.Eb4].forEach(function (f, i) { var o = osc('sawtooth', f * (1 + (i - 1.5) * 0.002), t, 1e6); o.connect(bp); });
        chain(bp, sg, L[2]);
        this.riser = osc('sawtooth', NOTE.D4, t, 1e6); var rg = ctx.createGain(); rg.gain.value = 0.02; var rf = filt('bandpass', 2200, 1); chain(this.riser, rf, rg, L[2]);
        this.strings = true;
      }
      if (n >= 3 && !this.cluster) {
        var cl = ctx.createGain(); cl.gain.value = 0.05; var clf = filt('lowpass', 2400); var ds = shaper(5);
        [NOTE.D3, NOTE.Eb4 / 2, NOTE.E3, NOTE.F3, NOTE.G3 * 0.944, NOTE.G3].forEach(function (f) { osc('sawtooth', f, t, 1e6).connect(ds); });
        chain(ds, clf, cl, L[3]); this.cluster = true;
      }
    },
    update: function (dt, m) {
      var t = ctx.currentTime, L = this.L, lv = m.safe ? 0 : m.level;
      // step up at once, step down one level at a time after things stay quiet
      if (lv > this.level) { this.level = lv; this.lvT = 0; if (lv >= 2 && this.lastSting < t - 25) { A.stinger(lv === 3 ? 1 : 0.7); } }
      else if (lv < this.level) { this.lvT += dt; if (this.lvT > (this.level >= 2 ? 6 : 10)) { this.level--; this.lvT = 0; } }
      else this.lvT = 0;
      this.ensure(this.level);
      var target = [[1, 0, 0, 0], [0.4, 1, 0, 0], [0.12, 0.75, 1, 0], [0, 0.55, 0.85, 1]][this.level];
      if (m.safe) target = [1, 0, 0, 0];
      for (var i = 0; i < 4; i++) { var up = target[i] > L[i].gain.value; L[i].gain.setTargetAtTime(target[i] * (i === 0 ? 0.9 : 1), t, up ? 0.5 : 3.5); }
      // calm: the lonely theme, a few notes then a long silence
      this.nextPluck -= dt;
      if (this.nextPluck <= 0) {
        var scale = m.safe ? ['D3', 'F3', 'A3', 'C4', 'D4', 'F4', 'A4', 'G4'] : ['D3', 'F3', 'A3', 'Bb3', 'D4', 'E4', 'F4', 'A4'];
        var n = Math.random() < 0.35 ? 3 : Math.random() < 0.5 ? 2 : 1, tt = t;
        for (var k = 0; k < n; k++) { var s = ctx.createBufferSource(); s.buffer = pluckBuf(NOTE[pick(scale)]); var g = ctx.createGain(); g.gain.value = R(0.18, 0.28); s.connect(g); g.connect(L[0]); s.start(tt); tt += R(0.35, 0.8); }
        if (Math.random() < 0.25) { var lo = ctx.createBufferSource(); lo.buffer = pluckBuf(NOTE.D2); var lg = ctx.createGain(); lg.gain.value = 0.22; lo.connect(lg); lg.connect(L[0]); lo.start(t); }
        this.nextPluck = R(3.5, 9);
      }
      // hunted + swarm: the pulse and the drums
      this.nextBeat -= dt;
      if (this.level >= 2 && this.nextBeat <= 0) {
        var swarm = this.level === 3, bpm = swarm ? 124 : 96, step = 60 / bpm / 2; this.nextBeat += step; if (this.nextBeat < -0.2) this.nextBeat = step;
        var b = this.beat++ % 8;
        if (b % 2 === 0) { var p = thump(t, swarm ? 62 : 78, 40, 0.22, b === 0 ? 0.45 : 0.28); p.connect(L[2]); }
        if (swarm && (b === 0 || b === 3 || b === 6)) { var d1 = thump(t, 58, 30, 0.5, 0.9); d1.connect(L[3]); burst(t, { type: 'lowpass', f: 700, dur: 0.25, g: 0.5 }).connect(L[3]); }
        if (swarm && b % 2 === 1) burst(t, { type: 'highpass', f: 6000, dur: 0.03, g: 0.08 }).connect(L[3]);
      }
      // hunted: dissonance climbing (restarts every 18 s, like a staircase that never ends)
      if (this.riser) { this.riseT -= dt; if (this.riseT <= 0) { this.riseT = 18; this.riser.frequency.cancelScheduledValues(t); this.riser.frequency.setValueAtTime(NOTE.D4, t); this.riser.frequency.exponentialRampToValueAtTime(NOTE.D5 * 1.06, t + 18); } }
      // swarm: metal screeches
      if (this.level === 3) { this.screechT -= dt; if (this.screechT <= 0) { this.screechT = R(3, 7); var c = osc('sawtooth', R(1200, 1900), t, 1.6), mo = osc('sine', R(600, 900), t, 1.6), mg = ctx.createGain(); mg.gain.setValueAtTime(400, t); mg.gain.linearRampToValueAtTime(1800, t + 1.4); mo.connect(mg); mg.connect(c.frequency); var e = env(t, 0.2, 0.05, 1.2), f = filt('bandpass', 2500, 2); chain(c, f, e, L[3]); } }
      // uneasy: rare false alarms, so the quiet never feels safe
      if (this.level === 1) { this.falseT -= dt; if (this.falseT <= 0) { this.falseT = R(70, 160); if (Math.random() < 0.4) A.stinger(0.35); } }
      // your body: heartbeat when hurt or hunted, heavy breathing when out of breath
      var hb = m.hp < 0.35 ? 1 - m.hp / 0.35 * 0.5 : this.level >= 2 ? 0.45 : 0;
      this.heartT -= dt;
      if (hb > 0 && this.heartT <= 0) { this.heartT = 60 / (70 + hb * 70); var h1 = thump(t, 58, 38, 0.12, 0.5 * hb + 0.2), h2 = thump(t + 0.16, 52, 34, 0.12, 0.35 * hb + 0.15); place(h1, null, {}); place(h2, null, {}); }
      this.breathT -= dt;
      if (m.tired && this.breathT <= 0) { this.breathT = 0.9; var br = burst(t, { f: 1100, q: 0.7, a: 0.15, dur: 0.3, g: 0.12 }), br2 = burst(t + 0.45, { f: 800, q: 0.7, a: 0.1, dur: 0.3, g: 0.1 }); place(br, null, {}); place(br2, null, {}); }
    },
    lastSting: -99
  };
  A.stinger = function (k) {
    if (!ctx || ctx.state !== 'running' || !music.built) return;
    var t = ctx.currentTime; k = k === undefined ? 1 : k; music.lastSting = t;
    var m = sum(), g = ctx.createGain(); g.gain.value = 0.35 * k;
    [NOTE.D3, NOTE.Eb4 / 2 * 2, NOTE.A3 * 1.059, NOTE.D4 * 1.414, NOTE.D5, NOTE.Eb4 * 2, NOTE.A4 * 2.12].forEach(function (f) { var o = osc('sawtooth', f, t, 3), e = env(t, 0.008, 0.16, 2.6); o.connect(e); e.connect(m); });
    burst(t, { type: 'highpass', f: 2500, dur: 0.4, g: 0.5 }).connect(m); thump(t, 70, 30, 1.2, 0.9).connect(m);
    chain(m, shaper(3), g); g.connect(musBus); var s = ctx.createGain(); s.gain.value = 0.8; g.connect(s); s.connect(verbIn);
  };

  /* ---------- the radio: stations from content/radio/stations.js ----------
     Everything on the radio goes through a small-speaker filter with static under it. Voices use the device's own
     speech (or Android's, through the app), and fall back to a garbled radio voice with subtitles where there is none.
     Music stations make their songs live; each song is picked from the real clock, so everyone tuned in hears the same thing. */
  var radio = A.radio = { on: false, idx: 0, car: false, list: [], text: function () {}, ctxFn: null };
  var rIn, rOut, rStatic, rFilt, rBed = null, rSpeaking = false, rGap = 0, rSay = 0, rNext = 0, rSong = null, rBeat = 0, rBags = {}, rCool = {}, rNum = null, rCbI = -1, rAlertI = 0, rTones = 0, rCrackle = null;
  function rBuild() {
    rIn = ctx.createGain(); rIn.gain.value = 1;
    var hp = filt('highpass', 260, 0.7); rFilt = filt('lowpass', 4200, 0.9); var sh = shaper(1.6);
    rOut = ctx.createGain(); rOut.gain.value = 0; chain(rIn, hp, rFilt, sh, rOut);
    var bus = ctx.createGain(); bus.gain.value = A.vol.radio === undefined ? 0.8 : A.vol.radio; A._radioBus = bus; rOut.connect(bus); bus.connect(menuLP);
    var s = noise(ctx.currentTime, 1e7), sf = filt('bandpass', 2400, 0.5); rStatic = ctx.createGain(); rStatic.gain.value = 0; chain(s, sf, rStatic, bus);
  }
  if (A.vol.radio === undefined) A.vol.radio = 0.8;
  var rng = function (seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function mf(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function st() { return radio.list[radio.idx]; }

  // ---- voices ----
  var sysVoices = [];
  function loadVoices() { try { sysVoices = speechSynthesis.getVoices().filter(function (v) { return /^en/i.test(v.lang); }); } catch (e) {} }
  if (window.speechSynthesis) { loadVoices(); try { speechSynthesis.addEventListener('voiceschanged', loadVoices); } catch (e) { speechSynthesis.onvoiceschanged = loadVoices; } }
  var droid = function () { var R0 = window.RebirthAndroid; return !!(R0 && typeof R0.speak === 'function' && (typeof R0.ttsReady !== 'function' || R0.ttsReady())); };
  var primed = false;
  var rDone = null; window.rebirthSpeechDone = function () { var d = rDone; rDone = null; if (d) d(); };
  function speakNow(text, v, done) {
    var vol = A.vol.master * A.vol.radio * (radio.car ? 1 : 0.85);
    var fin = false, finish = function () { if (fin) return; fin = true; rSpeaking = false; ducker(false); if (done) done(); };
    rSpeaking = true; ducker(true);
    var guess = 1500 + text.split(/\s+/).length * 430 / (v.rate || 1);
    radio.text(text);
    try {
      if (droid()) { rDone = finish; window.RebirthAndroid.speak(text, v.pitch || 1, v.rate || 1, vol, v.pick || 0); setTimeout(finish, guess + 4000); return; }
      if (window.speechSynthesis && sysVoices.length) {
        var u = new SpeechSynthesisUtterance(text); u.voice = sysVoices[(v.pick || 0) % sysVoices.length]; u.pitch = v.pitch || 1; u.rate = v.rate || 1; u.volume = Math.max(0.05, Math.min(1, vol));
        u.onend = finish; u.onerror = finish; speechSynthesis.cancel(); speechSynthesis.speak(u); setTimeout(finish, guess + 6000); return;
      }
    } catch (e) {}
    // no speech engine: a garbled voice through the radio, with the words on screen
    var t = ctx.currentTime, words = text.split(/\s+/).length, n = Math.round(words * 1.6), tt = t, f0 = 120 * (v.pitch || 1);
    for (var i = 0; i < n; i++) { var d = R(0.09, 0.2) / (v.rate || 1); voice(tt, { f0: f0 * R(0.85, 1.2), dur: d, v: pick(['ah', 'ee', 'uh', 'oo', 'aw']), rough: 0.05, grit: 2, g: 0.25, a: 0.015 }).connect(rIn); tt += d + (Math.random() < 0.18 ? R(0.12, 0.3) : 0.02); }
    setTimeout(finish, (tt - t) * 1000 + 300);
  }
  function stopSpeech() { rDone = null; try { if (droid() && window.RebirthAndroid.stopSpeaking) window.RebirthAndroid.stopSpeaking(); if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} rSpeaking = false; }
  function ducker(on) { if (!rSong || !rSong.out) return; rSong.out.gain.setTargetAtTime(on ? 0.25 : 1, ctx.currentTime, 0.3); }
  function lineFor(s, item) { if (typeof item === 'string') return [Object.keys(s.voices || { x: 1 })[0], item]; return item; }
  function vFor(s, id) { var vs = s.voices || {}; return vs[id] || vs[Object.keys(vs)[0]] || { pitch: 1, rate: 1, pick: 0 }; }
  function sayLine(s, item, done) { var l = lineFor(s, item); speakNow(l[1], vFor(s, l[0]), done); }
  // shuffle bags so lines don't repeat until the pool runs out
  function bag(key, arr) { var b = rBags[key]; if (!b || !b.length) { b = rBags[key] = arr.map(function (x, i) { return i; }); for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = b[i]; b[i] = b[j]; b[j] = t; } } return arr[b.pop()]; }

  // ---- beds and sounds that only the radio uses ----
  function setBed(kind) {
    if (rBed) { var old = rBed; old.g.gain.setTargetAtTime(0, ctx.currentTime, 0.3); setTimeout(function () { old.stop(); }, 1500); rBed = null; }
    if (!kind) return;
    var t = ctx.currentTime, g = ctx.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(kind === 'drone' ? 0.1 : 0.07, t, 1); var oscs = [];
    var notes = kind === 'drone' ? [mf(38), mf(38) * 1.01, mf(45), mf(73) * 1.003] : [mf(57), mf(64), mf(69), mf(72)];
    notes.forEach(function (f) { var o = ctx.createOscillator(); o.type = kind === 'drone' ? 'sawtooth' : 'triangle'; o.frequency.value = f; var lp = filt('lowpass', kind === 'drone' ? 500 : 900); o.connect(lp); lp.connect(g); o.start(t); oscs.push(o); });
    if (kind === 'drone') { var w = osc('sine', 0.3, t, 1e6), wg = ctx.createGain(); wg.gain.value = 40; w.connect(wg); var sw = osc('sine', 1800, t, 1e6), swg = ctx.createGain(); swg.gain.value = 0.02; wg.connect(sw.frequency); sw.connect(swg); swg.connect(g); oscs.push(w, sw); }   // shortwave whistle
    g.connect(rIn); rBed = { g: g, stop: function () { oscs.forEach(function (o) { try { o.stop(); } catch (e) {} }); } };
  }
  function squelch(t) { burst(t, { type: 'highpass', f: 1800, dur: 0.25, g: 0.35 }).connect(rIn); }
  function roger(t) { var o = osc('sine', 1200, t, 0.12), e = env(t, 0.005, 0.15, 0.1); o.connect(e); e.connect(rIn); }
  function alertTones(t) { for (var i = 0; i < 6; i++) { var o = osc('square', i % 2 ? 1046 : 784, t + i * 0.45, 0.42), e = env(t + i * 0.45, 0.01, 0.12, 0.05, 0.36), lp = filt('lowpass', 2500); chain(o, lp, e, rIn); } return 2.9; }
  function chime(t) { [72, 76, 79, 76, 72, 67].forEach(function (m, i) { var o = osc('sine', mf(m), t + i * 0.35, 1.2), e = env(t + i * 0.35, 0.005, 0.12, 1.1); o.connect(e); e.connect(rIn); }); return 2.6; }

  // ---- music: a new song every slot, built from the clock so it's the same for everyone ----
  var SLOT = 150;
  function songAt(s, slot) {
    var r = rng(hash(s.id + ':' + slot)), T = s.titles || { a: ['Untitled'], b: ['Song'], band: ['Unknown'] }, P = function (a) { return a[Math.floor(r() * a.length)]; };
    var style = s.style, song = { slot: slot, title: P(T.a) + ' ' + P(T.b), band: P(T.band), style: style, r: r };
    if (style === 'oldies') { song.bpm = 112 + Math.floor(r() * 30); song.key = 53 + Math.floor(r() * 7); song.prog = P([[[0, 'M'], [9, 'm'], [2, 'm'], [7, '7']], [[0, 'M'], [5, 'M'], [0, 'M'], [7, '7']], [[0, 'M'], [9, 'm'], [5, 'M'], [7, '7']]]); }
    else if (style === 'rock') { song.bpm = 118 + Math.floor(r() * 28); song.key = 40 + Math.floor(r() * 5); song.prog = P([[[0, 'p'], [10, 'p'], [5, 'p'], [0, 'p']], [[0, 'p'], [8, 'p'], [10, 'p'], [0, 'p']], [[0, 'p'], [7, 'p'], [9, 'p'], [5, 'p']], [[0, 'p'], [3, 'p'], [10, 'p'], [5, 'p']]]); }
    else { song.bpm = 70 + Math.floor(r() * 14); song.key = 50 + Math.floor(r() * 7); song.prog = P([[[0, 'M7'], [9, 'm7'], [5, 'M7'], [7, 'm7']], [[2, 'm7'], [7, '7'], [0, 'M7'], [0, 'M7']], [[0, 'm7'], [5, 'm7'], [10, 'M7'], [3, 'M7']]]); }
    song.len = 128 + Math.floor(r() * 14);
    song.motif = []; for (var i = 0; i < 8; i++) song.motif.push(r() < 0.35 ? null : Math.floor(r() * 5));
    song.motif2 = []; for (i = 0; i < 8; i++) song.motif2.push(r() < 0.4 ? null : Math.floor(r() * 5));
    return song;
  }
  function chordNotes(root, q) { var iv = { M: [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], p: [0, 7, 12], M7: [0, 4, 7, 11, 14], m7: [0, 3, 7, 10, 14] }[q] || [0, 4, 7]; return iv.map(function (x) { return root + x; }); }
  function nt(t, f, dur, g, type, out, a) { var o = osc(type || 'triangle', f, t, dur), e = env(t, a || 0.005, g, dur); o.connect(e); e.connect(out); return o; }
  function hat(t, g, dur, out, f) { burst(t, { type: 'highpass', f: f || 7000, dur: dur || 0.04, g: g }).connect(out); }
  function kick(t, g, out) { thump(t, 120, 42, 0.22, g).connect(out); }
  function snare(t, g, out, brush) { if (brush) burst(t, { f: 1800, q: 0.6, a: 0.02, dur: 0.16, g: g }).connect(out); else { burst(t, { f: 2200, q: 0.5, dur: 0.14, g: g }).connect(out); thump(t, 190, 150, 0.08, g * 0.6, 'triangle').connect(out); } }
  function guitar(t, notes, dur, g, out) { var m = sum(); notes.forEach(function (n) { var o = osc('sawtooth', mf(n), t, dur), o2 = osc('sawtooth', mf(n) * 1.004, t, dur); o.connect(m); o2.connect(m); }); var e = env(t, 0.004, g, dur), d = shaper(18), lp = filt('lowpass', 2600, 0.8); chain(m, d, lp, e, out); }
  function playBeat(song, b, t, out) {
    var spb = 60 / song.bpm, bar = Math.floor(b / 4), bi = b % 4, ch = song.prog[Math.floor(bar / (song.style === 'lowlight' ? 1 : 2)) % song.prog.length];
    var root = song.key + ch[0], notes = chordNotes(root, ch[1]), r = song.r, sec = Math.floor(bar / 8) % 2;   // verse / chorus
    var pent = [0, 2, 4, 7, 9], mpent = [0, 3, 5, 7, 10];
    if (song.style === 'oldies') {
      var sw = spb * 2 / 3;
      var walk = [root - 12, root - 12 + (bi === 1 ? (ch[1] === 'm' ? 3 : 4) : 7), root - 12 + 7, root - 12 + (r() < 0.5 ? 11 : 1)][bi];
      nt(t, mf(walk), spb * 0.9, 0.42, 'triangle', out);
      hat(t, 0.06, 0.12, out, 6000); if (bi % 2) { hat(t + sw, 0.05, 0.08, out, 6500); snare(t, 0.12, out, true); }
      if (bi === 0) kick(t, 0.25, out);
      if (bi % 2) notes.forEach(function (n) { var src = ctx.createBufferSource(); src.buffer = pluckBuf(mf(n + 12)); var e = env(t, 0.003, 0.12, 0.3); src.connect(e); e.connect(out); src.start(t); src.stop(t + 0.5); });
      var mo = (bar % 8 < 6 ? song.motif : song.motif2), k1 = mo[bi * 2], k2 = mo[bi * 2 + 1];
      [[k1, 0], [k2, sw]].forEach(function (p) { if (p[0] === null || p[0] === undefined) return; var m = song.key + 12 + pent[p[0]] + (bar % 4 === 3 ? 2 : 0), f = mf(m); nt(t + p[1], f, 0.9, 0.12, 'sine', out); nt(t + p[1], f * 4, 0.25, 0.02, 'sine', out); });
    } else if (song.style === 'rock') {
      var e8 = spb / 2;
      for (var h = 0; h < 2; h++) {
        var tt = t + h * e8;
        hat(tt, 0.07, 0.035, out);
        nt(tt, mf(root - 12), e8 * 0.9, 0.35, 'sawtooth', out);
        if (sec === 0) guitar(tt, notes, e8 * 0.6, 0.16, out);
      }
      if (sec === 1 && bi === 0) guitar(t, notes, spb * 4, 0.18, out);
      if (bi === 0 || bi === 2) kick(t, 0.6, out); if (bi === 2 && r() < 0.5) kick(t + e8, 0.4, out);
      if (bi === 1 || bi === 3) snare(t, 0.4, out);
      if (sec === 1 && song.motif[(bar * 4 + bi) % 8] !== null) { var lm = song.key + 24 + mpent[song.motif[(bar * 4 + bi) % 8]]; var o = osc('square', mf(lm), t, spb), e = env(t, 0.01, 0.06, spb * 0.9), dd = shaper(8), lp2 = filt('lowpass', 3000); chain(o, dd, lp2, e, out); }
    } else {
      if (bi === 0) notes.forEach(function (n, i) { nt(t + i * 0.012, mf(n), spb * 4, 0.05, 'sine', out, 0.02); nt(t, mf(n) * 2.01, spb * 1.5, 0.008, 'sine', out); });
      if (bi === 0) kick(t, 0.25, out); if (bi === 2) { kick(t + spb / 2, 0.18, out); burst(t, { f: 2500, q: 4, dur: 0.03, g: 0.12 }).connect(out); }
      var mm = song.motif[(bar * 4 + bi) % 8]; if (mm !== null && r() < 0.6) { var src = ctx.createBufferSource(); src.buffer = pluckBuf(mf(song.key + 12 + pent[mm])); var ge = ctx.createGain(); ge.gain.value = 0.22; src.connect(ge); ge.connect(out); src.start(t + (r() < 0.5 ? 0 : spb / 2)); }
    }
  }
  function startSong(s, slot, offset) {
    endSong();
    var song = songAt(s, slot); song.out = ctx.createGain(); song.out.gain.value = 1; song.lvl = ctx.createGain(); song.lvl.gain.value = 2.8; song.out.connect(song.lvl); song.lvl.connect(rIn); 
    song.t0 = ctx.currentTime - offset; song.nextB = Math.max(0, Math.floor(offset * song.bpm / 60));
    rSong = song;
    if (s.style === 'lowlight' || s.style === 'oldies') startCrackle(s.style === 'oldies' ? 0.06 : 0.035);
    radio.text(song.title + ' – ' + song.band, true);
  }
  function endSong() { if (rSong) { var o = rSong.out; o.gain.setTargetAtTime(0, ctx.currentTime, 0.2); setTimeout(function () { try { o.disconnect(); } catch (e) {} }, 1200); rSong = null; } stopCrackle(); }
  function startCrackle(g) { stopCrackle(); var s = noise(ctx.currentTime, 1e6), f = filt('highpass', 3000), gg = ctx.createGain(); gg.gain.value = g * 0.3; chain(s, f, gg, rIn); rCrackle = { s: s, g: gg, k: g }; }
  function stopCrackle() { if (rCrackle) { try { rCrackle.s.stop(); } catch (e) {} rCrackle = null; } }

  // ---- what each kind of station does next ----
  function tuneIn() {
    var s = st(); if (!s) return;
    stopSpeech(); endSong(); setBed(s.kind === 'talk' ? s.bed : null);
    rGap = 0.6; rNext = 0; rCbI = -1; rAlertI = 0; rTones = 0; rNum = null;
    var t = ctx.currentTime; burst(t, { f: 1800, q: 0.4, dur: 0.35, g: 0.5 }).connect(rIn);   // the dial sweeping
    rStatic.gain.setTargetAtTime((1 - (s.signal || 0.8)) * 0.16 + 0.012, t, 0.2);
    rFilt.frequency.setTargetAtTime(/AM/.test(s.freq) ? 3000 : s.kind === 'cb' || /MHz/.test(s.freq) ? 2600 : 4800, t, 0.1);
    radio.text(s.freq + '  ' + s.name, true);
    if (s.kind === 'music') { var now = Date.now() / 1000, slot = Math.floor(now / SLOT), off = now - slot * SLOT, song = songAt(s, slot); if (off < song.len - 3) startSong(s, slot, off); else rGap = 0.5; }
    if (s.intro && s.intro.length) { rGap = 99; setTimeout(function () { if (radio.on && st() === s) sayLine(s, bag(s.id + 'intro', s.intro), function () { rGap = R(2, 4); }); }, 700); }
  }
  function contextLine(s) {
    if (!s.when || !radio.ctxFn) return null;
    var c = radio.ctxFn() || {}, now = Date.now();
    var order = ['horde', 'infected', 'lowhp', 'screamer', 'brute', 'spotted', 'noammo', 'light', 'kills', 'car', 'safe', 'idle'];
    for (var i = 0; i < order.length; i++) { var k = order[i]; if (c[k] && s.when[k] && (!rCool[k] || now - rCool[k] > (k === 'horde' || k === 'lowhp' ? 40000 : 90000))) { rCool[k] = now; return bag(s.id + k, s.when[k]); } }
    return null;
  }
  radio.homing = 0; var pingT = 0;
  radio.update = function (dt) {
    var s = st(); if (!radio.on || !s || !rIn) return;
    if (s.kind === 'numbers' && radio.hold) { if (!rSpeaking) rGap = 1; }
    if (s.kind === 'numbers') {
      rStatic.gain.setTargetAtTime(((1 - (s.signal || 0.8)) * 0.16 + 0.012) * (1 - 0.85 * radio.homing), ctx.currentTime, 0.3);
      if (radio.homing > 0.02) { pingT -= dt; if (pingT <= 0) { pingT = 1.8 - 1.55 * radio.homing; var po = osc('sine', 1480, ctx.currentTime, 0.12), pe = env(ctx.currentTime, 0.004, 0.05 + 0.12 * radio.homing, 0.1); po.connect(pe); pe.connect(rIn); } }
    }
    rOut.gain.setTargetAtTime(radio.car ? 1 : 0.8, ctx.currentTime, 0.2);
    var t = ctx.currentTime;
    if (rCrackle && Math.random() < dt * 6) burst(t, { type: 'highpass', f: 2500, dur: 0.004, g: rCrackle.k * 3 }).connect(rIn);
    if (s.kind === 'music') {
      if (rSong) {
        var spb = 60 / rSong.bpm;
        while (rSong.t0 + rSong.nextB * spb < t + 0.25) { var bt = rSong.t0 + rSong.nextB * spb; if (bt > t - 0.05) try { playBeat(rSong, rSong.nextB, Math.max(t, bt), rSong.out); } catch (e) {} rSong.nextB++; }
        if (t - rSong.t0 > rSong.len) { var ended = rSong.slot; endSong(); rGap = 1.2; rSay = ended; }
        return;
      }
      if (rSpeaking) return;
      rGap -= dt; if (rGap > 0) return;
      var now = Date.now() / 1000, slot = Math.floor(now / SLOT), off = now - slot * SLOT;
      if (rSay !== -1 && s.lines) { rSay = -1; sayLine(s, bag(s.id, s.lines), function () { rGap = 0.6; }); return; }
      var sg = songAt(s, slot);
      if (off < sg.len - 3) { startSong(s, slot, off); return; }
      rGap = Math.min(SLOT - off + 0.1, 8); if (Math.random() < 0.5 && s.lines) rSay = 0; return;
    }
    if (rSpeaking) return;
    rGap -= dt; if (rGap > 0) return;
    if (s.kind === 'talk') {
      var ln = s.id === 'eyes' ? contextLine(s) : null;
      if (!ln) { var pools = [['lines', 5], ['tips', 3], ['lore', 2]].filter(function (p) { return s[p[0]] && s[p[0]].length; }), tot = pools.reduce(function (a, p) { return a + p[1]; }, 0), x = Math.random() * tot, chosen = pools[0];
        for (var i = 0; i < pools.length; i++) { x -= pools[i][1]; if (x <= 0) { chosen = pools[i]; break; } } ln = bag(s.id + chosen[0], s[chosen[0]]); }
      sayLine(s, ln, function () { rGap = R(2.5, 6); });
    } else if (s.kind === 'alert') {
      if (rAlertI % 4 === 0 && !rTones) { rTones = 1; rGap = alertTones(t) + 0.6; return; }
      rTones = 0; var a = s.lines[Math.floor(rAlertI / 1) % s.lines.length]; rAlertI++;
      sayLine(s, a, function () { rGap = 1.5; });
    } else if (s.kind === 'cb') {
      if (rCbI < 0) rCbI = Math.floor(Date.now() / 20000) % s.lines.length;
      var c = s.lines[rCbI % s.lines.length]; rCbI++;
      squelch(t); setTimeout(function () { if (radio.on && st() === s) sayLine(s, c, function () { roger(ctx.currentTime); rGap = R(4, 12); }); }, 300);
      rGap = 99;
    } else if (s.kind === 'numbers') {
      if (!rNum) {
        // today's message: five groups, one of them read twice (the game decides which, and what it means)
        var day = Math.floor(Date.now() / 86400000), spec = radio.numbersFn ? radio.numbersFn(day) : null, groups = [], key = 0;
        if (spec) { groups = spec.groups.map(function (g) { return g.split('').join(', '); }); key = spec.key; }
        else { var rr = rng(hash('numbers:' + day)); for (var g = 0; g < 5; g++) { var grp = []; for (var d = 0; d < 5; d++) grp.push(Math.floor(rr() * 10)); groups.push(grp.join(', ')); } }
        var q = ['chime', s.lines[0], s.lines[1]];
        groups.forEach(function (g, i) { q.push(g); if (i === key) q.push(s.lines[3] || 'I repeat.', g); });
        rNum = { q: q.concat([s.lines[2], 'pause']), i: 0 };
      }
      var item = rNum.q[rNum.i++]; if (rNum.i >= rNum.q.length) rNum.i = 0;
      if (item === 'chime') { rGap = chime(t) + 0.5; return; }
      if (item === 'pause') { rGap = 12; radio.text('', true); return; }
      sayLine(s, item, function () { rGap = 1.6; });
    }
  };
  radio.power = function (on, idx) {
    if (!ctx) { try { A.unlock(); } catch (e) {} }
    if (!ctx) return;
    if (!rIn) rBuild();
    if (idx !== undefined) radio.idx = (idx + radio.list.length) % radio.list.length;
    radio.on = on;
    // iPhone only lets a page speak if the first words start from a tap: say nothing, right now, while we have one
    if (on && !primed && window.speechSynthesis && !droid()) { primed = true; try { var u0 = new SpeechSynthesisUtterance(' '); u0.volume = 0; speechSynthesis.speak(u0); } catch (e) {} }
    if (on) { rOut.gain.setTargetAtTime(radio.car ? 1 : 0.8, ctx.currentTime, 0.05); tuneIn(); }
    else { stopSpeech(); endSong(); setBed(null); rOut.gain.setTargetAtTime(0, ctx.currentTime, 0.05); rStatic.gain.setTargetAtTime(0, ctx.currentTime, 0.05); radio.text('', true); }
  };
  radio.tune = function (dir) { if (!radio.list.length) return; radio.idx = (radio.idx + dir + radio.list.length) % radio.list.length; if (radio.on) tuneIn(); };
  radio.volume = function (v) { A.vol.radio = v; if (A._radioBus) A._radioBus.gain.setTargetAtTime(v, ctx.currentTime, 0.05); try { localStorage.setItem('rebirthVol', JSON.stringify(A.vol)); } catch (e) {} };
  radio.station = st;
  radio.announce = function (text, idx) {
    if (idx !== undefined && (!radio.on || radio.idx !== idx)) { radio.power(true, idx); }
    if (!radio.on) return;
    stopSpeech(); rGap = 99; sayLine(st(), text, function () { rGap = 2.5; });
  };
  radio._state = function () { return { song: rSong && { title: rSong.title, beat: rSong.nextB, t: ctx.currentTime - rSong.t0, len: rSong.len }, gap: rGap, say: rSay, speaking: rSpeaking }; };

  /* ---------- per-frame: music, ambience, menus ---------- */
  var mood = { level: 0, safe: false, menu: false, inside: false, hp: 1, tired: false, near: 99 };
  A.mood = function (level, o) { mood.level = level; for (var k in o) mood[k] = o[k]; };
  A.tick = function (dt) {
    if (!ctx || ctx.state !== 'running') return;
    var t = ctx.currentTime;
    menuLP.frequency.setTargetAtTime(mood.menu ? 900 : 20000, t, 0.12);
    try { ambience.update(dt, mood); music.update(dt, mood); } catch (e) {}
    try { if (radio.on) radio.update(dt); } catch (e) { A._radioErr = String(e && e.stack || e); }
    musBus.gain.setTargetAtTime(A.vol.music * (radio.on ? 0.35 : 1), t, 0.4);
  };
})();
