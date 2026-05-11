# Polindora - Comprehensive Technical Documentation

## 1. Introduction
Polindora is a premium, strict-focus Pomodoro timer designed specifically for GNOME Shell (versions 45-50). It utilizes a "dark glassmorphism" aesthetic, providing users with a non-intrusive, beautifully crafted progress indicator directly on the GNOME top panel, alongside a feature-rich GTK4/libadwaita preferences suite.

This document details the internal architecture, UI implementation, data management, and operational workflows of the Polindora extension.

---

## 2. Architecture Overview

GNOME Shell extensions operate under a split architecture. Polindora is composed of two entirely separate processes that communicate with each other:

1. **The Extension Process (`extension.js`)**: Runs directly inside the GNOME Shell compositor process. It manages the top-panel UI, the core timer loop, and system integration.
2. **The Preferences Process (`prefs.js`)**: Runs as a separate GTK4 application when the user opens the extension settings. It manages user configuration, analytics display, and task management.

### Inter-Process Communication (IPC)
Because the extension and preferences run in different processes, they cannot share JavaScript memory. Polindora bridges this gap using **`Gio.Settings` (GSettings)** under the schema `org.gnome.shell.extensions.pomodoro-timer`.

- **Commands**: When a user clicks "Play" or "Skip" in the preferences window, `prefs.js` writes a command string (e.g., `start-work`, `pause`) to the `timer-command` GSettings key. `extension.js` listens to changes on this key and executes the corresponding action.
- **State Synchronization**: `extension.js` continually updates keys like `timer-state`, `timer-duration-secs`, and `timer-elapsed-accumulated`. The preferences window reads these to display accurate countdowns and session rings.

---

## 3. Core Components

### 3.1 The Shell Extension (`extension.js`)

#### Timer State Machine
The core loop operates on four distinct states:
- `IDLE`: No active timer.
- `WORK`: Active focus session.
- `SHORT_BREAK`: Brief rest period.
- `LONG_BREAK`: Extended rest period after completing a set number of work sessions.

#### Custom Clutter UI (`PomodoroBar`)
Polindora injects custom UI elements into the GNOME top panel. It uses Clutter (GNOME Shell's scene graph) and St (Shell Toolkit) to create `PomodoroBar`, a custom widget.
- **Work Bar**: Injected *after* (to the right of) the `dateMenu` (the clock).
- **Break Bar**: Injected *before* (to the left of) the `dateMenu`.
- **Animations**: Uses Clutter's implicit animations (`.ease()`) to create buttery-smooth, liquid-like progress filling. A pulse effect is applied via opacity transitions.

#### Dynamic Wallpaper Color Extraction
Polindora dynamically adapts its styling to the user's desktop environment:
1. It listens to `org.gnome.desktop.background`.
2. It retrieves the file path of the current wallpaper (`picture-uri` or `picture-uri-dark`).
3. It generates an accent color by hashing the file path and converting the hash into a high-saturation HSL color. This ensures the timer bars organically match the user's desktop aesthetic without computationally expensive image parsing.

#### Panel Indicator
A standard `PanelMenu.Button` is added to the system status area. It displays a custom SVG icon (`polindora-logo.svg`) and provides quick access to pause/resume the timer or open the preferences window.

### 3.2 The Preferences Application (`prefs.js`)

The preferences window is built using modern GTK4 and libadwaita APIs.

#### Glassmorphism Styling
Polindora injects a custom `Gtk.CssProvider` containing complex CSS to achieve its signature look:
- Radial gradients for dynamic, fluid backgrounds.
- `@keyframes` animations (`fluid-drift`, `breathe-glow`) that make the window feel alive.
- Deep shadows, backdrop filters, and translucent borders for the "glass" effect.

#### Pages and Tabs
- **Home Tab**: Contains a custom `Gtk.DrawingArea` (`sessionRing`) that manually draws the segmented completion ring using Cairo graphics. It acts as the main control hub.
- **Timer Tab**: Configures durations for work, short breaks, and long breaks via `Adw.SpinRow`.
- **Behavior Tab**: Toggles strict mode (which hides controls to enforce focus), auto-start settings, and notification preferences.
- **Appearance Tab**: Modifies the physical dimensions of the panel bars and allows granular color customization using `Gtk.ColorDialogButton`.
- **Analytics & Tasks Tabs**: Parses historical data to display streaks, daily charts, and categorized task lists.

---

## 4. Data Persistence & State Management

All data is persistently stored in `dconf` via `GSettings`.

### Important Keys:
- **Timer Execution**: `timer-start-time` (monotonic time), `timer-elapsed-accumulated`, `timer-duration-secs`, `timer-is-paused`. Using monotonic time ensures the timer doesn't break if the system clock changes or the machine sleeps.
- **Analytics**: `sessions-completed`, `total-focus-minutes`.
- **Tasks & History**: `task-stats` stores a stringified JSON object containing a history of tasks, categories, and completion timestamps.

### Daily Rollover
Both `extension.js` and `prefs.js` independently verify the `last-session-date` key. If the system date changes to a new day, the daily analytics (sessions completed, daily focus minutes) are automatically reset to zero, while historical JSON data is preserved.

---

## 5. Visual Details and Micro-Interactions

- **Clutter Easing**: The progress bar doesn't just step forward; it interpolates to its new width using `Clutter.AnimationMode.LINEAR`. Upon session completion, an `EASE_OUT_ELASTIC` animation creates a "liquid burst" visual pop.
- **Color Saturation Algorithm**: Custom JavaScript functions convert HEX colors to RGB, convert to HSL to boost saturation, and convert back to HEX to ensure glowing elements always pop against dark backgrounds.
- **Motivational System**: An array of predefined strings (e.g., "Deep focus activated", "Recharge") is dynamically selected based on the current timer phase and displayed in the GTK window.

---

## 6. Project Structure

- **`extension.js`**: Core background daemon, top-panel UI injection, and timer logic.
- **`prefs.js`**: The GTK4 preferences application UI.
- **`stylesheet.css`**: GNOME Shell specific styling for the injected panel bars and indicator.
- **`metadata.json`**: GNOME extension definition, UUID, and version support list.
- **`schemas/`**: Contains `org.gnome.shell.extensions.pomodoro-timer.gschema.xml` which defines the types, defaults, and bounds for all configuration settings.
- **`icons/`**: Directory containing SVGs like the Gemini logo and system tray icons.
- **`install.sh` / `uninstall.sh`**: Scripts to handle building the `glib-compile-schemas` binaries and moving files to `~/.local/share/gnome-shell/extensions/`.
