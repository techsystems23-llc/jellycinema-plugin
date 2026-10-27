using System.Reflection;
using Jellyfin.Plugin.JellyCinema.Configuration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.JellyCinema.Api;

/// <summary>
/// Serves the Jelly Cinema settings script and the Jelly Cinema scripts.
/// Anonymous on purpose: the sign-in screen needs them before anyone is signed in. Nothing here is private:
/// the settings are display options only, and every title shown is loaded later as the signed-in user.
/// </summary>
[ApiController]
[Route("JellyCinema")]
public class JellyCinemaController : ControllerBase
{
    private static readonly Dictionary<string, string> Scripts = new(StringComparer.OrdinalIgnoreCase)
    {
        ["banner"] = "jellycinema-banner.js",
        ["seasonal"] = "jellycinema-seasonal.js",
        ["home"] = "jellycinema-home.js"
    };

    private readonly ILogger<JellyCinemaController> _logger;
    private readonly MediaBrowser.Controller.Library.IUserManager _users;
    private readonly MediaBrowser.Controller.Library.ILibraryManager _library;

    public JellyCinemaController(
        ILogger<JellyCinemaController> logger,
        MediaBrowser.Controller.Library.IUserManager users,
        MediaBrowser.Controller.Library.ILibraryManager library)
    {
        _logger = logger;
        _users = users;
        _library = library;
    }

    /// <summary>Body of <see cref="Visible"/>: the titles to check.</summary>
    public sealed class VisibleRequest
    {
        public List<Guid> Ids { get; set; } = new();
    }

