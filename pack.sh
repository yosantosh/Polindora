#!/bin/bash
# ──────────────────────────────────────────────────────
# pack.sh — Package Polindora for extensions.gnome.org
# ──────────────────────────────────────────────────────
# Usage:  ./pack.sh
# Output: releases/polindora@yosantosh.github.io.shell-extension.zip
# ──────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Extract UUID from metadata.json ──
EXT_UUID=$(grep -oP '"uuid":\s*"\K[^"]+' metadata.json)
if [ -z "$EXT_UUID" ]; then
    echo "ERROR: Could not read UUID from metadata.json"
    exit 1
fi

ZIP_NAME="${EXT_UUID}.shell-extension.zip"
OUT_DIR="$SCRIPT_DIR/releases"
OUT_PATH="$OUT_DIR/$ZIP_NAME"

echo "╔══════════════════════════════════════════════════╗"
echo "║       Polindora — Extension Packager             ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "  UUID:   $EXT_UUID"
echo "  Output: $OUT_PATH"
echo ""

# ── Compile GSettings schemas ──
echo "→ Compiling GSettings schemas..."
if [ -d "schemas" ]; then
    glib-compile-schemas schemas/
    echo "  ✔ Schemas compiled"
else
    echo "  ✖ No schemas/ directory found!"
    exit 1
fi

# ── Create releases directory ──
mkdir -p "$OUT_DIR"

# ── Remove old zip if present ──
if [ -f "$OUT_PATH" ]; then
    rm "$OUT_PATH"
    echo "  ✔ Removed old release zip"
fi

# ── Files & directories to include ──
# These are the ONLY files that EGO needs:
INCLUDE_FILES=(
    "metadata.json"
    "extension.js"
    "prefs.js"
    "stylesheet.css"
    "quotes.js"
)

INCLUDE_DIRS=(
    "icons"
    "schemas"
)

echo "→ Building zip archive..."

# Add individual files
for f in "${INCLUDE_FILES[@]}"; do
    if [ ! -f "$f" ]; then
        echo "  ✖ Missing required file: $f"
        exit 1
    fi
done

# Build zip — files first, then directories
zip -r "$OUT_PATH" "${INCLUDE_FILES[@]}"

for d in "${INCLUDE_DIRS[@]}"; do
    if [ -d "$d" ]; then
        zip -r "$OUT_PATH" "$d/" -x "*/gschemas.compiled"
    else
        echo "  ⚠ Directory $d/ not found, skipping"
    fi
done

echo ""
echo "→ Archive contents:"
zipinfo -1 "$OUT_PATH" | head -50
echo ""

FILE_COUNT=$(zipinfo -1 "$OUT_PATH" | wc -l)
FILE_SIZE=$(du -h "$OUT_PATH" | cut -f1)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✔ Packaged $FILE_COUNT files ($FILE_SIZE)"
echo "  ✔ Saved to: $OUT_PATH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Next step: Upload $ZIP_NAME to https://extensions.gnome.org"
echo ""
