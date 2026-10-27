/* Jelly Cinema: seasonal themes (settings: seasons.* in jellycinema.config.js).
   Picks a theme from seasons.calendar using the viewer's local date, draws a light particle
   effect over the web UI, and (for themes listed in seasons.rows) adds a themed movie row to Home.
   seasons.libraryRows adds rows from one library for a date range (set up in the server's own settings).
   During the Christmas season a library that is mostly Christmas titles also gets its own
   "<Library name> Christmas" row, found automatically (seasons.autoLibraryRows; no library is named here).
   Re-checks the date every minute and right after midnight, so themes change on their own.
   PERMISSIONS: rows are loaded as the signed-in user, every title is checked once more as that user
   (JellyCinema.verifyForUser), and caches are dropped when a different user signs in.
   Preview any theme from the browser console:  JellyCinemaSeasonal.preview('halloween')  /  JellyCinemaSeasonal.clear()
   Themes: newyear winter valentines stpatricks spring easter summer july4 fall halloween thanksgiving christmas plain */
(function () {
  'use strict';
  if (window.JellyCinemaSeasonal) return;
  var SC = (window.JellyCinemaConfig && window.JellyCinemaConfig.seasons) || {};
  // the viewer's language (jellycinema-banner.js); English when it isn't loaded
  var T = function () { var f = window.JellyCinemaT; if (f) return f.apply(null, arguments); var a = arguments; return String(a[0]).replace(/\{(\d)\}/g, function (m, i) { return a[+i + 1]; }); };
  if (SC.enabled === false) return;

  /* ---------- calendar ---------- */
  function easterSunday(y) { // Anonymous Gregorian algorithm
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4,
        f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30,
        i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7,
        m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31),
        da = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, mo - 1, da);
  }
  function thanksgiving(y) { // 4th Thursday of November
    var d = new Date(y, 10, 1), first = (4 - d.getDay() + 7) % 7;
    return new Date(y, 10, 1 + first + 21);
  }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function day0(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function between(d, a, b) { return d >= a && d <= b; }

  // 'MM-DD', 'easter', 'thanksgiving', each optionally followed by +N / -N days
  function dateExpr(expr, y) {
    var m = String(expr || '').trim().toLowerCase().match(/^(easter|thanksgiving|(\d{1,2})-(\d{1,2}))\s*([+-]\s*\d+)?$/);
    if (!m) return null;
    var base = m[1] === 'easter' ? easterSunday(y) : m[1] === 'thanksgiving' ? thanksgiving(y) : new Date(y, +m[2] - 1, +m[3]);
    return m[4] ? addDays(base, parseInt(m[4].replace(/\s/g, ''), 10)) : base;
  }
  var DEFAULT_CAL = [
    { theme: 'easter', from: 'easter-7', to: 'easter' }, { theme: 'newyear', from: '01-01', to: '01-02' },
    { theme: 'winter', from: '01-03', to: '01-31' }, { theme: 'valentines', from: '02-07', to: '02-14' },
    { theme: 'stpatricks', from: '03-14', to: '03-17' }, { theme: 'spring', from: '03-20', to: '04-30' },
    { theme: 'summer', from: '06-10', to: '06-27' }, { theme: 'july4', from: '06-28', to: '07-05' },
    { theme: 'fall', from: '09-22', to: '10-14' }, { theme: 'halloween', from: '10-15', to: '10-31' },
    { theme: 'thanksgiving', from: 'thanksgiving-6', to: 'thanksgiving' }, { theme: 'christmas', from: 'thanksgiving+1', to: '12-26' },
    { theme: 'newyear', from: '12-27', to: '12-31' }
  ];
  var CAL = Array.isArray(SC.calendar) ? SC.calendar : DEFAULT_CAL;
  function inRange(d, fromExpr, toExpr) {
    var y = d.getFullYear(), f = dateExpr(fromExpr, y), t = dateExpr(toExpr, y);
    if (!f || !t) return false;
    if (t < f) return d >= f || d <= t;   // wraps over New Year (e.g. 12-20 to 01-05)
    return between(d, f, t);
  }
  function themeFor(now) {
    var d = day0(now);
    for (var i = 0; i < CAL.length; i++) {
      var e = CAL[i];
      if (e && THEMES[e.theme] && inRange(d, e.from, e.to)) return e.theme;
    }
    return 'plain';
  }

  /* ---------- theme definitions ---------- */
  var THEMES = {
    plain:        { parts: [] },
    newyear:      { parts: [['sparkle', 1.0]] },
    winter:       { parts: [['snow', 1.0]] },
    valentines:   { parts: [['heart', 0.6]] },
    stpatricks:   { parts: [['clover', 0.6]] },
    spring:       { parts: [['petal', 0.8]] },
    easter:       { parts: [['pastelpetal', 0.6], ['egg', 0.25]] },
    summer:       { parts: [['firefly', 0.7]] },
    july4:        { parts: [['star', 0.6]] },
    fall:         { parts: [['leaf', 0.6]] },
    halloween:    { parts: [['leaf', 0.45], ['bat', 0.12]] },
    thanksgiving: { parts: [['tleaf', 0.55]] },
    christmas:    { parts: [['snow', 1.0]] }
  };
  // Themed movie rows (seasons.rows): { theme: { title, icon, tags[] } }
  var ROWS = SC.rows || {};
  Object.keys(ROWS).forEach(function (k) {
    var r = ROWS[k];
    if (THEMES[k] && r && r.title && Array.isArray(r.tags) && r.tags.length) THEMES[k].row = { title: String(r.title), icon: String(r.icon || ''), tags: r.tags.map(String) };
  });

  var PREVIEW_KEY = 'jc-seasonal-preview';
  function preview() { try { return localStorage.getItem(PREVIEW_KEY); } catch (e) { return null; } }
  function currentTheme() { var p = preview(); return (p && THEMES[p]) ? p : themeFor(new Date()); }

  /* ---------- particle effects ---------- */
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canvas, ctx, W = 0, H = 0, DPR = 1, particles = [], raf = 0, active = 'plain', lastT = 0;
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  var PAL = {
    sparkle: ['#ffd700', '#ffe680', '#f5c542', '#fff3b0'],
    heart: ['#ff4d6d', '#ff8fa3', '#e63946', '#ffb3c1'],
    clover: ['#2e9e44', '#3cb043', '#1f7a35'],
    petal: ['#ffc0cb', '#ffb7c5', '#f8a5c2', '#ffd1dc'],
    pastelpetal: ['#ffd1dc', '#c9f2c7', '#cde7ff', '#fff2b2', '#e3d1ff'],
    egg: ['#ffd1dc', '#c9f2c7', '#cde7ff', '#fff2b2', '#e3d1ff'],
    star: ['#e63946', '#ffffff', '#1d4ed8'],
    leaf: ['#e3a008', '#f2b705', '#d97706', '#c2410c', '#eab308'],
    tleaf: ['#b45309', '#9a3412', '#c2410c', '#78350f', '#d97706']
  };

  function make(kind, init) {
    var p = { kind: kind, x: rnd(0, W), y: init ? rnd(-H, H) : rnd(-60, -10), rot: rnd(0, 6.28), vr: rnd(-1, 1), t: rnd(0, 100) };
    switch (kind) {
      case 'snow':    p.r = rnd(1.2, 3.6); p.vy = rnd(20, 55); p.vx = rnd(-8, 8); p.a = rnd(0.5, 0.95); break;
      case 'sparkle': p.y = init ? rnd(0, H) : rnd(-20, 0); p.r = rnd(3, 8); p.vy = rnd(8, 22); p.vx = rnd(-5, 5); p.c = pick(PAL.sparkle); p.tw = rnd(1.5, 4); break;
      case 'heart':   p.r = rnd(7, 14); p.vy = rnd(25, 50); p.vx = rnd(-10, 10); p.c = pick(PAL.heart); p.vr = rnd(-0.6, 0.6); break;
      case 'clover':  p.r = rnd(7, 13); p.vy = rnd(25, 50); p.vx = rnd(-10, 10); p.c = pick(PAL.clover); break;
      case 'petal': case 'pastelpetal':
                      p.r = rnd(5, 10); p.vy = rnd(25, 55); p.vx = rnd(10, 35); p.c = pick(PAL[kind]); p.vr = rnd(-2, 2); break;
      case 'egg':     p.r = rnd(8, 13); p.vy = rnd(30, 50); p.vx = rnd(-6, 6); p.c = pick(PAL.egg); p.c2 = pick(PAL.egg); p.vr = rnd(-0.8, 0.8); break;
      case 'firefly': p.x = rnd(0, W); p.y = rnd(H * 0.25, H); p.r = rnd(1.6, 3); p.vx = rnd(-12, 12); p.vy = rnd(-12, 12); p.tw = rnd(0.6, 1.6); break;
      case 'star':    p.r = rnd(5, 11); p.vy = rnd(20, 45); p.vx = rnd(-8, 8); p.c = pick(PAL.star); p.vr = rnd(-1.2, 1.2); break;
      case 'leaf': case 'tleaf':
                      p.r = rnd(8, 15); p.vy = rnd(30, 60); p.vx = rnd(-15, 15); p.c = pick(PAL[kind]); p.vr = rnd(-2, 2); break;
      case 'bat':     p.dir = Math.random() < 0.5 ? 1 : -1; p.x = init ? rnd(0, W) : (p.dir > 0 ? -40 : W + 40); p.y = rnd(H * 0.05, H * 0.6);
                      p.r = rnd(10, 18); p.vx = p.dir * rnd(60, 120); p.vy = rnd(-10, 10); p.flap = rnd(7, 11); break;
    }
    return p;
  }

  function drawHeart(r) {
    ctx.beginPath(); ctx.moveTo(0, r * 0.35);
    ctx.bezierCurveTo(-r, -r * 0.3, -r * 0.45, -r * 1.05, 0, -r * 0.45);
    ctx.bezierCurveTo(r * 0.45, -r * 1.05, r, -r * 0.3, 0, r * 0.35);
    ctx.fill();
  }
  function drawStar(r, n, inner) {
    ctx.beginPath();
    for (var i = 0; i < n * 2; i++) { var rr = i % 2 ? r * inner : r, a = (i * Math.PI) / n - Math.PI / 2; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
  }
  function drawLeaf(r) {
    ctx.beginPath(); ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(r * 0.9, -r * 0.3, 0, r);
    ctx.quadraticCurveTo(-r * 0.9, -r * 0.3, 0, -r);
    ctx.fill();
    ctx.strokeStyle = 'rgba(80,40,0,0.45)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, -r * 0.85); ctx.lineTo(0, r * 1.25); ctx.stroke();
  }
  function drawBat(r, t, flap) {
    var w = Math.sin(t * flap) * 0.6;
    ctx.fillStyle = 'rgba(35,18,45,0.95)'; ctx.shadowColor = 'rgba(255,140,40,0.75)'; ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.22, r * 0.32, 0, 0, 6.283); ctx.fill();
    for (var s = -1; s <= 1; s += 2) {
      ctx.beginPath(); ctx.moveTo(0, -r * 0.1);
      ctx.quadraticCurveTo(s * r * 0.6, -r * (0.6 + w), s * r * 1.3, -r * (0.15 + w));
      ctx.quadraticCurveTo(s * r * 1.0, r * 0.05, s * r * 0.75, r * 0.12);
      ctx.quadraticCurveTo(s * r * 0.5, -r * 0.05, s * r * 0.35, r * 0.2);
      ctx.quadraticCurveTo(s * r * 0.2, 0, 0, r * 0.1); ctx.fill();
    }
    ctx.beginPath(); ctx.moveTo(-r * 0.15, -r * 0.25); ctx.lineTo(-r * 0.08, -r * 0.48); ctx.lineTo(0, -r * 0.28);
    ctx.lineTo(r * 0.08, -r * 0.48); ctx.lineTo(r * 0.15, -r * 0.25); ctx.fill();
  }

  function drawP(p) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    switch (p.kind) {
      case 'snow': ctx.globalAlpha = p.a; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.283); ctx.fill(); break;
      case 'sparkle':
        ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(p.t * p.tw)); ctx.fillStyle = p.c;
        ctx.shadowColor = p.c; ctx.shadowBlur = 8; drawStar(p.r, 4, 0.3); break;
      case 'heart': ctx.globalAlpha = 0.8; ctx.fillStyle = p.c; drawHeart(p.r); break;
      case 'clover':
        ctx.globalAlpha = 0.85; ctx.fillStyle = p.c;
        for (var i = 0; i < 4; i++) { ctx.save(); ctx.rotate(i * Math.PI / 2); ctx.translate(0, -p.r * 0.45); drawHeart(p.r * 0.55); ctx.restore(); }
        ctx.strokeStyle = p.c; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(p.r * 0.3, p.r * 0.7, p.r * 0.1, p.r * 1.1); ctx.stroke(); break;
      case 'petal': case 'pastelpetal':
        ctx.globalAlpha = 0.85; ctx.fillStyle = p.c; ctx.scale(1, 0.55 + 0.45 * Math.abs(Math.sin(p.t * 2)));
        ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * 0.6, 0, 0, 6.283); ctx.fill(); break;
      case 'egg':
        ctx.globalAlpha = 0.9; ctx.fillStyle = p.c; ctx.beginPath(); ctx.ellipse(0, 0, p.r * 0.75, p.r, 0, 0, 6.283); ctx.fill();
        ctx.strokeStyle = p.c2; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-p.r * 0.7, 0); ctx.quadraticCurveTo(0, -p.r * 0.25, p.r * 0.7, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-p.r * 0.6, p.r * 0.4); ctx.quadraticCurveTo(0, p.r * 0.15, p.r * 0.6, p.r * 0.4); ctx.stroke(); break;
      case 'firefly':
        var g = 0.25 + 0.75 * Math.max(0, Math.sin(p.t * p.tw)); ctx.globalAlpha = g;
        ctx.fillStyle = '#e8ff7a'; ctx.shadowColor = '#d4ff3a'; ctx.shadowBlur = 14; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.283); ctx.fill(); break;
      case 'star': ctx.globalAlpha = 0.85; ctx.fillStyle = p.c; if (p.c === '#ffffff') { ctx.shadowColor = '#fff'; ctx.shadowBlur = 6; } drawStar(p.r, 5, 0.45); break;
      case 'leaf': case 'tleaf': ctx.globalAlpha = 0.85; ctx.fillStyle = p.c; drawLeaf(p.r); break;
      case 'bat': ctx.rotate(-p.rot); drawBat(p.r, p.t, p.flap); break;
    }
    ctx.restore();
  }

  function step(p, dt) {
    p.t += dt;
    if (p.kind === 'firefly') {
      p.vx += rnd(-20, 20) * dt; p.vy += rnd(-20, 20) * dt;
      p.vx = Math.max(-18, Math.min(18, p.vx)); p.vy = Math.max(-18, Math.min(18, p.vy));
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10; if (p.y < H * 0.15) p.vy = Math.abs(p.vy); if (p.y > H + 10) p.y = H * 0.4;
      return true;
    }
    if (p.kind === 'bat') { p.x += p.vx * dt; p.y += (p.vy + Math.sin(p.t * 2) * 25) * dt; return p.x > -60 && p.x < W + 60; }
    p.x += (p.vx + Math.sin(p.t * 1.3) * 12) * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    if (p.x < -40) p.x = W + 30; else if (p.x > W + 40) p.x = -30;
    return p.y < H + 40;
  }

  function hiddenNow() {
    if (document.hidden) return true;
    var h = location.hash || '';
    if (/#\/(video|nowplaying|dashboard|configurationpage|plugins|users|libraries|networking|apikeys|tasks|logs)/i.test(h)) return true; // never over playback or admin pages
    var v = document.querySelector('.videoPlayerContainer:not(.hide), video.htmlvideoplayer');
    return !!(v && v.offsetParent !== null);
  }

  function frame(t) {
    raf = requestAnimationFrame(frame);
    var dt = Math.min(0.05, (t - (lastT || t)) / 1000); lastT = t;
    if (hiddenNow()) { if (canvas.style.display !== 'none') canvas.style.display = 'none'; return; }
    if (canvas.style.display === 'none') canvas.style.display = 'block';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (!step(p, dt)) particles[i] = make(p.kind, false);
      drawP(particles[i]);
    }
  }

  function resize() {
    if (!canvas) return;
    DPR = Math.min(window.devicePixelRatio || 1, 2); W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR; canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  }

  function startEffects(name) {
    stopEffects();
    var def = THEMES[name]; if (!def || !def.parts.length || reduceMotion || SC.effects === false) return;
    canvas = document.createElement('canvas'); canvas.id = 'jc-seasonal-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:999;';
    document.body.appendChild(canvas); ctx = canvas.getContext('2d'); resize();
    var base = Math.max(18, Math.min(90, Math.round((W * H) / 22000)));
    def.parts.forEach(function (pt) { for (var i = 0; i < Math.round(base * pt[1]); i++) particles.push(make(pt[0], true)); });
    lastT = 0; raf = requestAnimationFrame(frame);
  }
  function stopEffects() {
    if (raf) cancelAnimationFrame(raf); raf = 0; particles = [];
    var c = document.getElementById('jc-seasonal-canvas'); if (c) c.remove(); canvas = null;
  }
  window.addEventListener('resize', resize);

  /* ---------- themed movie row on Home ---------- */
  var rowCache = {}, rowBusy = false, rowUid = null;
  function uidNow() { var a = window.ApiClient; return a && a.getCurrentUserId && a.getCurrentUserId(); }
  // drop every cached row and every row on screen when a different user signs in
  function checkUser() {
    var u = uidNow();
    if (u !== rowUid) {
      rowUid = u; rowCache = {}; libCache = {};
      document.querySelectorAll('.jc-seasonal-row, .jc-hmx').forEach(function (el) { el.remove(); });
    }
    return u;
  }
  function verify(uid, items) {
    var J = window.JellyCinema;
    if (J && J.verifyForUser) return J.verifyForUser(uid, items);
    var api = window.ApiClient;   // fallback when jellycinema-home.js isn't loaded: same check, done here
    return Promise.all((items || []).map(function (it) {
      return api.getItem(uid, it.Id).then(function () { return it; }, function () { return null; });
    })).then(function (r) { return r.filter(Boolean); });
  }
  function themeRowItems(uid, name) {
    var api = window.ApiClient, def = THEMES[name] && THEMES[name].row; if (!api || !uid || !def) return Promise.resolve([]);
    var url = api.getUrl('Users/' + uid + '/Items', {
      Recursive: true, IncludeItemTypes: 'Movie', Tags: def.tags.join('|'), SortBy: 'Random', Limit: 30,
      Fields: 'PrimaryImageAspectRatio', ImageTypeLimit: 1, EnableImageTypes: 'Primary'
    });
    return api.getJSON(url).then(function (r) { return verify(uid, (r && r.Items) || []); });
  }
  // watched check / number of unwatched episodes or titles, the same badges Jellyfin puts on its own posters
  function addIndicators(box, it) {
    var ud = it && it.UserData; if (!ud) return;
    var n = ud.UnplayedItemCount, html = '';
    if (n > 0 && /^(Series|Season|BoxSet|Folder|CollectionFolder)$/.test(it.Type || '')) html = '<div class="countIndicator indicator">' + (n > 99 ? '99+' : n) + '</div>';
    else if (ud.Played) html = '<div class="playedIndicator indicator"><span class="material-icons indicatorIcon check" aria-hidden="true"></span></div>';
    if (!html) return;
    var d = document.createElement('div'); d.className = 'cardIndicators jc-indicators'; d.innerHTML = html;
    box.appendChild(d);
  }
  // poster with Jellyfin's round play button on top (shown on hover / remote highlight; plays right away)
  function withPlay(img, it) {
    var box = document.createElement('span'); box.className = 'jc-pic';
    var pl = document.createElement('span'); pl.className = 'jc-play'; pl.title = 'Play'; pl.setAttribute('aria-hidden', 'true');
    pl.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5.5v13l10.5-6.5z"/></svg>';
    pl.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      if (typeof window.JellyCinemaPlay !== 'function' || !window.JellyCinemaPlay(it)) window.location.hash = e.currentTarget.closest('a').getAttribute('href');
    });
    box.appendChild(img); box.appendChild(pl);
    addIndicators(box, it);
    // the poster's link remembers its title, so the remote's Play key can start it (jellycinema-home.js)
    setTimeout(function () { var a = box.closest('a'); if (a) a._jcItem = it; }, 0);
    return box;
  }
  var css = document.createElement('style');
  css.textContent =
    '.jc-seasonal-row .jc-scroll{display:flex;gap:14px;overflow-x:auto;padding:4px 3.3% 12px;scroll-snap-type:x proximity;scrollbar-width:thin}' +
    '.jc-seasonal-row .jc-card{flex:0 0 auto;width:150px;scroll-snap-align:start;text-decoration:none;color:inherit}' +
    '.jc-seasonal-row .jc-card img{width:150px;height:225px;object-fit:cover;border-radius:10px;display:block;background:rgba(255,255,255,.06);transition:transform .15s}' +
    '.jc-seasonal-row .jc-card:hover img,.jc-seasonal-row .jc-card:focus img{transform:scale(1.04)}' +
    '.jc-seasonal-row .jc-pic{position:relative;display:block}' +
    '.jc-seasonal-row .jc-play{position:absolute;left:50%;top:50%;z-index:2;width:clamp(36px,32%,56px);aspect-ratio:1;border-radius:50%;transform:translate(-50%,-50%);' +
    'display:flex;align-items:center;justify-content:center;color:#fff;cursor:pointer;opacity:0;transition:opacity .15s ease,background .15s ease;' +
    'background:color-mix(in srgb,var(--accentColor,#e0262b) 55%,transparent)}' +
    '.jc-seasonal-row .jc-play svg{width:55%;height:55%}' +
    '.jc-seasonal-row .jc-card:hover .jc-play,.jc-seasonal-row .jc-card:focus .jc-play{opacity:1}' +
    '.jc-seasonal-row .jc-play:hover{background:var(--accentColor,#e0262b)}' +
    '.jc-seasonal-row .jc-indicators{position:absolute;top:.35em;right:.35em;z-index:3;display:flex;gap:.25em;pointer-events:none}' +
    '.jc-seasonal-row .jc-name{font-size:.85em;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '@media (max-width:600px){.jc-seasonal-row .jc-card{width:110px}.jc-seasonal-row .jc-card img{width:110px;height:165px}}';
  document.head.appendChild(css);

  function onHome() { var h = location.hash || ''; return h === '' || /^#\/?(home|home\.html)?(\?|$)/.test(h); }

  function fetchRow(name) {
    var uid = checkUser(); if (!uid) return Promise.resolve(null);
    if (rowCache[name]) return Promise.resolve(rowCache[name]);
    return themeRowItems(uid, name).then(function (items) {
      if (uid !== rowUid) return null;
      rowCache[name] = items; return items;
    });
  }

  function ensureRow() {
    var name = active, def = THEMES[name] && THEMES[name].row;
    var containers = document.querySelectorAll('.homeSectionsContainer');
    document.querySelectorAll('.jc-seasonal-row').forEach(function (el) { if (!def || el.getAttribute('data-theme') !== name || !onHome()) el.remove(); });
    if (!def || !onHome() || rowBusy) return;
    var host = null;
    containers.forEach(function (c) { if (c.offsetParent !== null) host = c; });
    if (!host || host.querySelector('.jc-seasonal-row')) return;
    rowBusy = true;
    fetchRow(name).then(function (items) {
      rowBusy = false;
      if (!items || !items.length || host.querySelector('.jc-seasonal-row') || active !== name || uidNow() !== rowUid) return;
      var api = window.ApiClient, sid = api.serverId();
      var sec = document.createElement('div');
      sec.className = 'verticalSection jc-seasonal-row'; sec.setAttribute('data-theme', name);
      var head = document.createElement('div'); head.className = 'sectionTitleContainer sectionTitleContainer-cards padded-left';
      var h2 = document.createElement('h2'); h2.className = 'sectionTitle sectionTitle-cards'; h2.textContent = def.icon + ' ' + T(def.title);
      head.appendChild(h2); sec.appendChild(head);
      var sc = document.createElement('div'); sc.className = 'jc-scroll';
      items.forEach(function (it) {
        var a = document.createElement('a'); a.className = 'jc-card'; a.setAttribute('data-id', it.Id); a.href = '#/details?id=' + it.Id + '&serverId=' + sid; a.title = it.Name;
        var img = document.createElement('img'); img.loading = 'lazy'; img.alt = it.Name;
        if (it.ImageTags && it.ImageTags.Primary) img.src = api.getScaledImageUrl(it.Id, { type: 'Primary', maxHeight: 360, tag: it.ImageTags.Primary });
        var n = document.createElement('div'); n.className = 'jc-name'; n.textContent = it.Name;
        a.appendChild(withPlay(img, it)); a.appendChild(n); sc.appendChild(a);
      });
      sec.appendChild(sc);
      // place it just after "My Media" (or at the top if that row is hidden)
      var my = host.querySelector('.MyMedia');
      if (my && my.parentNode === host) host.insertBefore(sec, my.nextSibling); else host.insertBefore(sec, host.firstChild);
    }, function () { rowBusy = false; });
  }

  /* ---------- library rows (seasons.libraryRows) ----------
     Rows from one library for a date range, set up in the server's own settings, e.g.
     { title: '<name> Christmas', icon: '❄️', library: '<library name>', tags: [...], nameContains: 'Christmas',
       from: 'thanksgiving', to: '12-25', alsoWhenPreviewing: ['christmas'] }.
     Only built from a library the viewer can open (no access = no row), so it never shows anyone
     titles from a library they can't see. Titles = tagged with one of the tags, or with nameContains in the name.
     Every title is then checked once more as the viewer. */
  var LIBROWS = (Array.isArray(SC.libraryRows) ? SC.libraryRows : []).filter(function (r) { return r && r.title && r.library && r.from && r.to; });
  var libCache = {}, libBusy = {}, autoCache = {};
  function libSeason(r, now) {
    var p = preview(); if (p && (r.alsoWhenPreviewing || []).indexOf(p) >= 0) return true;
    return inRange(day0(now), r.from, r.to);
  }
  var hmxCss = document.createElement('style');
  hmxCss.textContent = css.textContent.replace(/\.jc-seasonal-row/g, '.jc-hmx');
  document.head.appendChild(hmxCss);
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function libRowItems(uid, r) {
    var api = window.ApiClient; if (!api || !uid) return Promise.resolve([]);
    if (r.auto) return Promise.resolve(r.items || []);     // found (and checked) by autoLibRows
    return api.getJSON(api.getUrl('Users/' + uid + '/Views')).then(function (v) {
      var lib = ((v && v.Items) || []).filter(function (x) { return (x.Name || '').toLowerCase() === String(r.library).toLowerCase(); })[0];
      if (!lib) return [];               // viewer can't open this library
      var base = { ParentId: lib.Id, Recursive: true, IncludeItemTypes: 'Movie', Limit: 60, SortBy: 'Random',
                   Fields: 'PrimaryImageAspectRatio', ImageTypeLimit: 1, EnableImageTypes: 'Primary' };
      var qs = [];
      if (Array.isArray(r.tags) && r.tags.length) qs.push(api.getJSON(api.getUrl('Users/' + uid + '/Items', Object.assign({ Tags: r.tags.join('|') }, base))));
      if (r.nameContains) qs.push(api.getJSON(api.getUrl('Users/' + uid + '/Items', Object.assign({ SearchTerm: String(r.nameContains) }, base))));
      if (!qs.length) qs.push(api.getJSON(api.getUrl('Users/' + uid + '/Items', base)));
      return Promise.all(qs).then(function (res) {
        var seen = {}, out = [];
        res.forEach(function (x) { ((x && x.Items) || []).forEach(function (it) { if (!seen[it.Id]) { seen[it.Id] = 1; out.push(it); } }); });
        // library-folder queries can skip the rating limit: check every title as this user before showing it
        return verify(uid, shuffle(out).slice(0, 40));
      });
    });
  }

  /* ---------- holiday rows for holiday-heavy libraries (same as the Jelly Cinema TV app) ----------
     From Thanksgiving to Dec 26, each library the viewer can open where at least 20% of the movies/shows
     (and at least 8 of them) are Christmas titles gets its own "❄️ <Library name> Christmas" row next to the
     main Christmas row. A Christmas title = has one of the Christmas row's tags, or "Christmas" in its name.
     So a library of Christmas TV movies gets its row and an ordinary Movies library doesn't. Nothing is named
     in the code: it works from each server's own libraries. A library that already has its own row in
     seasons.libraryRows is left to that row. Settings: seasons.autoLibraryRows (true/false),
     seasons.libraryRowShare (0.2), seasons.libraryRowMin (8). */
  var AUTO_LIB = SC.autoLibraryRows !== false;
  var AUTO_SHARE = typeof SC.libraryRowShare === 'number' ? SC.libraryRowShare : 0.2;
  var AUTO_MIN = typeof SC.libraryRowMin === 'number' ? SC.libraryRowMin : 8;
  var AUTO_SEASON = { from: 'thanksgiving', to: '12-26', alsoWhenPreviewing: ['christmas', 'thanksgiving'] };
  function autoLibRows(uid) {
    var api = window.ApiClient, def = THEMES.christmas && THEMES.christmas.row;
    if (!AUTO_LIB || !api || !uid || !def || !libSeason(AUTO_SEASON, new Date())) return Promise.resolve([]);
    if (autoCache[uid]) return autoCache[uid];
    var word = String(def.title).split(' ')[0] || 'Christmas';
    var taken = {}; LIBROWS.forEach(function (r) { taken[String(r.library).toLowerCase()] = 1; });
    var count = function (q) { return api.getJSON(api.getUrl('Users/' + uid + '/Items', q)).then(function (r) { return r || {}; }, function () { return {}; }); };
    autoCache[uid] = api.getJSON(api.getUrl('Users/' + uid + '/Views')).then(function (v) {
      var libs = ((v && v.Items) || []).filter(function (x) {
        var t = x.CollectionType; return (!t || t === 'movies' || t === 'tvshows' || t === 'homevideos') && !taken[(x.Name || '').toLowerCase()];
      });
      return Promise.all(libs.map(function (lib) {
        var base = { ParentId: lib.Id, Recursive: true, IncludeItemTypes: 'Movie,Series', EnableTotalRecordCount: true };
        var pics = { SortBy: 'Random', Limit: 40, Fields: 'PrimaryImageAspectRatio', ImageTypeLimit: 1, EnableImageTypes: 'Primary' };
        return count(Object.assign({ Limit: 0 }, base)).then(function (all) {
          var total = all.TotalRecordCount || 0;
          if (total < AUTO_MIN) return null;
          return Promise.all([count(Object.assign({ Tags: def.tags.join('|') }, base, pics)), count(Object.assign({ SearchTerm: word }, base, pics))]).then(function (res) {
            var matches = Math.max(res[0].TotalRecordCount || 0, res[1].TotalRecordCount || 0);
            if (matches < AUTO_MIN || matches < total * AUTO_SHARE) return null;
            var seen = {}, list = [];
            res.forEach(function (x) { (x.Items || []).forEach(function (it) { if (!seen[it.Id]) { seen[it.Id] = 1; list.push(it); } }); });
            return verify(uid, shuffle(list).slice(0, 40)).then(function (ok) {
              return ok.length ? { auto: true, key: 'a-' + lib.Id, title: def.title === 'Christmas Movies' ? T('{0} Christmas', (lib.Name || '').trim()) : (lib.Name || '').trim() + ' ' + word, icon: '❄️', items: ok,
                                   from: AUTO_SEASON.from, to: AUTO_SEASON.to, alsoWhenPreviewing: AUTO_SEASON.alsoWhenPreviewing } : null;
            });
          });
        }, function () { return null; });
      })).then(function (rows) { return rows.filter(Boolean); });
    }, function () { return []; });
    return autoCache[uid];
  }
  // every library row this viewer gets today: the ones set up in the settings, then the automatic ones
  function libRowsFor(uid) {
    var list = LIBROWS.map(function (r, i) { return Object.assign({ key: 'c' + i }, r); });
    return autoLibRows(uid).then(function (auto) { return list.concat(auto); }, function () { return list; });
  }

  function ensureLibRows() {
    var host = null;
    document.querySelectorAll('.homeSectionsContainer').forEach(function (c) { if (c.offsetParent !== null) host = c; });
    var uid = checkUser();
    if (!onHome() || !host || !uid) { if (!onHome()) document.querySelectorAll('.jc-hmx').forEach(function (el) { el.remove(); }); return; }
    if (libBusy.all) return;
    libBusy.all = true;
    libRowsFor(uid).then(function (rows) {
      libBusy.all = false;
      if (uid !== rowUid || !onHome()) return;
      var keep = {};
      rows.forEach(function (r) {
        var want = libSeason(r, new Date());
        if (want) keep[r.key] = 1;
        if (!want || libBusy[r.key] || host.querySelector('.jc-hmx[data-lib="' + r.key + '"]')) return;
        libBusy[r.key] = true;
        (libCache[r.key] ? Promise.resolve(libCache[r.key]) : libRowItems(uid, r)).then(function (items) {
          libBusy[r.key] = false;
          if (uid !== rowUid) return;
          libCache[r.key] = items;
          if (!items || !items.length || host.querySelector('.jc-hmx[data-lib="' + r.key + '"]')) return;
          var api = window.ApiClient, sid = api.serverId();
          var sec = document.createElement('div');
          sec.className = 'verticalSection jc-hmx'; sec.setAttribute('data-lib', r.key);
          var head = document.createElement('div'); head.className = 'sectionTitleContainer sectionTitleContainer-cards padded-left';
          var h2 = document.createElement('h2'); h2.className = 'sectionTitle sectionTitle-cards'; h2.textContent = (r.icon ? r.icon + ' ' : '') + r.title;
          head.appendChild(h2); sec.appendChild(head);
          var sc = document.createElement('div'); sc.className = 'jc-scroll';
          items.forEach(function (it) {
            var a = document.createElement('a'); a.className = 'jc-card'; a.setAttribute('data-id', it.Id);
            a.href = '#/details?id=' + it.Id + '&serverId=' + sid; a.title = it.Name;
            var img = document.createElement('img'); img.loading = 'lazy'; img.alt = it.Name;
            if (it.ImageTags && it.ImageTags.Primary) img.src = api.getScaledImageUrl(it.Id, { type: 'Primary', maxHeight: 360, tag: it.ImageTags.Primary });
            var n = document.createElement('div'); n.className = 'jc-name'; n.textContent = it.Name;
            a.appendChild(withPlay(img, it)); a.appendChild(n); sc.appendChild(a);
          });
          sec.appendChild(sc);
          // right after the themed row (and the library rows already placed), else after My Media, else at the top
          var placed = host.querySelectorAll('.jc-hmx');
          var after = placed.length ? placed[placed.length - 1] : (host.querySelector('.jc-seasonal-row') || host.querySelector('.MyMedia'));
          if (after && after.parentNode === host) host.insertBefore(sec, after.nextSibling); else host.insertBefore(sec, host.firstChild);
        }, function () { libBusy[r.key] = false; });
      });
      host.querySelectorAll('.jc-hmx').forEach(function (el) { if (!keep[el.getAttribute('data-lib')]) el.remove(); });
    }, function () { libBusy.all = false; });
  }
  var hmxTimer = 0;
  if (LIBROWS.length || AUTO_LIB) {
    new MutationObserver(function () { clearTimeout(hmxTimer); hmxTimer = setTimeout(ensureLibRows, 350); })
      .observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('hashchange', function () { setTimeout(ensureLibRows, 350); });
    setInterval(function () { autoCache = {}; ensureLibRows(); }, 60000 * 30);
    setInterval(ensureLibRows, 60000);
    setTimeout(ensureLibRows, 1500);
  }

  var obsTimer = 0;
  new MutationObserver(function () { clearTimeout(obsTimer); obsTimer = setTimeout(ensureRow, 300); })
    .observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('hashchange', function () { setTimeout(ensureRow, 300); });

  /* ---------- switching ---------- */
  function apply(force) {
    var name = currentTheme();
    if (!force && name === active && (name === 'plain' || document.getElementById('jc-seasonal-canvas') || reduceMotion)) { ensureRow(); return; }
    active = name; document.documentElement.setAttribute('data-jc-theme', name);
    startEffects(name); ensureRow();
  }
  function scheduleMidnight() {
    var n = new Date(), next = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 0, 0, 2);
    setTimeout(function () { apply(); scheduleMidnight(); }, next - n);
  }

  window.JellyCinemaSeasonal = {
    themeFor: themeFor, current: function () { return active; }, themes: Object.keys(THEMES),
    // for JellyCinema.checkAllUsers(): the seasonal rows a given user would see today
    rowsForUser: function (uid) {
      var out = [], name = currentTheme(), jobs = [];
      if (THEMES[name] && THEMES[name].row) jobs.push(themeRowItems(uid, name).then(function (it) { out.push({ row: THEMES[name].row.title, items: it }); }));
      jobs.push(libRowsFor(uid).then(function (rows) {
        return Promise.all(rows.filter(function (r) { return libSeason(r, new Date()); }).map(function (r) {
          return libRowItems(uid, r).then(function (it) { out.push({ row: r.title, items: it }); });
        }));
      }));
      return Promise.all(jobs).then(function () { return out; }, function () { return out; });
    },
    preview: function (n) { if (!THEMES[n]) return 'unknown theme: ' + n; try { localStorage.setItem(PREVIEW_KEY, n); } catch (e) {} apply(true); return 'previewing ' + n; },
    clear: function () { try { localStorage.removeItem(PREVIEW_KEY); } catch (e) {} apply(true); return 'back to calendar: ' + active; }
  };

  function boot() { apply(true); scheduleMidnight(); setInterval(function () { apply(false); }, 60000); }
  if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
