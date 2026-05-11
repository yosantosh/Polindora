/* ============================================
   POMODORO FOCUS TIMER — Extension
   Strict-focus Pomodoro with glassmorphism bars
   ============================================ */

import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Clutter from 'gi://Clutter';
import St from 'gi://St';
import Cairo from 'cairo';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

// Timer states
const State = {
    IDLE: 'idle',
    WORK: 'work',
    SHORT_BREAK: 'short_break',
    LONG_BREAK: 'long_break',
};

// Motivational messages
const MOTIVATIONS = {
    idle_zero: [
        "· You haven't started yet — time is ticking",
        "· Every minute idle is a minute wasted",
        "· Start now. Your future self will thank you",
    ],
    idle_some: [
        "॥ Take a breather, then get back to it",
        "॥ Good progress — but don't stop now",
    ],
    work_early: [
        "Stay locked in — you've got this",
        "Deep focus activated — no distractions",
        "The first minutes are the hardest. Push through",
    ],
    work_mid: [
        "⟡ Halfway there — keep the momentum",
        "⟡ You're in the zone — don't break it",
        "⟡ Flow state loading... almost there",
    ],
    work_late: [
        "Almost done — finish strong",
        "Final stretch — you can see the finish line",
        "Just a few more minutes of brilliance",
    ],
    break_msg: [
        "∘ Recharge — you earned this break",
        "∘ Rest your eyes, stretch, hydrate",
        "∘ Brief pause — then back to greatness",
    ],
    streak: [
        "{n} pomodoros done — keep the streak alive!",
        "{n} sessions crushed — you're on fire!",
        "{n} deep focus blocks — legendary!",
    ],
};

function getMotivation(category, n) {
    const msgs = MOTIVATIONS[category];
    const msg = msgs[Math.floor(Math.random() * msgs.length)];
    return msg.replace('{n}', n);
}

function formatTime(totalSeconds) {
    if (!Number.isFinite(totalSeconds)) totalSeconds = 0;
    totalSeconds = Math.max(0, Math.floor(totalSeconds));
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function getTodayStr() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
}

function clampInt(value, min, max, fallback) {
    if (!Number.isFinite(value)) return fallback;
    return Math.max(min, Math.min(max, Math.floor(value)));
}



