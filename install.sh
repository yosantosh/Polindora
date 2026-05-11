#!/bin/bash
# ═════════════════════════════════════════════════════════════════════
# 🍅 Polindora — Premium Installation Script
# ═════════════════════════════════════════════════════════════════════
# This script installs the Polindora extension for GNOME Shell.
# It is designed to work from any directory and on any Ubuntu system.

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
echo -e "${CYAN}║${NC}  ${BOLD}🍅 Polindora — Focus Timer Installation${NC}                 ${CYAN}║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ─── PRE-FLIGHT CHECKS ────────────────────────────────────────────────
echo -e "${BLUE}➜ Running pre-flight checks...${NC}"

# 1. Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}❌ Error: Please do NOT run this script as root/sudo.${NC}"
    echo -e "   Extensions should be installed in the user's local directory."
    exit 1
fi

# 2. Check for metadata.json to extract UUID
if [ ! -f "$SCRIPT_DIR/metadata.json" ]; then
    echo -e "${RED}❌ Error: metadata.json not found in $SCRIPT_DIR${NC}"
    echo -e "   Please make sure you are running the script from the source folder."
    exit 1
fi

EXT_UUID=$(grep -oP '"uuid":\s*"\K[^"]+' "$SCRIPT_DIR/metadata.json")
if [ -z "$EXT_UUID" ]; then
    echo -e "${RED}❌ Error: Could not determine UUID from metadata.json${NC}"
    exit 1
fi

EXT_DIR="$HOME/.local/share/gnome-shell/extensions/$EXT_UUID"

# 3. Check for required tools
MISSING_TOOLS=()
TOOLS=("glib-compile-schemas" "gnome-extensions" "gsettings" "cp" "mkdir")
for tool in "${TOOLS[@]}"; do
    if ! command -v "$tool" &> /dev/null; then
        MISSING_TOOLS+=("$tool")
    fi
done

if [ ${#MISSING_TOOLS[@]} -ne 0 ]; then
    echo -e "${GOLD}⚠ Warning: Missing tools: ${MISSING_TOOLS[*]}${NC}"
    echo -e "   Installation may be incomplete. Try running:"
    echo -e "   ${BOLD}sudo apt update && sudo apt install gnome-shell-extensions${NC}"
fi

# ─── SYSTEM ACTIVATION ────────────────────────────────────────────────
echo -e "${BLUE}➜ Activating system extension support...${NC}"

# Ensure user extensions are enabled globally
if command -v gsettings &> /dev/null; then
    gsettings set org.gnome.shell disable-user-extensions false
    echo -e "   ${GREEN}✓${NC} User extensions enabled in GSettings"
fi

# Check if gnome-shell is running
if ! pgrep -x "gnome-shell" > /dev/null; then
    echo -e "   ${GOLD}⚠${NC} GNOME Shell is not currently running. You'll need to start it to see the extension."
fi

# ─── INSTALLATION PROCESS ─────────────────────────────────────────────
echo -e "${BLUE}➜ UUID Detected:${NC} ${BOLD}$EXT_UUID${NC}"
echo -e "${BLUE}➜ Target Path:${NC}   ${EXT_DIR}"
echo ""

# Remove old installation if exists
if [ -d "$EXT_DIR" ]; then
    echo -e "${PURPLE}📦 Removing existing installation...${NC}"
    rm -rf "$EXT_DIR"
fi

# Create extension directory
echo -e "${PURPLE}📦 Creating target directory...${NC}"
mkdir -p "$EXT_DIR"

# Copy files
echo -e "${PURPLE}📦 Deploying extension files...${NC}"
FILES_TO_COPY=("extension.js" "prefs.js" "metadata.json" "stylesheet.css" "schemas" "icons")

for item in "${FILES_TO_COPY[@]}"; do
    if [ -e "$SCRIPT_DIR/$item" ]; then
        cp -r "$SCRIPT_DIR/$item" "$EXT_DIR/"
        echo -e "   ${GREEN}✓${NC} Copied: $item"
    else
        echo -e "   ${GOLD}⚠${NC} Missing: $item (Skipping)"
    fi
done

# Compile schemas
if [ -d "$EXT_DIR/schemas" ]; then
    echo -e "${PURPLE}🔧 Compiling GSettings schemas...${NC}"
    glib-compile-schemas "$EXT_DIR/schemas/"
    echo -e "   ${GREEN}✓${NC} Schemas compiled successfully"
fi

# Attempt to enable the extension automatically
echo -e "${PURPLE}🚀 Activating extension...${NC}"
if command -v gnome-extensions &> /dev/null; then
    # Try to enable. 
    # Note: On Wayland, this often fails for new extensions until shell restart.
    if gnome-extensions enable "$EXT_UUID" 2>/dev/null; then
        echo -e "   ${GREEN}✓${NC} Extension enabled successfully!"
    else
        echo -e "   ${GOLD}ℹ${NC} Extension installed but Shell restart required to enable."
    fi
fi

# ─── FINALIZATION ─────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${GREEN}${BOLD}🎉 Installation Successful!${NC}                             ${CYAN}║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BOLD}Next Steps (CRITICAL):${NC}"

echo -e "1. ${CYAN}Restart GNOME Shell:${NC}"
echo -e "   • ${BOLD}Wayland${NC} (Default Ubuntu): Log out and log back in."
echo -e "   • ${BOLD}X11${NC}: Press ${BOLD}Alt+F2${NC}, type ${BOLD}'r'${NC}, and press ${BOLD}Enter${NC}."
echo ""
echo -e "2. ${CYAN}Enable in Extensions App:${NC}"
echo -e "   After restart, open the 'Extensions' app (or 'Extension Manager')"
echo -e "   and ensure ${BOLD}Polindora${NC} is toggled ON."
echo ""
echo -e "3. ${CYAN}If it still doesn't appear:${NC}"
echo -e "   Run: ${GOLD}gnome-extensions list${NC}"
echo -e "   If Polindora is listed but not working, check logs:"
echo -e "   ${GOLD}journalctl /usr/bin/gnome-shell -f${NC}"
echo ""
echo -e "════════════════════════════════════════════════════════════"
echo -e "${BLUE}Stay focused with Polindora! 🍅${NC}"
echo -e "════════════════════════════════════════════════════════════"
echo ""
