#!/usr/bin/env python3
"""Adds a release to the Jelly Cinema plugin catalog (the manifest.json Jellyfin reads from
Dashboard > Plugins > Repositories).

  tools/make-manifest.py <manifest.json> <version> <zip> <zip url> [CHANGELOG.md]

The manifest file is created if it doesn't exist. An existing entry for the same version is replaced.
The release notes come from the "## <version>" section of CHANGELOG.md.
"""
import datetime
import hashlib
import json
import os
import re
import sys

GUID = "9cd3e1ec-177d-47d7-8b07-7ec96b361d2d"


def notes(changelog, version):
    if not changelog or not os.path.exists(changelog):
        return "Jelly Cinema " + version
    text = open(changelog, encoding="utf-8").read()
    m = re.search(r"^## +v?" + re.escape(version) + r"\b[^\n]*\n(.*?)(?=^## |\Z)", text, re.S | re.M)
    body = (m.group(1).strip() if m else "") or ("Jelly Cinema " + version)
    return re.sub(r"\n{2,}", "\n", body)


def main():
    if len(sys.argv) < 5:
        sys.exit(__doc__)
    path, version, zip_path, zip_url = sys.argv[1:5]
    changelog = sys.argv[5] if len(sys.argv) > 5 else None
    repo_raw = os.environ.get("JC_RAW_BASE", "").rstrip("/")
    data = json.load(open(path, encoding="utf-8")) if os.path.exists(path) else []
    plugin = next((p for p in data if p.get("guid") == GUID), None)
    if plugin is None:
        plugin = {"guid": GUID, "versions": []}
        data.append(plugin)
    plugin.update({
        "name": "Jelly Cinema",
        "description": "A living-room home screen for Jellyfin: a hero banner with trailers, Theater Mode, Top 10 rows, "
                       "Because You Watched, genre and seasonal rows, and a full-size sign-in screen. Every row respects "
                       "each account's library access and rating limit. Not affiliated with the Jellyfin project.",
        "overview": "Living-room home screen for Jellyfin",
        "owner": "TechSystems23",
        "category": "General",
    })
    if repo_raw:
        plugin["imageUrl"] = repo_raw + "/packaging/jellycinema.jpg"
    md5 = hashlib.md5(open(zip_path, "rb").read()).hexdigest()
    entry = {
        "version": version,
        "changelog": notes(changelog, version),
        "targetAbi": "12.1.0.0",
        "sourceUrl": zip_url,
        "checksum": md5,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    plugin["versions"] = [entry] + [v for v in plugin.get("versions", []) if v.get("version") != version]
    plugin["versions"].sort(key=lambda v: [int(x) for x in v["version"].split(".")], reverse=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"{path}: Jelly Cinema {version} ({md5})")


if __name__ == "__main__":
    main()
