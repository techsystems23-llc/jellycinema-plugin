using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace Jellyfin.Plugin.JellyCinema.Configuration;

/// <summary>
/// Turns the saved settings into the window.JellyCinemaConfig script the Jelly Cinema scripts read.
/// Values are checked and clamped here so a bad entry on the settings page can't break the home screen.
/// </summary>
public static partial class ConfigScript
{
    [GeneratedRegex("^#[0-9a-fA-F]{3,8}$")]
    private static partial Regex HexColor();

    [GeneratedRegex("^[0-9.]+(rem|px|em|vw|vh)$")]
    private static partial Regex CssSize();

    [GeneratedRegex("^[A-Za-z0-9._-]+$")]
    private static partial Regex SafePath();

    public static string Build(PluginConfiguration c, out string? seasonsError)
    {
        seasonsError = null;
        string Color(string v, string d) => v != null && HexColor().IsMatch(v.Trim()) ? v.Trim() : d;
        string Size(string v, string d) => v != null && CssSize().IsMatch(v.Trim()) ? v.Trim() : d;
        int Clamp(int v, int lo, int hi) => Math.Min(hi, Math.Max(lo, v));

        var days = (c.PicksDays ?? string.Empty).Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(s => int.TryParse(s, NumberStyles.Integer, CultureInfo.InvariantCulture, out var n) ? n : -1)
            .Where(n => n is >= 0 and <= 6).Distinct().ToArray();
        var ratings = (c.PicksRatings ?? string.Empty).Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(r => r.Length <= 20).ToArray();

        object? disclaimer = (c.DisclaimerMode ?? "jellyfin").ToLowerInvariant() switch
        {
            "hide" => string.Empty,
            "custom" => (c.DisclaimerText ?? string.Empty).Trim(),
            _ => null
        };

        var cfg = new JsonObject
        {
            ["brand"] = new JsonObject
            {
                ["name"] = string.IsNullOrWhiteSpace(c.BrandName) ? "Jelly Cinema" : c.BrandName.Trim(),
                ["logo"] = !string.IsNullOrWhiteSpace(c.LogoPath) && SafePath().IsMatch(c.LogoPath.Trim()) && !c.LogoPath.Contains("..", StringComparison.Ordinal) ? c.LogoPath.Trim() : "../JellyCinema/logo.png",
                ["accent"] = new JsonObject
                {
                    ["enabled"] = c.AccentEnabled,
                    ["color"] = Color(c.AccentColor, "#e0262b"),
                    ["hover"] = Color(c.AccentHover, "#f2484c"),
                    ["focus"] = Color(c.AccentFocus, "#ff4d4f"),
                    ["checkbox"] = Color(c.AccentColor, "#e0262b"),
                    ["save"] = Color(c.AccentSave, "#c4161c"),
                    ["saveBorder"] = Color(c.AccentHover, "#f2484c")
                }
            },
            ["signIn"] = new JsonObject
            {
                ["enabled"] = c.SignInEnabled,
                ["cardWidth"] = Size(c.SignInCardWidth, "30rem"),
                ["background"] = c.SignInBackground is "jellyfin" or "none" ? c.SignInBackground : "marquee",
                ["marqueeTitle"] = string.IsNullOrWhiteSpace(c.MarqueeTitle) ? null : c.MarqueeTitle.Trim(),
                ["marqueeTagline"] = (c.MarqueeTagline ?? string.Empty).Trim(),
                ["disclaimer"] = disclaimer is null ? null : JsonValue.Create((string)disclaimer)
            },
            ["banner"] = new JsonObject
            {
                ["autoAdvance"] = c.AutoAdvance,
                ["trailerMaxSeconds"] = Clamp(c.TrailerMaxSeconds, 5, 600),
                ["pin"] = c.PinBanner,
                ["pinStyle"] = c.PinStyle == "fade" ? "fade" : "tv",
                ["pinHeight"] = Size(c.PinHeight, "58vh"),
                ["followSelection"] = c.FollowSelection,
                ["focusDelayMs"] = Clamp(c.FocusDelayMs, 0, 10000),
                ["hoverDelayMs"] = Clamp(c.HoverDelayMs, 0, 10000),
                ["previewTimeoutSeconds"] = Clamp(c.PreviewTimeoutSeconds, 5, 3600),
                ["trailerFallback"] = c.TrailerFallback,
                ["hero"] = new JsonObject
                {
                    ["enabled"] = c.HeroEnabled,
                    ["maxItems"] = Clamp(c.HeroMaxItems, 1, 100),
                    ["slideSeconds"] = Clamp(c.HeroSlideSeconds, 3, 120),
                    ["types"] = c.HeroTypes switch { "movies" => "Movie", "shows" => "Series", _ => "Movie,Series" },
                    ["libraries"] = (c.HeroLibraries ?? string.Empty).Trim(),
                    ["skipWatched"] = c.HeroSkipWatched,
                    ["trailers"] = c.HeroTrailers,
                    ["trailerDelaySeconds"] = Clamp(c.HeroTrailerDelaySeconds, 0, 60),
                    ["height"] = Size(c.HeroHeight, "88vh")
                }
            },
            ["theaterMode"] = new JsonObject
            {
                ["enabled"] = c.TheaterMode,
                ["idleSeconds"] = Clamp(c.TheaterIdleSeconds, 10, 3600)
            },
            ["top10"] = new JsonObject
            {
                ["enabled"] = c.Top10Enabled,
                ["movies"] = c.Top10Movies,
                ["moviesTitle"] = string.IsNullOrWhiteSpace(c.Top10MoviesTitle) ? "Top 10 Movies This Week" : c.Top10MoviesTitle.Trim(),
                ["shows"] = c.Top10Shows,
                ["showsTitle"] = string.IsNullOrWhiteSpace(c.Top10ShowsTitle) ? "Top 10 Shows This Week" : c.Top10ShowsTitle.Trim(),
                ["minTitles"] = Clamp(c.Top10MinTitles, 1, 10),
                ["fillFromLibrary"] = c.Top10FillFromLibrary,
                ["refreshDays"] = Clamp(c.Top10RefreshDays, 1, 60),
                ["keep"] = Clamp(c.Top10Keep, 10, 200),
                ["minPlaySeconds"] = Clamp(c.Top10MinPlaySeconds, 0, 3600)
            },
            ["picks"] = new JsonObject
            {
                ["enabled"] = c.PicksEnabled,
                ["title"] = string.IsNullOrWhiteSpace(c.PicksTitle) ? null : c.PicksTitle.Trim(),
                ["days"] = new JsonArray(days.Select(d => (JsonNode)d).ToArray()),
                ["count"] = Clamp(c.PicksCount, 3, 30),
                ["ratings"] = new JsonArray(ratings.Select(r => (JsonNode)r).ToArray()),
                ["maxRating"] = string.IsNullOrWhiteSpace(c.PicksMaxRating) ? null : c.PicksMaxRating.Trim(),
                ["minScore"] = Math.Min(10, Math.Max(0, c.PicksMinScore)),
                ["unwatchedOnly"] = c.PicksUnwatchedOnly
            },
            ["rows"] = new JsonObject
            {
                ["replaceDuplicateGenres"] = c.ReplaceDuplicateGenres,
                ["continueWatchingHideAfterDays"] = Clamp(c.ContinueWatchingHideAfterDays, 0, 3650),
                ["arrows"] = c.RowArrows,
                ["keyboardNav"] = c.KeyboardNav,
                ["cardSize"] = c.TvCardSizes ? "tv" : "jellyfin",
                ["discover"] = (c.DiscoverRows ?? "auto").Trim().ToLowerInvariant() switch
                {
                    "on" or "true" => JsonValue.Create(true),
                    "off" or "false" => JsonValue.Create(false),
                    _ => JsonValue.Create("auto")
                },
                ["becauseYouWatched"] = Clamp(c.BecauseYouWatchedRows, 0, 6),
                ["genreRows"] = Clamp(c.GenreRows, 0, 12),
                ["collections"] = c.CollectionsRow,
                ["watchAgain"] = c.WatchAgainRow
            },
            // the running plugin version: open pages compare it with the scripts they loaded and reload once after an update
            ["version"] = typeof(Plugin).Assembly.GetName().Version?.ToString() ?? "0",
            ["autoReload"] = c.AutoReload
        };

        var seasons = new JsonObject
        {
            ["enabled"] = c.SeasonsEnabled,
            ["effects"] = c.SeasonEffects,
            ["autoLibraryRows"] = c.AutoLibraryRows,
            ["libraryRowShare"] = Clamp(c.LibraryRowSharePercent, 1, 100) / 100.0,
            ["libraryRowMin"] = Clamp(c.LibraryRowMin, 1, 1000)
        };
        if (!string.IsNullOrWhiteSpace(c.SeasonsJson))
        {
            try
            {
                if (JsonNode.Parse(c.SeasonsJson) is JsonObject adv)
                {
                    foreach (var key in new[] { "calendar", "rows", "libraryRows" })
                    {
                        if (adv[key] is JsonNode n)
                        {
                            seasons[key] = n.DeepClone();
                        }
                    }
                }
                else
                {
                    seasonsError = "Seasonal settings must be a JSON object.";
                }
            }
            catch (JsonException ex)
            {
                seasonsError = "Seasonal settings are not valid JSON: " + ex.Message;
            }
        }

        cfg["seasons"] = seasons;

        var json = cfg.ToJsonString(new JsonSerializerOptions
        {
            WriteIndented = true,
            // keep emoji readable but escape anything that could close the script tag
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.Default
        });
        return "/* Jelly Cinema settings (generated by the Jelly Cinema plugin; edit them in Dashboard > Plugins > Jelly Cinema) */\n" +
               "window.JellyCinemaConfig = " + json + ";\n";
    }
}
