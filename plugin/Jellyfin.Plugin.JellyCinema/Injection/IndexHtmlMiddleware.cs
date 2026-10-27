using Jellyfin.Plugin.JellyCinema.Configuration;
using System.Text;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Net.Http.Headers;

namespace Jellyfin.Plugin.JellyCinema.Injection;

/// <summary>
/// Adds the Jelly Cinema scripts to Jellyfin's web page (index.html) as it is sent to the browser.
/// Nothing on disk is changed, so it works on read-only Docker installs and survives Jellyfin upgrades.
/// If the page already loads the Jelly Cinema scripts some other way, nothing is added.
/// </summary>
public sealed class IndexHtmlMiddleware
{
    private const string Marker = "jellycinema-home.js";
    private readonly RequestDelegate _next;

    public IndexHtmlMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ILogger<IndexHtmlMiddleware> logger)
    {
        // Safety first: if this copy of Jelly Cinema can't read its settings (for example two versions of the
        // plugin were left in the plugins folder and both got loaded), or a newer copy is running, this copy steps
        // aside and Jellyfin carries on as if it weren't installed, instead of every request failing.
        var plugin = Plugin.Instance;
        PluginConfiguration? cfg = null;
        if (plugin is not null && !Duplicates.NewerCopyLoaded())
        {
            try
            {
                cfg = plugin.Configuration;
            }
            catch (Exception ex)
            {
                Duplicates.ReportBroken(logger, ex);
            }
        }

        if (plugin is null || cfg is null)
        {
            await _next(context).ConfigureAwait(false);
            return;
        }

        if (cfg.ReplaceIcons && HttpMethods.IsGet(context.Request.Method)
            && IconFor(context.Request.Path.Value) is { } icon)
        {
            var stream = typeof(Plugin).Assembly.GetManifestResourceStream(typeof(Plugin).Namespace + ".Web." + icon.Resource);
            if (stream is not null)
            {
                context.Response.ContentType = icon.ContentType;
                context.Response.Headers.CacheControl = "public, max-age=86400";
                context.Response.ContentLength = stream.Length;
                await using (stream.ConfigureAwait(false))
                {
                    await stream.CopyToAsync(context.Response.Body).ConfigureAwait(false);
                }

                return;
            }
        }

        if (!cfg.InjectScripts || !HttpMethods.IsGet(context.Request.Method) || !IsIndex(context.Request.Path.Value))
        {
            await _next(context).ConfigureAwait(false);
            return;
        }

        // ask for the plain file so it can be edited, then buffer the response
        context.Request.Headers.Remove(HeaderNames.AcceptEncoding);
        context.Request.Headers.Remove(HeaderNames.IfNoneMatch);
        context.Request.Headers.Remove(HeaderNames.IfModifiedSince);
        var original = context.Response.Body;
        using var buffer = new MemoryStream();
        context.Response.Body = buffer;
        try
        {
            await _next(context).ConfigureAwait(false);

            buffer.Seek(0, SeekOrigin.Begin);
            var isHtml = (context.Response.ContentType ?? string.Empty).Contains("html", StringComparison.OrdinalIgnoreCase);
            var encoded = context.Response.Headers.ContainsKey(HeaderNames.ContentEncoding);
            if (context.Response.StatusCode != 200 || !isHtml || encoded)
            {
                context.Response.Body = original;
                await buffer.CopyToAsync(original).ConfigureAwait(false);
                return;
            }

            var html = await new StreamReader(buffer, Encoding.UTF8).ReadToEndAsync().ConfigureAwait(false);
            var head = html.IndexOf("</head>", StringComparison.OrdinalIgnoreCase);
            if (head >= 0 && !html.Contains(Marker, StringComparison.OrdinalIgnoreCase))
            {
                html = html.Insert(head, Tags(plugin));
            }

            var bytes = Encoding.UTF8.GetBytes(html);
            context.Response.Body = original;
            context.Response.Headers.Remove(HeaderNames.ETag);
            context.Response.Headers.Remove(HeaderNames.LastModified);
            context.Response.Headers.CacheControl = "no-cache";
            context.Response.ContentLength = bytes.Length;
            await original.WriteAsync(bytes).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Jelly Cinema: could not add the scripts to the web page; serving it unchanged");
            context.Response.Body = original;
            if (!context.Response.HasStarted)
            {
                buffer.Seek(0, SeekOrigin.Begin);
                await buffer.CopyToAsync(original).ConfigureAwait(false);
            }
        }
    }

    private static readonly System.Text.RegularExpressions.Regex IconName = new(
        @"^(?<n>favicon|icon-transparent|touchicon(?<s>72|114|144|512)?)(\.[0-9a-f]+)?\.(?<e>ico|png)$",
        System.Text.RegularExpressions.RegexOptions.IgnoreCase | System.Text.RegularExpressions.RegexOptions.CultureInvariant);

    /// <summary>Jellyfin's logo and icons (any build hash in the name) are answered with the Jelly Cinema images.</summary>
    private static (string Resource, string ContentType)? IconFor(string? path)
    {
        if (string.IsNullOrEmpty(path) || path.IndexOf("/web/", StringComparison.OrdinalIgnoreCase) < 0)
        {
            return null;
        }

        var file = path[(path.LastIndexOf('/') + 1)..];
        var m = IconName.Match(file);
        if (!m.Success)
        {
            return null;
        }

        var n = m.Groups["n"].Value.ToLowerInvariant();
        var ext = m.Groups["e"].Value.ToLowerInvariant();
        if (n == "favicon" && ext == "ico")
        {
            return ("icons.favicon.ico", "image/x-icon");
        }

        if (ext != "png")
        {
            return null;
        }

        if (n == "icon-transparent")
        {
            return ("logo.png", "image/png");
        }

        var size = m.Groups["s"].Value;
        return ("icons.touchicon" + size + ".png", "image/png");
    }

    private static bool IsIndex(string? path)
    {
        if (string.IsNullOrEmpty(path))
        {
            return false;
        }

        return path.EndsWith("/web/index.html", StringComparison.OrdinalIgnoreCase)
            || path.EndsWith("/web/", StringComparison.OrdinalIgnoreCase)
            || path.EndsWith("/web", StringComparison.OrdinalIgnoreCase);
    }

    private static string Tags(Plugin plugin)
    {
        var v = typeof(Plugin).Assembly.GetName().Version?.ToString() ?? "0";
        // index.html lives at <base>/web/, the plugin's endpoints at <base>/JellyCinema/
        return "<script defer src=\"../JellyCinema/config.js?v=" + plugin.SettingsVersion + "\"></script>"
             + "<script defer src=\"../JellyCinema/js/banner.js?v=" + v + "\"></script>"
             + "<script defer src=\"../JellyCinema/js/seasonal.js?v=" + v + "\"></script>"
             + "<script defer src=\"../JellyCinema/js/home.js?v=" + v + "\"></script>";
    }
}

/// <summary>Puts <see cref="IndexHtmlMiddleware"/> at the front of Jellyfin's web pipeline.</summary>
public sealed class IndexHtmlStartupFilter : IStartupFilter
{
    public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next)
    {
        return app =>
        {
            app.UseMiddleware<IndexHtmlMiddleware>();
            next(app);
        };
    }
}
