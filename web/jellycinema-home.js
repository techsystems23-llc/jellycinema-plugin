/* Jelly Cinema: home screen features for the Jellyfin web client.
   Settings live in jellycinema.config.js (window.JellyCinemaConfig); this file only reads them.
   1. Banner follows selection: highlight a card on Home (remote/keyboard focus, or mouse hover)
      and after a short pause the banner switches to that title. The Play button reads
      "Resume" for things you're partway through, "Play album" for music albums, etc.
   2. Theater Mode: after theaterMode.idleSeconds with no input on Home, menus, rows and buttons fade out and the
      banner (trailers when available) fills the screen; the title graphic and description stay. The first key press / click / tap only
      brings everything back; it never opens or plays anything.
   3. Top 10 rows, 5. Picks, 6. duplicate genre rows, 7. Continue Watching cleanup, 8. row arrows, 4. trailer fallback.
   PERMISSIONS: every title is loaded as the signed-in user and checked once more before it is shown
   (verifyForUser), and all row caches are per user and cleared when the signed-in user changes. Nobody sees
   titles from libraries they can't open or above their rating limit.
   Debug from the browser console:  JellyCinema.theater(true|false)  /  JellyCinema.preview('<itemId>')  /
   JellyCinema.endPreview()  /  JellyCinema.checkPermissions()  /  JellyCinema.checkAllUsers() (admin) */
