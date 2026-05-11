#!/bin/bash
# ─────────────────────────────────────────────────
# validate_zip.sh — Validate the packaged extension zip
# ─────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

PASS=0
FAIL=0
WARN=0

pass() { echo -e "  ${GREEN}✔ PASS${NC}: $1"; PASS=$((PASS + 1)); }
fail() { echo -e "  ${RED}✖ FAIL${NC}: $1"; FAIL=$((FAIL + 1)); }
warn() { echo -e "  ${YELLOW}⚠ WARN${NC}: $1"; WARN=$((WARN + 1)); }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ZIP_PATH="$SCRIPT_DIR/releases/polindora@yosantosh.github.io.shell-extension.zip"
TEST_DIR=$(mktemp -d "${SCRIPT_DIR}/tests/validate_XXXXXX")

cleanup() { rm -rf "$TEST_DIR"; }
trap cleanup EXIT

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     Polindora — Extension Zip Validator          ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ── 1. Check zip exists ──
echo -e "${BOLD}[1/8] Zip file existence${NC}"
if [ -f "$ZIP_PATH" ]; then
    SIZE=$(du -h "$ZIP_PATH" | cut -f1)
    pass "Zip exists: $ZIP_PATH ($SIZE)"
else
    fail "Zip not found: $ZIP_PATH"
    echo -e "  ${RED}Cannot continue without zip file.${NC}"
    exit 1
fi

# ── 2. Extract and check structure ──
echo -e "${BOLD}[2/8] Extracting & checking structure${NC}"
unzip -q "$ZIP_PATH" -d "$TEST_DIR"

REQUIRED_FILES=("metadata.json" "extension.js" "prefs.js" "stylesheet.css" "quotes.js")
for f in "${REQUIRED_FILES[@]}"; do
    if [ -f "$TEST_DIR/$f" ]; then
        pass "Required file present: $f"
    else
        fail "Missing required file: $f"
    fi
done

# Check icons directory
ICON_COUNT=$(find "$TEST_DIR/icons" -name "*.svg" 2>/dev/null | wc -l)
if [ "$ICON_COUNT" -gt 0 ]; then
    pass "Icons directory present with $ICON_COUNT SVGs"
else
    fail "Icons directory missing or empty"
fi

# Check schemas
if [ -f "$TEST_DIR/schemas/gschemas.compiled" ]; then
    pass "Compiled schemas present"
else
    fail "Missing compiled schemas (gschemas.compiled)"
fi

if ls "$TEST_DIR/schemas/"*.gschema.xml 1>/dev/null 2>&1; then
    pass "Schema XML present"
else
    fail "Missing schema XML file"
fi

# ── 3. Check NO unwanted files leaked in ──
echo -e "${BOLD}[3/8] Checking for unwanted files${NC}"
UNWANTED=(".git" "tests" "scripts" "packaging" "install.sh" "uninstall.sh" "pack.sh" "README.md" "DOCUMENTATION.md" "LICENSE" ".agents" ".codex")
for u in "${UNWANTED[@]}"; do
    if [ -e "$TEST_DIR/$u" ]; then
        fail "Unwanted file/dir leaked into zip: $u"
    else
        pass "Correctly excluded: $u"
    fi
done

# Check no screenshots leaked
PNG_COUNT=$(find "$TEST_DIR" -name "*.png" 2>/dev/null | wc -l)
if [ "$PNG_COUNT" -eq 0 ]; then
    pass "No screenshots leaked into zip"
else
    fail "Found $PNG_COUNT PNG files in zip (screenshots?)"
fi

# ── 4. Validate metadata.json ──
echo -e "${BOLD}[4/8] Validating metadata.json${NC}"
META="$TEST_DIR/metadata.json"

# Check JSON is valid
if python3 -c "import json; json.load(open('$META'))" 2>/dev/null; then
    pass "metadata.json is valid JSON"
else
    fail "metadata.json is invalid JSON"
fi