    /// <summary>
    /// Which of these titles may this person open? One request for a whole row instead of one per title.
    /// Uses the same check as Jellyfin's own item lookup (libraries, rating limit, blocked/allowed tags), so the
    /// answer is exactly "would /Users/{id}/Items/{itemId} return it". Signed-in users only; a person can only
    /// check for themselves, an administrator can check for anyone (the settings page's permission check).
    /// </summary>
    [HttpPost("visible")]
    [Authorize]
    public IActionResult Visible([FromBody] VisibleRequest body, [FromQuery] Guid? userId)
    {
        var me = CurrentUserId();
        if (me == Guid.Empty)
        {
            return Unauthorized();
        }

        var target = userId is { } u && u != Guid.Empty ? u : me;
        if (target != me && !User.IsInRole("Administrator"))
        {
            return Forbid();
        }

        var user = _users.GetUserById(target);
        if (user is null)
        {
            return NotFound();
        }

        var ids = (body?.Ids ?? new List<Guid>()).Distinct().Take(500).ToList();
        var ok = new List<string>(ids.Count);
        foreach (var id in ids)
        {
            try
            {
                if (_library.GetItemById<MediaBrowser.Controller.Entities.BaseItem>(id, user) is not null)
                {
                    ok.Add(id.ToString("N"));
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Jelly Cinema: visibility check failed for {Id}", id);
            }
        }

        Response.Headers.CacheControl = "no-store";
        return Ok(new { visible = ok });
    }

    private Guid CurrentUserId()
    {
        var v = User.FindFirst("Jellyfin-UserId")?.Value;
        return Guid.TryParse(v, out var g) ? g : Guid.Empty;
    }

    [HttpGet("config.js")]
    [AllowAnonymous]
    [Produces("application/javascript")]
    public IActionResult GetConfig()
    {
        var plugin = Plugin.Instance;
        if (plugin is null)
        {
            return NotFound();
        }

        var js = ConfigScript.Build(plugin.Configuration, out var seasonsError);
        if (seasonsError is not null)
        {
            _logger.LogWarning("Jelly Cinema: {Error} Using the built-in seasonal defaults.", seasonsError);
        }

        Response.Headers.CacheControl = "no-cache";
        return Content(js, "application/javascript; charset=utf-8");
    }

    [HttpGet("js/{name}.js")]
    [AllowAnonymous]
    [Produces("application/javascript")]
    public IActionResult GetScript([FromRoute] string name)
    {
        if (!Scripts.TryGetValue(name, out var file))
        {
            return NotFound();
        }

        var asm = typeof(Plugin).Assembly;
        using var stream = asm.GetManifestResourceStream(typeof(Plugin).Namespace + ".Web." + file);
        if (stream is null)
        {
            return NotFound();
        }

        using var reader = new StreamReader(stream);
        var text = reader.ReadToEnd();
        // URLs carry the plugin version, so a long cache is safe; a new version gets a new URL
        Response.Headers.CacheControl = "public, max-age=604800";
        return Content(text, "application/javascript; charset=utf-8");
    }

    /// <summary>Default Jelly Cinema logo (popcorn bucket based on Microsoft Fluent Emoji "Popcorn", MIT License, recolored).</summary>
    [HttpGet("logo.png")]
    [AllowAnonymous]
    public IActionResult GetLogo()
    {
        var stream = typeof(Plugin).Assembly.GetManifestResourceStream(typeof(Plugin).Namespace + ".Web.logo.png");
        if (stream is null)
        {
            return NotFound();
        }

        Response.Headers.CacheControl = "public, max-age=86400";
        return File(stream, "image/png");
    }

    /// <summary>Jelly Cinema brand pictures (corner logo and start-up intro): wordmark, popcorn, word.</summary>
    [HttpGet("brand/{name}.png")]
    [AllowAnonymous]
    public IActionResult GetBrandImage([FromRoute] string name)
    {
        if (name is not ("wordmark" or "popcorn" or "word"))
        {
            return NotFound();
        }

        var stream = typeof(Plugin).Assembly.GetManifestResourceStream(typeof(Plugin).Namespace + ".Web.brand." + name + ".png");
        if (stream is null)
        {
            return NotFound();
        }

        Response.Headers.CacheControl = "public, max-age=86400";
        return File(stream, "image/png");
    }

    /// <summary>Jelly Cinema banner (popcorn on the "Now Showing" marquee) for the settings page.</summary>
    [HttpGet("banner.jpg")]
    [AllowAnonymous]
    public IActionResult GetBanner()
    {
        var stream = typeof(Plugin).Assembly.GetManifestResourceStream(typeof(Plugin).Namespace + ".Web.banner.jpg");
        if (stream is null)
        {
            return NotFound();
        }

        Response.Headers.CacheControl = "public, max-age=86400";
        return File(stream, "image/jpeg");
    }

    /// <summary>Marquee font (Oswald, SIL Open Font License 1.1).</summary>
    [HttpGet("font/oswald.woff2")]
    [AllowAnonymous]
    public IActionResult GetFont()
    {
        var stream = typeof(Plugin).Assembly.GetManifestResourceStream(typeof(Plugin).Namespace + ".Web.fonts.oswald-600.woff2");
        if (stream is null)
        {
            return NotFound();
        }

        Response.Headers.CacheControl = "public, max-age=2592000";
        return File(stream, "font/woff2");
    }

    /// <summary>Top 10 rank numerals (Archivo Black, SIL Open Font License 1.1).</summary>
    [HttpGet("font/rank.woff2")]
    [AllowAnonymous]
    public IActionResult GetRankFont()
    {
        var stream = typeof(Plugin).Assembly.GetManifestResourceStream(typeof(Plugin).Namespace + ".Web.fonts.archivo-black-400.woff2");
        if (stream is null)
        {
            return NotFound();
        }

        Response.Headers.CacheControl = "public, max-age=2592000";
        return File(stream, "font/woff2");
    }

    /// <summary>Puts every Jelly Cinema setting back to the product defaults (admins only).</summary>
    [HttpPost("reset")]
    [Authorize(Policy = "RequiresElevation")]
    public IActionResult ResetToDefaults()
    {
        var plugin = Plugin.Instance;
        if (plugin is null)
        {
            return NotFound();
        }

        plugin.UpdateConfiguration(new PluginConfiguration());
        _logger.LogInformation("Jelly Cinema: settings reset to defaults");
        return NoContent();
    }

    /// <summary>Settings-page helper: is the seasonal JSON valid?</summary>
    /// <summary>The running plugin version, for open pages to notice an update and reload once (anonymous, nothing private).</summary>
    [HttpGet("version")]
    [AllowAnonymous]
    public IActionResult GetVersion()
    {
        Response.Headers.CacheControl = "no-store";
        return Ok(new { version = typeof(Plugin).Assembly.GetName().Version?.ToString() ?? "0" });
    }

    [HttpGet("status")]
    [Authorize(Policy = "RequiresElevation")]
    public IActionResult GetStatus()
    {
        var plugin = Plugin.Instance;
        if (plugin is null)
        {
            return NotFound();
        }

        ConfigScript.Build(plugin.Configuration, out var seasonsError);
        return Ok(new
        {
            Version = typeof(Plugin).Assembly.GetName().Version?.ToString(),
            SeasonsError = seasonsError,
            OtherCopies = Injection.Duplicates.OtherCopies(),
            plugin.Configuration.InjectScripts
        });
    }
}