// ─── Custom Progress Bar Widget ───
const PomodoroBar = GObject.registerClass(
    class PomodoroBar extends St.BoxLayout {
        _init(side) {
            super._init({
                style_class: 'pomodoro-bar-container',
                vertical: false,
                y_align: Clutter.ActorAlign.CENTER,
                reactive: true,
                track_hover: true,
            });

            this._side = side; // 'work' or 'break'
            this._isVisible = false;
            this._pulseId = 0;
            this._destroyed = false;

            // Start completely hidden — not visible at all
            this.visible = false;

            // Time label (shows remaining time next to bar)
            this._timeLabel = new St.Label({
                text: '',
                y_align: Clutter.ActorAlign.CENTER,
                x_align: Clutter.ActorAlign.CENTER,
                style: 'width: 45px; text-align: center; font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.85); margin: 0 4px; font-family: monospace;',
            });

            // Outer glass capsule
            this._outer = new St.Bin({
                style_class: 'pomodoro-bar-outer',
                y_align: Clutter.ActorAlign.CENTER,
            });

            // Track (dark background)
            this._track = new St.Widget({
                style_class: 'pomodoro-bar-track',
                y_align: Clutter.ActorAlign.CENTER,
            });

            // Fill bar (the progress)
            this._fill = new St.Widget({
                style_class: `pomodoro-bar-fill pomodoro-${side}-fill`,
                y_align: Clutter.ActorAlign.CENTER,
            });

            // Glass shine overlay
            this._shine = new St.Widget({
                style_class: 'pomodoro-bar-shine',
            });

            // Build hierarchy: outer > track > [fill, shine]
            this._track.add_child(this._fill);
            this._track.add_child(this._shine);
            this._outer.set_child(this._track);

            // Layout: time label position depends on side
            if (side === 'break') {
                // Break bar is LEFT of clock: [time] [===bar===]
                this.add_child(this._timeLabel);
                this.add_child(this._outer);
            } else {
                // Work bar is RIGHT of clock: [===bar===] [time]
                this.add_child(this._outer);
                this.add_child(this._timeLabel);
            }

            this._progress = 0;
            this._barWidth = 140;
            this._barHeight = 2;
            this._hideTimeoutId = 0;
            this._flashTimeoutId = 0;

            this._updateSizes();
        }

        setDimensions(width, height) {
            if (this._destroyed) return;
            this._barWidth = clampInt(width, 1, 300, 140);
            this._barHeight = clampInt(height, 1, 12, 3);
            this._updateSizes();
        }

        _updateSizes() {
            if (this._destroyed) return;
            const w = this._barWidth;
            const h = this._barHeight;

            const outerW = Math.max(w, 4);
            const outerH = Math.max(h, 4);
            // Subtract 2px for the 1px border on each side
            const innerW = outerW - 2;
            const innerH = outerH - 2;
            
            this._innerW = innerW;

            this._outer.set_size(outerW, outerH);
            this._track.set_size(innerW, innerH);
            this._fill.height = innerH;
            this._shine.set_size(innerW, Math.max(1, Math.floor(innerH / 2)));
            this._updateFillWidth();
        }

        setProgress(fraction) {
            if (this._destroyed) return;
            this._progress = Math.max(0, Math.min(1, fraction));
            this._updateFillWidth();
        }

        _updateFillWidth() {
            if (this._destroyed) return;
            // Use Clutter implicit animation for buttery-smooth modern filling
            const fillVisible = this._progress > 0;
            if (fillVisible) {
                let targetWidth = Math.max(1, Math.floor((this._innerW || this._barWidth) * this._progress));
                this._fill.ease({
                    width: targetWidth,
                    duration: 1000,
                    mode: Clutter.AnimationMode.LINEAR
                });
            } else {
                this._fill.remove_transition('width');
                this._fill.width = 0;
            }

            if (this._fill.visible !== fillVisible) {
                this._fill.visible = fillVisible;
            }
        }

        // Update the time label
        setTimeText(text) {
            if (this._destroyed) return;
            this._timeLabel.text = text;
        }

        // Apply custom appearance — also caches style parts for pulse loop
        applyAppearance(hexColor, radius, saturation, glow) {
            if (this._destroyed) return;
            this._track.set_style(`border-radius: ${radius}px;`);
            this._outer.set_style(`border-radius: ${radius}px;`);
            this._shine.set_style(`border-radius: ${radius}px ${radius}px 0 0;`);

            if (hexColor) {
                let c = this._adjustSaturation(hexColor, saturation);
                let comp = this._hexToComponents(c);
                // 5-layer liquid halo — progressive alpha falloff for premium fluid light
                this._fill.set_style(
                    `border-radius: ${radius}px; background: ${c}; box-shadow: 0 0 ${glow}px ${c}, 0 0 ${glow * 1.5}px rgba(${comp}, 0.7), 0 0 ${glow * 3}px rgba(${comp}, 0.35), 0 0 ${glow * 5}px rgba(${comp}, 0.12), 0 0 ${glow * 8}px rgba(${comp}, 0.05);`
                );
            } else {
                this._fill.set_style(`border-radius: ${radius}px;`);
            }
        }

        _hexToComponents(hex) {
            if (!hex || hex.length < 7) return '255,255,255';
            let r = parseInt(hex.slice(1, 3), 16);
            let g = parseInt(hex.slice(3, 5), 16);
            let b = parseInt(hex.slice(5, 7), 16);
            if (isNaN(r) || isNaN(g) || isNaN(b)) return '255,255,255';
            return `${r},${g},${b}`;
        }

        _adjustSaturation(hex, sat) {
            if (!hex || hex.length < 7) return hex;
            let r = parseInt(hex.slice(1, 3), 16) / 255;
            let g = parseInt(hex.slice(3, 5), 16) / 255;
            let b = parseInt(hex.slice(5, 7), 16) / 255;

            if (isNaN(r) || isNaN(g) || isNaN(b)) return hex;

            let max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;
            if (max == min) { h = s = 0; }
            else {
                let d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }

            s = Math.min(1.0, s * sat);

            let hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            let p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);

            let toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
            return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        }

        // Show bar — make actually visible + fade in + start pulse
        showBar() {
            if (this._isVisible || this._destroyed) return;
            this._isVisible = true;
            this.visible = true;  // Make the actor render
            this.remove_style_class_name('pomodoro-bar-hidden');
            this.add_style_class_name('pomodoro-bar-visible');
            this._startPulse();
        }

        // Hide bar — fade out + stop pulse + make actor invisible
        hideBar() {
            if (!this._isVisible || this._destroyed) return;
            this._isVisible = false;
            this._stopPulse();
            this.remove_style_class_name('pomodoro-bar-visible');
            this.add_style_class_name('pomodoro-bar-hidden');
            // Cancel any pending hide timeout before setting a new one
            if (this._hideTimeoutId > 0) {
                GLib.source_remove(this._hideTimeoutId);
                this._hideTimeoutId = 0;
            }
            // Fully hide the actor after the fade-out transition (500ms)
            this._hideTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 550, () => {
                this._hideTimeoutId = 0;
                // Guard: don't touch actor if destroyed
                if (this._destroyed) return GLib.SOURCE_REMOVE;
                // Only hide if still not visible (user didn't re-show during fade)
                if (!this._isVisible) {
                    this.visible = false;
                }
                return GLib.SOURCE_REMOVE;
            });
        }

        // Keep this intentionally static. Rewriting actor CSS repeatedly from
        // GNOME Shell can crash the compositor on some systems, which looks
        // like an immediate logout when the timer starts.
        _startPulse() {
            this._stopPulse();
            if (this._destroyed) return;
            this._fill.opacity = 255;
        }

        _stopPulse() {
            if (this._pulseId > 0) {
                GLib.source_remove(this._pulseId);
                this._pulseId = 0;
            }
            if (!this._destroyed && this._fill) {
                this._fill.opacity = 255;
            }
        }

        setFillClass(className) {
            if (this._destroyed) return;
            const newClass = `pomodoro-bar-fill ${className}`;
            if (this._fill.style_class !== newClass) {
                this._fill.style_class = newClass;
            }
        }

        flashComplete() {
            if (this._destroyed) return;
            this._stopPulse(); // Stop pulse during flash
            this.setFillClass('pomodoro-complete-fill');
            this.applyAppearance(null, 99, 1.0, 3); // Let CSS handle color, but maintain radius

            // Modern spring/bounce animation for completion — liquid burst
            this._progress = 1.0;
            this._fill.remove_transition('width');
            this._fill.width = Math.floor((this._innerW || this._barWidth) * 0.8);
            this._fill.ease({
                width: this._innerW || this._barWidth,
                duration: 600,
                mode: Clutter.AnimationMode.EASE_OUT_ELASTIC
            });

            // Scale burst on the whole bar container — liquid pop
            this.ease({
                scale_x: 1.06,
                scale_y: 1.06,
                duration: 200,
                mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                onComplete: () => {
                    if (this._destroyed) return;
                    this.ease({
                        scale_x: 1.0,
                        scale_y: 1.0,
                        duration: 400,
                        mode: Clutter.AnimationMode.EASE_OUT_ELASTIC
                    });
                }
            });

            this.setTimeText('Done');
            this.showBar();
            // Cancel any pending flash timeout
            if (this._flashTimeoutId > 0) {
                GLib.source_remove(this._flashTimeoutId);
                this._flashTimeoutId = 0;
            }
            this._flashTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 2000, () => {
                this._flashTimeoutId = 0;
                if (this._destroyed) return GLib.SOURCE_REMOVE;
                this.setProgress(0);
                this.setTimeText('');
                this.hideBar();
                return GLib.SOURCE_REMOVE;
            });
        }

        destroy() {
            this._destroyed = true;
            this._stopPulse();
            if (this._flashTimeoutId > 0) {
                GLib.source_remove(this._flashTimeoutId);
                this._flashTimeoutId = 0;
            }
            if (this._hideTimeoutId > 0) {
                GLib.source_remove(this._hideTimeoutId);
                this._hideTimeoutId = 0;
            }
            super.destroy();
        }
    });


