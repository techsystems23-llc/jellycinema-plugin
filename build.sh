#!/bin/bash
# Build the Jelly Cinema plugin and package it.
#   ./build.sh 0.1.0.18 "what changed"
# Output: dist/Jelly Cinema_<version>/ (copy that folder into Jellyfin's plugins folder, with no other
# "Jelly Cinema_*" folder next to it) and dist/jellycinema-plugin-<version>.zip (for a plugin catalog).
set -euo pipefail
VERSION="${1:?usage: ./build.sh <version> [changelog]}"
CHANGELOG="${2:-Jelly Cinema $VERSION}"
cd "$(dirname "$0")"
P=plugin/Jellyfin.Plugin.JellyCinema

# the web scripts are the sources; the plugin carries copies of them
cat web/hero.js web/jellycinema-banner.js > "$P/Web/jellycinema-banner.js"
cp web/jellycinema-home.js web/jellycinema-seasonal.js "$P/Web/"
for f in web/*.js "$P"/Web/*.js; do node --check "$f"; done

rm -rf "$P/out"
dotnet build "$P" -c Release -p:Version="$VERSION" -p:AssemblyVersion="$VERSION" -p:FileVersion="$VERSION" -o "$P/out" -nologo -v q

OUT="dist/Jelly Cinema_$VERSION"
rm -rf dist && mkdir -p "$OUT"
cp "$P/out/Jellyfin.Plugin.JellyCinema.dll" packaging/jellycinema.jpg "$OUT/"
# the licenses travel with every download (GPL-3.0 for Jelly Cinema, plus the fonts and icons it bundles)
cp LICENSE THIRD-PARTY-NOTICES.txt "$OUT/"
cp "$P/Web/fonts/OFL-Oswald.txt" "$P/Web/fonts/OFL-ArchivoBlack.txt" "$OUT/"
cp "$P/Web/icons/LICENSE-icons.txt" "$OUT/LICENSE-FluentEmoji.txt"
python3 - "$VERSION" "$CHANGELOG" "$OUT/meta.json" <<'PY'
import json, sys, datetime
v, log, out = sys.argv[1:4]
t = open('packaging/meta.json.in').read()
t = t.replace('@VERSION@', v).replace('@CHANGELOG@', json.dumps(log)[1:-1]).replace('@TIMESTAMP@', datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'))
json.loads(t); open(out, 'w').write(t)
PY
(cd "$OUT" && zip -q -j "../jellycinema-plugin-$VERSION.zip" Jellyfin.Plugin.JellyCinema.dll jellycinema.jpg meta.json LICENSE THIRD-PARTY-NOTICES.txt OFL-Oswald.txt OFL-ArchivoBlack.txt LICENSE-FluentEmoji.txt)
echo "Built $OUT and dist/jellycinema-plugin-$VERSION.zip (md5 $(md5sum "dist/jellycinema-plugin-$VERSION.zip" | cut -c1-32))"
