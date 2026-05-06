# Neon Rose Pomodoro Timer 🍅

A stunning, glassmorphism-inspired Pomodoro Timer extension for GNOME Shell with a unique top-bar progress indicator.

## ✨ Why Our App is Different

Most Pomodoro timers force you to constantly break your focus just to check how much time is remaining—requiring you to switch tabs, open menus, or check your phone.

**Our solution: The Top-Bar Progress Indicator.**
We built a sleek, non-intrusive progress line that sits right at the top of your screen. This means you can keep track of your remaining time at a mere glance without ever leaving your current workflow or switching tabs.

![Progress Bar Indicator Placeholder](path/to/your/image.png)
*(Add your image of the bar progress indicator line at the top of the screen here)*

## 🚀 Features

- **Top-Bar Progress Line:** Track your time seamlessly without breaking focus.
- **Fluid Glassmorphism UI:** A premium "Neon Rose" aesthetic with magenta/hot pink accents and sleek dark mode styling.
- **Unified Analytics & Tasks:** Manage your tasks and view daily/weekly productivity stats right from the comprehensive settings interface.
- **Quick Controls:** Start, pause, or reset your timer directly from the panel menu.

## 🛠️ Installation

### Manual Installation

1. Clone or download this project folder.
2. Move the extension folder (`pomodoro-timer@pluto`) to your GNOME Shell extensions directory:
   ```bash
   cp -r pomodoro-timer@pluto ~/.local/share/gnome-shell/extensions/
   ```
3. Compile the GSettings schemas inside the extension directory:
   ```bash
   glib-compile-schemas ~/.local/share/gnome-shell/extensions/pomodoro-timer@pluto/schemas/
   ```
4. Restart GNOME Shell:
   - **X11:** Press `Alt + F2`, type `r`, and press `Enter`.
   - **Wayland:** Log out and log back in.
5. Enable the extension:
   ```bash
   gnome-extensions enable pomodoro-timer@pluto
   ```
   *(Alternatively, you can use the "Extensions" app to enable it.)*

## 🗑️ Uninstallation

To remove the extension completely from your system:

1. Disable the extension:
   ```bash
   gnome-extensions disable pomodoro-timer@pluto
   ```
2. Remove the extension directory:
   ```bash
   rm -rf ~/.local/share/gnome-shell/extensions/pomodoro-timer@pluto
   ```
3. Restart GNOME Shell (Press `Alt + F2`, type `r`, and press `Enter`, or log out/in on Wayland).

## 📖 How to Use

1. **Start a Session:** Click the Pomodoro icon in your GNOME top panel. A beautiful glassmorphic menu will appear where you can start your focus session.
2. **Track Progress:** Once started, a subtle progress bar will stretch across the top edge of your screen, letting you know how much time is left without interrupting your workflow!
3. **Manage Tasks & Stats:** Click the settings icon in the extension menu or the app grid to open the unified application window. Here you can add tasks, view your analytics, and adjust your preferences.

---
*Built for GNOME Shell with focus and aesthetics in mind.*
