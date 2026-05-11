#!/bin/bash
# ═════════════════════════════════════════════════════════════════════
# 🗑️  Polindora — Premium Uninstallation Script
# ═════════════════════════════════════════════════════════════════════
# This script removes the Polindora extension from GNOME Shell.
# It works from any directory and ensures a clean removal.

set -e

# ─── COLOR CONSTANTS ──────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
GOLD='\033[0;33m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ─── DYNAMIC PATH DETECTION ───────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${BOLD}🗑️  Polindora — Focus Timer Uninstallation${NC}               ${CYAN}║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ─── EXTRACT UUID ─────────────────────────────────────────────────────
# Try to find UUID from metadata.json in the script directory first
if [ -f "$SCRIPT_DIR/metadata.json" ]; then
    EXT_UUID=$(grep -oP '"uuid":\s*"\K[^"]+' "$SCRIPT_DIR/metadata.json")
fi

# Fallback to default if not found (in case script was moved)
if [ -z "$EXT_UUID" ]; then
    EXT_UUID="polindora@yosantosh.github.io"
fi

EXT_DIR="$HOME/.local/share/gnome-shell/extensions/$EXT_UUID"

# ─── CONFIRMATION ─────────────────────────────────────────────────────
if [ ! -d "$EXT_DIR" ]; then
    echo -e "${GOLD}⚠ Warning: Extension not found at:${NC} ${EXT_DIR}"
    echo -e "   It may have already been uninstalled."
    echo ""
else
    echo -e "${BLUE}➜ UUID Detected:${NC} ${BOLD}$EXT_UUID${NC}"
    echo -e "${BLUE}➜ Target Path:${NC}   ${EXT_DIR}"
    echo ""
fi

read -p "⚡ This will remove the Polindora extension. Continue? [y/N] " confirm
if [[ "$confirm" != [yY] && "$confirm" != [yY][eE][sS] ]]; then
    echo -e "${GOLD}✗ Uninstall cancelled.${NC}"
    exit 0
fi

# ─── UNINSTALLATION PROCESS ───────────────────────────────────────────
echo ""
echo -e "${PURPLE}→ Disabling extension...${NC}"
if command -v gnome-extensions &> /dev/null; then
    gnome-extensions disable "$EXT_UUID" 2>/dev/null || true
fi

if [ -d "$EXT_DIR" ]; then
    echo -e "${PURPLE}→ Removing extension files...${NC}"
    rm -rf "$EXT_DIR"
    echo -e "  ${GREEN}✓${NC} Files removed."
fi

# Step 3: Remove GSettings schema if installed locally in the central schemas dir
SCHEMA_DIR="$HOME/.local/share/glib-2.0/schemas"
SCHEMA_FILE="org.gnome.shell.extensions.pomodoro-timer.gschema.xml"

if [ -f "$SCHEMA_DIR/$SCHEMA_FILE" ]; then
    echo -e "${PURPLE}→ Removing legacy GSettings schema...${NC}"
    rm -f "$SCHEMA_DIR/$SCHEMA_FILE"
    if command -v glib-compile-schemas &> /dev/null; then
        glib-compile-schemas "$SCHEMA_DIR" 2>/dev/null || true
    fi
    echo -e "  ${GREEN}✓${NC} Legacy schema removed."
fi

# Step 4: Optional settings reset
echo ""
read -p "→ Also clear all saved settings (timer durations, tasks, stats)? [y/N] " clear_settings
if [[ "$clear_settings" == [yY] || "$clear_settings" == [yY][eE][sS] ]]; then
    if command -v dconf &> /dev/null; then
        # Try to extract schema from metadata.json or use default
        SCHEMA_ID=$(grep -oP '"settings-schema":\s*"\K[^"]+' "$SCRIPT_DIR/metadata.json" 2>/dev/null || echo "org.gnome.shell.extensions.pomodoro-timer")
        dconf reset -f "/${SCHEMA_ID//./\/}/" 2>/dev/null || true
        echo -e "  ${GREEN}✓${NC} All settings cleared."
    else
        echo -e "  ${GOLD}⚠${NC} dconf command not found. Skipping settings reset."
    fi
fi

# ─── FINALIZATION ─────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${GREEN}${BOLD}✓ Polindora has been uninstalled!${NC}                       ${CYAN}║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BOLD}Final Step:${NC}"
echo -e "Please restart GNOME Shell to complete the removal:"
echo -e " • ${BOLD}Wayland${NC}: Log out and log back in."
echo -e " • ${BOLD}X11${NC}: Press ${BOLD}Alt+F2${NC}, type ${BOLD}'r'${NC}, and press ${BOLD}Enter${NC}."
echo ""
echo -e "════════════════════════════════════════════════════════════"
echo -e "${BLUE}Hope to see you again soon! 🍅${NC}"
echo -e "════════════════════════════════════════════════════════════"
echo ""