(function () {
  'use strict';
  if (window.JellyCinema) return;

  /* ---------- settings (from jellycinema.config.js; defaults used for anything missing) ---------- */
  var CFG = window.JellyCinemaConfig || {};
  function cfg(path, dflt) {
    var o = CFG, k = path.split('.');
    for (var i = 0; i < k.length; i++) { if (o == null || typeof o !== 'object' || !(k[i] in o)) return dflt; o = o[k[i]]; }
    return o == null ? dflt : o;
  }
  var BRAND = cfg('brand.name', 'Jelly Cinema');
  // the viewer's language (jellycinema-banner.js); English when it isn't loaded
  var T = function () { var f = window.JellyCinemaT; if (f) return f.apply(null, arguments); var a = arguments; return String(a[0]).replace(/\{(\d)\}/g, function (m, i) { return a[+i + 1]; }); };
  var FOLLOW_SELECTION = cfg('banner.followSelection', true);
  var FOCUS_DELAY_MS = cfg('banner.focusDelayMs', 700);      // remote / keyboard highlight
  var HOVER_DELAY_MS = cfg('banner.hoverDelayMs', 1000);     // mouse hover
  var PREVIEW_TIMEOUT_MS = cfg('banner.previewTimeoutSeconds', 20) * 1000; // back to the normal slideshow after this long
  var THEATER_MODE = cfg('theaterMode.enabled', true);
  var THEATER_IDLE_MS = cfg('theaterMode.idleSeconds', 90) * 1000;
  var SKIP_TYPES = { CollectionFolder: 1, UserView: 1, Folder: 1, Genre: 1, MusicGenre: 1, Person: 1, Studio: 1, Channel: 1, TvChannel: 1 };

  /* ---------- after an update: reload once by itself ----------
     The scripts' address carries the plugin version they came from (…/home.js?v=0.1.0.18), and the settings
     (config.js, never cached) carry the version the server is running now. When they differ, the page is from
     before the update: it reloads once, fresh, so nobody needs Ctrl+Shift+R. It never reloads during playback or
     on the Dashboard (settings being edited); it waits until the person is back on a normal page. Open tabs also
     check now and then (when the tab comes back into view, and every 15 minutes). updates: autoReload false = off. */
  (function autoReload() {
    if (cfg('autoReload', true) === false) return;
    var src = (document.currentScript && document.currentScript.src) || '';
    var m = /[?&]v=([^&#]+)/.exec(src), mine = m ? decodeURIComponent(m[1]) : null;
    if (!mine) return;
    var KEY = 'jc.reloadedFor', pending = null;
    function busy() {
      if (/#\/(dashboard|configurationpage|plugins|users|libraries|networking|apikeys|tasks|logs|video|nowplaying)/i.test(location.hash || '')) return true;
      var v = document.querySelector('.videoPlayerContainer:not(.hide), video.htmlvideoplayer');
      return !!(v && v.offsetParent !== null);
    }
    function reload(ver) {
      if (!ver || ver === mine) return;
      var done = null; try { done = sessionStorage.getItem(KEY); } catch (e) {}
      if (done === ver) return;                        // already reloaded once for this version: never loop
      if (busy()) { pending = ver; return; }
      try { sessionStorage.setItem(KEY, ver); } catch (e) { return; }
      // refresh the browser's copy of the page first, so the reload gets the new script addresses
      fetch('index.html', { cache: 'reload', credentials: 'same-origin' }).catch(function () {}).then(function () { location.reload(); });
    }
    function poll() {
      fetch('../JellyCinema/version', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { if (j && j.version) reload(String(j.version)); }).catch(function () {});
    }
    reload(String(cfg('version', mine)));
    window.addEventListener('hashchange', function () { if (pending) setTimeout(function () { reload(pending); }, 500); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) poll(); });
    setInterval(poll, 15 * 60000);
  })();

  /* ---------- start-up intro (like the TV app): popcorn pops in, slides aside, the name wipes in ----------
     Shown once per browser tab while the web app and the banner load underneath. intro.enabled: false turns it off. */
  (function intro() {
    if (cfg('intro.enabled', true) === false) return;
    try { if (sessionStorage.getItem('jc.intro')) return; sessionStorage.setItem('jc.intro', '1'); } catch (e) { return; }
    var me = document.currentScript && document.currentScript.src || '';
    var i = me.indexOf('/JellyCinema/');
    var base = i >= 0 ? me.slice(0, i) : '';
    var U = 'min(calc(100vw / 1920),calc(100vh / 1080))';
    var st = document.createElement('style');
    st.textContent = [
      '#jc-intro{position:fixed;inset:0;z-index:2147483000;background:#101010;overflow:hidden;--u:' + U + ';transition:opacity .7s ease}',
      '/* played over 4.5 s */',
      '#jc-intro.jc-out{opacity:0;pointer-events:none}',
      '#jc-intro .g{position:absolute;inset:0;opacity:0;background:radial-gradient(circle at 50% 50%,#5a1414 0,rgba(42,14,14,.8) 26%,rgba(16,16,16,0) 55%);',
      '  animation:jci-g1 0.79s cubic-bezier(.33,1,.68,1) forwards,jci-g2 1.06s cubic-bezier(.65,0,.35,1) 3.44s forwards}',
      '#jc-intro .s{position:absolute;left:50%;top:50%;width:calc(217 * var(--u));height:calc(300 * var(--u));margin:calc(-150 * var(--u)) 0 0 calc(-108.5 * var(--u));',
      '  animation:jci-s 0.79s cubic-bezier(.65,0,.35,1) 1.26s both}',
      '#jc-intro .s img{width:100%;height:100%;opacity:0;transform:scale(0);animation:jci-p 0.99s cubic-bezier(.34,1.56,.64,1) 0.2s forwards}',
      '#jc-intro .w{position:absolute;left:calc(50% - 408.5 * var(--u));top:50%;width:calc(1074 * var(--u));height:calc(170 * var(--u));margin-top:calc(-75 * var(--u));',
      '  clip-path:inset(0 100% 0 0);animation:jci-w 0.93s cubic-bezier(.33,1,.68,1) 1.52s forwards}',
      '#jc-intro .w img{width:100%;height:100%;display:block}',
      '#jc-intro .w i{position:absolute;inset:0;-webkit-mask:var(--m) center/100% 100% no-repeat;mask:var(--m) center/100% 100% no-repeat;',
      '  background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.55) 50%,transparent 60%) no-repeat;background-size:300% 100%;background-position:120% 0;',
      '  animation:jci-sh 0.93s linear 2.51s forwards}',
      '@keyframes jci-g1{to{opacity:1}}@keyframes jci-g2{from{opacity:1}to{opacity:.45}}',
      '@keyframes jci-p{0%{opacity:0;transform:scale(0)}25%{opacity:1}100%{opacity:1;transform:scale(1)}}',
      '@keyframes jci-s{from{transform:translateX(0)}to{transform:translateX(calc(-557 * var(--u)))}}',
      '@keyframes jci-w{to{clip-path:inset(0 0 0 0)}}',
      '@keyframes jci-sh{from{background-position:120% 0}to{background-position:-20% 0}}'
    ].join('\n');
    var d = document.createElement('div');
    d.id = 'jc-intro';
    d.setAttribute('aria-hidden', 'true');
    var word = base + '/JellyCinema/brand/word.png';
    d.innerHTML = '<div class="g"></div><div class="s"><img alt="" src="' + base + '/JellyCinema/brand/popcorn.png"></div>' +
      '<div class="w" style="--m:url(\'' + word + '\')"><img alt="" src="' + word + '"><i></i></div>';
    (document.head || document.documentElement).appendChild(st);
    (document.body || document.documentElement).appendChild(d);
    // keys pressed during the intro are ignored
    function swallow(e) { e.preventDefault(); e.stopPropagation(); }
    window.addEventListener('keydown', swallow, true);
    var t0 = Date.now(), done = false;
    function finish() {
      if (done) return; done = true;
      window.removeEventListener('keydown', swallow, true);
      d.classList.add('jc-out');
      setTimeout(function () { d.remove(); st.remove(); }, 800);
    }
    // leave after the animation once the page is ready (banner shown, or a sign-in screen), 9 s at most
    (function wait() {
      var age = Date.now() - t0;
      var ready = document.documentElement.classList.contains('jc-hero-on') ||
        (!/#\/home/.test(location.hash || '') && document.querySelector('.page:not(.hide)'));
      if ((age >= 4500 && ready) || age >= 9000) return finish();
      setTimeout(wait, 100);
    })();
  })();

  var api = {};
  window.JellyCinema = api;

  function MB() { return window.slideshowPure; }
  function onHome() { return /^#\/home(\.html)?(\?|$)/.test(window.location.hash || ''); }
  function container() { return document.getElementById('slides-container'); }
  function client() { return window.ApiClient; }
  function bannerReady() {
    var P = MB(), c = container();
    return !!(P && P.STATE && P.STATE.slideshow && P.SlideCreator && c && c.style.display !== 'none' && onHome());
  }

  /* ---------- styles ---------- */
  var css = [
    /* preview slide extras */
    '#slides-container .slide.jc-preview .jc-title{font-size:clamp(28px,4.2vw,64px);font-weight:800;line-height:1.05;color:#fff;',
    '  text-shadow:0 2px 12px rgba(0,0,0,.6);max-width:42vw;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}',
    '#slides-container .slide.jc-preview img.backdrop.jc-poster-bg{filter:blur(28px) brightness(.55) saturate(1.2);transform:scale(1.15)}',
    '#slides-container .slide.jc-preview{z-index:2}',
    'body.jc-previewing #slides-container .dots-container,body.jc-previewing #slides-container .arrow{opacity:0!important;pointer-events:none!important}',
    /* Theater Mode */
    '#reactRoot,.appfooter,#jc-seasonal-canvas{transition:opacity .9s ease}',
    'body.jc-theater #reactRoot,body.jc-theater .appfooter{opacity:0!important;pointer-events:none!important}',
    /* Theater Mode keeps the title graphic, details line and description; only buttons and slide controls fade */
    'body.jc-theater #slides-container .button-container,body.jc-theater #slides-container .dots-container,',
    'body.jc-theater #slides-container .arrow,body.jc-theater #slides-container .ss-chrome{opacity:0!important;pointer-events:none!important;transition:opacity .9s ease}',
    'body.jc-theater #slides-container::after{opacity:0!important}',
    'body.jc-theater #slides-container{position:fixed!important;top:0!important;z-index:1000}',
    /* the season's falling leaves, bats, snow... stay on top of the full-screen banner (like the TV app) */
    'body.jc-theater #jc-seasonal-canvas{z-index:1001!important}',
    'body.jc-theater,body.jc-theater *{cursor:none!important}'
  ].join('\n');
  function addStyle() {
    if (document.getElementById('jc-tv-style')) return;
    var st = document.createElement('style');
    st.id = 'jc-tv-style';
    st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
  }
  addStyle();

  /* ---------- accent color (brand.accent) ----------
     Lives here (not in Branding > Custom CSS) so a theme manager can't overwrite it.
     Set brand.accent.enabled = false to keep the theme's own color. */
  var AC = cfg('brand.accent', {});
  var ACCENT = AC.enabled !== false;
  if (ACCENT && !document.getElementById('jc-accent')) {
    var ac = document.createElement('style');
    ac.id = 'jc-accent';
    var col = function (k, d) { var v = String(AC[k] || d); return /^#[0-9a-fA-F]{3,8}$/.test(v) ? v : d; };
    ac.textContent = 'html:root{--accentColor:' + col('color', '#e0262b') + ';--accentHoverColor:' + col('hover', '#f2484c') +
      ';--checkboxCheckedBgColor:' + col('checkbox', '#d0201f') + ';--highlightOutlineColor:' + col('focus', '#ff4d4f') +
      ';--btnSubmitColor:' + col('save', '#c4161c') + ';--btnSubmitBorderColor:' + col('saveBorder', '#f2484c') +
      ';--btnDeleteColor:' + col('deleteFill', '#3b1215') + ';--btnDeleteBorderColor:' + col('deleteBorder', '#d95454') + '}' +
      /* Jellyfin's stock theme doesn't use those variables: color the same controls directly */
      'html:not(.jc-has-theme-vars) .button-submit:not(.button-cancel){background:var(--accentColor)!important;color:#fff!important}' +
      'html:not(.jc-has-theme-vars) .button-submit:not(.button-cancel):hover{background:var(--accentHoverColor)!important}' +
      'html:not(.jc-has-theme-vars) .emby-checkbox:checked+span+.checkboxOutline{background-color:var(--accentColor)!important;border-color:var(--accentColor)!important}' +
      'html:not(.jc-has-theme-vars) .emby-input:focus,html:not(.jc-has-theme-vars) .emby-textarea:focus,html:not(.jc-has-theme-vars) .emby-select-withcolor:focus{border-color:var(--accentColor)!important}' +
      'html:not(.jc-has-theme-vars) .inputLabelFocused,html:not(.jc-has-theme-vars) .selectLabelFocused,html:not(.jc-has-theme-vars) .textareaLabelFocused{color:var(--accentColor)!important}' +
      'html:not(.jc-has-theme-vars) .itemProgressBarForeground{background-color:var(--accentColor)!important}' +
      /* posters and tiles: red outline when highlighted with the remote/keyboard or hovered with the mouse */
      /* Jellyfin's own blue (hovered buttons on movie and show pages, progress bars, sliders...) becomes the accent red */
      'html:root{--jf-palette-primary-main:var(--accentColor);--jf-palette-secondary-main:var(--accentColor)}' +
      '.listItemImageButton:hover{color:#fff!important;background-color:var(--accentColor)!important}' +
      /* the loading circle (opening a library, a page or a search) */
      '.mdl-spinner__layer-1,.mdl-spinner__layer-2,.mdl-spinner__layer-3,.mdl-spinner__layer-4{border-color:var(--accentColor)!important}' +
      /* the user picture circle in the top bar (newer Jellyfin header) */
      '.MuiAppBar-root .MuiAvatar-colorDefault,.skinHeader .MuiAvatar-colorDefault{background-color:var(--accentColor)!important}' +
      'div[data-role="controlgroup"] a.ui-btn-active{background-color:var(--accentColor)!important}' +
      '#dialogToc .toc li a:active,#dialogToc .toc li a:hover{color:var(--accentColor)!important}' +
      '.listItemIcon:not(.listItemIcon-transparent),.playbackProgress>div,.sliderMarker.watched,.iconOsdProgressInner,' +
      '.mdl-slider::-webkit-slider-thumb,.mdl-slider-background-lower{background-color:var(--accentColor)!important}' +
      'progress::-webkit-progress-value,progress[aria-valuenow]::before{background-color:var(--accentColor)!important}' +
      '.button-accent-flat,.mdl-slider{color:var(--accentColor)!important}' +
      /* drawn inside the picture so a row's scroller can never cut part of it off */
      '.card .cardScalable{position:relative}' +
      '.card:hover .cardScalable::after,.card:focus .cardScalable::after,.card.show-focus:focus .cardScalable::after{content:"";position:absolute;inset:0;' +
      'border-radius:.2em;box-shadow:inset 0 0 0 3px var(--accentColor);pointer-events:none;z-index:5}' +
      /* episode count and watched check on posters: red, like the TV app */
      '.countIndicator,.playedIndicator,.cardIndicators .indicator{background:var(--accentColor)!important;color:#fff!important}' +
      /* buttons on the movie / show pages (Play, Trailer, Watched, Favorite, Delete, more...): red outline like the TV app */
      '.detailButton:hover .detailButton-content,.detailButton:focus .detailButton-content,' +
      '.detailButton:hover>.detailButton-icon,.detailButton:focus>.detailButton-icon{box-shadow:0 0 0 3px var(--accentColor)!important;border-radius:.4em}';
    (document.head || document.documentElement).appendChild(ac);
  }

  /* ---------- card sizes (rows.cardSize) ----------
     Home posters in the same proportions as the Jelly Cinema TV app instead of Jellyfin's oversized
     cards. Works without any theme. 'jellyfin' keeps Jellyfin's own sizes. Phones keep Jellyfin's sizes. */
  if (cfg('rows.cardSize', 'tv') !== 'jellyfin' && !document.getElementById('jc-card-size')) {
    var cz = document.createElement('style');
    cz.id = 'jc-card-size';
    cz.textContent = [
      ':root{--jc-card-w:clamp(96px,7.6vw,240px);--jc-card-wide-w:clamp(170px,15.5vw,420px);--jc-card-square-w:clamp(110px,11.5vw,300px)}',
      '@media (min-width:761px){',
      '  .homeSectionsContainer .overflowPortraitCard{width:var(--jc-card-w)!important}',
      '  .homeSectionsContainer .overflowBackdropCard,.homeSectionsContainer .overflowSmallBackdropCard{width:var(--jc-card-wide-w)!important}',
      '  .homeSectionsContainer .overflowSquareCard{width:var(--jc-card-square-w)!important}',
      '  .jc-top10 .jc-t10-card{--jc-poster-w:var(--jc-card-w)!important}',
      '}',
      /* like the TV app: the highlighted card doesn't grow out of its row */
      '.homeSectionsContainer .card:focus .cardBox-focustransform,.homeSectionsContainer .card.show-focus:focus .cardBox-focustransform{transform:none!important}',
      '.homeSectionsContainer .emby-scroller{padding-top:.4em;padding-bottom:.4em}',
      /* seasonal rows (Halloween, Christmas...): same size as the other rows, and the same red outline drawn inside
         the poster (they used a fixed 150px poster that grew on hover and got cut off by the row) */
      '@media (min-width:761px){.jc-seasonal-row .jc-card,.jc-hmx .jc-card{width:var(--jc-card-w)!important}',
      '  .jc-seasonal-row .jc-card img,.jc-hmx .jc-card img{width:100%!important;height:auto!important;aspect-ratio:2/3}}',
      '.jc-seasonal-row .jc-scroll,.jc-hmx .jc-scroll{padding-top:.6em!important;padding-bottom:1em!important}',
      '.jc-seasonal-row .jc-card:hover img,.jc-seasonal-row .jc-card:focus img,.jc-hmx .jc-card:hover img,.jc-hmx .jc-card:focus img{transform:none!important;outline:3px solid var(--accentColor,#e0262b);outline-offset:-3px}',
      '.jc-seasonal-row .jc-card:focus,.jc-hmx .jc-card:focus{outline:none}'
    ].join('\n');
    (document.head || document.documentElement).appendChild(cz);
  }
  /* the round play button on a hovered poster in the accent red, like the TV app's highlight */
  if (!document.getElementById('jc-play-red')) {
    var pr = document.createElement('style');
    pr.id = 'jc-play-red';
    pr.textContent = '.cardOverlayContainer>.cardOverlayButton-hover{background:color-mix(in srgb,var(--accentColor,#e0262b) 55%,transparent)!important;color:#fff!important;transition:background .15s ease}' +
      '.cardOverlayContainer>.cardOverlayButton-hover:hover,.cardOverlayContainer>.cardOverlayButton-hover:focus{background:var(--accentColor,#e0262b)!important}';
    (document.head || document.documentElement).appendChild(pr);
  }

  /* ---------- sign-in screen (signIn.*) ----------
     Frosted, centered card with the logo (brand.logo) over the branding splash image; undoes
     ElegantFin's narrow sign-in panel and hidden title. Users stay hidden from this screen
     (people type their name), which keeps names and photos private. */
  var STYLE_LOGIN = cfg('signIn.enabled', true);
  var CARD_W = /^[0-9.]+(rem|px|em|vw)$/.test(String(cfg('signIn.cardWidth', '30rem'))) ? cfg('signIn.cardWidth', '30rem') : '30rem';
  var LOGO = String(cfg('brand.logo', 'jc-logo.png')).replace(/["'()\\\s]/g, '');
  if (STYLE_LOGIN && !document.getElementById('jc-login-style')) {
    var lg = document.createElement('style');
    lg.id = 'jc-login-style';
    lg.textContent = [
      /* ElegantFin squeezes the sign-in page into a ~400px panel and hides the page title; undo both */
      '#loginPage::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:0;',
      '  background:radial-gradient(ellipse at 50% 45%,rgba(10,12,18,.15) 0%,rgba(10,12,18,.78) 80%)}',
      '#loginPage > div{position:relative;z-index:1;background:transparent!important;box-shadow:none!important;border:0!important;',
      '  max-width:none!important;width:auto!important;padding-top:2vh!important}',
      '#loginPage .manualLoginForm,#loginPage .readOnlyContent{width:min(' + CARD_W + ',92vw)!important;max-width:none!important;box-sizing:border-box;',
      '  margin-left:auto!important;margin-right:auto!important}',
      '#loginPage .manualLoginForm{font-size:1.05rem;background:rgba(17,24,39,.78);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);',
      '  border:1px solid rgba(255,255,255,.10);border-radius:22px;padding:3.4rem 2.2rem 2rem!important;position:relative;margin-top:64px!important;box-shadow:0 24px 70px rgba(0,0,0,.6)}',
      /* logo sits on the card's top edge (no empty gap above the title) */
      '#loginPage .manualLoginForm::before{content:"";position:absolute!important;top:-58px!important;left:50%!important;',
      '  transform:translateX(-50%)!important;display:block;width:104px!important;height:104px!important;margin:0!important;',
      '  background:url("' + LOGO + '") center/contain no-repeat!important;filter:drop-shadow(0 6px 14px rgba(0,0,0,.5))}',
      '#loginPage .manualLoginForm .sectionTitle{display:block!important;font-size:1.75rem!important;font-weight:800;color:#fff!important;',
      '  text-align:center;margin:.2rem 0 1.2rem!important}',
      '#loginPage .manualLoginForm .inputContainer{margin-bottom:1.1rem}',
      '#loginPage .manualLoginForm .inputLabel{font-size:1rem}',
      '#loginPage .manualLoginForm input.emby-input{width:100%!important;box-sizing:border-box;height:2.9rem;font-size:1.1rem;padding:0 .9rem}',
      '#loginPage .manualLoginForm .checkboxContainer{font-size:1rem;margin:.4rem 0 1.2rem}',
      '#loginPage .manualLoginForm .button-submit{height:3.1rem;font-size:1.15rem;font-weight:700;width:100%}',
      '#loginPage .readOnlyContent .emby-button{height:2.9rem;font-size:1.02rem;width:100%;margin:.55rem 0 0}',
      '#loginPage .loginDisclaimerContainer{margin-top:1.4rem}',
      '#loginPage .loginDisclaimer{max-width:' + CARD_W + ';opacity:.85;font-size:.95rem;line-height:1.45;text-align:center}'
    ].join('\n');
    (document.head || document.documentElement).appendChild(lg);
  }
  /* ---------- sign-in background: the "Now Showing" theater scene (signIn.background = 'marquee') ----------
     Drawn with CSS (no image file): curtains, spotlights and a marquee sign with the server name in lights.
     Wide screens: sign on the left, sign-in card on the right. Narrow screens: sign on top, card below. */
  var SIGNIN_BG = cfg('signIn.background', 'marquee');
  if (STYLE_LOGIN && SIGNIN_BG === 'marquee') {
    var sc = document.createElement('style');
    sc.id = 'jc-signin-scene-style';
    sc.textContent = [
      '@font-face{font-family:"JC Marquee";src:url("../JellyCinema/font/oswald.woff2") format("woff2");font-weight:600;font-display:swap}',
      '#loginPage .jc-scene{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;',
      '  background:radial-gradient(ellipse at 50% 28%,#2b2340 0%,#16131f 55%,#0a0910 100%)}',
      'body.jc-has-scene #loginPage::before{opacity:.35}',
      '#loginPage .jc-curtain{position:absolute;top:0;bottom:0;width:8vw;min-width:48px;',
      '  background:repeating-linear-gradient(90deg,#4d0a13 0,#7a1320 1.2vw,#5c0d17 2.2vw,#3e070f 3vw);box-shadow:inset -40px 0 50px rgba(0,0,0,.65)}',
      '#loginPage .jc-curtain.l{left:0}#loginPage .jc-curtain.r{right:0;transform:scaleX(-1)}',
      '#loginPage .jc-beam{position:absolute;bottom:-12vh;left:50%;width:26vw;height:125vh;margin-left:-13vw;transform-origin:50% 100%;',
      '  background:linear-gradient(to top,rgba(255,226,160,.17),rgba(255,226,160,0) 82%);clip-path:polygon(46% 100%,54% 100%,100% 0,0 0);filter:blur(5px)}',
      '#loginPage .jc-beam.b1{transform:translateX(-26vw) rotate(-16deg)}#loginPage .jc-beam.b3{transform:translateX(26vw) rotate(16deg)}',
      '#loginPage .jc-sign{position:absolute;left:7vw;top:50%;transform:translateY(-55%);width:min(42vw,760px);text-align:center}',
      '#loginPage .jc-marquee{position:relative;border:3px solid #e9b949;border-radius:22px;padding:3.4em 2.2em 2.8em;',
      '  background:linear-gradient(#3d1019,#24070e);box-shadow:0 0 46px rgba(255,186,80,.38),inset 0 0 34px rgba(0,0,0,.65)}',
      '#loginPage .jc-marquee::before{content:"";position:absolute;inset:9px;border-radius:14px;animation:jcTwinkle 2.4s ease-in-out infinite;',
      '  background-image:radial-gradient(circle,#fff6d0 0 2.5px,rgba(255,206,110,.95) 3px,transparent 5.5px),radial-gradient(circle,#fff6d0 0 2.5px,rgba(255,206,110,.95) 3px,transparent 5.5px),',
      '    radial-gradient(circle,#fff6d0 0 2.5px,rgba(255,206,110,.95) 3px,transparent 5.5px),radial-gradient(circle,#fff6d0 0 2.5px,rgba(255,206,110,.95) 3px,transparent 5.5px);',
      '  background-size:24px 16px,24px 16px,16px 24px,16px 24px;background-repeat:repeat-x,repeat-x,repeat-y,repeat-y;',
      '  background-position:left top,left bottom,left top,right top;filter:drop-shadow(0 0 4px #ffcf70)}',
      '#loginPage .jc-marquee::after{content:"";position:absolute;inset:26px;border:1px solid rgba(233,185,73,.45);border-radius:8px}',
      '@keyframes jcTwinkle{50%{opacity:.72}}',
      '@media (prefers-reduced-motion:reduce){#loginPage .jc-marquee::before{animation:none}}',
      '#loginPage .jc-now{position:relative;z-index:1;color:#f5c96a;font-weight:700;letter-spacing:.38em;font-size:clamp(.8rem,1.1vw,1.15rem);margin-bottom:.5em}',
      '#loginPage .jc-title{position:relative;z-index:1;font-family:"JC Marquee",Oswald,Impact,"Arial Narrow",sans-serif;font-weight:600;text-transform:uppercase;',
      '  font-size:clamp(2.2rem,4.6vw,5rem);line-height:1.04;letter-spacing:.03em;overflow-wrap:anywhere;',
      '  background:linear-gradient(#fff6d6,#f6c862 58%,#d8962a);-webkit-background-clip:text;background-clip:text;color:transparent;',
      '  filter:drop-shadow(0 0 14px rgba(255,196,90,.45))}',
      '#loginPage .jc-tagline{margin-top:1.6em;color:rgba(255,255,255,.82);letter-spacing:.04em;font-size:clamp(.9rem,1.2vw,1.2rem)}',
      /* wide screens: card on the right so the sign stays visible */
      '@media (min-width:1100px){body.jc-has-scene #loginPage .manualLoginForm,body.jc-has-scene #loginPage .readOnlyContent,',
      '  body.jc-has-scene #loginPage .loginDisclaimerContainer{margin-left:auto!important;margin-right:7vw!important}}',
      /* narrow screens: sign on top, card below it */
      '@media (max-width:1099px){#loginPage .jc-sign{left:50%;top:3vh;transform:translateX(-50%);width:min(92vw,560px)}',
      '  #loginPage .jc-marquee{padding:2em 1.4em 1.7em}#loginPage .jc-title{font-size:clamp(1.8rem,8vw,3rem)}#loginPage .jc-tagline{display:none}',
      '  #loginPage .jc-beam,#loginPage .jc-curtain{opacity:.6}',
      '  body.jc-has-scene #loginPage > div:not(.jc-scene){padding-top:calc(3vh + 8.5rem)!important}}'
    ].join('\n');
    (document.head || document.documentElement).appendChild(sc);
    var sceneTitle = cfg('signIn.marqueeTitle', null) || BRAND;
    var sceneTag = cfg('signIn.marqueeTagline', '');
    var buildScene = function () {
      var s = document.createElement('div'); s.className = 'jc-scene'; s.setAttribute('aria-hidden', 'true');
      ['l', 'r'].forEach(function (k) { var c = document.createElement('div'); c.className = 'jc-curtain ' + k; s.appendChild(c); });
      ['b1', 'b2', 'b3'].forEach(function (k) { var b = document.createElement('div'); b.className = 'jc-beam ' + k; s.appendChild(b); });
      var sign = document.createElement('div'); sign.className = 'jc-sign';
      var m = document.createElement('div'); m.className = 'jc-marquee';
      var now = document.createElement('div'); now.className = 'jc-now'; now.textContent = '\u2605  NOW SHOWING  \u2605';
      var t = document.createElement('div'); t.className = 'jc-title'; t.textContent = sceneTitle;
      m.appendChild(now); m.appendChild(t); sign.appendChild(m);
      if (sceneTag) { var tg = document.createElement('div'); tg.className = 'jc-tagline'; tg.textContent = sceneTag; sign.appendChild(tg); }
      s.appendChild(sign);
      return s;
    };
    var syncScene = function () {
      var lp = document.querySelector('#loginPage');
      var showing = !!(lp && !lp.classList.contains('hide') && lp.offsetParent !== null);
      if (showing && !lp.querySelector(':scope > .jc-scene')) lp.insertBefore(buildScene(), lp.firstChild);
      if (document.body) document.body.classList.toggle('jc-has-scene', showing);
    };
    new MutationObserver(function () { syncScene(); }).observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('hashchange', function () { setTimeout(syncScene, 50); });
  }

  /* Disclaimer under the sign-in card: null = Jellyfin's own Login disclaimer, '' = hidden, text = replaces it */
  var DISCLAIMER = cfg('signIn.disclaimer', null);
  if (DISCLAIMER !== null) {
    new MutationObserver(function () {
      var d = document.querySelector('#loginPage .loginDisclaimer');
      if (!d) return;
      if (DISCLAIMER === '') { var dc = d.closest('.loginDisclaimerContainer') || d; if (dc.style.display !== 'none') dc.style.display = 'none'; return; }
      if (d.textContent !== DISCLAIMER) d.textContent = DISCLAIMER;
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  /* =====================================================================
     0. Permissions: per-user caches and a final check on every title
     ===================================================================== */
  var lastUid = null;
  var resetHooks = [];
  function onUserChange(fn) { resetHooks.push(fn); }
  // Call before using any cache: if a different person signed in, every cache and every row we added is dropped.
  function sameUser() {
    var c = client(), uid = c && c.getCurrentUserId && c.getCurrentUserId();
    if (uid !== lastUid) {
      lastUid = uid || null;
      verified = {};
      resetHooks.forEach(function (fn) { try { fn(); } catch (e) {} });
      document.querySelectorAll('.jc-top10, .jc-seasonal-row, .jc-hmx, #jc-hide-stale').forEach(function (n) { n.remove(); });
    }
    return lastUid;
  }
  // Final check: look each title up as this user. Jellyfin answers 404 for anything outside the user's
  // libraries, above their rating limit or blocked by their parental tags, so only allowed titles survive.
  var verified = {};   // itemId -> true/false for the current user
  // One request per row: the plugin checks every title at once, as Jellyfin's own item lookup does (/JellyCinema/visible).
  // Without the plugin (or on an error) every title is looked up one by one as before.
  var batchOk = true;
  function verifyBatch(c, uid, list, useCache) {
    var todo = list.filter(function (it) { return !(useCache && it.Id in verified); });
    var ask = todo.length && batchOk ? c.ajax({
      type: 'POST', url: c.getUrl('JellyCinema/visible', uid === c.getCurrentUserId() ? {} : { userId: uid }),
      data: JSON.stringify({ Ids: todo.map(function (it) { return it.Id; }) }), contentType: 'application/json', dataType: 'json'
    }) : Promise.resolve({ visible: [] });
    return ask.then(function (r) {
      var ok = {}; ((r && r.visible) || []).forEach(function (id) { ok[String(id).replace(/-/g, '').toLowerCase()] = 1; });
      var seen = {};
      todo.forEach(function (it) { var v = !!ok[String(it.Id).replace(/-/g, '').toLowerCase()]; seen[it.Id] = v; if (useCache) verified[it.Id] = v; });
      return list.filter(function (it) { return it.Id in seen ? seen[it.Id] : !!verified[it.Id]; });
    });
  }
  function verifyForUser(uid, items) {
    var c = client(); if (!c || !uid) return Promise.resolve([]);
    var list = (items || []).filter(Boolean);
    var useCache = uid === lastUid;
    if (batchOk && list.length) {
      return verifyBatch(c, uid, list, useCache).catch(function () { batchOk = false; return verifyOneByOne(c, uid, list, useCache); });
    }
    return verifyOneByOne(c, uid, list, useCache);
  }
  function verifyOneByOne(c, uid, list, useCache) {
    return Promise.all(list.map(function (it) {
      var id = it.Id;
      if (useCache && id in verified) return Promise.resolve(verified[id] ? it : null);
      return c.getItem(uid, id).then(function (x) { var ok = !!(x && x.Id); if (useCache) verified[id] = ok; return ok ? it : null; },
        function () { if (useCache) verified[id] = false; return null; });
    })).then(function (r) { return r.filter(Boolean); });
  }
  api.verifyForUser = verifyForUser;
  setInterval(sameUser, 2000);

  /* =====================================================================
     1. Banner follows selection
     ===================================================================== */
  var preview = { id: null, slide: null, hiddenSlide: null, timer: null, expire: null, token: 0, doneId: null };
  api.previewActive = function () { return !!preview.slide; };

  function pauseMediaBarTrailers() {
    var P = MB(); if (!P || !P.STATE) return;
    var players = P.STATE.slideshow.players || {};
    Object.keys(players).forEach(function (k) {
      try { if (players[k] && typeof players[k].pauseVideo === 'function') players[k].pauseVideo(); } catch (e) {}
    });
    P.STATE.slideshow.isVideoPlaying = false;
  }

  function imgUrl(id, type, tag, maxWidth) {
    var c = client();
    var q = { quality: 80, maxWidth: maxWidth || 1920 };
    if (tag) q.tag = tag;
    return c.getUrl('Items/' + id + '/Images/' + type, q);
  }

  function playLabel(item) {
    var pos = item.UserData && item.UserData.PlaybackPositionTicks;
    if (pos && pos > 0) return T('Resume');
    switch (item.Type) {
      case 'MusicAlbum': return T('Play album');
      case 'MusicArtist': return T('Play artist');
      case 'Playlist': return T('Play playlist');
      case 'Audio': return T('Play song');
      case 'BoxSet': return T('Play collection');
      default: return T('Play');
    }
  }

  function playItem(item) {
    // jellycinema-banner.js: works even when the server's live connection is down
    if (typeof window.JellyCinemaPlay === 'function' && window.JellyCinemaPlay(item)) return;
    var P = MB(), c = client();
    var go = function (sid) {
      if (!sid) return;
      var q = { playCommand: 'PlayNow', itemIds: item.Id };
      var pos = item.UserData && item.UserData.PlaybackPositionTicks;
      if (pos && pos > 0) q.startPositionTicks = pos;
      c.ajax({ type: 'POST', url: c.getUrl('Sessions/' + sid + '/Playing', q) });
    };
    if (P && P.ApiUtils && P.ApiUtils.getSessionId) P.ApiUtils.getSessionId().then(go);
  }

  function openDetails(item) {
    var c = client();
    var hash = '#/details?id=' + item.Id + '&serverId=' + c.serverId();
    if (window.Emby && window.Emby.Page) window.Emby.Page.show('/details?id=' + item.Id + '&serverId=' + c.serverId());
    else window.location.hash = hash;
  }

  // Build the object the banner draws from. Episodes borrow their show's artwork and logo.
  function buildDisplay(item) {
    var c = client(), uid = c.getCurrentUserId();
    var base = Promise.resolve(null);
    if (item.Type === 'Episode' && item.SeriesId) base = c.getItem(uid, item.SeriesId).catch(function () { return null; });
    else if ((item.Type === 'Audio') && item.AlbumId) base = c.getItem(uid, item.AlbumId).catch(function () { return null; });
    return base.then(function (parent) {
      var d = JSON.parse(JSON.stringify(parent && item.Type === 'Episode' ? parent : item));
      if (item.Type === 'Episode') {
        // YouTube-style seasons are years (S2020): skip the season/episode prefix for those
        var se = (item.ParentIndexNumber != null && item.ParentIndexNumber < 1900)
          ? 'S' + item.ParentIndexNumber + (item.IndexNumber != null ? ':E' + item.IndexNumber : '') : '';
        d.Taglines = [(se ? se + ' · ' : '') + item.Name];
        if (item.Overview) d.Overview = item.Overview;
        if (item.RunTimeTicks) d.RunTimeTicks = item.RunTimeTicks;
      }
      if (item.Type === 'Audio' && parent) {
        d.ImageTags = parent.ImageTags || d.ImageTags;
        d.Taglines = [(item.AlbumArtist || '') + (item.Album ? ' · ' + item.Album : '')];
      }
      if (item.Type === 'MusicAlbum' && item.AlbumArtist) d.Taglines = [item.AlbumArtist];
      // The banner labels ChildCount as "seasons": only keep it for real TV series
      if (d.Type !== 'Series') delete d.ChildCount;
      d.RemoteTrailers = [];      // no trailers in previews
      d.LocalTrailerCount = 0;
      return d;
    });
  }

  function decorateSlide(slide, display, item) {
    var hasLogo = display.ImageTags && display.ImageTags.Logo;
    var hasBackdrop = (display.BackdropImageTags && display.BackdropImageTags.length) || (display.ImageTags && display.ImageTags.Backdrop);
    var name = item.Type === 'Episode' ? (item.SeriesName || display.Name) : (display.Name || item.Name);

    if (!hasLogo) {
      var lc = slide.querySelector('.logo-container');
      if (lc) {
        lc.innerHTML = '';
        var t = document.createElement('div');
        t.className = 'jc-title';
        t.textContent = name;
        lc.appendChild(t);
      }
    }
    var bd = slide.querySelector('img.backdrop');
    if (bd && !hasBackdrop) {
      var tags = display.ImageTags || {};
      bd.classList.remove('awaiting-image', 'image-failed');
      bd.style.backgroundImage = '';
      if (tags.Thumb) { bd.src = imgUrl(display.Id, 'Thumb', tags.Thumb, 1920); }
      else if (tags.Primary) { bd.src = imgUrl(display.Id, 'Primary', tags.Primary, 800); bd.classList.add('jc-poster-bg'); }
    }
    // Play button: right label, plays/resumes the highlighted item itself (not the show/album art source)
    var pb = slide.querySelector('.play-button');
    if (pb) {
      var npb = pb.cloneNode(true);
      var txt = npb.querySelector('.play-text');
      if (txt) txt.textContent = playLabel(item);
      npb.onclick = function (e) { e.preventDefault(); e.stopPropagation(); playItem(item); };
      pb.parentNode.replaceChild(npb, pb);
    }
    var db = slide.querySelector('.detail-button');
    if (db) {
      var ndb = db.cloneNode(true);
      ndb.onclick = function (e) { e.preventDefault(); e.stopPropagation(); openDetails(item); };
      db.parentNode.replaceChild(ndb, db);
    }
  }

  function showPreview(itemId) {
    if (!FOLLOW_SELECTION || !bannerReady()) return;
    if (preview.id === itemId && preview.slide) return;     // same card: keep the clock running, don't restart it
    if (preview.doneId === itemId) return;                   // already shown and timed out: wait until a different card
    var token = ++preview.token;
    var c = client();
    c.getItem(c.getCurrentUserId(), itemId).then(function (item) {
      if (token !== preview.token || !item || SKIP_TYPES[item.Type]) return null;
      return buildDisplay(item).then(function (display) { return { item: item, display: display }; });
    }).then(function (r) {
      if (!r || token !== preview.token || !bannerReady() || theaterOn) return;
      var P = MB();
      var parts = P.SlideCreator.createSlideElement(r.display, r.display.Type === 'Movie' ? 'Movie' : 'TV Show');
      if (!parts || !parts.slide) return;
      var slide = parts.slide;
      slide.classList.add('jc-preview');
      slide.removeAttribute('data-item-id'); // keep Media Bar from treating it as one of its own slides
      slide.setAttribute('data-jc-preview-id', r.item.Id);
      decorateSlide(slide, r.display, r.item);

      var cont = container();
      pauseMediaBarTrailers();
      if (!preview.slide) {
        preview.hiddenSlide = cont.querySelector('.slide.active:not(.jc-preview)');
        if (preview.hiddenSlide) preview.hiddenSlide.classList.remove('active');
      }
      var old = preview.slide;
      cont.appendChild(slide);
      // short delay so the crossfade runs (setTimeout, not requestAnimationFrame, which stalls in background tabs)
      setTimeout(function () {
        slide.classList.add('active');
        var b = slide.querySelector('.backdrop'), l = slide.querySelector('.logo');
        if (b) b.classList.add('animate');
        if (l) l.classList.add('animate');
      }, 30);
      if (old) { old.classList.remove('active'); setTimeout(function () { old.remove(); }, 700); }
      preview.slide = slide;
      preview.id = r.item.Id;
      document.body.classList.add('jc-previewing');
      armExpiry();
    }).catch(function () { /* item not visible to this user or network hiccup: ignore */ });
  }

  function armExpiry() {
    clearTimeout(preview.expire);
    preview.expire = setTimeout(function () {
      preview.doneId = preview.id;   // the slideshow resumes; resting on the same card won't bring it back
      endPreview();
    }, PREVIEW_TIMEOUT_MS);
  }

  function endPreview() {
    preview.token++;
    clearTimeout(preview.timer);
    clearTimeout(preview.expire);
    if (!preview.slide) return;
    var s = preview.slide;
    s.classList.remove('active');
    setTimeout(function () { s.remove(); }, 700);
    preview.slide = null;
    preview.id = null;
    document.body.classList.remove('jc-previewing');
    var P = MB();
    if (P && P.STATE && P.SlideshowManager && bannerReady()) {
      // Resume the normal slideshow on the slide it was showing (restarts its trailer if it has one)
      try { P.SlideshowManager.updateCurrentSlide(P.STATE.slideshow.currentSlideIndex); } catch (e) {}
    } else if (preview.hiddenSlide) {
      preview.hiddenSlide.classList.add('active');
    }
    preview.hiddenSlide = null;
  }

  function cardFrom(el) {
    if (!el || !el.closest) return null;
    if (el.closest('#slides-container')) return null;
    var card = el.closest('.card[data-id], .jc-card[data-id]');
    if (!card) return null;
    if (SKIP_TYPES[card.getAttribute('data-type')]) return null;
    if (!card.closest('.homePage, .homeSectionsContainer, .verticalSection, #homeTab, [data-index="0"]')) return null;
    return card;
  }

  function schedule(card, delay) {
    var id = card.getAttribute('data-id');
    if (id === preview.id && preview.slide) return;          // already showing this one
    if (id === preview.doneId) return;
    clearTimeout(preview.timer);
    preview.timer = setTimeout(function () {
      if (!onHome() || theaterOn) return;
      showPreview(id);
    }, delay);
  }

  if (FOLLOW_SELECTION) {
    document.addEventListener('focusin', function (e) {
      if (!onHome()) return;
      var card = cardFrom(e.target);
      if (card) {
        if (card.getAttribute('data-id') !== preview.doneId) preview.doneId = null;
        schedule(card, FOCUS_DELAY_MS); return;
      }
      // Focus moved up to the banner or header: go back to the normal slideshow
      if (e.target.closest && (e.target.closest('#slides-container') || e.target.closest('.skinHeader'))) {
        clearTimeout(preview.timer);
        if (preview.slide && !(e.target.closest('.slide.jc-preview'))) endPreview();
      }
    }, true);
    document.addEventListener('mouseover', function (e) {
      if (!onHome()) return;
      var card = cardFrom(e.target);
      if (card) schedule(card, HOVER_DELAY_MS);
    }, true);
    document.addEventListener('mouseout', function (e) {
      var card = cardFrom(e.target);
      if (card && !(e.relatedTarget && card.contains(e.relatedTarget))) {
        clearTimeout(preview.timer);
        if (card.getAttribute('data-id') === preview.doneId) preview.doneId = null;   // left that card: it may preview again later
      }
    }, true);
    window.addEventListener('hashchange', function () { if (!onHome()) { preview.slide = null; preview.id = null; preview.hiddenSlide = null; document.body.classList.remove('jc-previewing'); clearTimeout(preview.timer); clearTimeout(preview.expire); } });
  }
  api.preview = showPreview;
  api.endPreview = endPreview;
  onUserChange(function () { endPreview(); });

  /* =====================================================================
     3. Top 10 This Week rows
     Ranking refreshed weekly from Playback Reporting by an admin browser; titles are looked up as the signed-in
     user, so each person only sees titles from libraries and ratings they're allowed.
     The ranking is stored on every account (DisplayPreferences "jc-top10", client "jellycinema"); see loadTop10 below.
     Settings: top10.*
     ===================================================================== */
  var TOP10 = cfg('top10.enabled', true);
  var top10Cache = null, top10Time = 0, top10Busy = false;
  onUserChange(function () { top10Cache = null; top10Time = 0; });
  var t10css = [
    '.jc-top10 .jc-t10-scroller{display:flex;gap:1.6em;overflow-x:auto;overflow-y:hidden;padding:1.1em 3.3% calc(var(--jc-card-w,150px) * .24 + 10px);scroll-behavior:smooth;scrollbar-width:none}',
    '.jc-top10 .jc-t10-scroller::-webkit-scrollbar{display:none}',
    '.jc-top10 .jc-t10-card{--jc-poster-w:clamp(110px,9.5vw,170px);position:relative;flex:0 0 auto;display:flex;align-items:flex-end;gap:.15em;',
    '  background:none;border:0;padding:0;margin:0;cursor:pointer;color:inherit;outline:none;overflow:visible;contain:none!important}',
    /* contain:none: Jellyfin gives every .card contain:content, which cut the bottom of the big outlined numbers off at the card's edge */
    /* number sits fully beside its poster, bottom-aligned, about 3/4 of the poster height */
    /* number fully beside its poster, standing on the poster's bottom edge: heavy numerals, near-black fill, light outline */
    "@font-face{font-family:'JC Rank';src:url('/JellyCinema/font/rank.woff2') format('woff2');font-display:swap}",
    '.jc-top10 .jc-t10-rank{position:relative;z-index:1;display:block;flex:0 0 auto;text-align:right;',
    '  font-size:calc(var(--jc-poster-w) * 1.18);line-height:.74;margin:0 .06em 0 0;padding:0;transform:scaleX(.84);transform-origin:right bottom;',
    '  font-family:"JC Rank","Arial Black","Helvetica Neue",Arial,sans-serif;font-weight:400;letter-spacing:0;',
    '  color:#141414;-webkit-text-stroke:.045em #d9d9d9;paint-order:stroke fill;user-select:none}',
    '.jc-top10 .jc-t10-card:nth-child(10) .jc-t10-rank{font-size:calc(var(--jc-poster-w) * .95);letter-spacing:-.08em;transform:scaleX(.66)}',
    '.jc-top10 .jc-t10-poster{position:relative;z-index:2;flex:0 0 auto;width:var(--jc-poster-w);aspect-ratio:2/3;border-radius:10px;overflow:hidden;background:#1f2937;',
    '  box-shadow:0 6px 18px rgba(0,0,0,.45);transition:transform .2s ease,box-shadow .2s ease}',
    '.jc-top10 .jc-t10-poster img{width:100%;height:100%;object-fit:cover;display:block}',
    '.jc-top10 .jc-t10-poster .jc-t10-name{position:absolute;inset:auto 0 0 0;padding:.5em;font-size:.85em;background:linear-gradient(transparent,rgba(0,0,0,.85));color:#fff}',
    '.jc-top10 .jc-t10-card:hover .jc-t10-poster,.jc-top10 .jc-t10-card:focus .jc-t10-poster{transform:none;box-shadow:0 10px 26px rgba(0,0,0,.6)}',
    '.jc-top10 .jc-t10-card:hover .jc-t10-poster img,.jc-top10 .jc-t10-card:focus .jc-t10-poster img{outline:4px solid var(--accentColor,#e0262b);outline-offset:-4px;border-radius:10px}',
    '.jc-top10 .jc-t10-poster::after{content:"";position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 0 0 4px var(--accentColor,#e0262b);opacity:0;transition:opacity .15s ease;pointer-events:none;z-index:3}',
    '.jc-top10 .jc-t10-card:hover .jc-t10-poster::after,.jc-top10 .jc-t10-card:focus .jc-t10-poster::after{opacity:1}',
    /* play button: see-through red, solid red when the mouse is on it (same as Jellyfin's rows) */
    '.jc-top10 .jc-t10-play{position:absolute;left:50%;top:50%;z-index:4;width:clamp(36px,32%,56px);aspect-ratio:1;border-radius:50%;transform:translate(-50%,-50%);',
    '  display:flex;align-items:center;justify-content:center;color:#fff;cursor:pointer;opacity:0;transition:opacity .15s ease,background .15s ease;',
    '  background:color-mix(in srgb,var(--accentColor,#e0262b) 55%,transparent)}',
    '.jc-top10 .jc-t10-play svg{width:55%;height:55%}',
    '.jc-top10 .jc-t10-card:hover .jc-t10-play,.jc-top10 .jc-t10-card:focus .jc-t10-play{opacity:1}',
    '.jc-top10 .jc-t10-play:hover{background:var(--accentColor,#e0262b)}',
    '.jc-indicators{position:absolute;top:.35em;right:.35em;z-index:4;display:flex;gap:.25em;pointer-events:none}'
  ].join('\n');
  function addT10Style() {
    if (document.getElementById('jc-top10-style')) return;
    var st = document.createElement('style'); st.id = 'jc-top10-style'; st.textContent = t10css;
    (document.head || document.documentElement).appendChild(st);
  }

  /* The ranking (top movies + top shows) is stored on every account as DisplayPreferences
     "jc-top10" (client "jellycinema"), written by an admin's browser. Each title is then looked up as the
     signed-in user: Jellyfin returns 404 for anything outside their libraries or above their rating
     limit, so each person gets their own top 10 from what they're allowed to watch. */
  function readRanking(uid) {
    var c = client();
    var get = function (key, cl) {
      return c.getJSON(c.getUrl('DisplayPreferences/' + key, { userId: uid, client: cl }))
        .then(function (d) { return (d && d.CustomPrefs) || {}; }).catch(function () { return {}; });
    };
    return get('jc-top10', 'jellycinema');
  }
  function resolveTop(uid, ids, want) {
    var c = client(), out = [], i = 0;
    function next() {
      if (out.length >= want || i >= ids.length) return Promise.resolve(out);
      var batch = ids.slice(i, i + 8); i += 8;
      return Promise.all(batch.map(function (id) {
        return c.getItem(uid, id).then(function (it) { return it; }).catch(function () { return null; });
      })).then(function (res) {
        res.forEach(function (it) { if (it && out.length < want) out.push(it); });
        return next();
      });
    }
    return next();
  }
  /* Accounts that can't open most of the ranked titles get short lists. top10.fillFromLibrary tops the
     row up to 10 with the best-rated titles from libraries THIS user can open (core query as the user,
     then the same per-title check), right after the real ranked titles. */
  function fillTop(uid, items, type) {
    if (items.length >= 10) return Promise.resolve(items);
    var c = client(), have = {};
    items.forEach(function (it) { have[it.Id] = 1; });
    return c.getJSON(c.getUrl('Items', { userId: uid, IncludeItemTypes: type, Recursive: true, SortBy: 'CommunityRating,SortName',
      SortOrder: 'Descending', HasPrimaryImage: true, EnableImageTypes: 'Primary', Limit: 40 }))
      .then(function (r) {
        var extra = (r.Items || []).filter(function (it) { return !have[it.Id] && it.ImageTags && it.ImageTags.Primary; });
        return verifyForUser(uid, extra.slice(0, 10 - items.length + 4));
      }).then(function (ok) { return items.concat(ok).slice(0, 10); }, function () { return items; });
  }
  function loadTop10() {
    var c = client(); if (!c || !c.getCurrentUserId()) return Promise.resolve(null);
    var uid = sameUser();
    if (top10Cache && Date.now() - top10Time < 10 * 60000) return Promise.resolve(top10Cache);
    return readRanking(uid).then(function (p) {
      var m = cfg('top10.movies', true) ? (p.movies || '').split(',').filter(Boolean) : [];
      var sh = cfg('top10.shows', true) ? (p.shows || '').split(',').filter(Boolean) : [];
      if (!m.length && !sh.length) return null;
      return Promise.all([resolveTop(uid, m, 10), resolveTop(uid, sh, 10)]).then(function (r) {
        if (!cfg('top10.fillFromLibrary', true)) return r;
        return Promise.all([
          cfg('top10.movies', true) ? fillTop(uid, r[0], 'Movie') : r[0],
          cfg('top10.shows', true) ? fillTop(uid, r[1], 'Series') : r[1]
        ]);
      }).then(function (r) {
        if (uid !== lastUid) return null;   // someone else signed in meanwhile: never show their list
        top10Cache = { movies: r[0], shows: r[1] };
        top10Time = Date.now();
        return top10Cache;
      });
    }).catch(function () { return null; });
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
  /* Play key on the remote / keyboard (Play, Play-Pause) on a highlighted Jelly Cinema poster starts it right away,
     like the play button does for the mouse. Enter still opens the details page. */
  var PLAY_KEYS = { MediaPlayPause: 1, MediaPlay: 1, Play: 1 };
  document.addEventListener('keydown', function (e) {
    if (!PLAY_KEYS[e.key] && e.keyCode !== 415 && e.keyCode !== 179 && e.keyCode !== 250) return;
    var ae = document.activeElement, card = ae && ae.closest && ae.closest('.jc-t10-card, .jc-seasonal-row .jc-card, .jc-hmx .jc-card');
    var it = card && card._jcItem;
    if (!it) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (typeof window.JellyCinemaPlay === 'function' && window.JellyCinemaPlay(it)) return;
    playItem(it);
  }, true);

  function buildRow(title, items, key) {
    var c = client();
    var sec = document.createElement('div');
    sec.className = 'verticalSection jc-top10 jc-top10-' + key;
    var h = document.createElement('div');
    h.className = 'sectionTitleContainer sectionTitleContainer-cards padded-left';
    var h2 = document.createElement('h2');
    h2.className = 'sectionTitle sectionTitle-cards';
    h2.textContent = title;
    h.appendChild(h2);
    sec.appendChild(h);
    var sc = document.createElement('div');
    sc.className = 'jc-t10-scroller';
    items.forEach(function (it, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'card jc-t10-card focusable';
      b.setAttribute('data-id', it.Id);
      b.setAttribute('data-type', it.Type);
      b.setAttribute('aria-label', '#' + (i + 1) + ' ' + it.Name);
      var n = document.createElement('span'); n.className = 'jc-t10-rank'; n.textContent = String(i + 1);
      var p = document.createElement('span'); p.className = 'jc-t10-poster';
      if (it.ImageTags && it.ImageTags.Primary) {
        var img = document.createElement('img'); img.loading = 'lazy'; img.alt = '';
        img.src = c.getUrl('Items/' + it.Id + '/Images/Primary', { tag: it.ImageTags.Primary, maxHeight: 360, quality: 85 });
        p.appendChild(img);
      } else {
        var nm = document.createElement('span'); nm.className = 'jc-t10-name'; nm.textContent = it.Name; p.appendChild(nm);
      }
      // round play button on the poster when hovered or highlighted, like Jellyfin's own rows (plays right away)
      var pl = document.createElement('span'); pl.className = 'jc-t10-play'; pl.setAttribute('aria-hidden', 'true');
      pl.title = 'Play';
      pl.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5.5v13l10.5-6.5z"/></svg>';
      pl.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); playItem(it); });
      p.appendChild(pl);
      addIndicators(p, it);
      b._jcItem = it;
      b.appendChild(n); b.appendChild(p);
      b.addEventListener('click', function (e) { e.preventDefault(); openDetails(it); });
      sc.appendChild(b);
    });
    sec.appendChild(sc);
    return sec;
  }

  function placeTop10() {
    if (!TOP10 || !onHome() || top10Busy) return;
    var host = document.querySelector('.homeSectionsContainer');
    if (!host || host.querySelector('.jc-top10:not(.jc-picks):not(.jc-genre-extra)')) return;
    if (!host.querySelector('.verticalSection')) return; // wait until Home has rendered its rows
    top10Busy = true;
    loadTop10().then(function (d) {
      top10Busy = false;
      if (!d || !onHome()) return;
      host = document.querySelector('.homeSectionsContainer');
      if (!host || host.querySelector('.jc-top10:not(.jc-picks):not(.jc-genre-extra)')) return;
      var after = null; // Top 10 goes first on Home (orderTopRows keeps it there)
      var frag = document.createDocumentFragment();
      var minN = cfg('top10.minTitles', 3);
      if (d.movies.length >= minN) frag.appendChild(buildRow(T(cfg('top10.moviesTitle', 'Top 10 Movies This Week')), d.movies, 'movies'));
      if (d.shows.length >= minN) frag.appendChild(buildRow(T(cfg('top10.showsTitle', 'Top 10 Shows This Week')), d.shows, 'shows'));
      if (!frag.childNodes.length) return;
      if (after && after.parentNode === host) host.insertBefore(frag, after.nextSibling);
      else host.insertBefore(frag, host.firstChild);
      orderTopRows();
    });
  }

  /* Home order, the same as the TV app: Top 10 Movies, Top 10 Shows, the seasonal rows (Halloween...),
     "<brand> Picks", then Jellyfin's own rows. Rows are added at different moments by
     different scripts, so this puts them back in that order whenever Home changes. */
  function orderTopRows() {
    var host = document.querySelector('.homeSectionsContainer'); if (!host) return;
    var want = [].concat(
      [].slice.call(host.querySelectorAll(':scope > .jc-top10-movies')),
      [].slice.call(host.querySelectorAll(':scope > .jc-top10-shows')),
      [].slice.call(host.querySelectorAll(':scope > .jc-seasonal-row')),
      [].slice.call(host.querySelectorAll(':scope > .jc-hmx')),
      [].slice.call(host.querySelectorAll(':scope > .jc-picks'))
    );
    if (!want.length) return;
    // already in order at the top? leave the page alone (no flicker, keeps focus)
    var ok = true;
    for (var i = 0; i < want.length; i++) if (host.children[i] !== want[i]) { ok = false; break; }
    if (ok) return;
    var focused = document.activeElement;
    var ref = host.firstChild;
    want.forEach(function (sec) { if (sec !== ref) host.insertBefore(sec, ref); else ref = ref.nextSibling; });
    if (focused && focused !== document.activeElement && focused.focus) { try { focused.focus({ preventScroll: true }); } catch (e) {} }
  }
  api.orderTopRows = orderTopRows;
  (function () {
    var t = null;
    new MutationObserver(function () {
      if (!onHome()) return;
      clearTimeout(t);
      t = setTimeout(orderTopRows, 300);
    }).observe(document.documentElement, { childList: true, subtree: true });
  })();

  if (TOP10) {
    addT10Style();
    var t10Timer = null;
    new MutationObserver(function () {
      if (!onHome()) return;
      clearTimeout(t10Timer);
      t10Timer = setTimeout(placeTop10, 400);
    }).observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('hashchange', function () { setTimeout(placeTop10, 800); });
    setTimeout(placeTop10, 1500);
  }
  /* ---------- Top 10 weekly self-refresh ----------
     When an admin opens Jellyfin and the ranking is more than top10.refreshDays old, recompute it from
     Playback Reporting and save it to every account's "jc-top10" preferences.
     Ranking: last 7 days first (plays over top10.minPlaySeconds; most viewers, then most plays; episodes count toward
     their show), then the last 30 days, then all-time history to fill out the list, up to top10.keep movies and shows.
     Non-admins never do this. Force it from the console with JellyCinema.refreshTop10(). */
  var TOP10_MAX_AGE_DAYS = cfg('top10.refreshDays', 6), TOP10_KEEP = cfg('top10.keep', 60), MIN_PLAY = Math.max(0, parseInt(cfg('top10.minPlaySeconds', 300), 10) || 0);
  /* Ranking without Playback Reporting: every user's played movies and episodes from Jellyfin itself
     (admin-only call), counted by how many people watched each title in the last 7 days, then 30 days,
     then ever. Episodes count toward their show. Only used to ORDER titles; each viewer's row is
     still looked up as that viewer, so nobody sees a title outside their access. */
  function rankFromUserData() {
    var c = client();
    return c.getJSON(c.getUrl('Users')).then(function (users) {
      return Promise.all(users.map(function (u) {
        return c.getJSON(c.getUrl('Items', { userId: u.Id, Recursive: true, IsPlayed: true, IncludeItemTypes: 'Movie,Episode',
          Fields: 'SeriesId', SortBy: 'DatePlayed', SortOrder: 'Descending', Limit: 1000, EnableImages: false }))
          .then(function (r) { return { uid: u.Id, items: r.Items || [] }; }, function () { return { uid: u.Id, items: [] }; });
      }));
    }).then(function (per) {
      var now = Date.now();
      function rank(days, type) {
        var agg = {};
        per.forEach(function (p) {
          p.items.forEach(function (it) {
            if (it.Type !== type) return;
            var d = it.UserData && it.UserData.LastPlayedDate ? Date.parse(it.UserData.LastPlayedDate) : 0;
            if (days && (!d || now - d > days * 864e5)) return;
            var key = type === 'Episode' ? it.SeriesId : it.Id; if (!key) return;
            var a = agg[key] = agg[key] || { users: {}, plays: 0 };
            a.users[p.uid] = 1; a.plays += (it.UserData && it.UserData.PlayCount) || 1;
          });
        });
        return Object.keys(agg).sort(function (x, y) {
          var ux = Object.keys(agg[x].users).length, uy = Object.keys(agg[y].users).length;
          return (uy - ux) || (agg[y].plays - agg[x].plays);
        });
      }
      function merge(lists) { var out = []; lists.forEach(function (l) { l.forEach(function (id) { if (out.indexOf(id) < 0) out.push(id); }); }); return out; }
      return { movies: merge([rank(7, 'Movie'), rank(30, 'Movie'), rank(0, 'Movie')]),
               shows: merge([rank(7, 'Episode'), rank(30, 'Episode'), rank(0, 'Episode')]) };
    });
  }
  function adminRefreshTop10(force) {
    var c = client(); if (!c || !c.getCurrentUserId()) return Promise.resolve('no user');
    var uid = c.getCurrentUserId();
    var norm = function (x) { return String(x).replace(/-/g, ''); };
    return c.getJSON(c.getUrl('Users/' + uid)).then(function (me) {
      if (!me || !me.Policy || !me.Policy.IsAdministrator) return 'not admin';
      return readRanking(uid).then(function (mine) {
        var age = mine.updated ? (Date.now() - new Date(mine.updated + 'T00:00:00').getTime()) / 86400000 : 999;
        if (!force && age < TOP10_MAX_AGE_DAYS) return 'fresh';
        var prFailed = false;   // Playback Reporting not installed: rank from Jellyfin's own watch data instead
        var q = function (sql) {
          return c.ajax({ type: 'POST', url: c.getUrl('user_usage_stats/submit_custom_query'), contentType: 'application/json', dataType: 'json',
            data: JSON.stringify({ CustomQueryString: sql, ReplaceUserId: false }) }).then(function (x) { return x.results || []; }, function () { prFailed = true; return []; });
        };
        var win = function (days) { return "DateCreated > datetime('now','-" + days + " days') AND PlayDuration > " + MIN_PLAY; };
        return Promise.all([
          q("SELECT ItemId, COUNT(DISTINCT UserId) v, COUNT(*) p, MAX(ItemName) n FROM PlaybackActivity WHERE ItemType='Movie' AND " + win(7) + " GROUP BY ItemId ORDER BY v DESC, p DESC LIMIT 60"),
          q("SELECT ItemId, COUNT(DISTINCT UserId) v, COUNT(*) p, MAX(ItemName) n FROM PlaybackActivity WHERE ItemType='Movie' AND " + win(30) + " GROUP BY ItemId ORDER BY v DESC, p DESC LIMIT 120"),
          q("SELECT ItemId, UserId, COUNT(*) p, MAX(ItemName) n FROM PlaybackActivity WHERE ItemType='Episode' AND " + win(7) + " GROUP BY ItemId, UserId"),
          q("SELECT ItemId, UserId, COUNT(*) p, MAX(ItemName) n FROM PlaybackActivity WHERE ItemType='Episode' AND " + win(30) + " GROUP BY ItemId, UserId"),
          q("SELECT ItemId, COUNT(DISTINCT UserId) v, COUNT(*) p, MAX(ItemName) n FROM PlaybackActivity WHERE ItemType='Movie' AND " + win(3650) + " GROUP BY ItemId ORDER BY v DESC, p DESC LIMIT 200"),
          q("SELECT ItemId, UserId, COUNT(*) p, MAX(ItemName) n FROM PlaybackActivity WHERE ItemType='Episode' AND " + win(3650) + " GROUP BY ItemId, UserId")
        ]).then(function (res) {
          var epIds = Array.from(new Set(res[2].concat(res[3], res[5]).map(function (r) { return r[0]; })));
          var mvIds = Array.from(new Set(res[0].concat(res[1], res[4]).map(function (r) { return r[0]; })));
          var chunk = function (arr, n) { var o = []; for (var i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o; };
          var look = function (ids, fields) {
            return Promise.all(chunk(ids, 60).map(function (ch) { return c.getJSON(c.getUrl('Items', { Ids: ch.join(','), Fields: fields || '' })); }))
              .then(function (ls) { var o = []; ls.forEach(function (l) { o = o.concat(l.Items || []); }); return o; });
          };
          return Promise.all([look(epIds, 'SeriesId'), look(mvIds)]).then(function (lk) {
            var epSeries = {}, mvOk = {};
            lk[0].forEach(function (x) { epSeries[norm(x.Id)] = x.SeriesId; });
            lk[1].forEach(function (x) { mvOk[norm(x.Id)] = x.Id; });
            // Titles that were re-added to the library get new IDs, so old plays point at IDs that no longer
            // exist. Match those plays to today's titles by name (movies by title, episodes by show name).
            var nameKey = function (t) { return String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); };
            var missMv = {}, missEp = {};
            res[0].concat(res[1], res[4]).forEach(function (r) { if (!mvOk[norm(r[0])] && r[3]) missMv[nameKey(r[3])] = r[3]; });
            res[2].concat(res[3], res[5]).forEach(function (r) {
              if (!epSeries[norm(r[0])] && r[3]) { var sn = String(r[3]).split(' - ')[0]; missEp[nameKey(sn)] = sn; }
            });
            var findByName = function (type, name) {
              return c.getJSON(c.getUrl('Items', { Recursive: true, IncludeItemTypes: type, SearchTerm: name, Limit: 10 }))
                .then(function (r) {
                  var k = nameKey(name);
                  var hit = (r.Items || []).filter(function (i) { return nameKey(i.Name) === k; })[0];
                  return hit ? hit.Id : null;
                }).catch(function () { return null; });
            };
            var mvNames = Object.keys(missMv), epNames = Object.keys(missEp), mvByName = {}, srByName = {};
            var runSeq = function (keys, fn) {
              var i = 0;
              var step = function () {
                if (i >= keys.length) return Promise.resolve();
                var b = keys.slice(i, i + 6); i += 6;
                return Promise.all(b.map(fn)).then(step);
              };
              return step();
            };
            return runSeq(mvNames, function (k) { return findByName('Movie', missMv[k]).then(function (id) { if (id) mvByName[k] = id; }); })
            .then(function () { return runSeq(epNames, function (k) { return findByName('Series', missEp[k]).then(function (id) { if (id) srByName[k] = id; }); }); })
            .then(function () {
            res[0].concat(res[1], res[4]).forEach(function (r) { if (!mvOk[norm(r[0])] && r[3] && mvByName[nameKey(r[3])]) mvOk[norm(r[0])] = mvByName[nameKey(r[3])]; });
            res[2].concat(res[3], res[5]).forEach(function (r) {
              if (!epSeries[norm(r[0])] && r[3]) { var sid = srByName[nameKey(String(r[3]).split(' - ')[0])]; if (sid) epSeries[norm(r[0])] = sid; }
            });
            var movies = [];
            res[0].concat(res[1], res[4]).forEach(function (r) { var id = mvOk[norm(r[0])]; if (id && movies.indexOf(id) < 0) movies.push(id); });
            var rankShows = function (rows) {
              var ser = {};
              rows.forEach(function (r) {
                var sid = epSeries[norm(r[0])]; if (!sid) return;
                ser[sid] = ser[sid] || { users: {}, p: 0 };
                ser[sid].users[r[1]] = 1; ser[sid].p += (+r[2]);
              });
              return Object.keys(ser).sort(function (a, b) {
                var ua = Object.keys(ser[a].users).length, ub = Object.keys(ser[b].users).length;
                return (ub - ua) || (ser[b].p - ser[a].p);
              });
            };
            var shows = [];
            rankShows(res[2]).concat(rankShows(res[3]), rankShows(res[5])).forEach(function (id) { if (shows.indexOf(id) < 0) shows.push(id); });
            movies = movies.slice(0, TOP10_KEEP); shows = shows.slice(0, TOP10_KEEP);
            return (prFailed ? rankFromUserData() : Promise.resolve({ movies: movies, shows: shows })).then(function (rk) {
            movies = rk.movies.slice(0, TOP10_KEEP); shows = rk.shows.slice(0, TOP10_KEEP);
            var prefs = { movies: movies.join(','), shows: shows.join(','), updated: new Date().toISOString().slice(0, 10) };
            return c.getJSON(c.getUrl('Users')).then(function (users) {
              return Promise.all(users.map(function (u) {
                var body = { Id: 'jc-top10', Client: 'jellycinema', SortBy: 'SortName', SortOrder: 'Ascending', RememberIndexing: false,
                  RememberSorting: false, ShowBackdrop: false, ShowSidebar: false, PrimaryImageHeight: 0, PrimaryImageWidth: 0,
                  ScrollDirection: 'Horizontal', IndexBy: null, CustomPrefs: prefs };
                return c.ajax({ type: 'POST', url: c.getUrl('DisplayPreferences/jc-top10', { userId: u.Id, client: 'jellycinema' }),
                  data: JSON.stringify(body), contentType: 'application/json' }).then(function () { return 1; }, function () { return 0; });
              })).then(function (ok) {
                top10Cache = null;
                document.querySelectorAll('.jc-top10:not(.jc-picks):not(.jc-genre-extra)').forEach(function (n) { n.remove(); });
                placeTop10();
                return 'refreshed (' + movies.length + ' movies, ' + shows.length + ' shows ranked from ' +
                  (prFailed ? "Jellyfin's watch data" : 'Playback Reporting') + '; saved for ' +
                  ok.reduce(function (a, b) { return a + b; }, 0) + '/' + users.length + ' accounts)';
              });
            });
            });
            });
          });
        });
      });
    }).catch(function (e) { return 'error ' + (e && e.status); });
  }
  api.refreshTop10 = function () { return adminRefreshTop10(true); };
  if (TOP10) setTimeout(function () { adminRefreshTop10(false).then(function (r) { if (r && r.indexOf('refreshed') === 0) console.log('JellyCinema Top 10 ' + r); }); }, 8000);

  api.top10 = function () { top10Cache = null; document.querySelectorAll('.jc-top10:not(.jc-picks):not(.jc-genre-extra)').forEach(function (n) { n.remove(); }); placeTop10(); };

  /* =====================================================================
     5. Picks row (picks.*)
     A row of well-rated family movies (picks.ratings, picks.minScore and up) that this viewer
     hasn't watched. Picks change every week; the same movies are picked for everyone who can
     access them, so the family sees the same list. Uses the viewer's own access and ratings.
     ===================================================================== */
  var PICKS = cfg('picks.enabled', true);
  var PICKS_DAYS = cfg('picks.days', [5, 6, 0]);            // 0 = Sunday
  var PICKS_COUNT = cfg('picks.count', 8);
  var PICKS_TITLE = cfg('picks.title', null) || T('{0} Picks', BRAND);
  var FAMILY_RATINGS = {};
  cfg('picks.ratings', ['G', 'PG', 'TV-G', 'TV-PG', 'TV-Y', 'TV-Y7']).forEach(function (r) { FAMILY_RATINGS[r] = 1; });
  var picksCache = null, picksKey = '', picksBusy = false;
  onUserChange(function () { picksCache = null; picksKey = ''; });
  function weekKey() {
    var d = new Date(); d.setHours(0, 0, 0, 0);
    // Friday-based week so Fri/Sat/Sun share one set of picks
    var back = (d.getDay() + 2) % 7; d.setDate(d.getDate() - back);
    return d.toISOString().slice(0, 10);
  }
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function loadPicks() {
    var c = client(), wk = weekKey(), uid = sameUser();
    if (picksCache && picksKey === wk) return Promise.resolve(picksCache);
    var q = { userId: uid, IncludeItemTypes: 'Movie', Recursive: true, HasOfficialRating: true,
      MinCommunityRating: cfg('picks.minScore', 6.5), EnableImageTypes: 'Primary', Limit: 2000 };
    if (cfg('picks.unwatchedOnly', true)) q.IsPlayed = false;
    if (cfg('picks.maxRating', 'PG')) q.MaxOfficialRating = cfg('picks.maxRating', 'PG');
    return c.getJSON(c.getUrl('Items', q))
      .then(function (r) {
        var list = (r.Items || []).filter(function (i) { return FAMILY_RATINGS[i.OfficialRating] && i.ImageTags && i.ImageTags.Primary; });
        list.sort(function (a, b) { return hash(String(a.Id).replace(/-/g, '') + wk) - hash(String(b.Id).replace(/-/g, '') + wk); });
        return verifyForUser(uid, list.slice(0, PICKS_COUNT + 4));
      }).then(function (ok) {
        if (uid !== lastUid) return null;
        picksCache = ok.slice(0, PICKS_COUNT); picksKey = wk;
        return picksCache;
      }).catch(function () { return null; });
  }
  function placePicks() {
    if (!PICKS || !onHome() || picksBusy) return;
    if (PICKS_DAYS.indexOf(new Date().getDay()) < 0) return;
    var host = document.querySelector('.homeSectionsContainer');
    if (!host || host.querySelector('.jc-picks') || !host.querySelector('.verticalSection')) return;
    picksBusy = true;
    loadPicks().then(function (items) {
      picksBusy = false;
      host = document.querySelector('.homeSectionsContainer');
      if (!items || items.length < 3 || !host || host.querySelector('.jc-picks') || !onHome()) return;
      var sec = buildRow(PICKS_TITLE, items, 'picks');
      sec.classList.add('jc-picks');
      sec.querySelectorAll('.jc-t10-rank').forEach(function (n) { n.remove(); });
      sec.querySelectorAll('.jc-t10-card').forEach(function (b, i) { b.setAttribute('aria-label', items[i] ? items[i].Name : ''); });
      host.insertBefore(sec, host.firstChild);
      orderTopRows();
    });
  }
  if (PICKS) {
    var pkTimer = null;
    new MutationObserver(function () {
      if (!onHome()) return;
      clearTimeout(pkTimer);
      pkTimer = setTimeout(placePicks, 350);
    }).observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(placePicks, 1200);
  }
  api.picks = function (force) {
    document.querySelectorAll('.jc-picks').forEach(function (n) { n.remove(); });
    if (force) { var d = PICKS_DAYS; PICKS_DAYS = [new Date().getDay()]; placePicks(); PICKS_DAYS = d; } else placePicks();
  };

  /* =====================================================================
     6. Replace duplicate genre rows
     Home Screen Sections sometimes picks the same genre twice and the second copy renders empty.
     Swap each empty duplicate for a different genre this viewer actually watches (most-watched first),
     filled with that viewer's own movies (their libraries and rating limit only).
     ===================================================================== */
  var FIX_DUP_GENRES = cfg('rows.replaceDuplicateGenres', true);
  var genreRank = null, genreBusy = false;
  onUserChange(function () { genreRank = null; });
  function viewerGenres() {
    var c = client(), uid = sameUser();
    if (genreRank) return Promise.resolve(genreRank);
    return c.getJSON(c.getUrl('Items', { userId: uid, IncludeItemTypes: 'Movie', Recursive: true, IsPlayed: true,
      Fields: 'Genres', SortBy: 'DatePlayed', SortOrder: 'Descending', Limit: 300 })).then(function (r) {
      var cnt = {};
      (r.Items || []).forEach(function (i) { (i.Genres || []).forEach(function (g) { cnt[g] = (cnt[g] || 0) + 1; }); });
      genreRank = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; });
      return genreRank;
    }).catch(function () { return []; });
  }
  function fixDuplicateGenres() {
    if (!FIX_DUP_GENRES || !onHome() || genreBusy) return;
    var host = document.querySelector('.homeSectionsContainer'); if (!host) return;
    var seen = {}, dups = [];
    host.querySelectorAll(':scope > .verticalSection').forEach(function (sec) {
      var m = sec.className.match(/\bGenre-(\S+)/); if (!m) return;
      if (seen[m[1]]) { if (!sec.hasAttribute('data-jc-dup')) dups.push(sec); } else seen[m[1]] = 1;
    });
    if (!dups.length) return;
    genreBusy = true;
    viewerGenres().then(function (rank) {
      var shown = {};
      host.querySelectorAll(':scope > .verticalSection').forEach(function (sec) {
        var m = sec.className.match(/\bGenre-(\S+)/); if (m) shown[m[1].toLowerCase()] = 1;
        var g = sec.getAttribute('data-jc-genre'); if (g) shown[g.toLowerCase().replace(/\s+/g, '-')] = 1;
      });
      var c = client();
      return dups.reduce(function (chain, sec) {
        return chain.then(function () {
          sec.setAttribute('data-jc-dup', '1');
          sec.style.display = 'none';
          var g = rank.filter(function (x) { return !shown[x.toLowerCase().replace(/\s+/g, '-')]; })[0];
          if (!g) return;
          shown[g.toLowerCase().replace(/\s+/g, '-')] = 1;
          var uid = sameUser();
          return c.getJSON(c.getUrl('Items', { userId: uid, IncludeItemTypes: 'Movie', Recursive: true, Genres: g,
            SortBy: 'Random', Limit: 16, EnableImageTypes: 'Primary' })).then(function (r) {
            return verifyForUser(uid, (r.Items || []).filter(function (i) { return i.ImageTags && i.ImageTags.Primary; }));
          }).then(function (items) {
            if (items.length < 3 || uid !== lastUid) return;
            var row = buildRow(T('{0} Movies', g), items, 'genre');
            row.classList.add('jc-genre-extra');
            row.setAttribute('data-jc-genre', g);
            row.querySelectorAll('.jc-t10-rank').forEach(function (n) { n.remove(); });
            row.querySelectorAll('.jc-t10-card').forEach(function (b, i) { b.setAttribute('aria-label', items[i] ? items[i].Name : ''); });
            sec.parentNode.insertBefore(row, sec.nextSibling);
          });
        });
      }, Promise.resolve());
    }).then(function () { genreBusy = false; }, function () { genreBusy = false; });
  }

  /* =====================================================================
     7. Continue Watching cleanup
     Hide things you started more than STALE_DAYS ago and never came back to, so the row only shows
     what you're actually watching. Nothing is changed on the server; it's only hidden in the row.
     ===================================================================== */
  var STALE_DAYS = cfg('rows.continueWatchingHideAfterDays', 90);
  var HIDE_STALE_RESUME = STALE_DAYS > 0;
  var staleDone = false;
  onUserChange(function () { staleDone = false; });
  function hideStaleResume() {
    var c = client(); if (!c || !c.getCurrentUserId()) return;
    var uid = sameUser();
    if (!HIDE_STALE_RESUME || staleDone) return;
    staleDone = true;
    c.getJSON(c.getUrl('UserItems/Resume', { userId: uid, Limit: 200, EnableImageTypes: '' }))
      .then(function (r) {
        var cutoff = Date.now() - STALE_DAYS * 86400000;
        var stale = (r.Items || []).filter(function (i) {
          var d = i.UserData && i.UserData.LastPlayedDate ? new Date(i.UserData.LastPlayedDate).getTime() : 0;
          return d && d < cutoff;
        });
        if (!stale.length || uid !== lastUid) return;
        var sel = [];
        stale.forEach(function (i) {
          [i.Id, String(i.Id).replace(/-/g, '')].forEach(function (id) {
            sel.push('.verticalSection.ContinueWatching .card[data-id="' + id + '"]', '.verticalSection.ContinueWatchingNextUp .card[data-id="' + id + '"]');
          });
        });
        var st = document.createElement('style'); st.id = 'jc-hide-stale';
        st.textContent = sel.join(',') + '{display:none!important}';
        (document.head || document.documentElement).appendChild(st);
      }).catch(function () { staleDone = false; });
  }

  (function () {
    var t = null;
    new MutationObserver(function () {
      if (!onHome()) return;
      clearTimeout(t);
      t = setTimeout(function () { fixDuplicateGenres(); hideStaleResume(); }, 500);
    }).observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('hashchange', function () { genreRank = null; });
  })();

  /* =====================================================================
     9. Discover rows: Because You Watched, genre rows, Collections, Watch Again
     The same rows Home Screen Sections makes, built by Jelly Cinema itself, so a plain Jellyfin
     server gets them too. Setting rows.discover: 'auto' (default) = only when Home Screen Sections
     isn't drawing its own; true = always; false = never. Every title is checked as the signed-in
     user (their libraries, rating limit and blocked tags only).
     ===================================================================== */
  var DISCOVER = cfg('rows.discover', 'auto');
  var BYW_ROWS = cfg('rows.becauseYouWatched', 2);
  var GENRE_ROWS = cfg('rows.genreRows', 5);
  var COLLECTIONS_ROW = cfg('rows.collections', true);
  var WATCH_AGAIN_ROW = cfg('rows.watchAgain', true);
  var discoverBusy = false, discoverCache = null;
  onUserChange(function () { discoverCache = null; });

  function hssRows(host) {
    // Home Screen Sections marks its rows with these section classes
    return !!host.querySelector('.verticalSection.BecauseYouWatched, .verticalSection[class*="Genre-"], .verticalSection.WatchAgain, .verticalSection.Collections, .verticalSection[class*="BecauseYouWatched"]');
  }
  function q(c, params) { return c.getJSON(c.getUrl('Items', params)).then(function (r) { return r.Items || []; }, function () { return []; }); }
  function withPoster(list) { return list.filter(function (i) { return i.ImageTags && i.ImageTags.Primary; }); }

  // Discover rows are kept for 10 minutes in this browser tab (per user), so going back to Home or reloading
  // the page shows them at once instead of asking the server again.
  var DISCOVER_KEEP_MS = 10 * 60000;
  function discoverStored(uid) {
    try {
      var x = JSON.parse(sessionStorage.getItem('jc.discover') || 'null');
      if (x && x.uid === uid && x.ver === cfg('version', '') && Date.now() - x.at < DISCOVER_KEEP_MS && Array.isArray(x.rows)) return x.rows;
    } catch (e) {}
    return null;
  }
  function loadDiscover() {
    var c = client(), uid = sameUser();
    if (discoverCache) return Promise.resolve(discoverCache);
    var stored = discoverStored(uid);
    if (stored) { discoverCache = stored; return Promise.resolve(stored); }
    var rows = [];
    var recent = q(c, { userId: uid, IncludeItemTypes: 'Movie,Episode', Recursive: true, IsPlayed: true,
      SortBy: 'DatePlayed', SortOrder: 'Descending', Limit: 30 });
    var because = BYW_ROWS > 0 ? recent.then(function (items) {
      var seen = {}, seeds = [];
      items.forEach(function (i) {
        var id = i.Type === 'Episode' ? i.SeriesId : i.Id, name = i.Type === 'Episode' ? i.SeriesName : i.Name;
        if (id && name && !seen[id]) { seen[id] = 1; seeds.push({ id: id, name: name }); }
      });
      // all lookups at once (faster), keep the first ones with enough titles
      return Promise.all(seeds.slice(0, BYW_ROWS + 2).map(function (sd) {
        return c.getJSON(c.getUrl('Items/' + sd.id + '/Similar', { userId: uid, Limit: 20, Fields: 'PrimaryImageAspectRatio' }))
          .then(function (r) {
            var l = withPoster((r.Items || []).filter(function (i) { return !(i.UserData && i.UserData.Played); }));
            return verifyForUser(uid, l);
          }, function () { return []; })
          .then(function (ok) { return ok.length >= 4 ? { title: T('Because You Watched {0}', sd.name), items: ok, key: 'byw' } : null; });
      })).then(function (rs) { return rs.filter(Boolean).slice(0, BYW_ROWS); });
    }) : Promise.resolve([]);
    var genres = GENRE_ROWS > 0 ? q(c, { userId: uid, IncludeItemTypes: 'Movie,Series,Episode', Recursive: true, IsPlayed: true,
      Fields: 'Genres', SortBy: 'DatePlayed', SortOrder: 'Descending', Limit: 300 }).then(function (items) {
      var cnt = {};
      items.forEach(function (i) { (i.Genres || []).forEach(function (g) { cnt[g] = (cnt[g] || 0) + 1; }); });
      var rank = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; });
      var more = rank.length >= GENRE_ROWS ? Promise.resolve(rank) :
        c.getJSON(c.getUrl('Genres', { userId: uid, IncludeItemTypes: 'Movie', Limit: 40 })).then(function (r) {
          var all = (r.Items || []).map(function (g) { return g.Name; }).sort(function () { return Math.random() - 0.5; });
          return rank.concat(all.filter(function (g) { return rank.indexOf(g) < 0; }));
        }, function () { return rank; });
      return more.then(function (list) {
        // a few more genres than needed, all at once; keep the first ones (in order) with enough movies
        return Promise.all(list.slice(0, GENRE_ROWS + 3).map(function (g) {
          return q(c, { userId: uid, IncludeItemTypes: 'Movie', Recursive: true, Genres: g, SortBy: 'Random', Limit: 24, EnableImageTypes: 'Primary' })
            .then(function (l) {
              l = withPoster(l).sort(function (a, b) { return ((a.UserData && a.UserData.Played) ? 1 : 0) - ((b.UserData && b.UserData.Played) ? 1 : 0); });
              return verifyForUser(uid, l);
            })
            .then(function (ok) { return ok.length >= 6 ? { title: T('{0} Movies', g), items: ok, key: 'genre', genre: g } : null; });
        })).then(function (rs) { return rs.filter(Boolean).slice(0, GENRE_ROWS); });
      });
    }) : Promise.resolve([]);
    // Collections: hidden for accounts with a rating limit (kids saw grown-up collection names)
    var collections = COLLECTIONS_ROW ? c.getCurrentUser().then(function (u) {
      if (u && u.Policy && u.Policy.MaxParentalRating != null) return [];
      return q(c, { userId: uid, IncludeItemTypes: 'BoxSet', Recursive: true, SortBy: 'Random', Limit: 24, EnableImageTypes: 'Primary' })
        .then(function (l) { return verifyForUser(uid, withPoster(l)); })
        .then(function (ok) { return ok.length >= 3 ? [{ title: T('Collections'), items: ok, key: 'collections' }] : []; });
    }, function () { return []; }) : Promise.resolve([]);
    var again = WATCH_AGAIN_ROW ? q(c, { userId: uid, IncludeItemTypes: 'Movie,Series', Recursive: true, IsPlayed: true,
      SortBy: 'DatePlayed', SortOrder: 'Descending', Limit: 24, EnableImageTypes: 'Primary' })
      .then(function (l) { return verifyForUser(uid, withPoster(l)); })
      .then(function (ok) { return ok.length >= 3 ? [{ title: T('Watch Again'), items: ok, key: 'again' }] : []; }) : Promise.resolve([]);
    return Promise.all([because, genres, collections, again]).then(function (r) {
      if (uid !== lastUid) return null;
      discoverCache = r[0].concat(r[1], r[2], r[3]);
      try { sessionStorage.setItem('jc.discover', JSON.stringify({ uid: uid, ver: cfg('version', ''), at: Date.now(), rows: discoverCache })); } catch (e) {}
      return discoverCache;
    }).catch(function () { return null; });
  }

  function placeDiscover() {
    if (DISCOVER === false || !onHome() || discoverBusy) return;
    var host = document.querySelector('.homeSectionsContainer');
    if (!host || host.querySelector('.jc-discover') || !host.querySelector('.verticalSection')) return;
    if (DISCOVER === 'auto' && hssRows(host)) return;
    discoverBusy = true;
    loadDiscover().then(function (rows) {
      discoverBusy = false;
      host = document.querySelector('.homeSectionsContainer');
      if (!rows || !rows.length || !host || host.querySelector('.jc-discover') || !onHome()) return;
      if (DISCOVER === 'auto' && hssRows(host)) return;
      var frag = document.createDocumentFragment();
      rows.forEach(function (r) {
        var sec = buildRow(r.title, r.items, r.key);
        sec.classList.add('jc-discover', 'jc-genre-extra');
        if (r.genre) sec.setAttribute('data-jc-genre', r.genre);
        sec.querySelectorAll('.jc-t10-rank').forEach(function (n) { n.remove(); });
        sec.querySelectorAll('.jc-t10-card').forEach(function (b, i) { b.setAttribute('aria-label', r.items[i] ? r.items[i].Name : ''); });
        frag.appendChild(sec);
      });
      // after Recently Added, i.e. at the end of Jellyfin's own rows
      host.appendChild(frag);
    }, function () { discoverBusy = false; });
  }
  if (DISCOVER !== false) {
    var dsTimer = null;
    new MutationObserver(function () {
      if (!onHome()) return;
      clearTimeout(dsTimer);
      // give Home Screen Sections time to draw its rows first, so 'auto' can see them
      dsTimer = setTimeout(placeDiscover, 2500);
    }).observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(placeDiscover, 3000);
  }
  api.discover = function () {
    discoverCache = null; try { sessionStorage.removeItem('jc.discover'); } catch (e) {}
    document.querySelectorAll('.jc-discover').forEach(function (n) { n.remove(); });
    var d = DISCOVER; DISCOVER = true; placeDiscover(); DISCOVER = d;
  };

  /* =====================================================================
     8. Left / right on every row
     Big arrow buttons on both sides of every Home row (Jellyfin's rows and ours). They appear when you
     hover a row and hide at the ends. Arrow keys Left/Right move between cards in a row, and Up/Down
     jump to the row above/below (desktop layout only; TV layout already does this itself).
     ===================================================================== */
  var ROW_ARROWS = cfg('rows.arrows', true);
  var KEY_NAV = cfg('rows.keyboardNav', true);
  var arrowCss = [
    '.jc-arrow-host{position:relative}',
    '.jc-row-arrow{position:absolute;z-index:5;width:52px;height:96px;border:0;border-radius:12px;cursor:pointer;',
    '  display:flex;align-items:center;justify-content:center;color:#fff;font-size:34px;line-height:1;',
    '  background:rgba(10,12,18,.62);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);',
    '  box-shadow:0 4px 16px rgba(0,0,0,.45);opacity:0;pointer-events:none;transition:opacity .2s ease,background .2s ease}',
    '.jc-row-arrow.left{left:6px}.jc-row-arrow.right{right:6px}',
    '.jc-arrow-host:hover .jc-row-arrow.can,.jc-row-arrow.can:focus{opacity:1;pointer-events:auto}',
    '.jc-row-arrow:hover,.jc-row-arrow:focus{background:var(--accentColor,#e0262b);outline:none}',
    '@media (hover:none){.jc-row-arrow.can{opacity:.85;pointer-events:auto}}'
  ].join('\n');

  function scrollerOf(sec) {
    var list = sec.querySelectorAll('.emby-scroller, .jc-t10-scroller, .jc-scroll, .scrollX');
    for (var i = 0; i < list.length; i++) { if (list[i].scrollWidth > 0) return list[i]; }
    return null;
  }
  // Jellyfin's own rows slide their content with a transform (not normal scrolling); for those, the big
  // arrows press Jellyfin's small built-in scroll buttons and follow their enabled/disabled state.
  function nativeBtn(sec, dir) { return sec.querySelector('.emby-scrollbuttons button[data-direction="' + dir + '"]'); }
  function updateArrows(sec) {
    var sc = sec.__jcScroller; if (!sc) return;
    var l = sec.querySelector(':scope > .jc-row-arrow.left'), r = sec.querySelector(':scope > .jc-row-arrow.right');
    if (!l || !r) return;
    var nl = nativeBtn(sec, 'left'), nr = nativeBtn(sec, 'right');
    if (nl && nr) {
      var fits = sc.scrollWidth <= sc.clientWidth + 4;
      l.classList.toggle('can', !nl.disabled && !fits);
      r.classList.toggle('can', !nr.disabled && !fits);
    } else {
      var max = sc.scrollWidth - sc.clientWidth;
      l.classList.toggle('can', sc.scrollLeft > 4);
      r.classList.toggle('can', sc.scrollLeft < max - 4);
    }
    // keep arrows centred on the cards
    var top = sc.offsetTop + Math.max(0, (sc.offsetHeight - 96) / 2);
    l.style.top = r.style.top = top + 'px';
  }
  function addArrows(sec) {
    if (sec.__jcArrows) { updateArrows(sec); return; }
    var sc = scrollerOf(sec); if (!sc) return;
    sec.__jcArrows = true; sec.__jcScroller = sc;
    sec.classList.add('jc-arrow-host');
    ['left', 'right'].forEach(function (dir) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'jc-row-arrow ' + dir;
      b.setAttribute('aria-label', dir === 'left' ? 'Scroll left' : 'Scroll right');
      b.tabIndex = -1;
      b.textContent = dir === 'left' ? '‹' : '›';
      b.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var nb = nativeBtn(sec, dir);
        if (nb) { nb.click(); setTimeout(function () { updateArrows(sec); }, 450); return; }
        var amt = Math.max(200, sc.clientWidth * 0.8) * (dir === 'left' ? -1 : 1);
        sc.scrollBy({ left: amt, behavior: 'smooth' });
      });
      sec.appendChild(b);
    });
    sc.addEventListener('scroll', function () { updateArrows(sec); }, { passive: true });
    var sb = sec.querySelector('.emby-scrollbuttons');
    if (sb) new MutationObserver(function () { updateArrows(sec); }).observe(sb, { attributes: true, subtree: true, attributeFilter: ['disabled'] });
    updateArrows(sec);
  }
  function addAllArrows() {
    if (!ROW_ARROWS || !onHome()) return;
    document.querySelectorAll('.homeSectionsContainer > .verticalSection').forEach(function (sec) {
      if (sec.offsetHeight > 0) addArrows(sec);
    });
  }

  function isTvLayout() { return document.documentElement.classList.contains('layout-tv'); }
  function rowCards(sec) {
    return Array.prototype.filter.call(sec.querySelectorAll('.card[data-id], .jc-card[data-id]'), function (c) { return c.offsetParent !== null; });
  }
  function onKey(e) {
    if (!KEY_NAV || isTvLayout() || !onHome() || e.altKey || e.ctrlKey || e.metaKey) return;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key) < 0) return;
    var ae = document.activeElement;
    if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return;
    var card = ae && ae.closest ? ae.closest('.homeSectionsContainer .card[data-id], .homeSectionsContainer .jc-card[data-id]') : null;
    var rows = Array.prototype.filter.call(document.querySelectorAll('.homeSectionsContainer > .verticalSection'),
      function (s) { return s.offsetHeight > 0 && rowCards(s).length; });
    // walk the rows in the order they appear on screen (Top 10 / Picks rows are added at the end of
    // the page code but shown near the top, so page-code order skipped them)
    rows.sort(function (a, b) { return a.getBoundingClientRect().top - b.getBoundingClientRect().top; });
    if (!rows.length) return;
    var target = null;
    if (!card) {
      // nothing focused yet: Down/Right starts at the first card of the first row
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') target = rowCards(rows[0])[0];
    } else {
      var sec = card.closest('.verticalSection'), cards = rowCards(sec), i = cards.indexOf(card), ri = rows.indexOf(sec);
      if (e.key === 'ArrowRight') target = cards[i + 1];
      else if (e.key === 'ArrowLeft') target = cards[i - 1];
      else {
        var nr = rows[ri + (e.key === 'ArrowDown' ? 1 : -1)];
        if (nr) {
          // pick the card in the next row closest horizontally to the current one
          var x = card.getBoundingClientRect().left, best = null, bd = 1e9;
          rowCards(nr).forEach(function (c) { var d = Math.abs(c.getBoundingClientRect().left - x); if (d < bd) { bd = d; best = c; } });
          target = best;
        }
      }
    }
    if (target) {
      e.preventDefault();
      if (!target.hasAttribute('tabindex') && target.tagName !== 'BUTTON' && target.tagName !== 'A') target.setAttribute('tabindex', '0');
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    }
  }

  if (ROW_ARROWS || KEY_NAV) {
    var ast = document.createElement('style'); ast.id = 'jc-row-arrows'; ast.textContent = arrowCss;
    (document.head || document.documentElement).appendChild(ast);
    var arT = null;
    new MutationObserver(function () {
      if (!onHome()) return;
      clearTimeout(arT); arT = setTimeout(addAllArrows, 400);
    }).observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('resize', function () { document.querySelectorAll('.jc-arrow-host').forEach(updateArrows); });
    if (KEY_NAV) document.addEventListener('keydown', onKey, true);
  }

  /* =====================================================================
     4. Trailer reliability
     Some YouTube trailers refuse to play inside other sites ("embedding disabled", errors 101/150/151...).
     Media Bar then gives up and retries the same broken trailer next time. This remembers broken
     trailers in this browser and switches to the movie's next-best trailer instead.
     ===================================================================== */
  var TRAILER_FALLBACK = cfg('banner.trailerFallback', true);
  var BAD_KEY = 'jc.badTrailers2';   // new list: the old one also held trailers that only failed once
  function badSet() {
    try {
      return new Set(JSON.parse(localStorage.getItem(BAD_KEY) || '[]'));
    } catch (e) { return new Set(); }
  }
  function markBad(id) {
    if (!id) return;
    try {
      var a = Array.from(badSet()); if (a.indexOf(id) < 0) a.push(id);
      localStorage.setItem(BAD_KEY, JSON.stringify(a.slice(-500)));
    } catch (e) {}
  }
  function ytId(url) {
    try {
      var u = new URL(url), h = u.hostname.replace(/^www\./, '');
      if (h === 'youtu.be') return u.pathname.split('/')[1] || null;
      if ((h === 'youtube.com' || h === 'm.youtube.com') && u.pathname.indexOf('/embed/') === 0) return u.pathname.split('/')[2] || null;
      return u.searchParams.get('v');
    } catch (e) { return null; }
  }
  function patchTrailers() {
    var P = MB();
    if (!P || !P.SlideCreator || !P.SlideshowManager || P.SlideCreator.__jcPatched) return !!(P && P.SlideCreator && P.SlideCreator.__jcPatched);
    var origSelect = P.SlideCreator.selectTrailerVideoId;
    P.SlideCreator.selectTrailerVideoId = function (remote) {
      var bad = badSet();
      var ok = (remote || []).filter(function (t) { var id = ytId(t && t.Url); return id && !bad.has(id); });
      return origSelect.call(this, ok);
    };
    var origError = P.SlideshowManager.onPlayerError;
    var tries = {};
    P.SlideshowManager.onPlayerError = function (event, itemId, container) {
      try {
        var S = P.STATE.slideshow, code = event && event.data;
        var vid = S.slideVideoIds[itemId];
        if (code !== 'local' && vid && String(vid).indexOf('local:') !== 0) {
          // remember only trailers YouTube will never play here (removed, embedding off, age-restricted = 151);
          // other errors can be temporary, so those trailers get tried again another time
          if ([100, 101, 150, 151].indexOf(Number(code)) >= 0) markBad(vid);
          tries[itemId] = (tries[itemId] || 0) + 1;
          var item = S.loadedItems[itemId];
          var next = item && tries[itemId] <= 3 ? P.SlideCreator.selectTrailerVideoId(item.RemoteTrailers) : null;
          var player = S.players[itemId];
          if (next && next !== vid && player && typeof player.loadVideoById === 'function') {
            console.log('JellyCinema: trailer ' + vid + ' blocked (error ' + code + '); trying ' + next);
            S.slideVideoIds[itemId] = next;
            player.loadVideoById({ videoId: next });
            try { player.mute(); } catch (e) {}
            return;
          }
        }
      } catch (e) {}
      return origError.apply(this, arguments);
    };
    P.SlideCreator.__jcPatched = true;
    return true;
  }
  // the banner puts titles whose trailers all refused to play at the end of its rotation
  window.JellyCinema = window.JellyCinema || {};
  window.JellyCinema.badTrailers = badSet;
  if (TRAILER_FALLBACK) {
    var tp = 0, tpi = setInterval(function () { if (patchTrailers() || ++tp > 240) clearInterval(tpi); }, 250);
  }

  /* =====================================================================
     2. Theater Mode (theaterMode.*)
     ===================================================================== */
  var theaterOn = false, lastInput = Date.now(), swallowUntil = 0, lastX = null, lastY = null;

  function dialogOpen() {
    return !!document.querySelector('.dialogContainer .dialog, .MuiDialog-root, .MuiModal-root:not(.MuiModal-hidden), .videoPlayerContainer, .nowPlayingBar:not(.hide) .nowPlayingBarTop:hover');
  }

  function enterTheater() {
    if (theaterOn) return;
    endPreview();
    theaterOn = true;
    document.body.classList.add('jc-theater');
    try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch (e) {}
  }
  function exitTheater() {
    if (!theaterOn) return;
    theaterOn = false;
    document.body.classList.remove('jc-theater');
  }
  api.theater = function (on) { if (on) enterTheater(); else exitTheater(); };
  api.theaterActive = function () { return theaterOn; };

  function activity(e) {
    if (e.type === 'mousemove') {
      // ignore sub-pixel jitter
      if (lastX !== null && Math.abs(e.clientX - lastX) < 6 && Math.abs(e.clientY - lastY) < 6) return;
      lastX = e.clientX; lastY = e.clientY;
    }
    lastInput = Date.now();
    if (!theaterOn) return;
    exitTheater();
    if (e.type === 'keydown' || e.type === 'mousedown' || e.type === 'pointerdown' || e.type === 'touchstart') {
      // First press only wakes the screen: don't let it open or play anything
      swallowUntil = Date.now() + 600;
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }
  function swallow(e) {
    if (Date.now() < swallowUntil) { e.preventDefault(); e.stopImmediatePropagation(); }
  }

  if (THEATER_MODE) {
    ['keydown', 'mousedown', 'pointerdown', 'touchstart', 'wheel', 'mousemove'].forEach(function (t) {
      window.addEventListener(t, activity, { capture: true, passive: false });
    });
    ['keyup', 'keypress', 'mouseup', 'pointerup', 'click', 'touchend'].forEach(function (t) {
      window.addEventListener(t, swallow, { capture: true, passive: false });
    });
    window.addEventListener('hashchange', function () { lastInput = Date.now(); exitTheater(); });
    document.addEventListener('visibilitychange', function () { lastInput = Date.now(); });
    setInterval(function () {
      if (theaterOn) {
        if (!onHome() || dialogOpen()) exitTheater();
        return;
      }
      if (document.hidden || !onHome() || !bannerReady() || dialogOpen()) { lastInput = Date.now(); return; }
      var ae = document.activeElement;
      if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) { lastInput = Date.now(); return; }
      if (Date.now() - lastInput >= THEATER_IDLE_MS) enterTheater();
    }, 1000);
  }

  /* =====================================================================
     9. Permission checks
     JellyCinema.checkPermissions()  - checks every title on the current Home screen (all rows, Jelly Cinema's
                                       and Jellyfin's, plus every banner slide) as the signed-in user.
     JellyCinema.checkAllUsers()     - admin only: builds Jelly Cinema's Top 10, Picks and seasonal rows for
                                       EVERY user and compares each title with that user's full list of allowed
                                       movies and shows (a separate, independent lookup).
     Both resolve to a report; any leak is listed with the title, the row and the user.
     ===================================================================== */
  function rowName(el) {
    var sec = el.closest && el.closest('.verticalSection');
    var h = sec && sec.querySelector('.sectionTitle');
    if (h) return h.textContent.trim();
    return el.closest && el.closest('#slides-container') ? 'Banner' : 'Home';
  }
  api.checkPermissions = function () {
    var c = client(); if (!c || !c.getCurrentUserId()) return Promise.resolve({ error: 'not signed in' });
    var uid = c.getCurrentUserId(), seen = {}, list = [];
    document.querySelectorAll('.homeSectionsContainer [data-id], #slides-container [data-item-id], #slides-container [data-jc-preview-id]').forEach(function (el) {
      var id = el.getAttribute('data-id') || el.getAttribute('data-item-id') || el.getAttribute('data-jc-preview-id');
      if (!id || seen[id]) return; seen[id] = 1;
      list.push({ id: id, row: rowName(el), name: el.getAttribute('aria-label') || el.getAttribute('title') || '' });
    });
    var P = MB();
    if (P && P.STATE && P.STATE.slideshow && P.STATE.slideshow.itemIds) {
      P.STATE.slideshow.itemIds.forEach(function (id) { if (!seen[id]) { seen[id] = 1; list.push({ id: id, row: 'Banner (queued)', name: '' }); } });
    }
    var leaks = [], i = 0;
    function next() {
      if (i >= list.length) return Promise.resolve();
      var batch = list.slice(i, i + 10); i += 10;
      return Promise.all(batch.map(function (x) {
        return c.getItem(uid, x.id).then(function () {}, function (e) {
          if (e && (e.status === 404 || e.status === 403)) leaks.push(x);
        });
      })).then(next);
    }
    return next().then(function () {
      var r = { user: uid, titlesChecked: list.length, leaks: leaks.length, details: leaks };
      console.log('Jelly Cinema permission check: ' + list.length + ' titles checked, ' + leaks.length + ' not allowed for this user', leaks);
      return r;
    });
  };
  api.checkAllUsers = function () {
    var c = client(); if (!c || !c.getCurrentUserId()) return Promise.resolve({ error: 'not signed in' });
    return c.getJSON(c.getUrl('Users/' + c.getCurrentUserId())).then(function (me) {
      if (!me || !me.Policy || !me.Policy.IsAdministrator) return { error: 'admin only' };
      return c.getJSON(c.getUrl('Users')).then(function (users) {
        var report = [];
        return users.reduce(function (chain, u) {
          return chain.then(function () {
            // independent list of everything this user may open (core query, filtered by Jellyfin for this user)
            return c.getJSON(c.getUrl('Items', { userId: u.Id, Recursive: true, IncludeItemTypes: 'Movie,Series', Fields: '', EnableImages: false, EnableUserData: false }))
              .then(function (all) {
                var allowed = {};
                (all.Items || []).forEach(function (x) { allowed[String(x.Id).replace(/-/g, '')] = 1; });
                var rows = [];
                var top = readRanking(u.Id).then(function (p) {
                  var m = (p.movies || '').split(',').filter(Boolean), sh = (p.shows || '').split(',').filter(Boolean);
                  return Promise.all([resolveTop(u.Id, m, 10), resolveTop(u.Id, sh, 10)]).then(function (r) {
                    if (!cfg('top10.fillFromLibrary', true)) return r;
                    return Promise.all([fillTop(u.Id, r[0], 'Movie'), fillTop(u.Id, r[1], 'Series')]);
                  }).then(function (r) {
                    rows.push({ row: 'Top 10 Movies', items: r[0] }, { row: 'Top 10 Shows', items: r[1] });
                  });
                });
                var picks = c.getJSON(c.getUrl('Items', { userId: u.Id, IncludeItemTypes: 'Movie', Recursive: true, HasOfficialRating: true,
                  MinCommunityRating: cfg('picks.minScore', 6.5), MaxOfficialRating: cfg('picks.maxRating', 'PG') || undefined, EnableImageTypes: 'Primary', Limit: 2000 }))
                  .then(function (r) {
                    var l = (r.Items || []).filter(function (i) { return FAMILY_RATINGS[i.OfficialRating]; });
                    return verifyForUser(u.Id, l.slice(0, 60)).then(function (ok) { rows.push({ row: 'Picks (first 60 candidates)', items: ok }); });
                  });
                var S = window.JellyCinemaSeasonal;
                var seas = (S && S.rowsForUser) ? S.rowsForUser(u.Id).then(function (rs) { rs.forEach(function (x) { rows.push(x); }); }) : Promise.resolve();
                return Promise.all([top, picks, seas]).then(function () {
                  var leaks = [], n = 0;
                  rows.forEach(function (r) {
                    (r.items || []).forEach(function (it) {
                      n++;
                      if (!allowed[String(it.Id).replace(/-/g, '')]) leaks.push({ title: it.Name, row: r.row });
                    });
                  });
                  report.push({ user: u.Name, allowedTitles: Object.keys(allowed).length, titlesChecked: n, leaks: leaks });
                });
              });
          });
        }, Promise.resolve()).then(function () {
          var total = report.reduce(function (a, r) { return a + r.leaks.length; }, 0);
          console.log('Jelly Cinema permission check (all users): ' + total + ' leaks', report);
          return { users: report.length, leaks: total, report: report };
        });
      });
    });
  };
  /* =====================================================================
     TV app notice: once per browser, on Home, for server admins only (never for family / kid accounts),
     a small card says the Jelly Cinema TV app exists. It stays until the admin closes it or opens a link.
     Settings: tvAppNotice (false turns it off).
     ===================================================================== */
  (function () {
    if (cfg('tvAppNotice', true) === false) return;
    var KEY = 'jc.tvAppNotice.seen';
    function seen() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return true; } }
    function markSeen() { try { localStorage.setItem(KEY, '1'); } catch (e) {} }
    var busy = false;
    function maybeShow() {
      if (busy || seen() || !onHome() || document.getElementById('jc-tvapp-notice')) return;
      var c = client(); if (!c || !c.getCurrentUserId || !c.getCurrentUserId()) return;
      busy = true;
      c.getJSON(c.getUrl('Users/' + c.getCurrentUserId())).then(function (me) {
        busy = false;
        if (!me || !me.Policy || !me.Policy.IsAdministrator || seen() || !onHome()) return;
        var st = document.getElementById('jc-tvapp-style') || document.createElement('style');
        st.id = 'jc-tvapp-style';
        st.textContent =
          '#jc-tvapp-notice{position:fixed;right:24px;bottom:24px;z-index:100000;max-width:min(420px,calc(100vw - 32px));' +
          'background:#16181d;color:#fff;border:2px solid var(--accentColor,#e0262b);border-radius:14px;padding:16px 18px 14px;' +
          'box-shadow:0 12px 40px rgba(0,0,0,.6);font-size:15px;line-height:1.4;animation:jcTvIn .45s ease}' +
          '@keyframes jcTvIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}' +
          '#jc-tvapp-notice strong{display:block;font-size:17px;margin:0 28px 4px 0}' +
          '#jc-tvapp-notice p{margin:0 0 12px;opacity:.85}' +
          '#jc-tvapp-notice .jc-tv-links{display:flex;flex-wrap:wrap;gap:8px}' +
          '#jc-tvapp-notice .jc-tv-links a{padding:8px 14px;border-radius:6px;font-weight:600;text-decoration:none;color:#fff}' +
          '#jc-tvapp-notice .jc-tv-play{background:var(--accentColor,#e0262b)}' +
          '#jc-tvapp-notice .jc-tv-gh{border:1px solid rgba(255,255,255,.4)}' +
          '#jc-tvapp-notice .jc-tv-links a:hover,#jc-tvapp-notice .jc-tv-links a:focus-visible{outline:3px solid var(--accentColor,#e0262b);outline-offset:2px}' +
          '#jc-tvapp-notice .jc-tv-close{position:absolute;top:8px;right:10px;background:none;border:0;color:#fff;font-size:22px;line-height:1;cursor:pointer;opacity:.7}' +
          '#jc-tvapp-notice .jc-tv-close:hover,#jc-tvapp-notice .jc-tv-close:focus-visible{opacity:1;outline:2px solid var(--accentColor,#e0262b)}' +
          '@media (max-width:600px){#jc-tvapp-notice{right:16px;bottom:16px;left:16px;max-width:none}}';
        document.head.appendChild(st);
        var box = document.createElement('div');
        box.id = 'jc-tvapp-notice'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Jelly Cinema TV app');
        box.innerHTML =
          '<button type="button" class="jc-tv-close" aria-label="Close">&times;</button>' +
          '<strong>&#128250; Jelly Cinema is on your TV too</strong>' +
          '<p>Get the same look on Android TV and Google TV with the Jelly Cinema TV app. Only admins see this message, once.</p>' +
          '<div class="jc-tv-links">' +
          '<a class="jc-tv-play" href="https://play.google.com/store/apps/details?id=com.techsystems23.jellycinema" target="_blank" rel="noopener noreferrer">Google Play</a>' +
          '<a class="jc-tv-gh" href="https://github.com/techsystems23-llc/jellycinema-tv" target="_blank" rel="noopener noreferrer">Free on GitHub</a>' +
          '</div>';
        function close() { markSeen(); box.remove(); st.remove(); }
        box.querySelector('.jc-tv-close').addEventListener('click', close);
        box.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setTimeout(close, 50); }); });
        document.body.appendChild(box);
      }, function () { busy = false; });
    }
    window.addEventListener('hashchange', function () {
      if (!onHome()) { var b = document.getElementById('jc-tvapp-notice'); if (b) b.remove(); }   // not on other pages; back next visit to Home
      else setTimeout(maybeShow, 6000);
    });
    setTimeout(maybeShow, 6000);   // after the intro and the rows have settled
  })();
})();