// ─── Main Extension ───
export default class PomodoroTimerExtension extends Extension {
    enable() {
        this._disabled = false;
        this._settings = this.getSettings();
        this._state = State.IDLE;
        this._elapsed = 0;
        this._totalDuration = 0;
        this._timerSourceId = 0;
        this._transitionTimeoutId = 0;
        this._dimensionDebounceId = 0;
        this._pomodoroCount = 0;
        this._isPaused = false;
        // Power state removed — extension is always active
        this._lastTimeText = '';  // Track last time text to reduce UI updates
        this._currentCategory = 'General'; // Track focus category

        // Wallpaper color tracking
        this._wallpaperColor = null;
        this._bgSettings = null;
        this._bgChangedId = 0;

        // Reset daily counter if date changed
        this._checkDailyReset();

        // Extract wallpaper dominant color
        this._initWallpaperColorTracking();

        // Create the progress bars
        this._createProgressBars();

        // Create the panel indicator
        this._createIndicator();

        // Ensure bars start completely hidden in idle state
        this._enterIdleState();

        // Listen for settings changes (dimensions + colors)
        this._settingsChangedId = this._settings.connect('changed', (s, key) => {
            this._onSettingChanged(key);
        });
    }

    disable() {
        this._disabled = true;
        this._stopTimer();

        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = 0;
        }

        if (this._dimensionDebounceId > 0) {
            GLib.source_remove(this._dimensionDebounceId);
            this._dimensionDebounceId = 0;
        }

        if (this._bgChangedId && this._bgSettings) {
            this._bgSettings.disconnect(this._bgChangedId);
            this._bgChangedId = 0;
        }
        this._bgSettings = null;

        if (this._clickTimeoutId) {
            GLib.source_remove(this._clickTimeoutId);
            this._clickTimeoutId = 0;
        }

        // Remove progress bars from center box
        if (this._workBar) {
            this._workBar.destroy();
            this._workBar = null;
        }
        if (this._breakBar) {
            this._breakBar.destroy();
            this._breakBar = null;
        }

