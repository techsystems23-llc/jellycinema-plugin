/* Jelly Cinema: the words it shows, in the viewer's language. Uses the language picked in Jellyfin
   (Settings > Display > Display language), else the browser's language; English when there's no translation.
   Shared by all the Jelly Cinema scripts as JellyCinemaT('Because You Watched {0}', name). Row titles typed on the
   settings page are only translated while they still read exactly like the English defaults. */
(function () {
  if (window.JellyCinemaT) return;
  var L = {"es":{"Because You Watched {0}":"Porque viste {0}","{0} Movies":"Películas de {0}","Collections":"Colecciones","Watch Again":"Volver a ver","Top 10 Movies This Week":"Top 10 películas de la semana","Top 10 Shows This Week":"Top 10 series de la semana","{0} Picks":"Selección de {0}","Play":"Reproducir","Resume":"Reanudar","More information":"Más información","Favorite":"Favorito","Play album":"Reproducir álbum","Play artist":"Reproducir artista","Play playlist":"Reproducir lista","Play song":"Reproducir canción","Play collection":"Reproducir colección","Halloween Movies":"Películas de Halloween","Christmas Movies":"Películas de Navidad","Easter Movies":"Películas de Pascua","{0} Christmas":"{0}: Navidad","Pause slideshow":"Pausar presentación","Resume slideshow":"Reanudar presentación","Sound":"Sonido","Previous":"Anterior","Next":"Siguiente","Featured":"Destacados"},"fr":{"Because You Watched {0}":"Parce que vous avez regardé {0}","{0} Movies":"Films : {0}","Collections":"Collections","Watch Again":"À revoir","Top 10 Movies This Week":"Top 10 des films de la semaine","Top 10 Shows This Week":"Top 10 des séries de la semaine","{0} Picks":"Sélection {0}","Play":"Lecture","Resume":"Reprendre","More information":"Plus d'informations","Favorite":"Favori","Play album":"Lire l'album","Play artist":"Lire l'artiste","Play playlist":"Lire la playlist","Play song":"Lire le titre","Play collection":"Lire la collection","Halloween Movies":"Films d'Halloween","Christmas Movies":"Films de Noël","Easter Movies":"Films de Pâques","{0} Christmas":"{0} – Noël","Pause slideshow":"Mettre le diaporama en pause","Resume slideshow":"Reprendre le diaporama","Sound":"Son","Previous":"Précédent","Next":"Suivant","Featured":"À la une"},"de":{"Because You Watched {0}":"Weil du {0} gesehen hast","{0} Movies":"Filme: {0}","Collections":"Sammlungen","Watch Again":"Nochmal ansehen","Top 10 Movies This Week":"Top 10 Filme der Woche","Top 10 Shows This Week":"Top 10 Serien der Woche","{0} Picks":"{0} empfiehlt","Play":"Abspielen","Resume":"Fortsetzen","More information":"Weitere Informationen","Favorite":"Favorit","Play album":"Album abspielen","Play artist":"Künstler abspielen","Play playlist":"Playlist abspielen","Play song":"Titel abspielen","Play collection":"Sammlung abspielen","Halloween Movies":"Halloween-Filme","Christmas Movies":"Weihnachtsfilme","Easter Movies":"Osterfilme","{0} Christmas":"{0} – Weihnachten","Pause slideshow":"Diashow anhalten","Resume slideshow":"Diashow fortsetzen","Sound":"Ton","Previous":"Zurück","Next":"Weiter","Featured":"Empfohlen"},"it":{"Because You Watched {0}":"Perché hai guardato {0}","{0} Movies":"Film: {0}","Collections":"Collezioni","Watch Again":"Guarda di nuovo","Top 10 Movies This Week":"Top 10 film della settimana","Top 10 Shows This Week":"Top 10 serie della settimana","{0} Picks":"Scelti da {0}","Play":"Riproduci","Resume":"Riprendi","More information":"Altre informazioni","Favorite":"Preferito","Play album":"Riproduci album","Play artist":"Riproduci artista","Play playlist":"Riproduci playlist","Play song":"Riproduci brano","Play collection":"Riproduci raccolta","Halloween Movies":"Film di Halloween","Christmas Movies":"Film di Natale","Easter Movies":"Film di Pasqua","{0} Christmas":"{0} – Natale","Pause slideshow":"Metti in pausa la presentazione","Resume slideshow":"Riprendi la presentazione","Sound":"Audio","Previous":"Precedente","Next":"Successivo","Featured":"In evidenza"},"pt":{"Because You Watched {0}":"Porque você assistiu {0}","{0} Movies":"Filmes de {0}","Collections":"Coleções","Watch Again":"Assistir novamente","Top 10 Movies This Week":"Top 10 filmes da semana","Top 10 Shows This Week":"Top 10 séries da semana","{0} Picks":"Escolhas de {0}","Play":"Reproduzir","Resume":"Retomar","More information":"Mais informações","Favorite":"Favorito","Play album":"Reproduzir álbum","Play artist":"Reproduzir artista","Play playlist":"Reproduzir playlist","Play song":"Reproduzir música","Play collection":"Reproduzir coleção","Halloween Movies":"Filmes de Halloween","Christmas Movies":"Filmes de Natal","Easter Movies":"Filmes de Páscoa","{0} Christmas":"{0} – Natal","Pause slideshow":"Pausar apresentação","Resume slideshow":"Retomar apresentação","Sound":"Som","Previous":"Anterior","Next":"Seguinte","Featured":"Destaques"},"nl":{"Because You Watched {0}":"Omdat je {0} hebt gekeken","{0} Movies":"Films: {0}","Collections":"Collecties","Watch Again":"Opnieuw kijken","Top 10 Movies This Week":"Top 10 films van deze week","Top 10 Shows This Week":"Top 10 series van deze week","{0} Picks":"{0} tips","Play":"Afspelen","Resume":"Hervatten","More information":"Meer informatie","Favorite":"Favoriet","Play album":"Album afspelen","Play artist":"Artiest afspelen","Play playlist":"Afspeellijst afspelen","Play song":"Nummer afspelen","Play collection":"Collectie afspelen","Halloween Movies":"Halloweenfilms","Christmas Movies":"Kerstfilms","Easter Movies":"Paasfilms","{0} Christmas":"{0} – Kerst","Pause slideshow":"Diavoorstelling pauzeren","Resume slideshow":"Diavoorstelling hervatten","Sound":"Geluid","Previous":"Vorige","Next":"Volgende","Featured":"Uitgelicht"}};
  function lang() {
    var l = '';
    try { l = (document.documentElement.getAttribute('lang') || '') || (localStorage.getItem('language') || '') || navigator.language || ''; } catch (e) { l = navigator.language || ''; }
    return String(l).toLowerCase().slice(0, 2);
  }
  window.JellyCinemaT = function (text) {
    var d = L[lang()], s = (d && d[text]) || text, args = arguments;
    return s.replace(/\{(\d)\}/g, function (m, i) { return args[+i + 1] == null ? '' : String(args[+i + 1]); });
  };
  window.JellyCinemaT.languages = ['en'].concat(Object.keys(L));
})();

/* Jelly Cinema: hero banner (the big slideshow at the top of Home).
   Used when the Media Bar plugin is NOT installed, so Jelly Cinema needs no other plugin. When Media Bar is
   installed, Media Bar draws the banner and this part stays off (nothing changes on those servers).
   Settings: banner.hero.* in jellycinema.config.js (banner.hero.enabled = false turns it off).
   PERMISSIONS: titles are loaded as the signed-in user and every one is checked again with
   JellyCinema.verifyForUser before it becomes a slide; slides are rebuilt when a different person signs in.
   It offers the same small interface Media Bar does (window.slideshowPure), so the rest of Jelly Cinema
   (banner follows selection, Theater Mode, trailer fallback, pinned banner, permission checks) works unchanged.
   Remote / keyboard: Down from the banner goes to the first row, Up from the first row comes back to the banner,
   Left / Right move between the banner's buttons (and to the previous / next title at either end).
   Debug from the browser console:  JellyCinemaHero.refresh()  /  JellyCinemaHero.items()  /  JellyCinemaHero.go(3) */
