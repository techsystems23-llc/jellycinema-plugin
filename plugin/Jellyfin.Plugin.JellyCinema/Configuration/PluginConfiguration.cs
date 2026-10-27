using MediaBrowser.Model.Plugins;

namespace Jellyfin.Plugin.JellyCinema.Configuration;

/// <summary>
/// Every Jelly Cinema setting. Defaults are the product defaults a new buyer starts with.
/// The settings page edits these; <see cref="ConfigScript"/> turns them into window.JellyCinemaConfig.
/// </summary>
public class PluginConfiguration : BasePluginConfiguration
{
    /* ---------- general ---------- */
    public bool InjectScripts { get; set; } = true;
    /// <summary>Open browsers reload once by themselves after the plugin is updated (no Ctrl+Shift+R needed).</summary>
    public bool AutoReload { get; set; } = true;

    /* ---------- branding ---------- */
    public string BrandName { get; set; } = "Jelly Cinema";
    /// <summary>Empty = the built-in Jelly Cinema logo. Otherwise a file in Jellyfin's web folder.</summary>
    public string LogoPath { get; set; } = string.Empty;
    public bool AccentEnabled { get; set; } = true;
    public string AccentColor { get; set; } = "#e0262b";
    public string AccentHover { get; set; } = "#f2484c";
    public string AccentFocus { get; set; } = "#ff4d4f";
    public string AccentSave { get; set; } = "#c4161c";

    /// <summary>Replace Jellyfin's logo, browser-tab icon and home-screen icons with the Jelly Cinema ones.</summary>
    public bool ReplaceIcons { get; set; } = true;

    /* ---------- sign-in screen ---------- */
    public bool SignInEnabled { get; set; } = true;
    public string SignInCardWidth { get; set; } = "30rem";
    /// <summary>"marquee" = Jelly Cinema's "Now Showing" theater scene, "jellyfin" = Jellyfin's own splash screen, "none".</summary>
    public string SignInBackground { get; set; } = "marquee";
    /// <summary>Big words on the marquee. Empty = the server name.</summary>
    public string MarqueeTitle { get; set; } = string.Empty;
    public string MarqueeTagline { get; set; } = "Grab the popcorn — the show's about to start.";
    /// <summary>"jellyfin" = Jellyfin's own Login disclaimer, "hide", or "custom" (DisclaimerText).</summary>
    public string DisclaimerMode { get; set; } = "custom";
    public string DisclaimerText { get; set; } = "Welcome! Sign in with the user name and password you were given. Need help or want a movie added? Ask the person who runs this server. Enjoy the show!";

    /* ---------- banner ---------- */
    public bool AutoAdvance { get; set; } = true;
    public int TrailerMaxSeconds { get; set; } = 45;
    public bool PinBanner { get; set; } = true;
    public string PinStyle { get; set; } = "tv";
    public string PinHeight { get; set; } = "58vh";
    public bool FollowSelection { get; set; } = true;
    public int FocusDelayMs { get; set; } = 700;
    public int HoverDelayMs { get; set; } = 1000;
    public int PreviewTimeoutSeconds { get; set; } = 20;
    public bool TrailerFallback { get; set; } = true;
    /// <summary>Jelly Cinema's own hero banner, used only when the Media Bar plugin isn't installed.</summary>
    public bool HeroEnabled { get; set; } = true;
    public int HeroMaxItems { get; set; } = 50;
    public int HeroSlideSeconds { get; set; } = 10;
    /// <summary>"movies", "shows" or "both".</summary>
    public string HeroTypes { get; set; } = "both";
    /// <summary>Library names, comma separated. Empty = every library the viewer can open.</summary>
    public string HeroLibraries { get; set; } = string.Empty;
    public bool HeroSkipWatched { get; set; }
    public bool HeroTrailers { get; set; } = true;
    public int HeroTrailerDelaySeconds { get; set; } = 4;
    public string HeroHeight { get; set; } = "88vh";

