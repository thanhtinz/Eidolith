#!/usr/bin/env bash
# Restores the self-hosted game fonts (Baloo 2 display + Be Vietnam Pro body,
# vietnamese + latin subsets) into apps/game-client/public/fonts/.
# The woff2 binaries are not in git (same policy as Font Awesome).
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="apps/game-client/public/fonts"
mkdir -p "$OUT"
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
curl -s -A "$UA" "https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Be+Vietnam+Pro:wght@500;600;700&display=swap" -o /tmp/_eidolith_fonts.css
OUT="$OUT" python3 - <<'PY'
import os, re, subprocess
out = os.environ["OUT"]
css = open("/tmp/_eidolith_fonts.css").read()
blocks = re.findall(r"/\*\s*(\S+)\s*\*/\s*(@font-face\s*{[^}]+})", css)
keep = []
for name, block in blocks:
    if name not in ("vietnamese", "latin"):
        continue
    url = re.search(r"url\((https://[^)]+\.woff2)\)", block).group(1)
    fn = url.split("/")[-1]
    subprocess.run(["curl", "-s", url, "-o", f"{out}/{fn}"], check=True)
    keep.append(f"/* {name} */\n" + block.replace(url, fn))
open(f"{out}/fonts.css", "w").write("\n".join(keep))
print("fonts restored:", len(keep), "faces")
PY