        // Remove indicator
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }

        this._settings = null;
    }

    // ─── Wallpaper Color Extraction ───

    _initWallpaperColorTracking() {
        try {
            this._bgSettings = new Gio.Settings({
                schema_id: 'org.gnome.desktop.background',
            });
            this._extractWallpaperColor();
            this._bgChangedId = this._bgSettings.connect('changed', (settings, key) => {
                if (key === 'picture-uri' || key === 'picture-uri-dark') {
                    this._extractWallpaperColor();
                }
            });
        } catch (e) {
            // Fallback: use a nice teal/cyan
            this._wallpaperColor = { r: 100, g: 180, b: 220 };
        }
    }

    _extractWallpaperColor() {
        try {
            const uri = this._bgSettings.get_string('picture-uri-dark') ||
                this._bgSettings.get_string('picture-uri');
            if (!uri) {
                this._wallpaperColor = { r: 100, g: 180, b: 220 };
                return;
            }

            // Extract dominant color using GdkPixbuf sampling
            const file = Gio.File.new_for_uri(uri);
            const path = file.get_path();

            if (path) {
                // Use a lightweight approach: sample the wallpaper file path hash
                // to generate a consistent, pleasant accent color
                this._wallpaperColor = this._colorFromPath(path);
            } else {
                this._wallpaperColor = { r: 100, g: 180, b: 220 };
            }
        } catch (e) {
            this._wallpaperColor = { r: 100, g: 180, b: 220 };
        }
    }

    _colorFromPath(path) {
        // Generate a pleasant accent color derived from wallpaper path
        // This gives consistent color per wallpaper without heavy image processing
        let hash = 0;
        for (let i = 0; i < path.length; i++) {
            hash = ((hash << 5) - hash) + path.charCodeAt(i);
            hash |= 0;
        }
        // Convert hash to HSL with high saturation, medium lightness
        const hue = Math.abs(hash % 360);
        const sat = 65 + Math.abs((hash >> 8) % 20); // 65-85%
        const lum = 55 + Math.abs((hash >> 16) % 15); // 55-70%

        // HSL to RGB
        return this._hslToRgb(hue, sat, lum);
    }

    _hslToRgb(h, s, l) {
        s /= 100;
        l /= 100;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        let r, g, b;
        if (h < 60) { r = c; g = x; b = 0; }
        else if (h < 120) { r = x; g = c; b = 0; }
        else if (h < 180) { r = 0; g = c; b = x; }
        else if (h < 240) { r = 0; g = x; b = c; }
        else if (h < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }
        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255),
        };
    }

    // ─── UI Creation ───

    _createProgressBars() {
        const barWidth = this._settings.get_int('bar-width');
        const barHeight = this._settings.get_int('bar-height');

        // Work bar — goes RIGHT of the clock
        this._workBar = new PomodoroBar('work');
        this._workBar.setDimensions(barWidth, barHeight);
        this._workBar.connect('button-press-event', (actor, event) => this._onBarClicked(actor, event));

        // Break bar — goes LEFT of the clock
        this._breakBar = new PomodoroBar('break');
        this._breakBar.setDimensions(barWidth, barHeight);
        this._breakBar.connect('button-press-event', (actor, event) => this._onBarClicked(actor, event));

        // Find the dateMenu (clock) in the center box
        const dateMenu = Main.panel.statusArea.dateMenu;

        if (dateMenu && dateMenu.container) {
            const dateMenuContainer = dateMenu.container;
            const parent = dateMenuContainer.get_parent();

            if (parent) {
                // Insert break bar BEFORE the clock (left side)
                parent.insert_child_below(this._breakBar, dateMenuContainer);
                // Insert work bar AFTER the clock (right side)
                parent.insert_child_above(this._workBar, dateMenuContainer);
            }
        }
    }

    _createIndicator() {
        // Standard PanelMenu.Button with a popup menu item.
        // Clicking the icon opens a small menu with "Open Polindora".
        // Activating the menu item launches the preferences window.
        this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);

        // Panel icon
        const iconPath = this.dir.get_child('icons').get_child('polindora-logo.svg').get_path();
        this._icon = new St.Icon({
            gicon: Gio.FileIcon.new(Gio.File.new_for_path(iconPath)),
            style_class: 'pomodoro-indicator-icon system-status-icon',
            icon_size: 16,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this._indicator.add_child(this._icon);

        // Add a menu item to pause/resume the timer
        this._pauseItem = new PopupMenu.PopupMenuItem('Pause Timer');
        this._pauseItem.connect('activate', () => {
            if (this._state !== State.IDLE) {
                this._settings.set_string('timer-command', this._isPaused ? 'resume' : 'pause');
            }
        });
        this._indicator.menu.addMenuItem(this._pauseItem);

        // Add a menu item that opens the preferences window
        const prefsItem = new PopupMenu.PopupMenuItem('Open Polindora');
        prefsItem.connect('activate', () => {
            try {
                Gio.Subprocess.new(
                    ['gnome-extensions', 'prefs', this.uuid],
                    Gio.SubprocessFlags.NONE
                );
            } catch (e) {
                log(`[PomodoroTimer] Failed to open prefs: ${e.message}`);
            }
        });
        this._indicator.menu.addMenuItem(prefsItem);

        // Apply theme to the menu actor
        this._updateMenuTheme();

        // Add to panel
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    _updateMenuTheme() {
        if (!this._indicator || !this._indicator.menu || !this._indicator.menu.actor) return;
        if (this._settings.get_string('theme-name') === 'black-pink') {
            this._indicator.menu.actor.add_style_class_name('theme-black-pink');
        } else {
            this._indicator.menu.actor.remove_style_class_name('theme-black-pink');
        }
    }

    _onBarClicked(actor, event) {
        if (event.get_button() !== 1) return Clutter.EVENT_PROPAGATE;

        // Pure timer-based click detection (avoids unreliable Clutter click_count)
        if (this._clickTimeoutId) {
            // Second click arrived within 300ms → double click
            GLib.source_remove(this._clickTimeoutId);
            this._clickTimeoutId = 0;
            try {
                Gio.Subprocess.new(
                    ['gnome-extensions', 'prefs', this.uuid],
                    Gio.SubprocessFlags.NONE
                );
            } catch (e) {
                log(`[PomodoroTimer] Failed to open prefs: ${e.message}`);
            }
        } else {
            // First click — wait 300ms to see if a second one arrives
            this._clickTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 300, () => {
                this._clickTimeoutId = 0;
                // No second click arrived → single click → pause/resume
                if (this._state !== State.IDLE) {
                    this._settings.set_string('timer-command', this._isPaused ? 'resume' : 'pause');
                }
                return GLib.SOURCE_REMOVE;
            });
        }
        return Clutter.EVENT_STOP;
    }



    // ─── Power ON/OFF removed — extension is always active ───

    // ─── Timer Command IPC ───
    // When the prefs window starts/stops/pauses a timer, it writes a command
    // string to the 'timer-command' GSettings key. The extension reads it and
    // drives the progress bars accordingly.

    _onTimerCommand() {
        const cmd = this._settings.get_string('timer-command');
        if (!cmd) return;

        // Clear the command immediately so it acts as a one-shot signal
        this._settings.set_string('timer-command', '');

        const category = this._settings.get_string('timer-category') || 'General';

        switch (cmd) {
            case 'start-work':
                this._startWork(category);
                break;
            case 'start-short-break':
                this._startBreak(false);
                break;
            case 'start-long-break':
                this._startBreak(true);
                break;
            case 'pause':
                if (this._state !== State.IDLE) {
                    this._isPaused = true;
                    this._settings.set_boolean('timer-is-paused', true);
                    this._settings.set_double('timer-elapsed-accumulated', this._elapsed);
                    if (this._pauseItem) this._pauseItem.label.text = 'Resume Timer';
                }
                break;
            case 'resume':
                if (this._state !== State.IDLE) {
                    this._isPaused = false;
                    this._settings.set_boolean('timer-is-paused', false);
                    this._settings.set_double('timer-start-time', GLib.get_monotonic_time());
                    if (this._pauseItem) this._pauseItem.label.text = 'Pause Timer';
                }
                break;
            case 'skip':
                this._skip();
                break;
            case 'reset':
                this._reset();
                break;
            case 'idle':
                this._stopTimer();
                this._enterIdleState();
                break;
        }
    }

    // ─── Timer Logic ───
    // Progress bars fill ASCENDING: starts at 0.0 (empty) and fills to 1.0 (full)
    //   Color fills more as time passes — whole line is filled when time runs out

    _startWork(category = 'General') {
        this._stopTimer();
        this._checkDailyReset();

        if (!this._workBar || !this._breakBar) return;
        this._currentCategory = category;
        this._state = State.WORK;
        this._elapsed = 0;
        this._totalDuration = clampInt(this._settings.get_int('work-duration'), 1, 60, 25) * 60;
        this._isPaused = false;
        this._lastTimeText = '';

        // Show ONLY work bar (right of clock), hide break bar
        this._workBar.setFillClass('pomodoro-work-fill');
        this._applyWorkColor();
        this._workBar.setProgress(0.0);
        this._workBar.setTimeText(formatTime(this._totalDuration));
        this._workBar.showBar();

        this._breakBar.setProgress(0);
        this._breakBar.setTimeText('');
        this._breakBar.hideBar();

        this._icon.style_class = 'pomodoro-indicator-icon-active system-status-icon';
        if (this._pauseItem) this._pauseItem.label.text = 'Pause Timer';

        this._settings.set_double('timer-start-time', GLib.get_monotonic_time());
        this._settings.set_double('timer-elapsed-accumulated', 0.0);
        this._settings.set_int('timer-duration-secs', this._totalDuration);
        this._settings.set_boolean('timer-is-paused', false);
        this._settings.set_string('timer-state', 'work');

        this._startTimerLoop();
    }

    _startBreak(isLong) {
        this._stopTimer();
        this._checkDailyReset();

        if (!this._workBar || !this._breakBar) return;
        this._state = isLong ? State.LONG_BREAK : State.SHORT_BREAK;
        this._elapsed = 0;
        const durationMins = isLong
            ? clampInt(this._settings.get_int('long-break-duration'), 1, 60, 15)
            : clampInt(this._settings.get_int('short-break-duration'), 1, 30, 5);
        this._totalDuration = durationMins * 60;
        this._isPaused = false;
        this._lastTimeText = '';

        // Show ONLY break bar (left of clock), hide work bar
        this._breakBar.setFillClass('pomodoro-break-fill');
        this._applyBreakColor();
        this._breakBar.setProgress(0.0);
        this._breakBar.setTimeText(formatTime(this._totalDuration));
        this._breakBar.showBar();

        this._workBar.setProgress(0);
        this._workBar.setTimeText('');
        this._workBar.hideBar();

        this._icon.style_class = 'pomodoro-indicator-icon-break system-status-icon';
        if (this._pauseItem) this._pauseItem.label.text = 'Pause Timer';

        this._settings.set_double('timer-start-time', GLib.get_monotonic_time());
        this._settings.set_double('timer-elapsed-accumulated', 0.0);
        this._settings.set_int('timer-duration-secs', this._totalDuration);
        this._settings.set_boolean('timer-is-paused', false);
        this._settings.set_string('timer-state', isLong ? 'long_break' : 'short_break');

        this._startTimerLoop();
    }

    _startTimerLoop() {
        this._stopTimer();
        this._lastTick = GLib.get_monotonic_time();

        this._timerSourceId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
            // Guard: stop immediately if extension is disabled
            if (this._disabled) {
                this._timerSourceId = 0;
                return GLib.SOURCE_REMOVE;
            }

            try {
                if (this._isPaused) {
                    this._lastTick = GLib.get_monotonic_time();
                    return GLib.SOURCE_CONTINUE;
                }

                const now = GLib.get_monotonic_time();
                const deltaSecs = (now - this._lastTick) / 1000000;
                this._lastTick = now;

                this._elapsed += deltaSecs;

                // ASCENDING: fraction goes from 0.0 → 1.0
                const progress = this._totalDuration > 0
                    ? (this._elapsed / this._totalDuration)
                    : 0.0;

                const remSecs = Math.max(0, this._totalDuration - this._elapsed);
                const timeText = formatTime(remSecs);

                if (this._state === State.WORK && this._workBar) {
                    this._workBar.setProgress(progress);
                    if (this._lastTimeText !== timeText) {
                        this._workBar.setTimeText(timeText);
                    }
                    // Switch to urgent color in the last 20%
                    if (progress > 0.8) {
                        this._workBar.setFillClass('pomodoro-work-fill-urgent');
                    }
                } else if (this._breakBar) {
                    this._breakBar.setProgress(progress);
                    if (this._lastTimeText !== timeText) {
                        this._breakBar.setTimeText(timeText);
                    }
                }
                
                if (this._icon && typeof this._icon.setProgress === 'function') {
                    this._icon.setProgress(progress);
                }

                this._lastTimeText = timeText;

                // Timer complete
                if (this._elapsed >= this._totalDuration) {
                    this._timerSourceId = 0;
                    this._onTimerComplete();
                    return GLib.SOURCE_REMOVE;
                }

                return GLib.SOURCE_CONTINUE;
            } catch (e) {
                log(`[PomodoroTimer] Timer loop error: ${e.message}`);
                this._timerSourceId = 0;
                return GLib.SOURCE_REMOVE;
            }
        });
    }

    _onTimerComplete() {
        this._timerSourceId = 0;
        this._checkDailyReset();

        if (this._state === State.WORK) {
            // Work session completed!
            this._pomodoroCount++;
            const sessions = this._settings.get_int('sessions-completed') + 1;
            const actualMins = Math.floor(this._totalDuration / 60);
            const focusMins = this._settings.get_int('total-focus-minutes') + actualMins;
            const allTimeMins = this._settings.get_int('all-time-focus-minutes') + actualMins;
            this._settings.set_int('sessions-completed', sessions);
            this._settings.set_int('total-focus-minutes', focusMins);
            this._settings.set_int('all-time-focus-minutes', allTimeMins);

            // Task stats updating
            let taskStats = {};
            try {
                taskStats = JSON.parse(this._settings.get_string('task-stats'));
                if (!taskStats || typeof taskStats !== 'object') taskStats = {};
            } catch (e) { taskStats = {}; }
            let cat = (this._currentCategory || 'General').trim().replace(/\s+/g, ' ');
            cat = cat.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            taskStats[cat] = (taskStats[cat] || 0) + actualMins;
            this._settings.set_string('task-stats', JSON.stringify(taskStats));

            // Increment pomodorosSpent on matching active tasks
            try {
                let allTasks = JSON.parse(this._settings.get_string('tasks'));
                if (Array.isArray(allTasks)) {
                    allTasks.forEach(t => {
                        if (!t.done && (t.category || 'General') === cat) {
                            t.pomodorosSpent = (t.pomodorosSpent || 0) + 1;
                        }
                    });
                    this._settings.set_string('tasks', JSON.stringify(allTasks));
                }
            } catch (e) { }

            // Save daily analytics history
            try {
                let todayStr = getTodayStr();
                let history = JSON.parse(this._settings.get_string('analytics-history'));
                if (!Array.isArray(history)) history = [];
                let todayEntry = history.find(e => e.date === todayStr);
                if (todayEntry) {
                    todayEntry.sessions = sessions;
                    todayEntry.focusMinutes = focusMins;
                    todayEntry.categories = taskStats;
                } else {
                    history.push({
                        date: todayStr, sessions, focusMinutes: focusMins,
                        categories: taskStats,
                    });
                }
                if (history.length > 30) history = history.slice(-30);
                this._settings.set_string('analytics-history', JSON.stringify(history));
            } catch (e) { }

            // Flash the work bar gold
            if (this._workBar) this._workBar.flashComplete();

            // Notify
            if (this._settings && this._settings.get_boolean('show-notifications')) {
                Main.notify(
                    'Pomodoro Complete!',
                    `Session #${sessions} done! ${getMotivation('streak', sessions)} Take a break.`
                );
            }
            if (this._settings && this._settings.get_boolean('play-sound-notifications')) {
                global.display.get_sound_player().play_from_theme('complete', 'Pomodoro Complete', null);
            }

            // Auto-start break
            if (this._settings && this._settings.get_boolean('auto-start-breaks')) {
                const interval = this._settings.get_int('long-break-interval');
                const isLongBreak = (this._pomodoroCount % interval) === 0;
                this._transitionTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 2200, () => {
                    this._transitionTimeoutId = 0;
                    if (this._disabled) return GLib.SOURCE_REMOVE;
                    this._startBreak(isLongBreak);
                    return GLib.SOURCE_REMOVE;
                });
            } else {
                this._transitionTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 2200, () => {
                    this._transitionTimeoutId = 0;
                    if (this._disabled) return GLib.SOURCE_REMOVE;
                    this._enterIdleState();
                    return GLib.SOURCE_REMOVE;
                });
            }
        } else {
            // Break completed
            if (this._breakBar) this._breakBar.flashComplete();

            if (this._settings && this._settings.get_boolean('show-notifications')) {
                Main.notify(
                    '⏰ Break Over!',
                    'Time to get back to work. Stay focused!'
                );
            }
            if (this._settings && this._settings.get_boolean('play-sound-notifications')) {
                global.display.get_sound_player().play_from_theme('complete', 'Break Over', null);
            }

            // Auto-start work
            if (this._settings && this._settings.get_boolean('auto-start-work')) {
                this._transitionTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 2200, () => {
                    this._transitionTimeoutId = 0;
                    if (this._disabled) return GLib.SOURCE_REMOVE;
                    this._startWork(this._currentCategory || 'General');
                    return GLib.SOURCE_REMOVE;
                });
            } else {
                this._transitionTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 2200, () => {
                    this._transitionTimeoutId = 0;
                    if (this._disabled) return GLib.SOURCE_REMOVE;
                    this._enterIdleState();
                    return GLib.SOURCE_REMOVE;
                });
            }
        }
    }

    _togglePause() {
        this._isPaused = !this._isPaused;
    }

    _skip() {
        this._stopTimer();
        if (this._state === State.WORK) {
            // Skipping work doesn't count as completed
            if (this._workBar) this._workBar.setProgress(0);
            this._enterIdleState();
        } else {
            // Skipping break — go to work
            if (this._breakBar) this._breakBar.setProgress(0);
            this._startWork(this._currentCategory || 'General');
        }
    }

    _reset() {
        this._stopTimer();
        if (this._workBar) this._workBar.setProgress(0);
        if (this._breakBar) this._breakBar.setProgress(0);
        this._enterIdleState();
    }

    _enterIdleState() {
        this._state = State.IDLE;
        this._elapsed = 0;
        this._totalDuration = 0;
        this._isPaused = false;

        if (this._icon) {
            this._icon.style_class = 'pomodoro-indicator-icon system-status-icon';
            if (typeof this._icon.setProgress === 'function') {
                this._icon.setProgress(0);
            }
        }
        if (this._pauseItem) this._pauseItem.label.text = 'Pause Timer';

        if (this._settings) {
            this._settings.set_string('timer-state', 'idle');
            this._settings.set_boolean('timer-is-paused', false);
        }

        const radius = this._settings ? this._settings.get_int('bar-radius') : 99;

        // In idle state, hide both bars completely — truly invisible
        if (this._workBar) {
            this._workBar.setProgress(0);
            this._workBar.setTimeText('');
            this._workBar.applyAppearance(null, radius, 1.0, 3);
            this._workBar.hideBar();
        }

        if (this._breakBar) {
            this._breakBar.setProgress(0);
            this._breakBar.setTimeText('');
            this._breakBar.applyAppearance(null, radius, 1.0, 3);
            this._breakBar.hideBar();
        }
    }

    _stopTimer() {
        if (this._timerSourceId > 0) {
            GLib.source_remove(this._timerSourceId);
            this._timerSourceId = 0;
        }
        if (this._transitionTimeoutId > 0) {
            GLib.source_remove(this._transitionTimeoutId);
            this._transitionTimeoutId = 0;
        }
    }

    // ─── Settings ───

    _onSettingChanged(key) {
        // Ignore internal state keys — they don't need UI processing
        if (key === 'sessions-completed' || key === 'total-focus-minutes' ||
            key === 'last-session-date' || key === 'task-stats' ||
            key === 'tasks' || key === 'analytics-history' ||
            key === 'best-streak' || key === 'timer-category') {
            return;
        }

        // Handle timer commands from prefs window
        if (key === 'timer-command') {
            this._onTimerCommand();
            return;
        }

        // Debounce dimension/appearance changes to prevent GNOME Shell crash.
        // Sliders fire 'changed' on every single increment — resizing panel
        // actors on each one causes a relayout storm that crashes the compositor.
        if (key === 'bar-width' || key === 'bar-height' || key === 'bar-radius' || key === 'color-saturation' || key === 'glow-intensity') {
            if (this._dimensionDebounceId > 0) {
                GLib.source_remove(this._dimensionDebounceId);
                this._dimensionDebounceId = 0;
            }
            this._dimensionDebounceId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 300, () => {
                this._dimensionDebounceId = 0;
                this._applyDimensionsAndAppearance();
                return GLib.SOURCE_REMOVE;
            });
            return; // Don't process further — the debounced callback handles everything
        }
        // Live-update colors when changed from Preferences
        if (key === 'work-bar-color') {
            if (this._state === State.WORK) {
                this._applyWorkColor();
            }
        }
        if (key === 'break-bar-color') {
            if (this._state === State.SHORT_BREAK || this._state === State.LONG_BREAK) {
                this._applyBreakColor();
            }
        }
        if (key === 'heart-color' || key === 'heart-outline-color' || key === 'icon-style') {
            this._applyHeartColors();
        }
        if (key === 'theme-name') {
            this._updateMenuTheme();
        }
    }

    _applyHeartColors() {
        if (!this._icon || !this._settings) return;
        const outlineColor = this._settings.get_string('heart-color');
        const fillColor = this._settings.get_string('heart-outline-color');
        const iconStyle = this._settings.get_string('icon-style') || 'heart-outline';
        if (typeof this._icon.setColors === 'function') {
            this._icon.setColors(outlineColor, fillColor);
        }
        if (typeof this._icon.setIconStyle === 'function') {
            this._icon.setIconStyle(iconStyle);
        }
    }

    // Safely apply dimension + appearance changes in a single batch.
    // Called once after debounce settles, never in a rapid-fire loop.
    _applyDimensionsAndAppearance() {
        try {
            const w = this._settings.get_int('bar-width');
            const h = this._settings.get_int('bar-height');
            const radius = this._settings.get_int('bar-radius');

            if (this._workBar) this._workBar.setDimensions(w, h);
            if (this._breakBar) this._breakBar.setDimensions(w, h);

            // Re-apply appearance (colors + radius) for the current state
            if (this._state === State.WORK) {
                this._applyWorkColor();
            } else if (this._state === State.SHORT_BREAK || this._state === State.LONG_BREAK) {
                this._applyBreakColor();
            } else {
                // Idle — just re-apply radius to both bars without a full
                // _enterIdleState() call (which would trigger redundant
                // hide/show cycles and additional layout churn).
                if (this._workBar) this._workBar.applyAppearance(null, radius, 1.0, 3);
                if (this._breakBar) this._breakBar.applyAppearance(null, radius, 1.0, 3);
            }
        } catch (e) {
            // Swallow errors to prevent extension crash from taking down the shell
            log(`[PomodoroTimer] Error applying dimensions: ${e.message}`);
        }
    }

    // Apply the user's chosen work bar color from settings
    _applyWorkColor() {
        const color = this._settings.get_string('work-bar-color');
        const radius = this._settings.get_int('bar-radius');
        const sat = this._settings.get_double('color-saturation') || 1.0;
        const glow = this._settings.get_int('glow-intensity');
        if (color) {
            this._workBar.applyAppearance(color, radius, sat, glow);
        }
    }

    // Apply the user's chosen break bar color from settings
    _applyBreakColor() {
        const color = this._settings.get_string('break-bar-color');
        const radius = this._settings.get_int('bar-radius');
        const sat = this._settings.get_double('color-saturation') || 1.0;
        const glow = this._settings.get_int('glow-intensity');
        if (color) {
            this._breakBar.applyAppearance(color, radius, sat, glow);
        }
    }

    _checkDailyReset() {
        const today = getTodayStr();
        const lastDate = this._settings.get_string('last-session-date');
        if (lastDate !== today) {
            this._settings.set_int('sessions-completed', 0);
            this._settings.set_int('total-focus-minutes', 0);
            this._settings.set_string('task-stats', '{}');
            this._settings.set_string('last-session-date', today);
        }
    }
}
