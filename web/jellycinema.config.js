/* Jelly Cinema settings.
   Every Jelly Cinema feature reads its settings from this one file. With the plugin installed these come from
   Dashboard > Plugins > Jelly Cinema; change them there and refresh the browser.
   The values below are the Jelly Cinema defaults. */
window.JellyCinemaConfig = {

  /* ---------- branding ---------- */
  brand: {
    name: 'Jelly Cinema',                // your server's name; shown in row titles such as "<name> Picks"
    logo: 'jc-logo.png',                 // file in Jellyfin's web folder, used on the sign-in card
    accent: {                            // set enabled:false to keep the theme's own colors
      enabled: true,
      color: '#e0262b', hover: '#f2484c', checkbox: '#d0201f', focus: '#ff4d4f',
      save: '#c4161c', saveBorder: '#f2484c', deleteFill: '#3b1215', deleteBorder: '#d95454'
    }
  },

  /* ---------- sign-in screen ---------- */
  signIn: {
    enabled: true,
    cardWidth: '30rem',
    disclaimer: null                     // null = use Jellyfin's own Login disclaimer (Dashboard > General > Branding);
                                         // '' = hide it; any other text replaces it
  },

  /* ---------- hero banner ----------
     Jelly Cinema draws its own banner when the Media Bar plugin isn't installed (banner.hero below).
     When Media Bar is installed, Media Bar draws it and the other banner settings
     here add auto-advance, pinning, follow-selection and trailer fallback on top of it. */
  banner: {
    hero: {                              // Jelly Cinema's own banner (ignored while Media Bar is installed)
      enabled: true,
      maxItems: 50,                      // titles in the banner (at least 50; titles with a trailer first)
      slideSeconds: 10,                  // seconds per title without a trailer
      types: 'Movie,Series',             // 'Movie', 'Series' or both
      libraries: '',                     // library names, comma separated; '' = every library the viewer can open
      skipWatched: false,                // leave out titles the viewer has already watched
      trailers: true,                    // muted trailers (local trailer files, or YouTube)
      trailerDelaySeconds: 4,            // trailer starts this long after the title appears
      height: '88vh'
    },
    autoAdvance: true,
    trailerMaxSeconds: 45,               // a slide playing a trailer moves on after this long
    pin: true,                           // banner stays on screen while rows scroll underneath
    pinStyle: 'tv',                      // 'tv' = top of banner stays; 'fade' = banner text fades behind rows
    pinHeight: '58vh',
    followSelection: true,               // banner switches to the highlighted card
    focusDelayMs: 700,                   // remote / keyboard highlight
    hoverDelayMs: 1000,                  // mouse hover
    previewTimeoutSeconds: 20,           // how long a highlighted title stays before the slideshow resumes
    trailerFallback: true                // skip YouTube trailers that refuse to play
  },

  /* ---------- Theater Mode ---------- */
  theaterMode: {
    enabled: true,
    idleSeconds: 90                      // no input on Home for this long = full-screen banner
  },

  /* ---------- Top 10 rows ---------- */
  top10: {
    enabled: true,
    movies: true, moviesTitle: 'Top 10 Movies This Week',
    shows: true,  showsTitle: 'Top 10 Shows This Week',
    minTitles: 3,                        // hide a row that would show fewer than this
    fillFromLibrary: true,               // top up short rows with the viewer's best-rated titles they can open
    refreshDays: 6,                      // an admin's browser re-ranks when the ranking is older than this
    keep: 60,                            // titles kept in the ranking (each user then sees their allowed top 10)
    minPlaySeconds: 300                  // plays shorter than this don't count
  },

  /* ---------- Picks row ---------- */
  picks: {
    enabled: true,
    title: null,                         // null = "<brand name> Picks"
    days: [5, 6, 0],                     // 0 = Sunday ... 6 = Saturday
    count: 8,
    ratings: ['G', 'PG', 'TV-G', 'TV-PG', 'TV-Y', 'TV-Y7'],
    maxRating: 'PG',
    minScore: 6.5,
    unwatchedOnly: true
  },

  /* ---------- other rows ---------- */
  rows: {
    replaceDuplicateGenres: true,        // swap a repeated genre row for one the viewer watches
    continueWatchingHideAfterDays: 90,   // 0 = never hide
    arrows: true,                        // left/right arrows on every row
    keyboardNav: true,                   // arrow keys move between cards and rows (desktop layout)
    discover: 'auto',                    // Because You Watched / genre / Collections / Watch Again rows:
                                         // 'auto' = only when Home Screen Sections isn't making them, true, false
    becauseYouWatched: 2,                // number of "Because You Watched" rows
    genreRows: 5,                        // number of genre rows (genres this viewer watches most)
    collections: true,                   // Collections row (never for accounts with a rating limit)
    watchAgain: true                     // Watch Again row
  },

  /* ---------- seasonal themes ----------
     The first entry whose dates include today wins. Dates: 'MM-DD', 'easter', 'thanksgiving',
     optionally with an offset in days ('easter-7', 'thanksgiving+1'). */
  seasons: {
    enabled: true,
    effects: true,                       // falling leaves, snow, etc. (always off for reduce-motion devices)
    calendar: [
      { theme: 'easter',       from: 'easter-7',       to: 'easter' },
      { theme: 'newyear',      from: '01-01',          to: '01-02' },
      { theme: 'winter',       from: '01-03',          to: '01-31' },
      { theme: 'valentines',   from: '02-07',          to: '02-14' },
      { theme: 'stpatricks',   from: '03-14',          to: '03-17' },
      { theme: 'spring',       from: '03-20',          to: '04-30' },
      { theme: 'summer',       from: '06-10',          to: '06-27' },
      { theme: 'july4',        from: '06-28',          to: '07-05' },
      { theme: 'fall',         from: '09-22',          to: '10-14' },
      { theme: 'halloween',    from: '10-15',          to: '10-31' },
      { theme: 'thanksgiving', from: 'thanksgiving-6', to: 'thanksgiving' },
      { theme: 'christmas',    from: 'thanksgiving+1', to: '12-26' },
      { theme: 'newyear',      from: '12-27',          to: '12-31' }
    ],
    /* Themed movie rows: movies with any of these tags, from libraries the viewer can open */
    rows: {
      easter:    { title: 'Easter Movies',    icon: '🐣', tags: ['easter', 'easter bunny', 'easter egg', 'jesus christ', 'crucifixion of jesus'] },
      halloween: { title: 'Halloween Movies', icon: '🎃', tags: ['halloween'] },
      christmas: { title: 'Christmas Movies', icon: '🎄', tags: ['christmas', 'santa claus', 'christmas eve', 'christmas tree'] }
    },
    /* Christmas season (Thanksgiving to Dec 26): a library where at least libraryRowShare of the movies/shows
       (and at least libraryRowMin of them) are Christmas titles gets its own "❄️ <Library name> Christmas" row
       next to the main Christmas row. Found automatically from your own libraries, like the TV app. */
    autoLibraryRows: true,
    libraryRowShare: 0.2,
    libraryRowMin: 8,
    /* Extra rows from one library for a date range, if you want to set one up yourself. Only shown to viewers
       who can open that library. Example (put your own library name in):
       { title: 'Kids Christmas', icon: '❄️', library: 'Kids Movies',
         tags: ['christmas', 'santa claus', 'christmas eve', 'christmas tree'], nameContains: 'Christmas',
         from: 'thanksgiving', to: '12-25', alsoWhenPreviewing: ['christmas', 'thanksgiving'] } */
    libraryRows: []
  }
};