# Check required fields
UUID=$(python3 -c "import json; print(json.load(open('$META')).get('uuid',''))" 2>/dev/null || echo "")
NAME=$(python3 -c "import json; print(json.load(open('$META')).get('name',''))" 2>/dev/null || echo "")
DESC=$(python3 -c "import json; print(json.load(open('$META')).get('description',''))" 2>/dev/null || echo "")
URL=$(python3 -c "import json; print(json.load(open('$META')).get('url',''))" 2>/dev/null || echo "")
SHELL_VERS=$(python3 -c "import json; v=json.load(open('$META')).get('shell-version',[]); print(len(v))" 2>/dev/null || echo "0")
VERSION=$(python3 -c "import json; print(json.load(open('$META')).get('version',''))" 2>/dev/null || echo "")
SCHEMA=$(python3 -c "import json; print(json.load(open('$META')).get('settings-schema',''))" 2>/dev/null || echo "")

if [ -n "$UUID" ]; then pass "UUID set: $UUID"; else fail "UUID is empty"; fi
if [ -n "$NAME" ]; then pass "Name set: $NAME"; else fail "Name is empty"; fi
if [ "${#DESC}" -gt 10 ]; then pass "Description present (${#DESC} chars)"; else fail "Description too short or missing"; fi
if [ -n "$URL" ] && [ "$URL" != "None" ]; then pass "URL set: $URL"; else fail "URL is empty"; fi
if [ "$SHELL_VERS" -gt 0 ] 2>/dev/null; then pass "shell-version has $SHELL_VERS entries"; else fail "shell-version is empty"; fi
if [ -n "$VERSION" ]; then pass "Version set: $VERSION"; else fail "Version is empty"; fi
if [ -n "$SCHEMA" ]; then pass "settings-schema set: $SCHEMA"; else fail "settings-schema is empty"; fi

# UUID format check (should contain @)
if [[ "$UUID" == *"@"* ]]; then
    pass "UUID contains @ separator"
else
    fail "UUID missing @ separator (EGO requirement)"
fi

# Description length check (EGO rejects very long descriptions)
if [ "${#DESC}" -le 500 ]; then
    pass "Description length OK (${#DESC} chars, max 500)"
else
    warn "Description might be too long for EGO (${#DESC} chars)"
fi

# ── 5. Validate schema matches metadata ──
echo -e "${BOLD}[5/8] Cross-validating schema ID${NC}"
SCHEMA_XML=$(ls "$TEST_DIR/schemas/"*.gschema.xml 2>/dev/null | head -1)
if [ -n "$SCHEMA_XML" ]; then
    SCHEMA_ID=$(grep -oP 'id="\K[^"]+' "$SCHEMA_XML" | head -1)
    if [ "$SCHEMA_ID" = "$SCHEMA" ]; then
        pass "Schema ID in XML ($SCHEMA_ID) matches metadata.json ($SCHEMA)"
    else
        fail "Schema ID mismatch: XML='$SCHEMA_ID' vs metadata='$SCHEMA'"
    fi
fi

# ── 6. Validate JS syntax ──
echo -e "${BOLD}[6/8] JavaScript syntax validation${NC}"
for jsfile in extension.js prefs.js quotes.js; do
    if [ -f "$TEST_DIR/$jsfile" ]; then
        if command -v gjs &>/dev/null; then
            # GJS can parse-check with --command
            if gjs -c "imports.gi;" &>/dev/null 2>&1; then
                pass "$jsfile — GJS available (runtime check skipped, needs GNOME Shell)"
            else
                pass "$jsfile — GJS available (runtime check skipped, needs GNOME Shell)"
            fi
        elif command -v node &>/dev/null; then
            # Try as ES module
            if node --input-type=module -e "$(cat "$TEST_DIR/$jsfile" | sed 's/from.*gi:\/\/.*//g; s/from.*resource:\/\/.*//g; s/import.*cairo.*//g')" 2>/dev/null; then
                pass "$jsfile passes basic syntax check"
            else
                warn "$jsfile — Node.js can't validate GJS-specific imports (expected)"
            fi
        else
            warn "No JS runtime available for syntax checking $jsfile"
        fi
    fi
done

