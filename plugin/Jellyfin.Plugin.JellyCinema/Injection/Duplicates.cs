using System.Reflection;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.JellyCinema.Injection;

/// <summary>
/// Notices when more than one copy of Jelly Cinema is loaded (an older "Jelly Cinema_*" folder left next to a
/// newer one). The older copy stands down so only one runs; the settings page shows which folders to remove.
/// </summary>
public static class Duplicates
{
    private static readonly object Gate = new();
    private static DateTime _checkedAt = DateTime.MinValue;
    private static bool _newer;
    private static int _reported;

    private static Version Mine => typeof(Plugin).Assembly.GetName().Version ?? new Version(0, 0);

    /// <summary>Versions of the other Jelly Cinema copies loaded in this Jellyfin (empty normally).</summary>
    public static IReadOnlyList<string> OtherCopies()
    {
        var me = typeof(Plugin).Assembly;
        return AppDomain.CurrentDomain.GetAssemblies()
            .Where(a => !ReferenceEquals(a, me) && string.Equals(a.GetName().Name, me.GetName().Name, StringComparison.Ordinal))
            .Select(a => a.GetName().Version?.ToString() ?? "?")
            .ToList();
    }

    /// <summary>True when a newer Jelly Cinema copy is loaded too: this one then does nothing. Checked once a minute.</summary>
    public static bool NewerCopyLoaded()
    {
        lock (Gate)
        {
            if ((DateTime.UtcNow - _checkedAt).TotalSeconds < 60)
            {
                return _newer;
            }

            _checkedAt = DateTime.UtcNow;
            _newer = OtherCopies().Any(v => Version.TryParse(v, out var o) && o > Mine);
            return _newer;
        }
    }

    public static void ReportBroken(ILogger logger, Exception ex)
    {
        if (Interlocked.Exchange(ref _reported, 1) == 0)
        {
            logger.LogError(
                ex,
                "Jelly Cinema {Version}: can't read its settings, so it is switched off and Jellyfin carries on without it. Other Jelly Cinema copies loaded: {Others}. Keep only one \"Jelly Cinema_*\" folder in the plugins folder and restart Jellyfin.",
                Mine,
                string.Join(", ", OtherCopies()));
        }
    }
}