    /* ---------- Theater Mode ---------- */
    public bool TheaterMode { get; set; } = true;
    public int TheaterIdleSeconds { get; set; } = 90;

    /* ---------- Top 10 ---------- */
    public bool Top10Enabled { get; set; } = true;
    public bool Top10Movies { get; set; } = true;
    public string Top10MoviesTitle { get; set; } = "Top 10 Movies This Week";
    public bool Top10Shows { get; set; } = true;
    public string Top10ShowsTitle { get; set; } = "Top 10 Shows This Week";
    public int Top10MinTitles { get; set; } = 3;
    public bool Top10FillFromLibrary { get; set; } = true;
    public int Top10RefreshDays { get; set; } = 6;
    public int Top10Keep { get; set; } = 60;
    public int Top10MinPlaySeconds { get; set; } = 300;

    /* ---------- Picks ---------- */
    public bool PicksEnabled { get; set; } = true;
    /// <summary>Empty = "&lt;brand name&gt; Picks".</summary>
    public string PicksTitle { get; set; } = string.Empty;
    /// <summary>Comma-separated days, 0 = Sunday.</summary>
    public string PicksDays { get; set; } = "5,6,0";
    public int PicksCount { get; set; } = 8;
    public string PicksRatings { get; set; } = "G,PG,TV-G,TV-PG,TV-Y,TV-Y7";
    public string PicksMaxRating { get; set; } = "PG";
    public double PicksMinScore { get; set; } = 6.5;
    public bool PicksUnwatchedOnly { get; set; } = true;

    /* ---------- rows ---------- */
    public bool ReplaceDuplicateGenres { get; set; } = true;
    public int ContinueWatchingHideAfterDays { get; set; } = 90;
    public bool RowArrows { get; set; } = true;
    public bool KeyboardNav { get; set; } = true;
    /// <summary>Home posters in the Jelly Cinema TV app's proportions (off = Jellyfin's own card sizes).</summary>
    public bool TvCardSizes { get; set; } = true;
    /// <summary>"auto" = Jelly Cinema's discover rows only when Home Screen Sections isn't making them, "on", "off".</summary>
    public string DiscoverRows { get; set; } = "auto";
    public int BecauseYouWatchedRows { get; set; } = 2;
    public int GenreRows { get; set; } = 5;
    public bool CollectionsRow { get; set; } = true;
    public bool WatchAgainRow { get; set; } = true;

    /* ---------- seasonal ---------- */
    public bool SeasonsEnabled { get; set; } = true;
    public bool SeasonEffects { get; set; } = true;
    /// <summary>Christmas season: a library that is mostly Christmas titles gets its own "<Library> Christmas" row.</summary>
    public bool AutoLibraryRows { get; set; } = true;
    /// <summary>Share of a library's movies/shows that must be Christmas titles (percent).</summary>
    public int LibraryRowSharePercent { get; set; } = 20;
    /// <summary>...and at least this many of them.</summary>
    public int LibraryRowMin { get; set; } = 8;

    /// <summary>
    /// Advanced seasonal settings as JSON: { "calendar": [...], "rows": {...}, "libraryRows": [...] }.
    /// Anything left out uses the built-in default (13 themes, Easter/Halloween/Christmas rows, no library rows).
    /// </summary>
    public string SeasonsJson { get; set; } = DefaultSeasonsJson;

    public const string DefaultSeasonsJson = """
{
  "rows": {
    "easter":    { "title": "Easter Movies",    "icon": "🐣", "tags": ["easter", "easter bunny", "easter egg"] },
    "halloween": { "title": "Halloween Movies", "icon": "🎃", "tags": ["halloween"] },
    "christmas": { "title": "Christmas Movies", "icon": "🎄", "tags": ["christmas", "santa claus", "christmas eve", "christmas tree"] }
  },
  "libraryRows": []
}
""";
}
