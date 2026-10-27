using Jellyfin.Plugin.JellyCinema.Configuration;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Model.Plugins;
using MediaBrowser.Model.Serialization;

namespace Jellyfin.Plugin.JellyCinema;

/// <summary>
/// Jelly Cinema: a living-room home screen for Jellyfin.
/// The plugin stores the settings, serves the Jelly Cinema scripts and adds them to Jellyfin's web page.
/// </summary>
public class Plugin : BasePlugin<PluginConfiguration>, IHasWebPages
{
    public static readonly Guid PluginId = Guid.Parse("9cd3e1ec-177d-47d7-8b07-7ec96b361d2d");

    public Plugin(IApplicationPaths applicationPaths, IXmlSerializer xmlSerializer)
        : base(applicationPaths, xmlSerializer)
    {
        Instance = this;
    }

    public static Plugin? Instance { get; private set; }

    public override string Name => "Jelly Cinema";

    public override Guid Id => PluginId;

    public override string Description => "A living-room home screen: hero banner, Theater Mode, Top 10, Picks, seasonal themes and a full-size sign-in screen. Every row respects each user's library access.";

    /// <summary>Changes every time the settings are saved, so browsers fetch the new settings.</summary>
    public string SettingsVersion { get; private set; } = DateTime.UtcNow.Ticks.ToString(System.Globalization.CultureInfo.InvariantCulture);

    public override void UpdateConfiguration(BasePluginConfiguration configuration)
    {
        base.UpdateConfiguration(configuration);
        SettingsVersion = DateTime.UtcNow.Ticks.ToString(System.Globalization.CultureInfo.InvariantCulture);
    }

    public IEnumerable<PluginPageInfo> GetPages()
    {
        yield return new PluginPageInfo
        {
            Name = "JellyCinema",
            DisplayName = "Jelly Cinema",
            EmbeddedResourcePath = GetType().Namespace + ".Configuration.configPage.html",
            EnableInMainMenu = true,
            MenuIcon = "theaters"
        };
    }
}
