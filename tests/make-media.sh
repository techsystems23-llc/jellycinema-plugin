#!/bin/bash
# Builds a tiny test library for the automatic permission check: short black videos with .nfo files
# (titles, ratings, genres, tags), in four libraries:
#   Kids     - family movies (G/PG), two of them Christmas titles
#   Grownup  - R-rated movies (one Halloween), which kid accounts must never see
#   Holiday  - mostly Christmas TV movies (PG), so it gets its own "<Library> Christmas" row
#   Shows    - one TV-MA show with two episodes
# Usage: tests/make-media.sh <folder>
set -euo pipefail
ROOT="${1:?usage: make-media.sh <folder>}"
mkdir -p "$ROOT"
CLIP="$ROOT/.clip.mp4"
[ -f "$CLIP" ] || ffmpeg -loglevel error -f lavfi -i color=c=black:s=320x180:d=3 -f lavfi -i anullsrc=r=22050:cl=mono -t 3 -c:v libx264 -c:a aac -shortest "$CLIP"

movie() { # library title year rating genre tags...
  local lib="$1" title="$2" year="$3" rating="$4" genre="$5"; shift 5
  local dir="$ROOT/$lib/$title ($year)"
  mkdir -p "$dir"
  cp "$CLIP" "$dir/$title ($year).mp4"
  {
    echo '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    echo "<movie><title>$title</title><year>$year</year><mpaa>$rating</mpaa><genre>$genre</genre><rating>7.5</rating>"
    for t in "$@"; do echo "<tag>$t</tag>"; done
    echo "<plot>Test title for the Jelly Cinema permission check.</plot></movie>"
  } > "$dir/$title ($year).nfo"
}

movie Kids "Puppy Parade" 2019 G Family
movie Kids "Robot Pals" 2020 PG Animation
movie Kids "Space Kittens" 2021 PG Animation
movie Kids "The Lost Kite" 2018 G Family
movie Kids "A Kids Christmas" 2017 G Family christmas
movie Kids "Snowman Friends" 2016 PG Family "christmas tree"

movie Grownup "Night Heist" 2015 R Action
movie Grownup "Hard Case" 2014 R Drama
movie Grownup "Dark Harbor" 2013 R Thriller
movie Grownup "Midnight Manor" 2012 R Horror halloween
movie Grownup "Last Stand" 2011 R Action
movie Grownup "Cold Trail" 2010 R Drama

for i in 1 2 3 4 5 6 7 8; do
  movie Holiday "Christmas in Town $i" $((2010 + i)) PG Romance christmas
done
movie Holiday "Autumn Inn" 2019 PG Romance
movie Holiday "Spring Garden" 2020 PG Romance

SHOW="$ROOT/Shows/Rough Streets"
mkdir -p "$SHOW/Season 01"
echo '<?xml version="1.0" encoding="UTF-8"?><tvshow><title>Rough Streets</title><mpaa>TV-MA</mpaa><genre>Crime</genre></tvshow>' > "$SHOW/tvshow.nfo"
for e in 1 2; do
  cp "$CLIP" "$SHOW/Season 01/Rough Streets S01E0$e.mp4"
  echo "<?xml version=\"1.0\" encoding=\"UTF-8\"?><episodedetails><title>Episode $e</title><season>1</season><episode>$e</episode><mpaa>TV-MA</mpaa></episodedetails>" > "$SHOW/Season 01/Rough Streets S01E0$e.nfo"
done
echo "Test media ready in $ROOT"
