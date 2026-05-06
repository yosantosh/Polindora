#!/bin/bash
# ═══════════════════════════════════════════════
# Pomodoro Focus Timer — Install Script
# Installs the GNOME Shell extension
# ═══════════════════════════════════════════════

set -e

EXT_UUID="pomodoro-timer@pluto"
EXT_DIR="$HOME/.local/share/gnome-shell/extensions/$EXT_UUID"
SRC_DIR="$(cd "$(dirname "$0")/$EXT_UUID" && pwd)"

echo "🍅 Pomodoro Focus Timer — Installer"
echo "════════════════════════════════════"
echo ""

# Check if source exists
if [ ! -d "$SRC_DIR" ]; then
    echo "❌ Source directory not found: $SRC_DIR"
    exit 1
fi

# Remove old installation
if [ -d "$EXT_DIR" ]; then
    echo "🗑️  Removing old installation..."
    rm -rf "$EXT_DIR"
fi

# Copy extension files
echo "📦 Installing extension to $EXT_DIR..."
mkdir -p "$EXT_DIR"
cp -r "$SRC_DIR"/* "$EXT_DIR/"

# Compile schemas
echo "🔧 Compiling GSettings schemas..."
glib-compile-schemas "$EXT_DIR/schemas/"

# Enable the extension
echo "✅ Enabling extension..."
gnome-extensions enable "$EXT_UUID" 2>/dev/null || true

echo ""
echo "═══════════════════════════════════════════"
echo "🎉 Installation complete!"
echo ""
echo "⚠️  You need to restart GNOME Shell for changes to take effect:"
echo ""
echo "   On Wayland (default Ubuntu): Log out and log back in"
echo "   On X11: Press Alt+F2, type 'r', press Enter"
echo ""
echo "📋 After restart, you can manage the extension with:"
echo "   gnome-extensions prefs $EXT_UUID"
echo "═══════════════════════════════════════════"
