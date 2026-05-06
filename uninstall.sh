#!/bin/bash
# ============================================
# Pomodoro Focus Timer — Uninstall Script
# Removes the extension from GNOME Shell
# ============================================

set -e

EXTENSION_UUID="pomodoro-timer@pluto"
EXTENSION_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"
SCHEMA_DIR="$HOME/.local/share/glib-2.0/schemas"
SCHEMA_FILE="org.gnome.shell.extensions.pomodoro-timer.gschema.xml"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Pomodoro Focus Timer — Uninstaller     ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Check if extension exists
if [ ! -d "$EXTENSION_DIR" ]; then
    echo "⚠  Extension not found at: $EXTENSION_DIR"
    echo "   It may have already been uninstalled."
    exit 0
fi

# Confirm with user
read -p "⚡ This will remove the Pomodoro Focus Timer extension. Continue? [y/N] " confirm
if [[ "$confirm" != [yY] && "$confirm" != [yY][eE][sS] ]]; then
    echo "✗  Uninstall cancelled."
    exit 0
fi

# Step 1: Disable the extension
echo ""
echo "→ Disabling extension..."
gnome-extensions disable "$EXTENSION_UUID" 2>/dev/null || true

# Step 2: Remove the extension directory
echo "→ Removing extension files..."
rm -rf "$EXTENSION_DIR"
echo "  ✓ Removed: $EXTENSION_DIR"

# Step 3: Remove GSettings schema if installed locally
if [ -f "$SCHEMA_DIR/$SCHEMA_FILE" ]; then
    echo "→ Removing GSettings schema..."
    rm -f "$SCHEMA_DIR/$SCHEMA_FILE"
    echo "  ✓ Removed: $SCHEMA_DIR/$SCHEMA_FILE"

    # Recompile schemas
    if [ -d "$SCHEMA_DIR" ]; then
        echo "→ Recompiling schemas..."
        glib-compile-schemas "$SCHEMA_DIR" 2>/dev/null || true
        echo "  ✓ Schemas recompiled"
    fi
fi

# Step 4: Also check system-wide schema location (requires sudo)
SYSTEM_SCHEMA="/usr/share/glib-2.0/schemas/$SCHEMA_FILE"
if [ -f "$SYSTEM_SCHEMA" ]; then
    echo ""
    echo "⚠  System-wide schema found at: $SYSTEM_SCHEMA"
    read -p "   Remove it? (requires sudo) [y/N] " sys_confirm
    if [[ "$sys_confirm" == [yY] || "$sys_confirm" == [yY][eE][sS] ]]; then
        sudo rm -f "$SYSTEM_SCHEMA"
        sudo glib-compile-schemas /usr/share/glib-2.0/schemas/ 2>/dev/null || true
        echo "  ✓ System schema removed and recompiled"
    fi
fi

# Step 5: Reset dconf settings (optional)
echo ""
read -p "→ Also clear all saved settings (timer durations, tasks, stats)? [y/N] " clear_settings
if [[ "$clear_settings" == [yY] || "$clear_settings" == [yY][eE][sS] ]]; then
    dconf reset -f /org/gnome/shell/extensions/pomodoro-timer/ 2>/dev/null || true
    echo "  ✓ All settings cleared"
fi

echo ""
echo "═══════════════════════════════════════════"
echo "  ✓ Pomodoro Focus Timer has been removed!"
echo ""
echo "  Please restart GNOME Shell to complete:"
echo "    • Wayland: Log out and log back in"
echo "    • X11:     Press Alt+F2, type 'r', Enter"
echo "═══════════════════════════════════════════"
echo ""
