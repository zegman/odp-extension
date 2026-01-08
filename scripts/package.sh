#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
MANIFEST="$ROOT_DIR/manifest.json"
NAME="odp-extension"

if ! command -v zip >/dev/null 2>&1; then
  echo "zip command not found. Install zip and rerun." >&2
  exit 1
fi

if [ ! -f "$MANIFEST" ]; then
  echo "manifest.json not found at $MANIFEST" >&2
  exit 1
fi

VERSION=$(python3 - <<'PY' "$MANIFEST"
import json
import sys
from pathlib import Path

path = Path(sys.argv[1])
try:
  data = json.loads(path.read_text())
except Exception:
  print("0.0.0")
  sys.exit(0)

print(data.get("version", "0.0.0"))
PY
)

mkdir -p "$DIST_DIR"
OUTPUT="$DIST_DIR/${NAME}-v${VERSION}.zip"

cd "$ROOT_DIR"
zip -r "$OUTPUT" \
  manifest.json \
  background.js \
  options.html \
  options.css \
  options.js \
  popup.html \
  popup.css \
  popup.js \
  icons \
  LICENSE \
  NOTICE \
  README.md \
  PRIVACY.md

echo "Created $OUTPUT"
