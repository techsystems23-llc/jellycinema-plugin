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