(function () {
  var T = function () { return window.JellyCinemaT.apply(null, arguments); };
  'use strict';
  var JC_BASE = (function () { var m = document.currentScript && document.currentScript.src || '', i = m.indexOf('/JellyCinema/'); return i >= 0 ? m.slice(0, i) : ''; })();
  var CFG = window.JellyCinemaConfig || {};
  function cfg(path, dflt) {
    var o = CFG, k = path.split('.');
    for (var i = 0; i < k.length; i++) { if (o == null || typeof o !== 'object' || !(k[i] in o)) return dflt; o = o[k[i]]; }
    return o == null ? dflt : o;
  }

  /* ---------- Play from the banner, on any server ----------
     Media Bar starts playback by sending this browser a remote "play" command, which only works while the
     server's live connection (web socket) is up. When it isn't (some setups, some TV boxes), open the title's
     page and press its own Play / Resume button instead. Also used by "banner follows selection". */
  var AUTO_KEY = 'jc.autoplay';
  function pressPlayOnDetails() {
    var job; try { job = JSON.parse(sessionStorage.getItem(AUTO_KEY) || 'null'); } catch (e) { job = null; }
    if (!job || Date.now() - job.at > 20000) return;
    if ((window.location.hash || '').indexOf(job.id) < 0) return;
    var n = 0, seen = 0;
    (function look() {
      var page = document.querySelector('#itemDetailPage:not(.hide), .itemDetailPage:not(.hide)') || document;
      var resume = job.resume && page.querySelector('.btnResume:not(.hide)');
      var btn = resume || page.querySelector('.mainDetailButtons .btnPlay:not(.hide), .detailPagePrimaryContainer .btnPlay:not(.hide), .btnPlay:not(.hide)');
      var named = page.querySelector('.itemName, .nameContainer h1, h1.itemName, .parentName');
      // wait until the page shows this title (its name is filled in) and the button has been there a moment
      if (btn && btn.offsetParent !== null && (!named || named.textContent.trim())) seen++; else seen = 0;
      if (seen >= 3) {
        try { sessionStorage.removeItem(AUTO_KEY); } catch (e) {}
        btn.click();
        return;
      }
      if (++n < 40) setTimeout(look, 250);
    })();
  }
  window.addEventListener('hashchange', function () { setTimeout(pressPlayOnDetails, 300); });
  // item: a title as loaded from the server (Episode, Movie, ...). Returns true when it was handled.
  window.JellyCinemaPlay = function (item) {
    var c = window.ApiClient;
    if (!c || !item || !item.Id) return false;
    var pos = item.UserData && item.UserData.PlaybackPositionTicks;
    var socketUp = typeof c.isWebSocketOpen === 'function' ? c.isWebSocketOpen() : true;
    if (socketUp) {
      return c.getSessions({ deviceId: c.deviceId() }).then(function (list) {
        var s = (list || []).filter(function (x) { return x.DeviceId === c.deviceId(); })[0];
        if (!s) throw new Error('no session');
        var q = { playCommand: 'PlayNow', itemIds: item.Id };
        if (pos && pos > 0) q.startPositionTicks = pos;
        return c.ajax({ type: 'POST', url: c.getUrl('Sessions/' + s.Id + '/Playing', q) });
      }).catch(function () { viaDetails(); }), true;
    }
    viaDetails();
    return true;
    function viaDetails() {
      try { sessionStorage.setItem(AUTO_KEY, JSON.stringify({ id: item.Id, at: Date.now(), resume: !!(pos && pos > 0) })); } catch (e) {}
      window.location.hash = '#/details?id=' + encodeURIComponent(item.Id) + '&serverId=' + encodeURIComponent(c.serverId());
    }
  };

  if (cfg('banner.hero.enabled', true) === false) return;

  function num(v, d, lo, hi) { v = Number(v); return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; }
  function cssLen(v, d) { return /^[0-9.]+(vh|px|rem|em|%)$/.test(String(v)) ? String(v) : d; }
  // a long rotation (at least 50, like the TV app) of titles that have a trailer
  var MAX_ITEMS = Math.max(num(cfg('banner.hero.maxItems', 50), 50, 1, 100), num(cfg('banner.hero.minRotation', 50), 50, 1, 100));
  var SLIDE_MS = num(cfg('banner.hero.slideSeconds', 10), 10, 3, 120) * 1000;
  var TRAILER_MAX_MS = num(cfg('banner.trailerMaxSeconds', 45), 45, 5, 600) * 1000;
  var TRAILERS = cfg('banner.hero.trailers', true) !== false;
  var TRAILER_DELAY_MS = num(cfg('banner.hero.trailerDelaySeconds', 4), 4, 0, 60) * 1000;
  var SKIP_WATCHED = cfg('banner.hero.skipWatched', false) === true;
  var HEIGHT = cssLen(cfg('banner.hero.height', '88vh'), '88vh');
  var TYPES = String(cfg('banner.hero.types', 'Movie,Series')).split(',').map(function (s) { return s.trim(); })
    .filter(function (s) { return /^(Movie|Series|MusicAlbum|BoxSet)$/.test(s); });
  if (!TYPES.length) TYPES = ['Movie', 'Series'];
  var LIBRARIES = String(cfg('banner.hero.libraries', '') || '').split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);

  function mediaBarPresent() {
    return !!document.querySelector('script[src*="slideshowpure" i], link[href*="slideshowpure" i]') ||
      !!(window.slideshowPure && !window.slideshowPure.__jellyCinema);
  }

  function start() {
    if (mediaBarPresent() || document.getElementById('slides-container')) return;   // Media Bar draws the banner
    init();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  function init() {
    var STATE = { slideshow: {
      currentSlideIndex: 0, totalItems: 0, itemIds: [], loadedItems: {}, createdSlides: {}, players: {}, slideVideoIds: {},
      isPaused: false, isTransitioning: false, isLoading: true, isVideoPlaying: false,
      slideInterval: { stop: function () {}, start: function () {} }   // tells the Media Bar auto-advance helper to stand down
    } };
    var S = STATE.slideshow;
    var uid = null, gen = 0, slideStart = Date.now(), trailerTimer = null, muted = true;
    var cont = null;

    function client() { return window.ApiClient; }
    function onHomeHash() { return /^#\/home(\.html)?(\?|$)/.test(window.location.hash || ''); }
    function homeTabActive() {
      var t = document.querySelector('.emby-tab-button-active');
      return t ? t.getAttribute('data-index') === '0' : true;
    }
    function jc() { return window.JellyCinema || {}; }

    /* ---------- styles ---------- */
    var css = [
      ':root{--jc-hero-h:' + HEIGHT + '}',
      '#slides-container.jc-hero{position:absolute;top:0;left:0;width:100%;height:var(--jc-hero-h);overflow:hidden;z-index:1;',
      '  background:transparent;display:none;font-family:inherit}',
      'html.jc-hero-on #slides-container.jc-hero{display:block}',
      'body.jc-theater #slides-container.jc-hero{height:100vh!important}',
      /* Jelly Cinema logo, top right of the banner (under the header buttons; in the corner in Theater Mode) */
      '.jc-hero .jc-brand{position:absolute;top:calc(var(--jc-head,64px) + 1.6vh);right:3.3vw;height:clamp(22px,3.4vh,42px);width:auto;z-index:7;',
      '  pointer-events:none;filter:drop-shadow(0 2px 8px rgba(0,0,0,.65));transition:top .9s ease,right .9s ease}',
      'body.jc-theater .jc-hero .jc-brand{top:4.2vh;right:3vw}',
      /* the home page sits on top of the banner: let the banner show through */
      'html.jc-hero-on #indexPage,html.jc-hero-on #indexPage .tabContent,html.jc-hero-on .backgroundContainer.withBackdrop{background:transparent!important}',
      'html.jc-hero-on #indexPage .homeSectionsContainer{position:relative;z-index:6}',
      'html.jc-hero-on .skinHeader{background:linear-gradient(to bottom,rgba(8,10,14,.85),rgba(8,10,14,0))!important;box-shadow:none!important}',
      'html.jc-hero-on body.jc-scrolled .skinHeader{background:rgba(8,10,14,.92)!important}',
      /* slides */
      '.jc-hero .slide{position:absolute;inset:0;opacity:0;visibility:hidden;transition:opacity .9s ease,visibility 0s linear .9s}',
      '.jc-hero .slide.active{opacity:1;visibility:visible;transition:opacity .9s ease,visibility 0s}',
      '.jc-hero .backdrop-container{position:absolute;inset:0;overflow:hidden}',
      '.jc-hero img.backdrop{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 22%;transform:scale(1.02);',
      '  transition:opacity .8s ease}',
      '.jc-hero img.backdrop.animate{animation:jcHeroKen 24s ease-out forwards}',
      '@keyframes jcHeroKen{from{transform:scale(1.02)}to{transform:scale(1.1)}}',
      '.jc-hero .backdrop-overlay{position:absolute;inset:0;pointer-events:none;',
      '  background:linear-gradient(90deg,rgba(8,10,14,.92) 0%,rgba(8,10,14,.72) 26%,rgba(8,10,14,.18) 58%,rgba(8,10,14,0) 75%)}',
      '.jc-hero .gradient-overlay{position:absolute;left:0;right:0;bottom:0;height:46%;pointer-events:none;',
      '  background:linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,.35) 100%)}',
      /* the picture fades out at the bottom into whatever background the theme uses */
      '.jc-hero .backdrop-container,.jc-hero .video-container,.jc-hero .backdrop-overlay,.jc-hero .gradient-overlay{',
      '  -webkit-mask-image:linear-gradient(to bottom,#000 0,#000 58%,rgba(0,0,0,.55) 80%,transparent 100%);',
      '  mask-image:linear-gradient(to bottom,#000 0,#000 58%,rgba(0,0,0,.55) 80%,transparent 100%)}',
      'body.jc-theater .jc-hero .backdrop-container,body.jc-theater .jc-hero .video-container,body.jc-theater .jc-hero .backdrop-overlay,',
      'body.jc-theater .jc-hero .gradient-overlay{-webkit-mask-image:none;mask-image:none}',
      'body.jc-theater .jc-hero .gradient-overlay{background:linear-gradient(to bottom,rgba(0,0,0,0) 40%,rgba(0,0,0,.7) 100%)}',
      /* fade a picture in once it has loaded, instead of popping in */
      '.jc-hero img.backdrop.jc-wait{opacity:0}',
      '.jc-hero .video-container{position:absolute;inset:0;opacity:0;transition:opacity 1.2s ease;pointer-events:none;overflow:hidden}',
      '.jc-hero .slide.jc-video-on .video-container{opacity:1}',
      '.jc-hero .slide.jc-video-on img.backdrop{opacity:0}',
      '.jc-hero .slide.jc-video-on .backdrop-overlay{opacity:.85}',
      /* the trailer fills the banner (16:9 cover) */
      '.jc-hero .video-container iframe,.jc-hero .video-container video{position:absolute;top:50%;left:50%;border:0;',
      '  width:max(100%,calc(var(--jc-hero-h) * 16 / 9));height:max(100%,calc(100vw * 9 / 16));transform:translate(-50%,-50%) scale(1.18)}',
      'body.jc-theater .jc-hero .video-container iframe,body.jc-theater .jc-hero .video-container video{width:max(100%,calc(100vh * 16 / 9))}',
      /* Sharp YouTube trailers: YouTube picks quality from the player's size in web pixels, so a TV-sized page got 480p
         stretched (pixelated). Draw the player at least 1920 pixels wide and shrink it back: YouTube sends 1080p (same fix as the TV app). */
      '.jc-hero .video-container iframe{width:calc(max(100%,calc(var(--jc-hero-h) * 16 / 9)) * var(--jc-yt-k,1));',
      '  height:calc(max(100%,calc(100vw * 9 / 16)) * var(--jc-yt-k,1));transform:translate(-50%,-50%) scale(calc(1.18 / var(--jc-yt-k,1)))}',
      'body.jc-theater .jc-hero .video-container iframe{width:calc(max(100%,calc(100vh * 16 / 9)) * var(--jc-yt-k,1));height:calc(max(100%,calc(100vw * 9 / 16)) * var(--jc-yt-k,1))}',
      /* text block */
      '.jc-hero .slide-content{position:absolute;left:4.2vw;bottom:calc(var(--jc-hero-h) * .25);width:min(46vw,780px);z-index:3;color:#fff}',
      'body.jc-theater .jc-hero .slide-content{bottom:12vh}',
      '.jc-hero .logo-container{min-height:6vh;display:flex;align-items:flex-end;margin-bottom:1.6vh}',
      '.jc-hero img.logo{max-width:min(32vw,520px);max-height:17vh;object-fit:contain;object-position:left bottom;',
      '  filter:drop-shadow(0 4px 18px rgba(0,0,0,.55))}',
      '.jc-hero .jc-title{font-size:clamp(28px,4.2vw,64px);font-weight:800;line-height:1.05;color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.6);',
      '  max-width:42vw;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}',
      '.jc-hero .logo-container::after{content:"";display:none}',
      '.jc-hero .jc-rule{width:3.2vw;min-width:34px;height:2px;background:rgba(255,255,255,.55);margin:0 0 1.4vh}',
      '.jc-hero .info-container{display:flex;flex-wrap:wrap;align-items:center;gap:.25em .9em;font-size:clamp(11px,.82vw,15px);',
      '  letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.88);margin-bottom:1.3vh;font-variant-numeric:tabular-nums}',
      '.jc-hero .info-container .jc-sep{opacity:.45}',
      '.jc-hero .info-container .jc-star{color:#f5c518}',
      '.jc-hero .info-container .jc-tomato{display:inline-block;width:.8em;height:.8em;border-radius:50%;background:#fa320a;margin-right:.35em;vertical-align:-.05em}',
      '.jc-hero .info-container .jc-rated{border:1px solid rgba(255,255,255,.55);border-radius:3px;padding:.05em .45em;letter-spacing:.06em}',
      '.jc-hero .tagline{font-size:clamp(14px,1.05vw,19px);font-weight:600;color:#fff;margin-bottom:.8vh;',
      '  display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}',
      '.jc-hero .plot{font-size:clamp(13px,.98vw,18px);line-height:1.5;color:rgba(255,255,255,.82);',
      '  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-shadow:0 1px 6px rgba(0,0,0,.5)}',
      '.jc-hero .button-container{display:flex;align-items:center;gap:1vw;margin-top:2.6vh}',
      '.jc-hero .button-container button{font:inherit;cursor:pointer;border:0;outline:0;display:inline-flex;align-items:center;justify-content:center;',
      '  transition:transform .15s ease,background .2s ease,box-shadow .2s ease;-webkit-tap-highlight-color:transparent}',
      '.jc-hero .play-button{height:clamp(40px,3.2vw,56px);padding:0 2.2em 0 1.8em;border-radius:999px;background:rgba(255,255,255,.92);color:#111;',
      '  font-size:clamp(14px,1vw,18px);font-weight:700;gap:.55em}',
      '.jc-hero .play-button svg{width:1em;height:1em}',
      '.jc-hero .round-button{width:clamp(40px,3.2vw,56px);height:clamp(40px,3.2vw,56px);border-radius:50%;background:rgba(255,255,255,.08);',
      '  color:#fff;box-shadow:inset 0 0 0 2px rgba(255,255,255,.45)}',
      '.jc-hero .round-button svg{width:45%;height:45%}',
      '.jc-hero .favorite-button.jc-on{color:var(--accentColor,#e0262b)}',
      '.jc-hero .favorite-button.jc-on svg path{fill:currentColor}',
      /* hovered with the mouse or highlighted with the remote: exactly like the TV app's banner buttons —
         a little bigger with a red outline; Play turns solid white, the round buttons a bit brighter */
      '.jc-hero .button-container button:hover,.jc-hero .button-container button:focus-visible,.jc-hero .button-container button.jc-focus{transform:scale(1.08);',
      '  box-shadow:0 0 0 3px var(--highlightOutlineColor,#ff4d4f)}',
      '.jc-hero .play-button:hover,.jc-hero .play-button:focus-visible,.jc-hero .play-button.jc-focus{background:#fff}',
      '.jc-hero .round-button:hover,.jc-hero .round-button:focus-visible,.jc-hero .round-button.jc-focus{background:rgba(255,255,255,.24)}',
      /* dots, arrows, pause and sound */
      '.jc-hero .dots-container.jc-count{font-size:.85rem;letter-spacing:.08em;color:rgba(255,255,255,.75);gap:0}',
      '.jc-hero .dots-container{position:absolute;left:4.2vw;bottom:calc(var(--jc-hero-h) * .25 - 5vh);z-index:4;display:flex;gap:7px;align-items:center}',
      '.jc-hero .dot{width:7px;height:7px;border-radius:4px;background:rgba(255,255,255,.35);cursor:pointer;transition:width .35s ease,background .35s ease}',
      '.jc-hero .dot.active{width:26px;background:#fff}',
      '.jc-hero .arrow{position:absolute;top:45%;transform:translateY(-50%);z-index:5;width:44px;height:64px;border:0;border-radius:8px;cursor:pointer;',
      '  background:rgba(0,0,0,.25);color:#fff;opacity:0;transition:opacity .3s ease;display:flex;align-items:center;justify-content:center}',
      '.jc-hero .arrow svg{width:26px;height:26px}',
      '.jc-hero .left-arrow{left:10px}.jc-hero .right-arrow{right:10px}',
      '.jc-hero:hover .arrow{opacity:.8}.jc-hero .arrow:hover{opacity:1}',
      '.jc-hero .ss-chrome{position:absolute;bottom:calc(var(--jc-hero-h) * .25 - 5.6vh);z-index:5;width:34px;height:34px;border-radius:50%;border:0;cursor:pointer;',
      '  background:rgba(0,0,0,.35);color:#fff;display:flex;align-items:center;justify-content:center;opacity:.75;transition:opacity .2s ease}',
      '.jc-hero .ss-chrome:hover{opacity:1}.jc-hero .ss-chrome svg{width:18px;height:18px}',
      '.jc-hero .pause-button{right:4.2vw}.jc-hero .volume-toggle{right:calc(4.2vw + 44px)}',
      '.jc-hero .volume-toggle{display:none}.jc-hero.jc-trailer-on .volume-toggle{display:flex}',
      'html.layout-tv .jc-hero .arrow,html.layout-tv .jc-hero .ss-chrome{display:none!important}',
      '@media (max-width:760px){.jc-hero .slide-content{width:88vw}.jc-hero img.logo{max-width:70vw}.jc-hero .jc-title{max-width:88vw}',
      '  .jc-hero .backdrop-overlay{background:linear-gradient(0deg,rgba(8,10,14,.95) 0%,rgba(8,10,14,.5) 45%,rgba(8,10,14,0) 75%)}}',
      '@media (prefers-reduced-motion:reduce){.jc-hero img.backdrop.animate{animation:none}.jc-hero .slide{transition:none}}'
    ].join('\n');
    var st = document.createElement('style');
    st.id = 'jc-hero-style';
    st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
    /* ---------- helpers ---------- */
    var ICON = {
      play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/></svg>',
      info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" stroke-width="2"/><path fill="currentColor" d="M11 10.5h2V17h-2zM11 7h2v2h-2z"/></svg>',
      heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M12 20.3S3.5 15 3.5 8.9A4.4 4.4 0 0 1 12 6.9a4.4 4.4 0 0 1 8.5 2c0 6.1-8.5 11.4-8.5 11.4z"/></svg>',
      left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M15 5l-7 7 7 7"/></svg>',
      right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>',
      pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>',
      resume: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>',
      mute: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9h4l5-4v14l-5-4H4z"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M16.5 9.5l5 5M21.5 9.5l-5 5"/></svg>',
      sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9h4l5-4v14l-5-4H4z"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>'
    };
    function el(tag, cls, text) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.textContent = text;
      return e;
    }
    function button(cls, label, svg) {
      var b = el('button', cls);
      b.type = 'button';
      b.setAttribute('aria-label', label);
      b.title = label;
      b.innerHTML = svg;
      return b;
    }
    function imgUrl(id, path, tag, maxWidth) {
      var q = { quality: 85, maxWidth: maxWidth };
      if (tag) q.tag = tag;
      return client().getUrl('Items/' + id + '/Images/' + path, q);
    }
    function runtime(item) {
      if (item.Type === 'Series') return item.ChildCount ? item.ChildCount + (item.ChildCount === 1 ? ' Season' : ' Seasons') : '';
      var m = Math.round((item.RunTimeTicks || 0) / 600000000);
      if (!m) return '';
      return (m >= 60 ? Math.floor(m / 60) + 'h ' : '') + (m % 60 ? (m % 60) + 'm' : '').trim();
    }
    function playLabel(item) {
      var pos = item.UserData && item.UserData.PlaybackPositionTicks;
      return pos && pos > 0 ? T('Resume') : T('Play');
    }
    function getSessionId() {
      var c = client();
      return c.getSessions({ deviceId: c.deviceId() }).then(function (list) {
        var s = (list || []).filter(function (x) { return x.DeviceId === c.deviceId(); })[0];
        return s && s.Id;
      }).catch(function () { return null; });
    }
    // Series: play the next episode to watch (or the first one). Everything else: play / resume the title.
    function playTarget(item) {
      var c = client();
      if (item.Type !== 'Series') return Promise.resolve(item);
      return c.getJSON(c.getUrl('Shows/NextUp', { SeriesId: item.Id, UserId: uid, Limit: 1, Fields: 'UserData' })).then(function (r) {
        if (r && r.Items && r.Items[0]) return r.Items[0];
        return c.getJSON(c.getUrl('Shows/' + item.Id + '/Episodes', { UserId: uid, Limit: 1, Fields: 'UserData' })).then(function (e) { return (e.Items || [])[0] || item; });
      }).catch(function () { return item; });
    }
    function play(item) {
      playTarget(item).then(function (it) { if (it) window.JellyCinemaPlay(it); })
        .catch(function (e) { console.warn('JellyCinema banner: could not start playback', e); });
    }
    function details(item) {
      var c = client();
      window.location.hash = '#/details?id=' + encodeURIComponent(item.Id) + '&serverId=' + encodeURIComponent(c.serverId());
    }

    /* ---------- one slide ---------- */
    function createSlideElement(item) {
      var s = el('div', 'slide');
      s.setAttribute('data-item-id', item.Id);
      var bc = el('div', 'backdrop-container');
      var bd = el('img', 'backdrop');
      bd.alt = ''; bd.decoding = 'async'; bd.draggable = false;
      bd.classList.add('jc-wait');
      bd.onload = function () { bd.classList.remove('jc-wait'); };
      bd.onerror = function () { bd.classList.remove('jc-wait'); };
      var tags = item.ImageTags || {};
      var bt = item.BackdropImageTags && item.BackdropImageTags[0];
      if (bt) bd.src = imgUrl(item.Id, 'Backdrop/0', bt, 1920);
      else if (tags.Thumb) bd.src = imgUrl(item.Id, 'Thumb', tags.Thumb, 1920);
      else if (tags.Primary) { bd.src = imgUrl(item.Id, 'Primary', tags.Primary, 800); bd.classList.add('jc-poster-bg'); }
      bc.appendChild(bd);
      s.appendChild(bc);
      s.appendChild(el('div', 'video-container'));
      s.appendChild(el('div', 'backdrop-overlay'));
      s.appendChild(el('div', 'gradient-overlay'));

      var content = el('div', 'slide-content');
      var lc = el('div', 'logo-container');
      if (tags.Logo) {
        var lg = el('img', 'logo');
        lg.alt = item.Name || ''; lg.decoding = 'async'; lg.draggable = false;
        lg.src = imgUrl(item.Id, 'Logo', tags.Logo, 900);
        lg.onerror = function () { lc.innerHTML = ''; lc.appendChild(el('div', 'jc-title', item.Name || '')); };
        lc.appendChild(lg);
      } else {
        lc.appendChild(el('div', 'jc-title', item.Name || ''));
      }
      content.appendChild(lc);
      content.appendChild(el('div', 'jc-rule'));

      var info = el('div', 'info-container');
      var bits = [];
      if (item.ProductionYear) bits.push(el('span', '', String(item.ProductionYear)));
      if (item.CommunityRating) { var cr = el('span', ''); cr.appendChild(el('span', 'jc-star', '★ ')); cr.appendChild(document.createTextNode(Number(item.CommunityRating).toFixed(1))); bits.push(cr); }
      if (item.CriticRating) { var tm = el('span', ''); tm.appendChild(el('span', 'jc-tomato')); tm.appendChild(document.createTextNode(item.CriticRating + '%')); bits.push(tm); }
      var rt = runtime(item); if (rt) bits.push(el('span', '', rt));
      if (item.Genres && item.Genres.length) bits.push(el('span', 'genre', item.Genres.slice(0, 2).join(' · ')));
      if (item.OfficialRating) bits.push(el('span', 'jc-rated', item.OfficialRating));
      bits.forEach(function (b, i) { if (i) info.appendChild(el('span', 'jc-sep', '•')); info.appendChild(b); });
      if (bits.length) content.appendChild(info);

      var tl = item.Taglines && item.Taglines[0];
      if (tl) content.appendChild(el('div', 'tagline', tl));
      var pc = el('div', 'plot-container');
      pc.appendChild(el('div', 'plot', item.Overview || ''));
      content.appendChild(pc);

      var bcn = el('div', 'button-container');
      var pb = el('button', 'play-button');
      pb.type = 'button';
      pb.innerHTML = ICON.play;
      pb.appendChild(el('span', 'play-text', playLabel(item)));
      pb.onclick = function (e) { e.preventDefault(); e.stopPropagation(); play(item); };
      var db = button('detail-button round-button', T('More information'), ICON.info);
      db.onclick = function (e) { e.preventDefault(); e.stopPropagation(); details(item); };
      var fb = button('favorite-button round-button', T('Favorite'), ICON.heart);
      var fav = !!(item.UserData && item.UserData.IsFavorite);
      fb.classList.toggle('jc-on', fav);
      fb.setAttribute('aria-pressed', String(fav));
      fb.onclick = function (e) {
        e.preventDefault(); e.stopPropagation();
        var want = !fb.classList.contains('jc-on');
        client().updateFavoriteStatus(uid, item.Id, want).then(function () {
          fb.classList.toggle('jc-on', want); fb.setAttribute('aria-pressed', String(want));
          if (item.UserData) item.UserData.IsFavorite = want;
        }).catch(function () {});
      };
      bcn.appendChild(pb); bcn.appendChild(db); bcn.appendChild(fb);
      content.appendChild(bcn);
      s.appendChild(content);
      // buttons on slides that aren't showing can't be reached with Tab / the remote
      setTabbable(s, false);
      return { slide: s, backdrop: bd };
    }
    function setTabbable(slide, on) {
      slide.querySelectorAll('button').forEach(function (b) { b.tabIndex = on ? 0 : -1; });
    }

    /* ---------- trailers ---------- */
    function ytId(url) {
      try {
        var u = new URL(url), h = u.hostname.replace(/^www\./, '');
        if (h === 'youtu.be') return u.pathname.split('/')[1] || null;
        if (/(^|\.)youtube(-nocookie)?\.com$/.test(h)) {
          if (u.pathname.indexOf('/embed/') === 0) return u.pathname.split('/')[2] || null;
          return u.searchParams.get('v');
        }
      } catch (e) {}
      return null;
    }
    // first YouTube trailer (Jelly Cinema's trailer fallback wraps this to skip ones that refuse to play)
    function selectTrailerVideoId(remote) {
      var list = (remote || []).map(function (t) { return t && ytId(t.Url); }).filter(Boolean);
      return list[0] || null;
    }
    var ytReady = null;
    function loadYT() {
      if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
      if (ytReady) return ytReady;
      ytReady = new Promise(function (resolve, reject) {
        var prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = function () { if (typeof prev === 'function') try { prev(); } catch (e) {} resolve(window.YT); };
        var sc = document.createElement('script');
        sc.src = 'https://www.youtube.com/iframe_api';
        sc.async = true;
        sc.onerror = function () { ytReady = null; reject(new Error('YouTube unavailable')); };
        document.head.appendChild(sc);
        setTimeout(function () { if (!(window.YT && window.YT.Player)) reject(new Error('YouTube timeout')); }, 15000);
      });
      return ytReady;
    }
    function videoOn(itemId, on) {
      var sl = S.createdSlides[itemId];
      if (sl) sl.classList.toggle('jc-video-on', on);
      if (on && S.trailerPending === itemId) S.trailerPending = null;
      if (S.itemIds[S.currentSlideIndex] === itemId) {
        S.isVideoPlaying = on;
        if (cont) cont.classList.toggle('jc-trailer-on', on);
      }
    }
    function destroyPlayer(itemId) {
      var p = S.players[itemId];
      if (p) { try { p.destroy(); } catch (e) {} }
      delete S.players[itemId];
      if (S.trailerPending === itemId) S.trailerPending = null;
      var sl = S.createdSlides[itemId];
      if (sl) { sl.classList.remove('jc-video-on'); var vc = sl.querySelector('.video-container'); if (vc) vc.innerHTML = ''; }
      if (S.itemIds[S.currentSlideIndex] === itemId) { S.isVideoPlaying = false; if (cont) cont.classList.remove('jc-trailer-on'); }
    }
    function destroyAllPlayers() { Object.keys(S.players).forEach(destroyPlayer); }
    function localPlayer(video) {
      return {
        playVideo: function () { var p = video.play(); if (p && p.catch) p.catch(function () {}); },
        pauseVideo: function () { video.pause(); },
        mute: function () { video.muted = true; }, unMute: function () { video.muted = false; },
        isMuted: function () { return video.muted; },
        loadVideoById: function () {},
        destroy: function () { try { video.pause(); video.removeAttribute('src'); video.load(); } catch (e) {} video.remove(); }
      };
    }
    // YouTube starts blurry and sharpens within a second or two: keep the banner picture up until the
    // trailer is HD (720p or better), 3 seconds at most, so the trailer never appears pixelated
    function revealSharp(player, itemId) {
      var t0 = Date.now();
      (function check() {
        if (S.itemIds[S.currentSlideIndex] !== itemId || !S.players[itemId]) return;
        var q = ''; try { q = player.getPlaybackQuality ? player.getPlaybackQuality() : ''; } catch (x) {}
        if (/^(hd|highres)/.test(q) || Date.now() - t0 > 3000) { videoOn(itemId, true); return; }
        setTimeout(check, 250);
      })();
    }
    function startTrailer(itemId, myGen) {
      var item = S.loadedItems[itemId], sl = S.createdSlides[itemId];
      if (!item || !sl || myGen !== gen || S.players[itemId]) return;
      var vc = sl.querySelector('.video-container');
      var c = client();
      if (item.LocalTrailerCount > 0) {
        c.getJSON(c.getUrl('Users/' + uid + '/Items/' + item.Id + '/LocalTrailers')).then(function (list) {
          var t = (list || [])[0];
          if (!t || myGen !== gen || S.itemIds[S.currentSlideIndex] !== itemId) return;
          var v = document.createElement('video');
          v.muted = muted; v.playsInline = true; v.autoplay = true; v.preload = 'auto';
          v.src = c.getUrl('Videos/' + t.Id + '/stream', { static: true, api_key: c.accessToken() });
          v.addEventListener('playing', function () { videoOn(itemId, true); });
          v.addEventListener('ended', function () { if (S.itemIds[S.currentSlideIndex] === itemId) next(); });
          v.addEventListener('error', function () { api.SlideshowManager.onPlayerError({ data: 'local' }, itemId, vc); });
          vc.appendChild(v);
          S.slideVideoIds[itemId] = 'local:' + t.Id;
          S.players[itemId] = localPlayer(v);
          S.players[itemId].playVideo();
        }).catch(function () {});
        return;
      }
      var vid = api.SlideCreator.selectTrailerVideoId(item.RemoteTrailers);
      if (!vid) { if (S.trailerPending === itemId) S.trailerPending = null; return; }
      loadYT().then(function (YT) {
        if (myGen !== gen || S.itemIds[S.currentSlideIndex] !== itemId || S.players[itemId] || !visible()) return;
        var box = document.createElement('div');
        vc.appendChild(box);
        S.slideVideoIds[itemId] = vid;
        S.players[itemId] = new YT.Player(box, {
          videoId: vid,
          host: 'https://www.youtube-nocookie.com',
          playerVars: { autoplay: 1, mute: 1, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, modestbranding: 1, playsinline: 1, rel: 0, vq: 'hd1080', origin: location.origin },
          events: {
            onReady: function (e) { try { if (muted) e.target.mute(); else e.target.unMute(); if (e.target.setPlaybackQuality) e.target.setPlaybackQuality('hd1080'); e.target.playVideo(); } catch (x) {} },
            onStateChange: function (e) {
              if (e.data === 1) revealSharp(e.target, itemId);
              else if (e.data === 0 && S.itemIds[S.currentSlideIndex] === itemId) next();
            },
            onError: function (e) { api.SlideshowManager.onPlayerError(e, itemId, vc); }
          }
        });
      }).catch(function () { /* no YouTube (blocked or offline): the backdrop simply stays */ if (S.trailerPending === itemId) S.trailerPending = null; });
    }
    function scheduleTrailer(itemId) {
      clearTimeout(trailerTimer);
      S.trailerPending = null;
      if (!TRAILERS) return;
      var item = S.loadedItems[itemId];
      if (!item || !((item.RemoteTrailers && item.RemoteTrailers.length) || item.LocalTrailerCount > 0)) return;
      // the slide waits a while for its trailer to load (it used to move on before trailers got to play)
      S.trailerPending = itemId;
      var myGen = gen;
      trailerTimer = setTimeout(function () {
        if (myGen !== gen || S.itemIds[S.currentSlideIndex] !== itemId || !visible() || S.isPaused || (jc().previewActive && jc().previewActive())) return;
        startTrailer(itemId, myGen);
      }, TRAILER_DELAY_MS);
    }

    /* ---------- slideshow ---------- */
    function ensureSlide(i) {
      var id = S.itemIds[i];
      if (!id) return null;
      if (!S.createdSlides[id]) {
        var parts = createSlideElement(S.loadedItems[id]);
        S.createdSlides[id] = parts.slide;
        cont.insertBefore(parts.slide, cont.querySelector('.dots-container'));
      }
      return S.createdSlides[id];
    }
    function preload(i) {
      var id = S.itemIds[i], it = id && S.loadedItems[id];
      if (!it || S.createdSlides[id]) return;
      var bt = it.BackdropImageTags && it.BackdropImageTags[0];
      if (bt) { var im = new Image(); im.decoding = 'async'; im.src = imgUrl(it.Id, 'Backdrop/0', bt, 1920); }
    }
    function focusedButtonClass() {
      var ae = document.activeElement;
      if (!ae || !cont || !cont.contains(ae)) return null;
      var b = ae.closest('.button-container button');
      if (!b) return null;
      return b.classList.contains('play-button') ? 'play-button' : b.classList.contains('detail-button') ? 'detail-button' : 'favorite-button';
    }
    function updateCurrentSlide(i) {
      if (!cont || !S.totalItems) return;
      i = ((i % S.totalItems) + S.totalItems) % S.totalItems;
      var keepFocus = focusedButtonClass();
      var prevId = S.itemIds[S.currentSlideIndex];
      S.currentSlideIndex = i;
      var slide = ensureSlide(i);
      var id = S.itemIds[i];
      clearTimeout(trailerTimer);
      var same = prevId === id && !!S.players[id];
      if (prevId && prevId !== id) destroyPlayer(prevId);
      if (!same) { S.isVideoPlaying = false; cont.classList.remove('jc-trailer-on'); }
      cont.querySelectorAll('.slide.active').forEach(function (s) {
        if (s !== slide) { s.classList.remove('active'); setTabbable(s, false); }
      });
      S.isTransitioning = true;
      setTimeout(function () {
        slide.classList.add('active');
        setTabbable(slide, true);
        var bd = slide.querySelector('img.backdrop'), lg = slide.querySelector('.logo');
        if (bd) { bd.classList.remove('animate'); void bd.offsetWidth; bd.classList.add('animate'); }
        if (lg) lg.classList.add('animate');
        if (keepFocus) { var nb = slide.querySelector('.' + keepFocus); if (nb) nb.focus({ preventScroll: true }); }
      }, 30);
      setTimeout(function () { S.isTransitioning = false; }, 900);
      slideStart = Date.now();
      updateDots();
      preload(i + 1);
      if (same) {
        // back on the same title (e.g. after a highlighted card): carry on with its trailer
        var pl = S.players[id];
        try { pl.playVideo(); } catch (e) {}
        var on = S.createdSlides[id] && S.createdSlides[id].classList.contains('jc-video-on');
        S.isVideoPlaying = !!on; cont.classList.toggle('jc-trailer-on', !!on);
      } else {
        scheduleTrailer(id);
      }
    }
    function next() { updateCurrentSlide(S.currentSlideIndex + 1); }
    function prev() { updateCurrentSlide(S.currentSlideIndex - 1); }
    function updateDots() {
      var d = cont && cont.querySelector('.dots-container');
      if (!d) return;
      if (S.totalItems > 15) {
        // many titles: a small "12 / 50" instead of a long row of dots
        d.classList.add('jc-count');
        d.textContent = (S.currentSlideIndex + 1) + ' / ' + S.totalItems;
        d.style.display = '';
        return;
      }
      d.classList.remove('jc-count');
      if (d.children.length !== S.totalItems) {
        d.innerHTML = '';
        for (var k = 0; k < S.totalItems; k++) {
          (function (k) {
            var dot = el('span', 'dot');
            dot.setAttribute('aria-hidden', 'true');
            dot.onclick = function (e) { e.stopPropagation(); if (jc().endPreview) jc().endPreview(); updateCurrentSlide(k); };
            d.appendChild(dot);
          })(k);
        }
      }
      d.style.display = S.totalItems > 1 ? '' : 'none';
      Array.prototype.forEach.call(d.children, function (dot, k) { dot.classList.toggle('active', k === S.currentSlideIndex); });
    }

    function setTrailerScale() {
      var w = window.innerWidth || 1920;
      document.documentElement.style.setProperty('--jc-yt-k', String(Math.min(3, Math.max(1, 1920 / w)).toFixed(3)));
    }
    setTrailerScale();
    window.addEventListener('resize', setTrailerScale);

    function buildContainer() {
      cont = el('div', 'jc-hero');
      cont.id = 'slides-container';
      cont.setAttribute('role', 'region');
      cont.setAttribute('aria-label', T('Featured'));
      cont.appendChild(el('div', 'dots-container'));
      var brand = el('img', 'jc-brand');
      brand.alt = ''; brand.setAttribute('aria-hidden', 'true');
      brand.src = JC_BASE + '/JellyCinema/brand/wordmark.png';
      brand.onerror = function () { brand.remove(); };
      cont.appendChild(brand);
      var la = button('arrow left-arrow', T('Previous'), ICON.left), ra = button('arrow right-arrow', T('Next'), ICON.right);
      la.tabIndex = -1; ra.tabIndex = -1;
      la.onclick = function (e) { e.stopPropagation(); if (jc().endPreview) jc().endPreview(); prev(); };
      ra.onclick = function (e) { e.stopPropagation(); if (jc().endPreview) jc().endPreview(); next(); };
      var vt = button('volume-toggle ss-chrome', T('Sound'), ICON.mute);
      vt.tabIndex = -1;
      vt.onclick = function (e) {
        e.stopPropagation();
        muted = !muted;
        vt.innerHTML = muted ? ICON.mute : ICON.sound;
        var p = S.players[S.itemIds[S.currentSlideIndex]];
        if (p) { try { if (muted) p.mute(); else p.unMute(); } catch (x) {} }
      };
      var pz = button('pause-button ss-chrome', T('Pause slideshow'), ICON.pause);
      pz.tabIndex = -1;
      pz.onclick = function (e) {
        e.stopPropagation();
        S.isPaused = !S.isPaused;
        pz.innerHTML = S.isPaused ? ICON.resume : ICON.pause;
        pz.setAttribute('aria-label', S.isPaused ? T('Resume slideshow') : T('Pause slideshow'));
        var p = S.players[S.itemIds[S.currentSlideIndex]];
        if (p) { try { if (S.isPaused) p.pauseVideo(); else p.playVideo(); } catch (x) {} }
      };
      cont.appendChild(la); cont.appendChild(ra); cont.appendChild(vt); cont.appendChild(pz);
      document.body.appendChild(cont);
    }
    function clearSlides() {
      destroyAllPlayers();
      clearTimeout(trailerTimer);
      if (cont) cont.querySelectorAll('.slide').forEach(function (s) { s.remove(); });
      S.createdSlides = {}; S.slideVideoIds = {};
    }

    /* ---------- which titles: loaded as the signed-in user, then checked again ---------- */
    var FIELDS = 'LocalTrailerCount,Overview,Genres,Taglines,RemoteTrailers,CommunityRating,CriticRating,OfficialRating,ProductionYear,ChildCount,ParentId,RunTimeTicks';
    function query(parentId, limit, withTrailer) {
      var q = { IncludeItemTypes: TYPES.join(','), Recursive: true, SortBy: 'Random', Limit: limit, ImageTypes: 'Backdrop',
        Fields: FIELDS, EnableUserData: true, EnableImageTypes: 'Backdrop,Logo,Thumb,Primary', EnableTotalRecordCount: false };
      if (withTrailer) q.HasTrailer = true;
      if (SKIP_WATCHED) q.IsPlayed = false;
      if (parentId) q.ParentId = parentId;
      return client().getItems(uid, q).then(function (r) { return (r && r.Items) || []; });
    }
    function fetchTitles() {
      var c = client(), want = MAX_ITEMS + 6;
      var p;
      if (LIBRARIES.length) {
        p = c.getUserViews({}, uid).then(function (v) {
          var libs = ((v && v.Items) || []).filter(function (l) { return LIBRARIES.indexOf(String(l.Name || '').toLowerCase()) >= 0; });
          if (!libs.length) return [];
          var per = Math.ceil(want / libs.length) + 2;
          return Promise.all(libs.map(function (l) { return query(l.Id, per, true); })).then(function (lists) {
            var all = [].concat.apply([], lists);
            for (var i = all.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = all[i]; all[i] = all[j]; all[j] = t; }
            return all;
          });
        });
      } else {
        p = query(null, want, true).then(function (items) {
          // a library with few trailers: fill up with other titles
          return items.length >= MAX_ITEMS ? items : query(null, want, false).then(function (more) { return items.concat(more); });
        });
      }
      return p.then(function (items) {
        var seen = {};
        items = items.filter(function (it) {
          if (!it || !it.Id || seen[it.Id]) return false;
          seen[it.Id] = 1;
          return it.BackdropImageTags && it.BackdropImageTags.length;
        });
        // checked one by one as this user: only check a few more than will be shown
        return verify(items.slice(0, MAX_ITEMS + 3)).then(function (ok) { return playableFirst(ok.slice(0, MAX_ITEMS)); });
      });
    }
    // titles whose trailer can play go first; titles whose every trailer was refused go last
    function playableFirst(items) {
      var J = jc(), bad = typeof J.badTrailers === 'function' ? J.badTrailers() : null;
      if (!bad || !bad.size) return items;
      var ok = [], refused = [];
      items.forEach(function (it) {
        var ids = (it.RemoteTrailers || []).map(function (t) { return t && ytId(t.Url); }).filter(Boolean);
        (it.LocalTrailerCount > 0 || !ids.length || ids.some(function (id) { return !bad.has(id); }) ? ok : refused).push(it);
      });
      return ok.concat(refused);
    }
    function verify(items) {
      var J = jc();
      if (typeof J.verifyForUser === 'function') return J.verifyForUser(uid, items);
      var c = client();
      return Promise.all(items.map(function (it) {
        return c.getItem(uid, it.Id).then(function (x) { return x && x.Id ? it : null; }, function () { return null; });
      })).then(function (r) { return r.filter(Boolean); });
    }

    var loadStarted = 0, loadTries = 0;
    function load() {
      var myGen = ++gen;
      S.isLoading = true;
      loadStarted = Date.now();
      clearSlides();
      S.itemIds = []; S.loadedItems = {}; S.totalItems = 0; S.currentSlideIndex = 0;
      updateDots();
      setOn(false);
      if (!uid) return Promise.resolve();
      return fetchTitles().then(function (items) {
        if (myGen !== gen) return;
        items.forEach(function (it) { S.itemIds.push(it.Id); S.loadedItems[it.Id] = it; });
        S.totalItems = items.length;
        S.isLoading = false;
        loadTries = 0;
        if (!S.totalItems) { setOn(false); return; }
        updateDots();
        lastShown = null;
        sync();
      }).catch(function (e) {
        if (myGen === gen) { console.warn('JellyCinema banner: could not load titles; trying again shortly', e); loadStarted = Date.now() - 20000; }
      });
    }

    /* ---------- show on Home only; rows start below the banner ---------- */
    var lastShown = null, sectionsShift = 0;
    function visible() { return !!(uid && S.totalItems && onHomeHash() && homeTabActive()); }
    function setOn(on) {
      document.documentElement.classList.toggle('jc-hero-on', on);
      api.VisibilityObserver.wasVisible = on;
    }
    function placeRows() {
      var sec = document.querySelector('#indexPage:not(.hide) .homeSectionsContainer');
      if (!sec) return;
      var h = cont.offsetHeight;
      // rows begin just below the banner's text block, over the faded bottom of the picture
      var target = Math.round(h * 0.86);
      var top = sec.getBoundingClientRect().top + (window.scrollY || 0) - sectionsShift;
      var shift = Math.max(0, target - top);
      if (Math.abs(shift - sectionsShift) > 1 || sec.style.marginTop !== shift + 'px') {
        sectionsShift = shift;
        sec.style.marginTop = shift + 'px';
      }
    }
    function unplaceRows() {
      document.querySelectorAll('.homeSectionsContainer').forEach(function (s) { if (s.style.marginTop) s.style.marginTop = ''; });
      sectionsShift = 0;
    }
    function checkUser() {
      var c = client(), u = c && c.getCurrentUserId && c.getCurrentUserId();
      if (u !== uid) { uid = u || null; load(); }   // a different person: drop every slide before anything shows
    }
    function sync() {
      if (!cont) return;
      checkUser();
      var v = visible();
      if (v !== lastShown) {
        lastShown = v;
        setOn(v);
        if (v) { updateCurrentSlide(S.currentSlideIndex); tvStartFocus(); }
        else { destroyAllPlayers(); clearTimeout(trailerTimer); unplaceRows(); }
      }
      if (v) placeRows();
    }

    /* ---------- the timer: next title after slideSeconds (trailers: when they end, at most trailerMaxSeconds) ---------- */
    setInterval(function () {
      sync();
      // a request that never answered (the web app was still starting up): try again, a few times
      if (uid && S.isLoading && Date.now() - loadStarted > 25000 && loadTries < 6) { loadTries++; load(); }
      if (!visible() || S.totalItems < 2) { slideStart = Date.now(); return; }
      var J = jc();
      if (document.hidden || S.isPaused || S.isTransitioning || S.isLoading || (J.previewActive && J.previewActive())) {
        slideStart = Date.now(); return;
      }
      // the corner logo sits just under the header buttons
      var head = document.querySelector('.skinHeader .headerTop') || document.querySelector('.skinHeader');
      var hb = head ? Math.round(head.getBoundingClientRect().bottom) : 0;
      if (cont && hb > 0) cont.style.setProperty('--jc-head', hb + 'px');
      var limit = S.isVideoPlaying ? TRAILER_MAX_MS
        : (S.trailerPending && S.trailerPending === S.itemIds[S.currentSlideIndex] ? Math.max(SLIDE_MS, 25000) : SLIDE_MS);
      if (Date.now() - slideStart >= limit) next();
    }, 500);
    window.addEventListener('hashchange', function () { setTimeout(sync, 60); });
    document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.emby-tab-button')) setTimeout(sync, 80); }, true);
    document.addEventListener('visibilitychange', function () {
      var p = S.players[S.itemIds[S.currentSlideIndex]];
      if (p) { try { if (document.hidden) p.pauseVideo(); else if (!S.isPaused) p.playVideo(); } catch (e) {} }
    });

    /* ---------- remote / keyboard ---------- */
    // TV layout: Home opens with the banner's Play button selected (Jellyfin would pick a card further down,
    // often off screen). Only until the person presses a key or clicks.
    var lastKeyAt = 0;
    function tvStartFocus() {
      if (!document.documentElement.classList.contains('layout-tv')) return;
      var shownAt = Date.now();
      [80, 500, 1200, 2500].forEach(function (ms) {
        setTimeout(function () {
          if (lastKeyAt > shownAt || !visible()) return;
          var ae = document.activeElement;
          if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return;
          if (ae && cont.contains(ae)) return;
          focusBanner('play-button');
        }, ms);
      });
    }
    ['keydown', 'mousedown', 'touchstart'].forEach(function (t) { window.addEventListener(t, function () { lastKeyAt = Date.now(); }, true); });
    function bannerButtons() {
      var s = cont && cont.querySelector('.slide.active');
      return s ? Array.prototype.slice.call(s.querySelectorAll('.button-container button')) : [];
    }
    function firstRowCard() {
      var secs = document.querySelectorAll('#indexPage:not(.hide) .homeSectionsContainer .verticalSection');
      for (var i = 0; i < secs.length; i++) {
        var cards = Array.prototype.filter.call(secs[i].querySelectorAll('.card[data-id], .jc-card[data-id], button.card, .card'), function (c) { return c.offsetParent !== null; });
        if (!cards.length) continue;
        var scroller = secs[i].querySelector('.emby-scroller, .itemsContainer');
        var left = scroller ? scroller.getBoundingClientRect().left : 0;
        // the first card that is on screen in that row
        var vis = cards.filter(function (c) { return c.getBoundingClientRect().right > left + 4; });
        var card = vis[0] || cards[0];
        var f = card.matches('button, a, [tabindex]') ? card : card.querySelector('button, a, [tabindex], .cardImageContainer') || card;
        return { section: secs[i], target: f };
      }
      return null;
    }
    // Scroll so a row's title sits just below the part of the banner that stays pinned on screen
    function bandPx() {
      var B = cfg('banner', {}) || {};
      if (B.pin === false || B.pinStyle === 'fade') return (document.querySelector('.skinHeader') || { offsetHeight: 0 }).offsetHeight;
      var probe = document.createElement('div');
      probe.style.cssText = 'position:absolute;visibility:hidden;height:var(--jc-band,58vh)';
      document.body.appendChild(probe);
      var h = probe.offsetHeight; probe.remove();
      return h;
    }
    function showRowBelowBanner(section) {
      var top = section.getBoundingClientRect().top + (window.scrollY || 0);
      var y = Math.max(0, Math.round(top - bandPx() + 8));
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    // TV layout: Jellyfin scrolls a selected row to its own spot, which can leave it under the pinned banner.
    // Once its scrolling settles, nudge the row down to just below the banner.
    var settleTimer = null;
    document.addEventListener('focusin', function (e) {
      if (!visible() || !document.documentElement.classList.contains('layout-tv')) return;
      var sec = e.target && e.target.closest && e.target.closest('#indexPage .homeSectionsContainer .verticalSection');
      if (!sec) return;
      clearInterval(settleTimer);
      var last = -1, same = 0, n = 0;
      settleTimer = setInterval(function () {
        var y = window.scrollY || 0;
        same = y === last ? same + 1 : 0; last = y;
        if (++n > 40) { clearInterval(settleTimer); return; }
        if (same < 2) return;
        clearInterval(settleTimer);
        if (!sec.contains(document.activeElement)) return;
        var top = sec.getBoundingClientRect().top, band = bandPx();
        if (y > 0 && top < band - 4) window.scrollTo({ top: Math.max(0, Math.round(y + top - band + 8)), behavior: 'smooth' });
      }, 60);
    }, true);
    function focusBanner(cls) {
      var bs = bannerButtons();
      if (!bs.length) return false;
      var b = (cls && bs.filter(function (x) { return x.classList.contains(cls); })[0]) || bs[0];
      b.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    }
    window.addEventListener('keydown', function (e) {
      if (!visible() || e.altKey || e.ctrlKey || e.metaKey) return;
      if (document.body.classList.contains('jc-theater')) return;   // Theater Mode wakes up first
      var k = e.key, t = e.target;
      if (k !== 'ArrowLeft' && k !== 'ArrowRight' && k !== 'ArrowUp' && k !== 'ArrowDown') return;
      var inBanner = t && t.closest && cont.contains(t) && t.closest('.button-container');
      if (inBanner) {
        var bs = bannerButtons(), i = bs.indexOf(t.closest('button'));
        if (k === 'ArrowLeft' || k === 'ArrowRight') {
          var j = i + (k === 'ArrowRight' ? 1 : -1);
          if (j >= 0 && j < bs.length) bs[j].focus({ preventScroll: true });
          else if (S.totalItems > 1) { if (jc().endPreview) jc().endPreview(); if (k === 'ArrowRight') next(); else prev(); }
        } else if (k === 'ArrowDown') {
          var fr = firstRowCard();
          if (!fr) return;
          fr.target.focus({ preventScroll: true });
          showRowBelowBanner(fr.section);
        } else {
          return;   // Up: let Jellyfin move to the header
        }
        e.preventDefault(); e.stopImmediatePropagation();
        return;
      }
      if (k === 'ArrowUp' && t && t.closest) {
        var fr2 = firstRowCard();
        if (fr2 && fr2.section.contains(t)) {
          if (focusBanner('play-button')) { e.preventDefault(); e.stopImmediatePropagation(); }
        }
      }
    }, true);

    /* ---------- the interface the rest of Jelly Cinema expects (same names as Media Bar's) ---------- */
    var api = {
      __jellyCinema: true,
      STATE: STATE,
      CONFIG: { shuffleInterval: SLIDE_MS },
      VisibilityObserver: { wasVisible: false },
      ApiUtils: { getSessionId: getSessionId, playItem: function (id) { play(S.loadedItems[id] || { Id: id }); } },
      SlideCreator: {
        createSlideElement: function (item) { return createSlideElement(item); },
        selectTrailerVideoId: selectTrailerVideoId
      },
      SlideshowManager: {
        updateCurrentSlide: updateCurrentSlide,
        nextSlide: next, prevSlide: prev,
        clearSlideTimers: function () { clearTimeout(trailerTimer); },
        onPlayerError: function (event, itemId) { destroyPlayer(itemId); }
      },
      nextSlide: next, prevSlide: prev
    };
    window.slideshowPure = api;
    window.JellyCinemaHero = {
      refresh: load,
      items: function () { return S.itemIds.map(function (id) { return S.loadedItems[id].Name; }); },
      ids: function () { return S.itemIds.slice(); },
      go: function (i) { updateCurrentSlide(i); },
      state: function () { return { user: uid, loading: S.isLoading, titles: S.totalItems, showing: lastShown, tries: loadTries, waitingMs: S.isLoading ? Date.now() - loadStarted : 0 }; }
    };
    buildContainer();
  }
})();
/* Jelly Cinema: banner auto-advance and pinned banner (works with the Media Bar banner).
   Settings: banner.* in jellycinema.config.js.
   Auto-advance: Media Bar 6.1.0 creates its slide timer and immediately discards it, so the banner never
   advances on its own (and a trailer would hold a slide until it ended).
   Rules: a slide without a trailer moves on after Media Bar's own slide interval (10 s by default);
          a slide playing a trailer moves on banner.trailerMaxSeconds after the slide appeared.
   Skips while the tab is hidden, the banner is off-screen, or the pause button is on.
   Switches itself off automatically if a future Media Bar version keeps its own timer. */
(function () {
  var B = (window.JellyCinemaConfig && window.JellyCinemaConfig.banner) || {};
  if (B.autoAdvance === false) return;
  var TRAILER_MAX_MS = (B.trailerMaxSeconds || 45) * 1000;
  var slideStart = Date.now(), seenIdx = -1;
  setInterval(function () {
    var P = window.slideshowPure;
    if (!P || !P.STATE || !P.STATE.slideshow) return;
    var S = P.STATE.slideshow;
    if (S.slideInterval) return; // plugin's own timer works: do nothing
    if (seenIdx !== S.currentSlideIndex) { seenIdx = S.currentSlideIndex; slideStart = Date.now(); return; }
    var jc = window.JellyCinema; // jellycinema-home.js: hold the slideshow while a highlighted title is shown
    if ((jc && jc.previewActive && jc.previewActive()) ||
        document.hidden || S.isPaused || S.isTransitioning || S.isLoading ||
        !P.VisibilityObserver || !P.VisibilityObserver.wasVisible || !(S.totalItems > 1)) {
      slideStart = Date.now(); return;
    }
    var limit = S.isVideoPlaying ? TRAILER_MAX_MS : ((P.CONFIG && P.CONFIG.shuffleInterval) || 10000);
    if (Date.now() - slideStart >= limit) { slideStart = Date.now(); P.nextSlide(); }
  }, 500);
})();

/* Jelly Cinema: keep the banner pinned while scrolling.
   pinStyle "tv"   (default): once you scroll, the banner's top part (title graphic, description,
                    Play button) stays at the top of the screen and the rows scroll up underneath it,
                    like a TV home screen. Focused rows are kept below the banner area.
   pinStyle "fade": the banner image stays behind the rows and its text/buttons fade out.
   banner.pin = false turns pinning off. */
(function () {
  var B = (window.JellyCinemaConfig && window.JellyCinemaConfig.banner) || {};
  if (B.pin === false) return;
  var PIN_STYLE = B.pinStyle === 'fade' ? 'fade' : 'tv';
  var BAND = B.pinHeight || '58vh';     // how much of the screen the banner keeps once you scroll ("tv" style)
  var common = [
    '#slides-container{position:fixed!important;top:0!important}',
    '#slides-container .dots-container,#slides-container .arrow,#slides-container .ss-chrome{transition:opacity .35s ease}',
    // the slide counter, arrows and pause button fade as soon as the rows start to move, so the first row's
    // heading never slides over them
    'body.jc-scroll-start #slides-container .dots-container,body.jc-scroll-start #slides-container .arrow,',
    'body.jc-scroll-start #slides-container .ss-chrome{opacity:0!important;pointer-events:none!important}'
  ];
  var tv = [
    ':root{--jc-band:' + BAND + '}',
    '#slides-container .slide-content{transition:transform .4s ease}',
    /* once scrolled, the banner keeps only its top band and that band is solid, like the TV app: rows scroll up
       and disappear under its bottom edge instead of showing through behind the title, text and buttons.
       clip-path (not a size change) so the picture doesn't jump; it also keeps the mouse off the hidden rows. */
    'body.jc-scrolled #slides-container{z-index:998;background:var(--jc-page-bg,#101010);',
    '  -webkit-clip-path:inset(0 0 calc(100% - var(--jc-band)) 0);clip-path:inset(0 0 calc(100% - var(--jc-band)) 0)}',
    'body.jc-scrolled #slides-container::before{content:"";position:absolute;left:0;right:0;top:calc(var(--jc-band) - 70px);height:70px;z-index:8;',
    '  pointer-events:none;background:linear-gradient(to bottom,transparent,var(--jc-page-bg,#101010))}',
    'body.jc-scrolled #slides-container .slide-content{transform:translateY(-12vh)}',
    /* Theater Mode (jellycinema-home.js) always gets the full screen */
    'body.jc-theater #slides-container{-webkit-mask-image:none!important;mask-image:none!important;-webkit-clip-path:none!important;clip-path:none!important}',
    'body.jc-theater #slides-container::before{display:none!important}',
    'body.jc-theater #slides-container .slide-content{transform:none!important}'
  ];
  var fade = [
    '#slides-container .slide-content,#slides-container .featured-content,#slides-container .logo-container{transition:opacity .35s ease}',
    'body.jc-scrolled #slides-container .slide-content,body.jc-scrolled #slides-container .featured-content,',
    'body.jc-scrolled #slides-container .logo-container{opacity:0!important;pointer-events:none!important}',
    '#slides-container::after{content:"";position:absolute;inset:0;background:rgba(10,12,18,.55);opacity:0;transition:opacity .35s ease;pointer-events:none;z-index:5}',
    'body.jc-scrolled #slides-container::after{opacity:1}',
    'body.jc-theater #slides-container::after{opacity:0!important}'
  ];
  var css = common.concat(PIN_STYLE === 'fade' ? fade : tv).join('\n');
  var st = document.createElement('style');
  st.id = 'jc-pinned-banner';
  st.textContent = css;
  (document.head || document.documentElement).appendChild(st);
  function onHome() { return /^#\/home(\.html)?(\?|$)/.test(window.location.hash || ''); }
  function onScroll() {
    if (!document.body) return;
    var y = window.scrollY || document.documentElement.scrollTop;
    document.body.classList.toggle('jc-scroll-start', y > 8);
    document.body.classList.toggle('jc-scrolled', y > 120);
  }
  // the page's own background color, so the pinned band blends into whatever theme is in use
  function setPageBg() {
    var el = document.querySelector('.backgroundContainer') || document.documentElement, c = getComputedStyle(el).backgroundColor;
    if (!c || /rgba\(0, 0, 0, 0\)|transparent/.test(c)) c = getComputedStyle(document.documentElement).backgroundColor;
    if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) document.documentElement.style.setProperty('--jc-page-bg', c);
  }
  setTimeout(setPageBg, 1500); window.addEventListener('hashchange', function () { setTimeout(setPageBg, 300); });
  function setPadding() {
    // Keep rows that get focused (remote/keyboard) from scrolling up behind the banner
    document.documentElement.style.scrollPaddingTop = (PIN_STYLE === 'tv' && onHome()) ? BAND : '';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('hashchange', function () { setTimeout(function () { onScroll(); setPadding(); }, 50); });
  setPadding();
})();