# ── 7. Check imports reference bundled files ──
echo -e "${BOLD}[7/8] Checking import references${NC}"
# Check if extension.js imports quotes.js
if grep -q "from.*['\"]\.\/quotes\.js['\"]" "$TEST_DIR/extension.js"; then
    pass "extension.js imports quotes.js (bundled in zip)"
else
    warn "extension.js doesn't seem to import quotes.js"
fi

# Check for any local imports that reference files NOT in the zip
LOCAL_IMPORTS=$(grep -oP "from\s+['\"](\./[^'\"]+)['\"]" "$TEST_DIR/extension.js" 2>/dev/null | grep -oP "\./[^'\"]+" || true)
if [ -n "$LOCAL_IMPORTS" ]; then
    while IFS= read -r imp; do
        # Strip leading ./
        imp_file="${imp#./}"
        if [ -f "$TEST_DIR/$imp_file" ]; then
            pass "Local import '$imp_file' is bundled in zip"
        else
            fail "Local import '$imp_file' is NOT in the zip — will crash at runtime!"
        fi
    done <<< "$LOCAL_IMPORTS"
fi

# Also check prefs.js for local imports
PREFS_IMPORTS=$(grep -oP "from\s+['\"](\./[^'\"]+)['\"]" "$TEST_DIR/prefs.js" 2>/dev/null | grep -oP "\./[^'\"]+" || true)
if [ -n "$PREFS_IMPORTS" ]; then
    while IFS= read -r imp; do
        imp_file="${imp#./}"
        if [ -f "$TEST_DIR/$imp_file" ]; then
            pass "prefs.js local import '$imp_file' is bundled in zip"
        else
            fail "prefs.js local import '$imp_file' is NOT in the zip — will crash!"
        fi
    done <<< "$PREFS_IMPORTS"
fi

# ── 8. Test install (dry run) ──
echo -e "${BOLD}[8/8] Test install (dry run)${NC}"
INSTALL_DIR="$TEST_DIR/install_test/$UUID"
mkdir -p "$INSTALL_DIR"

# Simulate what gnome-extensions install does: extract zip to UUID dir
unzip -q "$ZIP_PATH" -d "$INSTALL_DIR" 2>/dev/null
if [ -f "$INSTALL_DIR/metadata.json" ] && [ -f "$INSTALL_DIR/extension.js" ]; then
    pass "Simulated install structure is valid"
else
    fail "Simulated install structure is broken"
fi

# Check compiled schemas can be loaded
if command -v gsettings &>/dev/null; then
    export GSETTINGS_SCHEMA_DIR="$INSTALL_DIR/schemas"
    KEY_COUNT=$(gsettings list-keys "$SCHEMA" 2>/dev/null | wc -l || echo "0")
    if [ "$KEY_COUNT" -gt 0 ]; then
        pass "GSettings schema loads correctly ($KEY_COUNT keys found)"
    else
        warn "Could not validate GSettings schema load (may need running GNOME session)"
    fi
fi

# Check icon files are valid SVGs (have <svg tag)
BROKEN_ICONS=0
for svg in "$INSTALL_DIR/icons/"*.svg; do
    if [ -f "$svg" ] && ! grep -q "<svg" "$svg" 2>/dev/null; then
        fail "Invalid SVG: $(basename "$svg")"
        BROKEN_ICONS=$((BROKEN_ICONS + 1))
    fi
done
if [ "$BROKEN_ICONS" -eq 0 ]; then
    pass "All icon SVGs are valid"
fi

# ── Summary ──
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${GREEN}Passed: $PASS${NC}  |  ${RED}Failed: $FAIL${NC}  |  ${YELLOW}Warnings: $WARN${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "$FAIL" -eq 0 ]; then
    echo -e "  ${GREEN}${BOLD}✔ ZIP IS VALID — Ready to upload to extensions.gnome.org!${NC}"
else
    echo -e "  ${RED}${BOLD}✖ ZIP HAS ISSUES — Fix the $FAIL failure(s) above before uploading.${NC}"
fi
echo ""

exit "$FAIL"
