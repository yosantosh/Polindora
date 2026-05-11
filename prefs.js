/* ============================================
   POMODORO FOCUS TIMER — Preferences
   GTK4 + Adwaita settings window
   ============================================ */

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk?version=4.0';

import { ExtensionPreferences, gettext as _ } from
    'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import { getTimedQuote } from './quotes.js';

export default class PomodoroPreferences extends ExtensionPreferences {

    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        const display = Gdk.Display.get_default();
        const iconTheme = Gtk.IconTheme.get_for_display(display);
        iconTheme.add_search_path(this.dir.get_child('icons').get_path());
        window._settings = settings;

        // Ensure stats rollover if the user opens preferences on a new day
        const now = new Date();
        const today = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
        const lastDate = settings.get_string('last-session-date');
        if (lastDate !== today) {
            settings.set_int('sessions-completed', 0);
            settings.set_int('total-focus-minutes', 0);
            settings.set_string('task-stats', '{}');
            settings.set_string('last-session-date', today);
        }

        const todayD = new Date();
        const isBday = (todayD.getMonth() === 2 && todayD.getDate() === 4);

        window.set_default_size(480, 720);
        window.set_title(isBday ? _("🎉 Polindora 🎊") : _("Polindora"));
        window.add_css_class('pomodoro-prefs-window');

        try {
            let gtkSettings = Gtk.Settings.get_default();
            if (gtkSettings) {
                gtkSettings.set_property('gtk-decoration-layout', 'icon:minimize,close');
            }
        } catch (e) {
            console.error('Failed to add minimize button:', e);
        }

        // Add custom glassmorphism styling
        const provider = new Gtk.CssProvider();
        const css = `
            /* ── Animated fluid background ── */
            @keyframes fluid-drift {
                0%   { background-position: 0% 0%, 100% 100%, 50% 0%, 30% 60%, 80% 20%; }
                25%  { background-position: 10% 20%, 80% 80%, 60% 15%, 20% 40%, 90% 35%; }
                50%  { background-position: 20% 40%, 60% 60%, 40% 30%, 40% 20%, 70% 50%; }
                75%  { background-position: 5% 25%, 90% 70%, 55% 10%, 25% 50%, 85% 30%; }
                100% { background-position: 0% 0%, 100% 100%, 50% 0%, 30% 60%, 80% 20%; }
            }
            @keyframes breathe-glow {
                0%   { box-shadow: 0 0 50px rgba(0,0,0,0.8), 0 0 20px rgba(80,180,255,0.03), inset 0 8px 24px rgba(0,0,0,0.9), inset 0 -2px 6px rgba(255,255,255,0.04), inset 0 0 40px rgba(0,0,0,0.4); }
                50%  { box-shadow: 0 0 50px rgba(0,0,0,0.8), 0 0 30px rgba(80,180,255,0.06), inset 0 8px 24px rgba(0,0,0,0.85), inset 0 -2px 8px rgba(255,255,255,0.06), inset 0 0 40px rgba(0,0,0,0.35); }
                100% { box-shadow: 0 0 50px rgba(0,0,0,0.8), 0 0 20px rgba(80,180,255,0.03), inset 0 8px 24px rgba(0,0,0,0.9), inset 0 -2px 6px rgba(255,255,255,0.04), inset 0 0 40px rgba(0,0,0,0.4); }
            }
            window.pomodoro-prefs-window {
                background-color: #000000;
                background-image:
                    radial-gradient(ellipse 140% 100% at 8% 25%, rgba(40,120,255,0.03) 0%, transparent 50%),
                    radial-gradient(ellipse 120% 100% at 92% 75%, rgba(120,80,255,0.02) 0%, transparent 50%),
                    radial-gradient(ellipse 100% 80% at 50% 10%, rgba(255,255,255,0.015) 0%, transparent 45%),
                    radial-gradient(ellipse 100% 80% at 30% 60%, rgba(80,200,180,0.015) 0%, transparent 55%),
                    radial-gradient(ellipse 80% 100% at 80% 20%, rgba(160,120,255,0.01) 0%, transparent 50%);
                background-size: 200% 200%, 200% 200%, 200% 200%, 200% 200%, 200% 200%;
                animation: fluid-drift 40s ease-in-out infinite;
                transition: background-image 1s ease, background-color 1s ease;
            }
            window.pomodoro-prefs-window.theme-black-pink {
                background-color: #000000;
                background-image:
                    radial-gradient(ellipse 140% 100% at 8% 25%, rgba(255,0,128,0.07) 0%, transparent 50%),
                    radial-gradient(ellipse 120% 100% at 92% 75%, rgba(255,105,180,0.06) 0%, transparent 50%),
                    radial-gradient(ellipse 100% 80% at 50% 10%, rgba(255,220,235,0.03) 0%, transparent 45%),
                    radial-gradient(ellipse 100% 80% at 30% 60%, rgba(255,20,147,0.05) 0%, transparent 55%),
                    radial-gradient(ellipse 80% 100% at 80% 20%, rgba(199,21,133,0.04) 0%, transparent 50%);
            }
            window.pomodoro-prefs-window .boxed-list {
                background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.015));
                border: 1px solid rgba(255,255,255,0.06);
                border-top: 1.5px solid rgba(255,255,255,0.18);
                border-radius: 16px;
                box-shadow: inset 0 1px 2px rgba(255,255,255,0.08), 0 4px 16px rgba(0,0,0,0.5), 0 0 20px rgba(80,180,255,0.02);
            }
            window.pomodoro-prefs-window row {
                background: transparent;
                border-bottom: 1px solid rgba(255,255,255,0.03);
                transition: background 300ms ease-out, box-shadow 300ms ease-out;
            }
            window.pomodoro-prefs-window row:hover {
                background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.02) 50%, transparent 100%);
                box-shadow: inset 0 0 10px rgba(255,255,255,0.01);
            }
            window.pomodoro-prefs-window row:last-child {
                border-bottom: none;
            }
            .pomodoro-home-timer-circle {
                background: radial-gradient(circle at center, #010204 0%, #030a12 60%, #050d18 100%);
                border: 1px solid rgba(255,255,255,0.05);
                border-top: 1.5px solid rgba(255,255,255,0.18);
                border-radius: 120px;
                padding: 24px;
                min-width: 200px;
                min-height: 200px;
                box-shadow: 0 0 50px rgba(0,0,0,0.8), 0 0 20px rgba(80,180,255,0.03), inset 0 8px 24px rgba(0,0,0,0.9), inset 0 -2px 6px rgba(255,255,255,0.04), inset 0 0 40px rgba(0,0,0,0.4);
                animation: breathe-glow 4s ease-in-out infinite;
            }
            .pomodoro-home-state-label {
                font-size: 11px;
                font-weight: 300;
                letter-spacing: 4px;
                color: rgba(255,255,255,0.7);
            }
            .pomodoro-home-heart {
                font-size: 19px;
                font-weight: 500;
                color: rgba(255,255,255,0.96);
                text-shadow: 0 0 8px rgba(255,255,255,0.35), 0 0 16px rgba(255,255,255,0.18), 0 0 24px rgba(80,180,255,0.1);
            }
            .pomodoro-home-digits {
                font-size: 52px;
                font-weight: 200;
                letter-spacing: 2px;
                color: #ffffff;
                font-family: monospace;
                text-shadow: 0 0 12px rgba(255,255,255,0.25), 0 0 24px rgba(80,180,255,0.08);
            }
            .pomodoro-home-motivation {
                font-size: 12px;
                font-weight: 300;
                font-style: italic;
                color: rgba(255,255,255,0.6);
            }
            .pomodoro-home-play-btn {
                min-width: 44px;
                min-height: 44px;
                border-radius: 22px;
                background: linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02));
                border-top: 1px solid rgba(255,255,255,0.25);
                border-bottom: 1px solid rgba(0,0,0,0.5);
                box-shadow: inset 0 1px 6px rgba(255,255,255,0.10), 0 4px 12px rgba(0,0,0,0.5), 0 0 10px rgba(80,180,255,0.03);
                transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .pomodoro-home-play-btn:hover {
                background: linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04));
                box-shadow: inset 0 2px 8px rgba(255,255,255,0.20), 0 6px 16px rgba(0,0,0,0.6), 0 0 18px rgba(80,180,255,0.06);
                transform: scale(1.06);
            }
            .pomodoro-home-play-btn:active {
                box-shadow: inset 0 4px 12px rgba(0,0,0,0.7);
                transform: scale(0.94);
            }
            .pomodoro-home-ctrl-btn {
                min-width: 36px;
                min-height: 36px;
                border-radius: 18px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.10);
                box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 6px rgba(80,180,255,0.02);
                transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .pomodoro-home-ctrl-btn:hover {
                background: rgba(255,255,255,0.10);
                box-shadow: inset 0 1px 4px rgba(255,255,255,0.10), 0 4px 12px rgba(0,0,0,0.4), 0 0 12px rgba(80,180,255,0.04);
                transform: scale(1.06);
            }
            .pomodoro-home-ctrl-btn:active {
                box-shadow: inset 0 3px 8px rgba(0,0,0,0.6);
                transform: scale(0.94);
            }
            .pomodoro-home-stats-card {
                background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.015));
                border-top: 1.5px solid rgba(255,255,255,0.20);
                border: 1px solid rgba(255,255,255,0.06);
                border-radius: 14px;
                padding: 12px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.4), 0 0 14px rgba(80,180,255,0.02);
            }
            .pomodoro-home-task-row {
                background: transparent;
                border: none;
                border-bottom: 1px solid rgba(255,255,255,0.04);
                border-radius: 0;
                padding: 8px 12px;
                margin-bottom: 4px;
                transition: background 300ms ease-out;
            }
            .pomodoro-home-task-row:hover {
                background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%);
            }
            .pomodoro-home-start-btn {
                padding: 12px 24px;
                border-radius: 24px;
                background: linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.025));
                border-top: 1.5px solid rgba(255,255,255,0.30);
                border-bottom: 1px solid rgba(0,0,0,0.5);
                color: white;
                font-weight: 400;
                font-size: 15px;
                box-shadow: inset 0 1px 4px rgba(255,255,255,0.10), 0 8px 24px rgba(0,0,0,0.5), 0 0 16px rgba(80,180,255,0.03);
                transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .pomodoro-home-start-btn:hover {
                background: linear-gradient(180deg, rgba(255,255,255,0.20), rgba(255,255,255,0.05));
                box-shadow: inset 0 2px 6px rgba(255,255,255,0.15), 0 10px 28px rgba(0,0,0,0.6), 0 0 24px rgba(80,180,255,0.05);
                transform: scale(1.03);
            }
            .pomodoro-home-start-btn:active {
                box-shadow: inset 0 4px 12px rgba(0,0,0,0.7);
                transform: scale(0.97);
            }
            /* Analytics page */
            .pomodoro-analytics-hero {
                background: linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.015));
                border-top: 1.5px solid rgba(255,255,255,0.20);
                border-radius: 16px;
                padding: 16px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.4), 0 0 16px rgba(80,180,255,0.02);
            }
            .pomodoro-analytics-hero-value {
                font-size: 32px;
                font-weight: 200;
                color: #ffffff;
                font-family: monospace;
                text-shadow: 0 0 12px rgba(255,255,255,0.25), 0 0 24px rgba(80,180,255,0.10);
            }
            .pomodoro-analytics-hero-label {
                font-size: 11px;
                font-weight: 300;
                letter-spacing: 1px;
                color: rgba(255,255,255,0.6);
            }
            .pomodoro-analytics-stat-card {
                background: linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02));
                border: 1px solid rgba(255,255,255,0.05);
                border-top: 1.5px solid rgba(255,255,255,0.14);
                border-radius: 12px;
                padding: 12px 16px;
                min-width: 120px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.35), 0 0 12px rgba(80,180,255,0.02);
            }
            .pomodoro-analytics-stat-value {
                font-size: 22px;
                font-weight: 200;
                color: rgba(255,255,255,0.95);
                font-family: monospace;
                text-shadow: 0 0 10px rgba(255,255,255,0.2), 0 0 20px rgba(80,180,255,0.06);
            }
            .pomodoro-analytics-stat-label {
                font-size: 10px;
                font-weight: 300;
                letter-spacing: 1px;
                color: rgba(255,255,255,0.5);
            }
            .pomodoro-streak-badge {
                background: linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.025));
                border-top: 1.5px solid rgba(255,255,255,0.24);
                border-radius: 12px;
                padding: 10px 16px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.35), 0 0 10px rgba(80,180,255,0.02);
            }
            .pomodoro-streak-value {
                font-size: 18px;
                font-weight: 300;
                color: #ffffff;
                text-shadow: 0 0 10px rgba(255,255,255,0.35), 0 0 20px rgba(80,180,255,0.08);
            }
            .pomodoro-streak-label {
                font-size: 10px;
                font-weight: 300;
                color: rgba(255,255,255,0.6);
            }
            .pomodoro-task-mini-stat {
                background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.015));
                border-top: 1.5px solid rgba(255,255,255,0.14);
                border-radius: 10px;
                padding: 8px 14px;
                min-width: 80px;
                box-shadow: 0 3px 10px rgba(0,0,0,0.3), 0 0 8px rgba(80,180,255,0.02);
            }
            .pomodoro-task-mini-value {
                font-size: 18px;
                font-weight: 200;
                color: #ffffff;
                font-family: monospace;
                text-shadow: 0 0 8px rgba(255,255,255,0.2);
            }
            .pomodoro-task-mini-label {
                font-size: 9px;
                font-weight: 300;
                letter-spacing: 1px;
                color: rgba(255,255,255,0.5);
            }
            .pomodoro-cat-legend-dot {
                min-width: 10px;
                min-height: 10px;
                border-radius: 5px;
            }
            .bday-surprise-text {
                font-size: 24px;
                font-weight: 800;
                color: #ff1493;
                text-shadow: 0 0 10px #ff69b4, 0 0 20px #ffb6c1;
                opacity: 0;
            }
            .show-bday-surprise .bday-surprise-text {
                opacity: 1;
                transition: opacity 0.5s ease 0.5s;
            }
            .pomodoro-home-heart, .pomodoro-home-state-label, .pomodoro-home-digits, .pomodoro-home-play-btn {
                transition: opacity 0.5s ease;
            }
            .show-bday-surprise .pomodoro-home-heart,
            .show-bday-surprise .pomodoro-home-state-label,
            .show-bday-surprise .pomodoro-home-digits,
            .show-bday-surprise .pomodoro-home-play-btn {
                opacity: 0;
            }
        `;
        try {
            provider.load_from_string(css);
        } catch (e) {
            // Fallback for older GTK4 versions
            provider.load_from_data(css, css.length);
        }
        Gtk.StyleContext.add_provider_for_display(
            Gdk.Display.get_default(),
            provider,
            Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
        );

        // Apply theme CSS class dynamically
        const updateThemeClass = () => {
            if (settings.get_string('theme-name') === 'black-pink') {
                window.add_css_class('theme-black-pink');
            } else {
                window.remove_css_class('theme-black-pink');
            }
        };
        settings.connect('changed::theme-name', updateThemeClass);
        updateThemeClass();

        // ══════════════════════════════════
        // PAGE 0: HOME — Main App Interface
        // ══════════════════════════════════
        this._buildHomePage(window, settings);

        // ══════════════════════════════════
        // PAGE 1: Timer Settings
        // ══════════════════════════════════
        const timerPage = new Adw.PreferencesPage({
            title: _('Timer'),
            icon_name: 'polindora-timer-symbolic',
        });
        window.add(timerPage);

        // ── Work Duration ──
        const timerGroup = new Adw.PreferencesGroup({
            title: _('Session Durations'),
            description: _('Configure how long each session lasts'),
        });
        timerPage.add(timerGroup);

        const workRow = new Adw.SpinRow({
            title: _('Work Duration'),
            subtitle: _('Minutes per focus session'),
            adjustment: new Gtk.Adjustment({
                lower: 1, upper: 60, step_increment: 1, page_increment: 5, value: 25,
            }),
        });
        settings.bind('work-duration', workRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        timerGroup.add(workRow);

        const shortBreakRow = new Adw.SpinRow({
            title: _('Short Break'),
            subtitle: _('Minutes for short breaks'),
            adjustment: new Gtk.Adjustment({
                lower: 1, upper: 30, step_increment: 1, page_increment: 5, value: 5,
            }),
        });
        settings.bind('short-break-duration', shortBreakRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        timerGroup.add(shortBreakRow);

        const longBreakRow = new Adw.SpinRow({
            title: _('Long Break'),
            subtitle: _('Minutes for long breaks'),
            adjustment: new Gtk.Adjustment({
                lower: 1, upper: 60, step_increment: 1, page_increment: 5, value: 15,
            }),
        });
        settings.bind('long-break-duration', longBreakRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        timerGroup.add(longBreakRow);

        const intervalRow = new Adw.SpinRow({
            title: _('Long Break Interval'),
            subtitle: _('Pomodoros before a long break'),
            adjustment: new Gtk.Adjustment({
                lower: 2, upper: 8, step_increment: 1, page_increment: 1, value: 4,
            }),
        });
        settings.bind('long-break-interval', intervalRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        timerGroup.add(intervalRow);

        // ══════════════════════════════════
        // PAGE 2: Behavior
        // ══════════════════════════════════
        const behaviorPage = new Adw.PreferencesPage({
            title: _('Behavior'),
            icon_name: 'polindora-behavior-symbolic',
        });
        window.add(behaviorPage);

        // ── Focus Mode ──
        const focusGroup = new Adw.PreferencesGroup({
            title: _('Focus Enforcement'),
            description: _('Settings that keep you accountable'),
        });
        behaviorPage.add(focusGroup);

        const strictRow = new Adw.SwitchRow({
            title: _('Strict Mode'),
            subtitle: _('Hides pause &amp; skip buttons during work sessions — no escape!'),
        });
        settings.bind('strict-mode', strictRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        focusGroup.add(strictRow);

        const autoWorkRow = new Adw.SwitchRow({
            title: _('Auto-start Work'),
            subtitle: _('Automatically begin work after break ends — no excuses'),
        });
        settings.bind('auto-start-work', autoWorkRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        focusGroup.add(autoWorkRow);

        const autoBreakRow = new Adw.SwitchRow({
            title: _('Auto-start Breaks'),
            subtitle: _('Automatically begin break after work ends'),
        });
        settings.bind('auto-start-breaks', autoBreakRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        focusGroup.add(autoBreakRow);

        // ── Notifications ──
        const notifGroup = new Adw.PreferencesGroup({
            title: _('Notifications'),
        });
        behaviorPage.add(notifGroup);

        const notifRow = new Adw.SwitchRow({
            title: _('Desktop Notifications'),
            subtitle: _('Show notifications when sessions complete'),
        });
        settings.bind('show-notifications', notifRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        notifGroup.add(notifRow);

        const soundRow = new Adw.SwitchRow({
            title: _('Sound Notifications'),
            subtitle: _('Play a chime when sessions complete'),
        });
        settings.bind('play-sound-notifications', soundRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        notifGroup.add(soundRow);

        // ══════════════════════════════════
        // PAGE 3: Appearance
        // ══════════════════════════════════
        const appearancePage = new Adw.PreferencesPage({
            title: _('Appearance'),
            icon_name: 'polindora-appearance-symbolic',
        });
        window.add(appearancePage);

        // ── Bar Dimensions ──
        const dimGroup = new Adw.PreferencesGroup({
            title: _('Bar Dimensions'),
            description: _('Size of the progress bars on the top panel'),
        });
        appearancePage.add(dimGroup);

        const widthRow = new Adw.SpinRow({
            title: _('Bar Width'),
            subtitle: _('Width in pixels (60–300)'),
            adjustment: new Gtk.Adjustment({
                lower: 60, upper: 300, step_increment: 10, page_increment: 20, value: 140,
            }),
        });
        settings.bind('bar-width', widthRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        dimGroup.add(widthRow);

        const heightRow = new Adw.SpinRow({
            title: _('Bar Height'),
            subtitle: _('Height in pixels (4–12)'),
            adjustment: new Gtk.Adjustment({
                lower: 4, upper: 12, step_increment: 1, page_increment: 2, value: 4,
            }),
        });
        settings.bind('bar-height', heightRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        dimGroup.add(heightRow);

        const radiusRow = new Adw.SpinRow({
            title: _('Bar Corner Radius'),
            subtitle: _('0 for rectangle, 99 for capsule'),
            adjustment: new Gtk.Adjustment({
                lower: 0, upper: 99, step_increment: 1, page_increment: 10, value: 99,
            }),
        });
        settings.bind('bar-radius', radiusRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        dimGroup.add(radiusRow);



        // ── Colors ──
        const colorGroup = new Adw.PreferencesGroup({
            title: _('Colors'),
            description: _('Customize the glassmorphism bar colors'),
        });
        appearancePage.add(colorGroup);

        // Store color button references for reset functionality
        const colorButtons = {};

        // Work color
        colorButtons['work-bar-color'] = this._addColorRow(colorGroup, settings, 'work-bar-color',
            _('Work Bar Color'), _('Color of the focus/work progress bar'));

        // Break color
        colorButtons['break-bar-color'] = this._addColorRow(colorGroup, settings, 'break-bar-color',
            _('Break Bar Color'), _('Color of the break progress bar'));

        // Idle color
        colorButtons['idle-bar-color'] = this._addColorRow(colorGroup, settings, 'idle-bar-color',
            _('Idle Pulse Color'), _('Color of the idle pulsing animation'));

        const satRow = new Adw.SpinRow({
            title: _('Color Saturation'),
            subtitle: _('Multiplier (1.0 is default)'),
            digits: 1,
            adjustment: new Gtk.Adjustment({
                lower: 0.0, upper: 2.0, step_increment: 0.1, page_increment: 0.5, value: 1.0,
            }),
        });
        settings.bind('color-saturation', satRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        colorGroup.add(satRow);

        const glowRow = new Adw.SpinRow({
            title: _('Glow Intensity'),
            subtitle: _('Spread of glow shadow in pixels'),
            adjustment: new Gtk.Adjustment({
                lower: 0, upper: 20, step_increment: 1, page_increment: 2, value: 3,
            }),
        });
        settings.bind('glow-intensity', glowRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        colorGroup.add(glowRow);

        // ── Reset Colors ──
        const resetColorGroup = new Adw.PreferencesGroup({});
        appearancePage.add(resetColorGroup);

        const resetColorRow = new Adw.ActionRow({
            title: _('Reset Colors to Default'),
            subtitle: _('Restore the curated default color palette'),
        });
        const resetColorBtn = new Gtk.Button({
            label: _('Reset'),
            css_classes: ['suggested-action'],
            valign: Gtk.Align.CENTER,
        });

        // Default colors matching the CSS glassmorphism aesthetic
        const defaultColors = {
            'work-bar-color': '#a3d5ff',
            'break-bar-color': '#eaf2ff',
            'idle-bar-color': '#ffffff',
            'heart-color': '#999999',
            'heart-outline-color': '#ff0000',
        };

        resetColorBtn.connect('clicked', () => {
            for (const [key, hex] of Object.entries(defaultColors)) {
                settings.set_string(key, hex);
                // Update the color button UI immediately
                let btn = colorButtons[key];
                if (btn) {
                    const rgba = new Gdk.RGBA();
                    if (rgba.parse(hex)) {
                        btn.set_rgba(rgba);
                    }
                }
            }
        });
        resetColorRow.add_suffix(resetColorBtn);
        resetColorRow.set_activatable_widget(resetColorBtn);
        resetColorGroup.add(resetColorRow);

        // ══════════════════════════════════
        // PAGE 4: Analytics — Detailed insights
        // ══════════════════════════════════
        this._buildAnalyticsPage(window, settings);

        // ══════════════════════════════════
        // PAGE 5: Tasks — Task management + mini analytics
        // ══════════════════════════════════
        this._buildTasksPage(window, settings);

        // ══════════════════════════════════
        // PAGE 6: Theme
        // ══════════════════════════════════
        this._buildThemePage(window, settings);
    }

    _addColorRow(group, settings, key, title, subtitle) {
        const row = new Adw.ActionRow({
            title: title,
            subtitle: subtitle,
        });

        const colorBtn = new Gtk.ColorDialogButton({
            valign: Gtk.Align.CENTER,
            dialog: new Gtk.ColorDialog(),
        });

        // Set initial color from settings
        const colorStr = settings.get_string(key);
        const rgba = new Gdk.RGBA();
        if (rgba.parse(colorStr)) {
            colorBtn.set_rgba(rgba);
        }

        // Update settings when color changes
        colorBtn.connect('notify::rgba', () => {
            const c = colorBtn.get_rgba();
            const r = Math.round(c.red * 255).toString(16).padStart(2, '0');
            const g = Math.round(c.green * 255).toString(16).padStart(2, '0');
            const b = Math.round(c.blue * 255).toString(16).padStart(2, '0');
            settings.set_string(key, `#${r}${g}${b}`);
        });

        // Listen for external settings changes
        settings.connect(`changed::${key}`, () => {
            const newColorStr = settings.get_string(key);
            const newRgba = new Gdk.RGBA();
            if (newRgba.parse(newColorStr)) {
                colorBtn.set_rgba(newRgba);
            }
        });

        row.add_suffix(colorBtn);
        group.add(row);

        return colorBtn;
    }

    // ══════════════════════════════════════════════════
    //  HOME PAGE — Full app interface in a single tab
    // ══════════════════════════════════════════════════

    _buildHomePage(window, settings) {
        const homePage = new Adw.PreferencesPage({
            title: _('Home'),
            icon_name: 'polindora-home-symbolic',
        });
        window.add(homePage);

        // ── Timer Display Group ──
        const timerGroup = new Adw.PreferencesGroup({});
        homePage.add(timerGroup);

        // Timer circle area using a DrawingArea + labels
        const timerBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            halign: Gtk.Align.CENTER,
            spacing: 8,
            margin_top: 8,
            margin_bottom: 8,
        });

        // Circle container with session ring overlay
        const RING_SIZE = 240;
        const circleOverlay = new Gtk.Overlay({
            halign: Gtk.Align.CENTER,
        });

        // Session ring drawing area (behind the content)
        const sessionRing = new Gtk.DrawingArea({
            content_width: RING_SIZE,
            content_height: RING_SIZE,
            halign: Gtk.Align.CENTER,
            valign: Gtk.Align.CENTER,
        });

        let _ringSessionsCompleted = settings.get_int('sessions-completed');
        let _ringTotalSegments = settings.get_int('long-break-interval');

        sessionRing.set_draw_func((area, cr, width, height) => {
            const cx = width / 2;
            const cy = height / 2;
            const radius = Math.min(width, height) / 2 - 8;
            const lineWidth = 3;
            const gap = 0.06; // radians gap between segments
            const totalSegs = Math.max(1, _ringTotalSegments);
            const segAngle = (2 * Math.PI - totalSegs * gap) / totalSegs;
            const startOffset = -Math.PI / 2; // Start at 12 o'clock

            cr.setLineWidth(lineWidth);
            cr.setLineCap(1); // ROUND

            for (let i = 0; i < totalSegs; i++) {
                const segStart = startOffset + i * (segAngle + gap);
                const segEnd = segStart + segAngle;

                if (i < _ringSessionsCompleted) {
                    // Completed segment — soft accent
                    cr.setSourceRGBA(0.75, 0.75, 0.75, 0.85);
                } else {
                    // Remaining segment — dim translucent
                    cr.setSourceRGBA(1, 1, 1, 0.1);
                }

                cr.arc(cx, cy, radius, segStart, segEnd);
                cr.stroke();
            }
        });

        // The dark circle background (smaller than ring so ring is visible)
        const circleFrame = new Gtk.Frame({
            halign: Gtk.Align.CENTER,
            valign: Gtk.Align.CENTER,
            css_classes: ['pomodoro-home-timer-circle'],
            width_request: RING_SIZE - 24,
            height_request: RING_SIZE - 24,
        });
        const circleContent = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            halign: Gtk.Align.CENTER,
            valign: Gtk.Align.CENTER,
            spacing: 4,
        });

        // Minimal heart above state label
        const heartIcon = new Gtk.Label({
            label: '♥',
            halign: Gtk.Align.CENTER,
            css_classes: ['pomodoro-home-heart'],
        });

        const _checkBday = () => {
            const d = new Date();
            const m = d.getMonth();
            const dt = d.getDate();
            return (m === 2 && dt === 4);
        };

        const heartClick = new Gtk.GestureClick();
        heartClick.connect('pressed', () => {
            if (_checkBday()) settings.set_boolean('bday-surprise', true);
        });
        heartIcon.add_controller(heartClick);

        const heartHover = new Gtk.EventControllerMotion();
        heartHover.connect('enter', () => {
            if (_checkBday()) settings.set_boolean('bday-surprise', true);
        });
        heartIcon.add_controller(heartHover);

        circleContent.append(heartIcon);

        // State label (FOCUS / BREAK / IDLE)
        const stateLabel = new Gtk.Label({
            label: 'FOCUS',
            halign: Gtk.Align.CENTER,
            css_classes: ['pomodoro-home-state-label'],
        });
        circleContent.append(stateLabel);

        // Big timer digits
        const workDur = settings.get_int('work-duration');
        const digitsLabel = new Gtk.Label({
            label: `${workDur.toString().padStart(2, '0')}:00`,
            halign: Gtk.Align.CENTER,
            css_classes: ['pomodoro-home-digits'],
        });
        circleContent.append(digitsLabel);

        // Control buttons row inside circle
        const ctrlRow = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            halign: Gtk.Align.CENTER,
            spacing: 12,
            margin_top: 8,
        });

        const playBtn = new Gtk.Button({
            icon_name: 'polindora-play-symbolic',
            css_classes: ['pomodoro-home-play-btn'],
            halign: Gtk.Align.CENTER,
            tooltip_text: _('Start / Pause'),
        });
        ctrlRow.append(playBtn);

        circleContent.append(ctrlRow);

        const innerOverlay = new Gtk.Overlay();
        innerOverlay.set_child(circleContent);

        const bdayLabel = new Gtk.Label({
            label: 'Happy Birthday P_S 🎂🎉',
            halign: Gtk.Align.CENTER,
            valign: Gtk.Align.CENTER,
            css_classes: ['bday-surprise-text'],
            wrap: true,
            justify: Gtk.Justification.CENTER,
        });
        innerOverlay.add_overlay(bdayLabel);
        circleFrame.set_child(innerOverlay);

        settings.connect('changed::bday-surprise', () => {
            if (settings.get_boolean('bday-surprise')) {
                circleFrame.add_css_class('show-bday-surprise');
                GLib.timeout_add(GLib.PRIORITY_DEFAULT, 8000, () => {
                    settings.set_boolean('bday-surprise', false);
                    return GLib.SOURCE_REMOVE;
                });
            } else {
                circleFrame.remove_css_class('show-bday-surprise');
            }
        });
        if (settings.get_boolean('bday-surprise')) {
            circleFrame.add_css_class('show-bday-surprise');
        }

        // Overlay: ring behind, circleFrame on top
        circleOverlay.set_child(sessionRing);
        circleOverlay.add_overlay(circleFrame);
        timerBox.append(circleOverlay);

        // Motivation text
        const motivationLabel = new Gtk.Label({
            label: 'Press play to start your focus session',
            halign: Gtk.Align.CENTER,
            css_classes: ['pomodoro-home-motivation'],
            margin_top: 8,
            wrap: true,
            justify: Gtk.Justification.CENTER,
            max_width_chars: 40,
        });
        timerBox.append(motivationLabel);

        timerGroup.add(timerBox);

        // ── Action Buttons (Skip / Reset) — shown contextually ──
        const actionGroup = new Adw.PreferencesGroup({});
        homePage.add(actionGroup);

        const actionRow = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            halign: Gtk.Align.CENTER,
            spacing: 12,
            margin_top: 4,
            margin_bottom: 4,
        });

        const skipBtn = new Gtk.Button({
            icon_name: 'polindora-skip-symbolic',
            css_classes: ['pomodoro-home-ctrl-btn'],
            sensitive: true,
            tooltip_text: _('Skip current session'),
        });
        actionRow.append(skipBtn);

        const resetBtn = new Gtk.Button({
            icon_name: 'polindora-reset-symbolic',
            css_classes: ['pomodoro-home-ctrl-btn'],
            sensitive: true,
            tooltip_text: _('Reset timer'),
        });
        actionRow.append(resetBtn);

        actionGroup.add(actionRow);

        // ── Category normalization helper ──
        const _normalizeCategory = (raw) => {
            if (!raw || typeof raw !== 'string') return 'General';
            let s = raw.trim().replace(/\s+/g, ' ');
            if (!s) return 'General';
            return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        };

        // ── Start Focus Session (category picker) ──
        const startGroup = new Adw.PreferencesGroup({});
        homePage.add(startGroup);

        const categoryCombo = new Gtk.DropDown({
            halign: Gtk.Align.CENTER,
        });

        // Build category list (normalized + deduplicated)
        let _isRefreshingCats = false;
        const _refreshCategories = () => {
            _isRefreshingCats = true;
            let cats = ['General'];
            try {
                let tasks = JSON.parse(settings.get_string('tasks'));
                if (Array.isArray(tasks)) {
                    tasks.forEach(t => {
                        if (!t.done && t.category) {
                            let norm = _normalizeCategory(t.category);
                            if (!cats.includes(norm)) {
                                cats.push(norm);
                            }
                        }
                    });
                }
            } catch (e) { }

            let currentCat = settings.get_string('timer-category') || 'General';
            if (!cats.includes(currentCat)) {
                cats.push(currentCat);
            }

            categoryCombo.set_model(Gtk.StringList.new(cats));
            let idx = cats.indexOf(currentCat);
            if (idx >= 0) {
                categoryCombo.set_selected(idx);
            }
            _isRefreshingCats = false;
        };
        _refreshCategories();

        categoryCombo.connect('notify::selected', () => {
            if (_isRefreshingCats) return;
            let selected = categoryCombo.get_selected();
            let model = categoryCombo.get_model();
            if (model) {
                let cat = _normalizeCategory(model.get_string(selected));
                settings.set_string('timer-category', cat);
            }
        });

        const startFocusBtn = new Gtk.Button({
            label: _('Start Focus Session'),
            icon_name: 'polindora-rocket-symbolic',
            css_classes: ['pomodoro-home-start-btn'],
            halign: Gtk.Align.FILL,
            hexpand: true,
        });

        const _refreshRemainingLabel = () => {
            let completed = settings.get_int('sessions-completed');
            let total = settings.get_int('long-break-interval');
            let remaining = Math.max(0, total - (completed % total));
            let state = settings.get_string('timer-state');
            if (state === 'work') {
                startFocusBtn.set_label(_(`Session in progress... \u00B7 ${remaining} left`));
            } else if (state === 'short_break' || state === 'long_break') {
                startFocusBtn.set_label(_(`On break... \u00B7 ${remaining} left`));
            } else {
                startFocusBtn.set_label(_(`Start Focus Session \u00B7 ${remaining} left`));
            }
        };
        _refreshRemainingLabel();

        const startBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 8,
            halign: Gtk.Align.FILL,
            hexpand: true,
        });
        startBox.append(categoryCombo);
        startBox.append(startFocusBtn);
        startGroup.add(startBox);

        // ── Stats Card ──
        const statsGroup = new Adw.PreferencesGroup({
            title: _('Today'),
        });
        homePage.add(statsGroup);

        const sessionsCompleted = settings.get_int('sessions-completed');
        const totalFocusMins = settings.get_int('total-focus-minutes');
        const hrs = Math.floor(totalFocusMins / 60);
        const mns = totalFocusMins % 60;
        const focusStr = hrs > 0 ? `${hrs}h ${mns}m` : `${mns}m`;

        const statsRow = new Adw.ActionRow({
            icon_name: 'polindora-pomodoro-symbolic',
            title: `${sessionsCompleted} pomodoro${sessionsCompleted !== 1 ? 's' : ''}`,
            subtitle: `${focusStr} focused`,
        });
        statsGroup.add(statsRow);

        // ── Top 3 Tasks ──
        const taskGroup = new Adw.PreferencesGroup({
            title: _('Top 3 Tasks'),
        });
        homePage.add(taskGroup);

        let _taskRows = [];
        const _renderHomeTasks = () => {
            for (const r of _taskRows) taskGroup.remove(r);
            _taskRows = [];
            let tasks = [];
            try {
                tasks = JSON.parse(settings.get_string('tasks'));
                if (!Array.isArray(tasks)) tasks = [];
            } catch (e) { tasks = []; }
            let topTasks = tasks.filter(t => !t.done).slice(0, 3);
            if (topTasks.length === 0) {
                let emptyRow = new Adw.ActionRow({
                    icon_name: 'polindora-inbox-symbolic',
                    title: _('No active tasks'),
                    subtitle: _('Add tasks from the Tasks tab'),
                });
                taskGroup.add(emptyRow);
                _taskRows.push(emptyRow);
                return;
            }
            topTasks.forEach((t, i) => {
                let row = new Adw.ActionRow({
                    icon_name: 'polindora-bullet-symbolic',
                    title: t.text || '(unnamed)',
                    subtitle: t.category || 'General',
                });
                let doneBtn = new Gtk.Button({
                    icon_name: 'polindora-complete-symbolic',
                    valign: Gtk.Align.CENTER,
                    tooltip_text: _('Mark done'),
                    css_classes: ['flat'],
                });
                doneBtn.connect('clicked', () => {
                    let allTasks = [];
                    try {
                        allTasks = JSON.parse(settings.get_string('tasks'));
                        if (!Array.isArray(allTasks)) allTasks = [];
                    } catch (e) { allTasks = []; }
                    // Find the matching task by id
                    let idx = allTasks.findIndex(at => at.id === t.id);
                    if (idx >= 0) {
                        allTasks[idx].done = true;
                        allTasks[idx].completedAt = new Date().toISOString();
                    }
                    settings.set_string('tasks', JSON.stringify(allTasks));
                    _renderHomeTasks();
                    _refreshStats();
                });
                row.add_suffix(doneBtn);
                taskGroup.add(row);
                _taskRows.push(row);
            });
        };
        _renderHomeTasks();

        // ── Timer State Management (GTK side) ──
        // We track a simple timer state to update the Home UI
        let _homeState = settings.get_string('timer-state');
        let _homePaused = settings.get_boolean('timer-is-paused');
        let _homeDuration = settings.get_int('timer-duration-secs');
        let _homeElapsed = settings.get_double('timer-elapsed-accumulated');
        if (!_homePaused && _homeState !== 'idle') {
            let start = settings.get_double('timer-start-time');
            let now = GLib.get_monotonic_time();
            _homeElapsed += (now - start) / 1000000;
        }
        let _homeTimerId = 0;
        let _homeCategory = settings.get_string('timer-category');
        let _homePomodoroCount = 0;
        let _homeLastTick = GLib.get_monotonic_time();

        const _formatTime = (secs) => {
            if (!Number.isFinite(secs)) secs = 0;
            secs = Math.max(0, Math.floor(secs));
            let m = Math.floor(secs / 60);
            let s = secs % 60;
            return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        };

        const _refreshStats = () => {
            let sc = settings.get_int('sessions-completed');
            let fm = settings.get_int('total-focus-minutes');
            let h = Math.floor(fm / 60);
            let m = fm % 60;
            let fs = h > 0 ? `${h}h ${m}m` : `${m}m`;
            statsRow.set_title(`${sc} pomodoro${sc !== 1 ? 's' : ''}`);
            statsRow.set_subtitle(`${fs} focused`);

            // Update session ring
            _ringSessionsCompleted = sc % _ringTotalSegments;
            _ringTotalSegments = settings.get_int('long-break-interval');
            sessionRing.queue_draw();

            // Update remaining label
            _refreshRemainingLabel();
        };

        const _pickMotivation = () => {
            return getTimedQuote(8);
        };

        const _updateHomeUI = () => {
            let sessions = settings.get_int('sessions-completed');
            let isStrict = settings.get_boolean('strict-mode');
            categoryCombo.set_visible(true);
            if (_homeState === 'idle') {
                stateLabel.set_label('FOCUS');
                let wd = settings.get_int('work-duration');
                digitsLabel.set_label(_formatTime(wd * 60));
                playBtn.set_icon_name('polindora-play-symbolic');
                playBtn.set_sensitive(true);
                skipBtn.set_sensitive(true);
                resetBtn.set_sensitive(true);
                startFocusBtn.set_sensitive(true);
                _refreshRemainingLabel();
                motivationLabel.set_label(sessions === 0 ? _pickMotivation('idle_zero') : _pickMotivation('idle_some'));
            } else if (_homeState === 'work') {
                let rem = Math.max(0, _homeDuration - _homeElapsed);
                stateLabel.set_label('FOCUS');
                digitsLabel.set_label(_formatTime(rem));
                playBtn.set_icon_name(_homePaused ? 'polindora-play-symbolic' : 'polindora-pause-symbolic');
                playBtn.set_sensitive(!isStrict);
                skipBtn.set_sensitive(!isStrict);
                resetBtn.set_sensitive(true);
                startFocusBtn.set_sensitive(false);
                _refreshRemainingLabel();
                let progress = _homeDuration > 0 ? _homeElapsed / _homeDuration : 0;
                if (progress < 0.3) motivationLabel.set_label(_pickMotivation('work_early'));
                else if (progress < 0.7) motivationLabel.set_label(_pickMotivation('work_mid'));
                else motivationLabel.set_label(_pickMotivation('work_late'));
            } else {
                let rem = Math.max(0, _homeDuration - _homeElapsed);
                stateLabel.set_label(_homeState === 'long_break' ? 'LONG BREAK' : 'BREAK');
                digitsLabel.set_label(_formatTime(rem));
                playBtn.set_icon_name(_homePaused ? 'polindora-play-symbolic' : 'polindora-pause-symbolic');
                playBtn.set_sensitive(true);
                skipBtn.set_sensitive(true);
                resetBtn.set_sensitive(true);
                startFocusBtn.set_sensitive(false);
                _refreshRemainingLabel();
                motivationLabel.set_label(_pickMotivation('break_msg'));
            }
            _refreshStats();
        };

        const _stopHomeTimer = () => {
            if (_homeTimerId) {
                GLib.source_remove(_homeTimerId);
                _homeTimerId = 0;
            }
        };

        const _syncFromSettings = () => {
            _homeState = settings.get_string('timer-state');
            _homePaused = settings.get_boolean('timer-is-paused');
            _homeDuration = settings.get_int('timer-duration-secs');
            _homeCategory = settings.get_string('timer-category');

            let acc = settings.get_double('timer-elapsed-accumulated');
            if (!_homePaused && _homeState !== 'idle') {
                let start = settings.get_double('timer-start-time');
                let now = GLib.get_monotonic_time();
                _homeElapsed = acc + (now - start) / 1000000;
            } else {
                _homeElapsed = acc;
            }

            if (_homeState !== 'idle') {
                _startTimerLoop();
            } else {
                _stopHomeTimer();
            }
            _updateHomeUI();
        };

        let _syncDebounceId = 0;
        const _queueSyncFromSettings = () => {
            if (_syncDebounceId > 0) return;
            _syncDebounceId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 50, () => {
                _syncDebounceId = 0;
                _syncFromSettings();
                return GLib.SOURCE_REMOVE;
            });
        };

        const stateChangedId = settings.connect('changed::timer-state', _queueSyncFromSettings);
        const pauseChangedId = settings.connect('changed::timer-is-paused', _queueSyncFromSettings);
        const durChangedId = settings.connect('changed::timer-duration-secs', _queueSyncFromSettings);
        const startChangedId = settings.connect('changed::timer-start-time', _queueSyncFromSettings);
        const workDurChangedId = settings.connect('changed::work-duration', () => {
            if (_homeState === 'idle') _updateHomeUI();
        });
        const sessCompletedId = settings.connect('changed::sessions-completed', _refreshStats);
        const focusMinsId = settings.connect('changed::total-focus-minutes', _refreshStats);

        const _startTimerLoop = () => {
            _stopHomeTimer();
            _homeLastTick = GLib.get_monotonic_time();
            _homeTimerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
                if (_homePaused) {
                    _homeLastTick = GLib.get_monotonic_time();
                    return GLib.SOURCE_CONTINUE;
                }

                let now = GLib.get_monotonic_time();
                let deltaSecs = (now - _homeLastTick) / 1000000;
                _homeLastTick = now;

                _homeElapsed += deltaSecs;
                if (_homeElapsed >= _homeDuration && _homeDuration > 0) {
                    _homeElapsed = _homeDuration; // Cap it, extension handles transitions
                }
                _updateHomeUI();
                return GLib.SOURCE_CONTINUE;
            });
        };

        // Wire up buttons
        playBtn.connect('clicked', () => {
            if (_homeState === 'idle') {
                let selected = categoryCombo.get_selected();
                let model = categoryCombo.get_model();
                let cat = _normalizeCategory(model ? model.get_string(selected) : 'General');
                settings.set_string('timer-category', cat);
                settings.set_string('timer-command', 'start-work');
            } else {
                settings.set_string('timer-command', _homePaused ? 'resume' : 'pause');
            }
        });

        startFocusBtn.connect('clicked', () => {
            if (_homeState === 'idle') {
                let selected = categoryCombo.get_selected();
                let model = categoryCombo.get_model();
                let cat = _normalizeCategory(model ? model.get_string(selected) : 'General');
                settings.set_string('timer-category', cat);
                settings.set_string('timer-command', 'start-work');
            }
        });

        skipBtn.connect('clicked', () => {
            settings.set_string('timer-command', 'skip');
        });

        resetBtn.connect('clicked', () => {
            settings.set_string('timer-command', 'reset');
        });

        // Listen for task changes to update list
        const tasksChangedId = settings.connect('changed::tasks', () => {
            _renderHomeTasks();
            _refreshCategories();
        });

        // Cleanup on window close
        window.connect('close-request', () => {
            _stopHomeTimer();
            if (_syncDebounceId > 0) {
                GLib.source_remove(_syncDebounceId);
                _syncDebounceId = 0;
            }
            if (tasksChangedId) settings.disconnect(tasksChangedId);
            if (stateChangedId) settings.disconnect(stateChangedId);
            if (pauseChangedId) settings.disconnect(pauseChangedId);
            if (durChangedId) settings.disconnect(durChangedId);
            if (startChangedId) settings.disconnect(startChangedId);
            if (workDurChangedId) settings.disconnect(workDurChangedId);
            if (sessCompletedId) settings.disconnect(sessCompletedId);
            if (focusMinsId) settings.disconnect(focusMinsId);
            return false;
        });

        if (_homeState !== 'idle') {
            _startTimerLoop();
        }
        _updateHomeUI();
    }

    // ══════════════════════════════════════════════════
    //  ANALYTICS PAGE — Detailed productivity insights
    // ══════════════════════════════════════════════════

    _buildAnalyticsPage(window, settings) {
        const page = new Adw.PreferencesPage({
            title: _('Analytics'),
            icon_name: 'polindora-analytics-symbolic',
        });
        window.add(page);

        // Helper
        const _fmtTime = (m) => {
            let h = Math.floor(m / 60);
            let r = m % 60;
            return h > 0 ? `${h}h ${r}m` : `${r}m`;
        };
        const _getTodayStr = () => {
            let d = new Date();
            return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
        };
        const _readHistory = () => {
            try {
                let h = JSON.parse(settings.get_string('analytics-history'));
                return Array.isArray(h) ? h : [];
            } catch (e) { return []; }
        };
        const _readTaskStats = () => {
            try {
                let s = JSON.parse(settings.get_string('task-stats'));
                return (s && typeof s === 'object') ? s : {};
            } catch (e) { return {}; }
        };
        const _readTasks = () => {
            try {
                let t = JSON.parse(settings.get_string('tasks'));
                return Array.isArray(t) ? t : [];
            } catch (e) { return []; }
        };

        // ── 1. Today's Hero Card ──
        const heroGroup = new Adw.PreferencesGroup({
            title: _('Today\'s Focus'),
        });
        page.add(heroGroup);

        let sessions = settings.get_int('sessions-completed');
        let focusMins = settings.get_int('total-focus-minutes');

        const heroSessionsRow = new Adw.ActionRow({
            icon_name: 'polindora-pomodoro-symbolic',
            title: _('Pomodoros Completed'),
            subtitle: `${sessions} session${sessions !== 1 ? 's' : ''} today`,
        });
        const heroSessionsLabel = new Gtk.Label({
            label: `${sessions}`,
            css_classes: ['pomodoro-analytics-hero-value'],
        });
        heroSessionsRow.add_suffix(heroSessionsLabel);
        heroGroup.add(heroSessionsRow);

        const heroFocusRow = new Adw.ActionRow({
            icon_name: 'polindora-hourglass-symbolic',
            title: _('Total Focus Time'),
            subtitle: `${_fmtTime(focusMins)} of deep work`,
        });
        const heroFocusLabel = new Gtk.Label({
            label: `${_fmtTime(focusMins)}`,
            css_classes: ['pomodoro-analytics-stat-value'],
        });
        heroFocusRow.add_suffix(heroFocusLabel);
        heroGroup.add(heroFocusRow);

        // Average session length
        let avgMins = sessions > 0 ? Math.round(focusMins / sessions) : 0;
        const avgRow = new Adw.ActionRow({
            icon_name: 'polindora-avg-symbolic',
            title: _('Avg Session Length'),
            subtitle: `${avgMins}m per pomodoro`,
        });
        heroGroup.add(avgRow);

        let allTimeMins = settings.get_int('all-time-focus-minutes');
        const allTimeRow = new Adw.ActionRow({
            icon_name: 'polindora-star-symbolic',
            title: _('Total Focus Time (All Time)'),
            subtitle: `${_fmtTime(allTimeMins)} of deep work in total`,
        });
        const allTimeLabel = new Gtk.Label({
            label: `${_fmtTime(allTimeMins)}`,
            css_classes: ['pomodoro-analytics-stat-value'],
        });
        allTimeRow.add_suffix(allTimeLabel);
        heroGroup.add(allTimeRow);

        const _refreshHeroStats = () => {
            let s = settings.get_int('sessions-completed');
            let f = settings.get_int('total-focus-minutes');
            heroSessionsRow.set_subtitle(`${s} session${s !== 1 ? 's' : ''} today`);
            heroSessionsLabel.set_label(`${s}`);
            heroFocusRow.set_subtitle(`${_fmtTime(f)} of deep work`);
            heroFocusLabel.set_label(`${_fmtTime(f)}`);
            let avg = s > 0 ? Math.round(f / s) : 0;
            avgRow.set_subtitle(`${avg}m per pomodoro`);

            let atm = settings.get_int('all-time-focus-minutes');
            allTimeRow.set_subtitle(`${_fmtTime(atm)} of deep work in total`);
            allTimeLabel.set_label(`${_fmtTime(atm)}`);
        };

        // ── 2. Streak ──
        const streakGroup = new Adw.PreferencesGroup({
            title: _('Streak'),
        });
        page.add(streakGroup);

        const streakRow = new Adw.ActionRow({
            icon_name: 'polindora-streak-symbolic',
            title: _('Current Streak'),
            subtitle: `0 days consecutive`,
        });
        const streakLabel = new Gtk.Label({
            label: `0`,
            css_classes: ['pomodoro-streak-value'],
        });
        streakRow.add_suffix(streakLabel);
        streakGroup.add(streakRow);

        const bestRow = new Adw.ActionRow({
            icon_name: 'polindora-trophy-symbolic',
            title: _('Best Streak'),
            subtitle: `Your all-time record`,
        });
        const bestLabel = new Gtk.Label({
            label: `0`,
            css_classes: ['pomodoro-streak-value'],
        });
        bestRow.add_suffix(bestLabel);
        streakGroup.add(bestRow);

        const _refreshStreakStats = () => {
            let history = _readHistory();
            let currentStreak = 0;
            let today = _getTodayStr();
            let sess = settings.get_int('sessions-completed');
            let sortedDates = history.map(e => e.date).filter(d => d);
            if (sess > 0 && !sortedDates.includes(today)) sortedDates.push(today);
            sortedDates = [...new Set(sortedDates)].sort().reverse();

            let expected = new Date();
            if (sortedDates.length > 0 && sortedDates[0] !== today) {
                let y = new Date();
                y.setDate(y.getDate() - 1);
                let yStr = `${y.getFullYear()}-${(y.getMonth() + 1).toString().padStart(2, '0')}-${y.getDate().toString().padStart(2, '0')}`;
                if (sortedDates[0] === yStr) {
                    expected.setDate(expected.getDate() - 1);
                }
            }

            for (let i = 0; i < sortedDates.length; i++) {
                let expStr = `${expected.getFullYear()}-${(expected.getMonth() + 1).toString().padStart(2, '0')}-${expected.getDate().toString().padStart(2, '0')}`;
                if (sortedDates[i] === expStr) {
                    currentStreak++;
                    expected.setDate(expected.getDate() - 1);
                } else {
                    break;
                }
            }
            let bestStreak = settings.get_int('best-streak');
            if (currentStreak > bestStreak) {
                bestStreak = currentStreak;
                settings.set_int('best-streak', bestStreak);
            }
            streakRow.set_subtitle(`${currentStreak} day${currentStreak !== 1 ? 's' : ''} consecutive`);
            streakLabel.set_label(`${currentStreak}`);
            bestRow.set_subtitle(`Your all-time record`);
            bestLabel.set_label(`${bestStreak}`);
        };
        _refreshStreakStats();

        // ── 3. Category Breakdown (pie chart + legend) ──
        const catGroup = new Adw.PreferencesGroup({
            title: _('Category Breakdown'),
            description: _('Time spent per category today'),
        });
        page.add(catGroup);

        const CHART_COLORS = [
            [0.0, 0.83, 1.0], [0.0, 1.0, 0.4], [1.0, 0.18, 0.47],
            [1.0, 0.8, 0.0], [0.6, 0.2, 1.0], [1.0, 0.5, 0.0],
            [0.3, 0.9, 0.7], [0.9, 0.4, 0.8], [0.4, 0.6, 1.0],
        ];

        // State for Bug 4: bar-click-to-pie interaction
        let _selectedDayIndex = -1; // -1 = today (live data)
        let _overrideCatStats = null; // null = use live task-stats
        let _hoveredSliceIndex = -1; // for hover tooltip

        // Get effective category stats (overridden by bar click or live)
        const _getEffectiveCatStats = () => {
            if (_overrideCatStats) return _overrideCatStats;
            return _readTaskStats();
        };

        const pieChart = new Gtk.DrawingArea({
            width_request: 180, height_request: 180,
            halign: Gtk.Align.CENTER, margin_bottom: 8,
        });

        // Hover tooltip via motion controller
        const motionCtrl = new Gtk.EventControllerMotion();
        motionCtrl.connect('motion', (ctrl, mx, my) => {
            let tStats = _getEffectiveCatStats();
            let keys = Object.keys(tStats).filter(k => tStats[k] > 0);
            let total = 0;
            for (let k of keys) total += tStats[k];
            if (total === 0 || keys.length === 0) {
                if (_hoveredSliceIndex !== -1) {
                    _hoveredSliceIndex = -1;
                    pieChart.set_tooltip_text(null);
                    pieChart.queue_draw();
                }
                return;
            }
            let w = pieChart.get_width();
            let h = pieChart.get_height();
            let cx = w / 2, cy = h / 2;
            let r = Math.min(cx, cy) - 8;
            let innerR = r * 0.55;
            let dx = mx - cx, dy = my - cy;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < innerR || dist > r + 6) {
                if (_hoveredSliceIndex !== -1) {
                    _hoveredSliceIndex = -1;
                    pieChart.set_tooltip_text(null);
                    pieChart.queue_draw();
                }
                return;
            }
            let mouseAngle = Math.atan2(dy, dx);
            if (mouseAngle < -Math.PI / 2) mouseAngle += 2 * Math.PI;
            let angle = -Math.PI / 2;
            let found = -1;
            for (let i = 0; i < keys.length; i++) {
                let sweep = (tStats[keys[i]] / total) * 2 * Math.PI;
                let endAngle = angle + sweep;
                let normMouse = mouseAngle;
                if (normMouse >= angle && normMouse < endAngle) { found = i; break; }
                angle = endAngle;
            }
            if (found !== _hoveredSliceIndex) {
                _hoveredSliceIndex = found;
                if (found >= 0) {
                    let cat = keys[found];
                    let mins = tStats[cat];
                    let pct = Math.round((mins / total) * 100);
                    pieChart.set_tooltip_text(`${cat}: ${_fmtTime(mins)} (${pct}%)`);
                } else {
                    pieChart.set_tooltip_text(null);
                }
                pieChart.queue_draw();
            }
        });
        motionCtrl.connect('leave', () => {
            if (_hoveredSliceIndex !== -1) {
                _hoveredSliceIndex = -1;
                pieChart.set_tooltip_text(null);
                pieChart.queue_draw();
            }
        });
        pieChart.add_controller(motionCtrl);

        pieChart.set_draw_func((area, cr, w, h) => {
            let tStats = _getEffectiveCatStats();
            let keys = Object.keys(tStats).filter(k => tStats[k] > 0);
            let total = 0;
            for (let k of keys) total += tStats[k];
            let cx = w / 2, cy = h / 2, r = Math.min(cx, cy) - 12;
            if (r <= 0) return;
            let innerR = r * 0.55;
            if (total === 0) {
                cr.setSourceRGBA(0.5, 0.5, 0.5, 0.15);
                cr.arc(cx, cy, r, 0, 2 * Math.PI);
                cr.arc(cx, cy, innerR, 0, 2 * Math.PI);
                cr.setFillRule(1);
                cr.fill();
                return;
            }
            let angle = -Math.PI / 2;
            for (let i = 0; i < keys.length; i++) {
                let sweep = (tStats[keys[i]] / total) * 2 * Math.PI;
                if (sweep <= 0) continue;
                let isHovered = (i === _hoveredSliceIndex);
                let explode = isHovered ? 6 : 0;
                let midAngle = angle + sweep / 2;
                let offX = explode * Math.cos(midAngle);
                let offY = explode * Math.sin(midAngle);
                let sCx = cx + offX, sCy = cy + offY;
                cr.moveTo(sCx + innerR * Math.cos(angle), sCy + innerR * Math.sin(angle));
                cr.arc(sCx, sCy, isHovered ? r + 3 : r, angle, angle + sweep);
                cr.arc(sCx, sCy, innerR, angle + sweep, angle);
                cr.closePath();
                let col = CHART_COLORS[i % CHART_COLORS.length];
                cr.setSourceRGBA(col[0], col[1], col[2], isHovered ? 1.0 : 0.8);
                cr.fillPreserve();
                cr.setSourceRGBA(0, 0, 0, 0.3); cr.setLineWidth(1); cr.stroke();
                // Draw category label on slice for larger slices
                if (sweep > 0.4) {
                    let labelR = (r + innerR) / 2;
                    let lx = cx + labelR * Math.cos(midAngle);
                    let ly = cy + labelR * Math.sin(midAngle);
                    cr.setSourceRGBA(1, 1, 1, 0.9);
                    cr.selectFontFace('sans-serif', 0, 1);
                    cr.setFontSize(9);
                    let pct = `${Math.round((tStats[keys[i]] / total) * 100)}%`;
                    let te = cr.textExtents(pct);
                    cr.moveTo(lx - te.width / 2, ly + te.height / 2);
                    cr.showText(pct);
                }
                angle += sweep;
            }
            // Center text
            cr.setSourceRGBA(1, 1, 1, 0.8);
            cr.selectFontFace('monospace', 0, 0);
            cr.setFontSize(14);
            let txt = _fmtTime(total);
            let ext = cr.textExtents(txt);
            cr.moveTo(cx - ext.width / 2, cy + ext.height / 2);
            cr.showText(txt);
        });
        catGroup.add(pieChart);

        // Dynamic legend rows
        let _legendRows = [];
        const _refreshCategoryBreakdown = () => {
            for (const r of _legendRows) catGroup.remove(r);
            _legendRows = [];
            let tStats = _getEffectiveCatStats();
            let keys = Object.keys(tStats).filter(k => tStats[k] > 0);
            let total = 0;
            for (let k of keys) total += tStats[k];
            if (keys.length === 0) {
                let emptyRow = new Adw.ActionRow({
                    title: _('No data yet'),
                    subtitle: _('Complete a focus session to see category breakdown'),
                });
                catGroup.add(emptyRow);
                _legendRows.push(emptyRow);
                pieChart.queue_draw();
                return;
            }
            keys.forEach((cat, ci) => {
                let mins = tStats[cat];
                let pct = total > 0 ? Math.round((mins / total) * 100) : 0;
                let col = CHART_COLORS[ci % CHART_COLORS.length];
                let catRow = new Adw.ActionRow({
                    title: cat,
                    subtitle: `${_fmtTime(mins)} · ${pct}%`,
                });
                let dot = new Gtk.DrawingArea({ width_request: 12, height_request: 12, valign: Gtk.Align.CENTER });
                const cc = col;
                dot.set_draw_func((a, cr2, w2, h2) => {
                    cr2.setSourceRGBA(cc[0], cc[1], cc[2], 1);
                    cr2.arc(w2 / 2, h2 / 2, 5, 0, 2 * Math.PI);
                    cr2.fill();
                });
                catRow.add_prefix(dot);
                catGroup.add(catRow);
                _legendRows.push(catRow);
            });
            pieChart.queue_draw();
        };
        _refreshCategoryBreakdown();

        // ── 4. 7-Day History Bar Chart ──
        const weekGroup = new Adw.PreferencesGroup({
            title: _('Last 7 Days'),
            description: _('Daily focus minutes · Click a bar to see its category breakdown'),
        });
        page.add(weekGroup);

        // Helper: build days array from history
        const _buildDays = () => {
            let hist = _readHistory();
            let dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            let days = [];
            for (let i = 6; i >= 0; i--) {
                let d = new Date();
                d.setDate(d.getDate() - i);
                let ds = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
                let entry = hist.find(e => e.date === ds);
                let mins = entry ? entry.focusMinutes : 0;
                let categories = entry ? (entry.categories || {}) : {};
                if (i === 0) {
                    mins = settings.get_int('total-focus-minutes');
                    categories = _readTaskStats();
                }
                let dateLabel = `${d.getDate()}/${d.getMonth() + 1}`;
                days.push({ label: dayNames[d.getDay()], dateLabel, mins, isToday: i === 0, categories, date: ds });
            }
            return days;
        };

        const barChart = new Gtk.DrawingArea({
            width_request: 380, height_request: 150,
            halign: Gtk.Align.CENTER, margin_top: 4, margin_bottom: 4,
        });

        // Click handler for bar chart
        const clickCtrl = new Gtk.GestureClick();
        clickCtrl.connect('pressed', (gesture, nPress, mx, my) => {
            let days = _buildDays();
            let w = barChart.get_width();
            let barW = 36, gap = 12;
            let chartW = days.length * (barW + gap) - gap;
            let startX = (w - chartW) / 2;
            // Determine which bar was clicked
            let clickedIndex = -1;
            for (let i = 0; i < days.length; i++) {
                let x = startX + i * (barW + gap);
                if (mx >= x && mx <= x + barW) { clickedIndex = i; break; }
            }
            if (clickedIndex < 0) return;
            // Toggle selection: click same bar deselects
            if (_selectedDayIndex === clickedIndex) {
                _selectedDayIndex = -1;
                _overrideCatStats = null;
                catGroup.set_title(_('Category Breakdown'));
                catGroup.set_description(_('Time spent per category today'));
            } else {
                _selectedDayIndex = clickedIndex;
                let day = days[clickedIndex];
                _overrideCatStats = day.categories || {};
                catGroup.set_title(_(`Category Breakdown — ${day.label} ${day.dateLabel}`));
                catGroup.set_description(day.isToday ? _('Today\'s categories') : _(`Focus categories for ${day.label}`));
            }
            barChart.queue_draw();
            _refreshCategoryBreakdown();
        });
        barChart.add_controller(clickCtrl);

        barChart.set_draw_func((area, cr, w, h) => {
            let days = _buildDays();
            let maxVal = Math.max(1, ...days.map(d => d.mins));
            let barW = 36, gap = 12;
            let chartW = days.length * (barW + gap) - gap;
            let startX = (w - chartW) / 2;
            let chartH = h - 30;
            // Grid lines
            cr.setSourceRGBA(1, 1, 1, 0.06);
            for (let g = 0; g <= 4; g++) {
                let gy = 10 + (chartH - 10) * (1 - g / 4);
                cr.moveTo(startX - 5, gy); cr.lineTo(startX + chartW, gy);
                cr.setLineWidth(0.5); cr.stroke();
                cr.setSourceRGBA(1, 1, 1, 0.25);
                cr.selectFontFace('monospace', 0, 0); cr.setFontSize(8);
                let gVal = Math.round(maxVal * g / 4);
                cr.moveTo(startX - 28, gy + 3);
                cr.showText(`${gVal}m`);
                cr.setSourceRGBA(1, 1, 1, 0.06);
            }
            // Bars
            days.forEach((d, i) => {
                let x = startX + i * (barW + gap);
                let barH = d.mins > 0 ? Math.max(3, (d.mins / maxVal) * (chartH - 10)) : 0;
                let y = 10 + (chartH - 10) - barH;
                let isSelected = (i === _selectedDayIndex);
                // Color: selected = bright glow, today = pink, others = cyan
                if (isSelected) {
                    cr.setSourceRGBA(1, 0.8, 0.0, 0.95);
                } else if (d.isToday) {
                    cr.setSourceRGBA(1, 0.18, 0.47, 0.8);
                } else {
                    cr.setSourceRGBA(0, 0.83, 1.0, 0.5);
                }
                // Rounded rect
                let rr = 4;
                cr.moveTo(x + rr, y);
                cr.lineTo(x + barW - rr, y);
                cr.arc(x + barW - rr, y + rr, rr, -Math.PI / 2, 0);
                cr.lineTo(x + barW, 10 + chartH - 10);
                cr.lineTo(x, 10 + chartH - 10);
                cr.lineTo(x, y + rr);
                cr.arc(x + rr, y + rr, rr, Math.PI, 3 * Math.PI / 2);
                cr.closePath();
                cr.fill();
                // Selected glow effect
                if (isSelected && barH > 0) {
                    cr.save();
                    cr.moveTo(x + rr, y);
                    cr.lineTo(x + barW - rr, y);
                    cr.arc(x + barW - rr, y + rr, rr, -Math.PI / 2, 0);
                    cr.lineTo(x + barW, 10 + chartH - 10);
                    cr.lineTo(x, 10 + chartH - 10);
                    cr.lineTo(x, y + rr);
                    cr.arc(x + rr, y + rr, rr, Math.PI, 3 * Math.PI / 2);
                    cr.closePath();
                    cr.setSourceRGBA(1, 0.8, 0.0, 0.15);
                    cr.setLineWidth(3);
                    cr.stroke();
                    cr.restore();
                    // Selection indicator triangle
                    cr.setSourceRGBA(1, 0.8, 0.0, 0.9);
                    let tx = x + barW / 2;
                    let ty = h - 16;
                    cr.moveTo(tx - 4, ty + 5); cr.lineTo(tx + 4, ty + 5); cr.lineTo(tx, ty);
                    cr.closePath(); cr.fill();
                }
                // Label
                cr.setSourceRGBA(1, 1, 1, (d.isToday || isSelected) ? 0.8 : 0.4);
                cr.selectFontFace('monospace', 0, 0); cr.setFontSize(9);
                let ext = cr.textExtents(d.label);
                cr.moveTo(x + barW / 2 - ext.width / 2, h - 5);
                cr.showText(d.label);
                // Value on top
                if (d.mins > 0) {
                    cr.setSourceRGBA(1, 1, 1, 0.6);
                    cr.setFontSize(8);
                    let vt = `${d.mins}`;
                    let ve = cr.textExtents(vt);
                    cr.moveTo(x + barW / 2 - ve.width / 2, y - 4);
                    cr.showText(vt);
                }
            });
        });
        weekGroup.add(barChart);

        // ── 5. Task Completion Stats ──
        const taskStatGroup = new Adw.PreferencesGroup({
            title: _('Task Completion'),
        });
        page.add(taskStatGroup);

        let tasks = _readTasks();
        let totalTasks = tasks.length;
        let doneTasks = tasks.filter(t => t.done).length;
        let activeTasks = totalTasks - doneTasks;
        let deletedIncomplete = settings.get_int('deleted-incomplete-count');
        let effectiveTotal = totalTasks + deletedIncomplete;
        let compRate = effectiveTotal > 0 ? Math.round((doneTasks / effectiveTotal) * 100) : 0;

        const totalTasksRow = new Adw.ActionRow({
            icon_name: 'polindora-list-symbolic',
            title: _('Total Tasks'), subtitle: `${totalTasks} created`,
        });
        taskStatGroup.add(totalTasksRow);

        const doneTasksRow = new Adw.ActionRow({
            icon_name: 'polindora-complete-symbolic',
            title: _('Completed'), subtitle: `${doneTasks} finished`,
        });
        taskStatGroup.add(doneTasksRow);

        const activeTasksRow = new Adw.ActionRow({
            icon_name: 'polindora-pending-symbolic',
            title: _('Active'), subtitle: `${activeTasks} remaining`,
        });
        taskStatGroup.add(activeTasksRow);

        const rateRow = new Adw.ActionRow({
            icon_name: 'polindora-percent-symbolic',
            title: _('Completion Rate'),
        });
        const rateLabel = new Gtk.Label({
            label: `${compRate}%`,
            css_classes: ['pomodoro-analytics-stat-value'],
        });
        rateRow.add_suffix(rateLabel);
        taskStatGroup.add(rateRow);

        const _refreshTaskStats = () => {
            let t = _readTasks();
            let tot = t.length;
            let dn = t.filter(x => x.done).length;
            let act = tot - dn;
            let delInc = settings.get_int('deleted-incomplete-count');
            let effTotal = tot + delInc;
            let rt = effTotal > 0 ? Math.round((dn / effTotal) * 100) : 0;
            totalTasksRow.set_subtitle(`${tot} created`);
            doneTasksRow.set_subtitle(`${dn} finished`);
            activeTasksRow.set_subtitle(`${act} remaining`);
            rateLabel.set_label(`${rt}%`);
        };

        // ── 6. Reset ──
        const resetGroup = new Adw.PreferencesGroup({
            title: _(' Reset'),
        });
        page.add(resetGroup);

        const resetRow = new Adw.ActionRow({
            icon_name: 'polindora-reset-symbolic',
            title: _('Reset Today\'s Stats'),
            subtitle: _('Clear session count and focus time for today'),
        });
        const resetBtn = new Gtk.Button({
            label: _('Reset Today'),
            css_classes: ['destructive-action'],
            valign: Gtk.Align.CENTER,
        });
        resetBtn.connect('clicked', () => {
            settings.set_int('sessions-completed', 0);
            settings.set_int('total-focus-minutes', 0);
            settings.set_string('task-stats', '{}');
            heroSessionsRow.set_subtitle('0 sessions today');
            heroSessionsLabel.set_label('0');
            heroFocusRow.set_subtitle('0m of deep work');
            heroFocusLabel.set_label('0m');
            avgRow.set_subtitle('0m per pomodoro');
            pieChart.queue_draw();
            barChart.queue_draw();
        });
        resetRow.add_suffix(resetBtn);
        resetRow.set_activatable_widget(resetBtn);
        resetGroup.add(resetRow);

        const resetAllRow = new Adw.ActionRow({
            icon_name: 'polindora-delete-symbolic',
            title: _('Reset All History'),
            subtitle: _('Clear all analytics data and streaks'),
        });
        const resetAllBtn = new Gtk.Button({
            label: _('Reset All'),
            css_classes: ['destructive-action'],
            valign: Gtk.Align.CENTER,
        });
        resetAllBtn.connect('clicked', () => {
            settings.set_int('sessions-completed', 0);
            settings.set_int('total-focus-minutes', 0);
            settings.set_int('all-time-focus-minutes', 0);
            settings.set_string('task-stats', '{}');
            settings.set_string('analytics-history', '[]');
            settings.set_int('best-streak', 0);
            settings.set_int('deleted-incomplete-count', 0);
            heroSessionsRow.set_subtitle('0 sessions today');
            heroSessionsLabel.set_label('0');
            heroFocusRow.set_subtitle('0m of deep work');
            heroFocusLabel.set_label('0m');
            avgRow.set_subtitle('0m per pomodoro');
            streakRow.set_subtitle('0 days consecutive');
            bestRow.set_subtitle('Your all-time record');
            pieChart.queue_draw();
            barChart.queue_draw();
        });
        resetAllRow.add_suffix(resetAllBtn);
        resetAllRow.set_activatable_widget(resetAllBtn);
        resetGroup.add(resetAllRow);

        // Redraw charts on stats change
        const sid1 = settings.connect('changed::task-stats', () => {
            _refreshCategoryBreakdown();
        });
        const sid2 = settings.connect('changed::sessions-completed', () => {
            barChart.queue_draw();
            _refreshHeroStats();
            _refreshStreakStats();
        });
        const sid3 = settings.connect('changed::tasks', () => _refreshTaskStats());
        const sid4 = settings.connect('changed::total-focus-minutes', () => _refreshHeroStats());
        const sid5 = settings.connect('changed::analytics-history', () => _refreshStreakStats());
        const sid6 = settings.connect('changed::deleted-incomplete-count', () => _refreshTaskStats());

        window.connect('close-request', () => {
            settings.disconnect(sid1);
            settings.disconnect(sid2);
            settings.disconnect(sid3);
            settings.disconnect(sid4);
            settings.disconnect(sid5);
            settings.disconnect(sid6);
            return false;
        });
    }

    // ══════════════════════════════════════════════════
    //  TASKS PAGE — Task management + mini analytics
    // ══════════════════════════════════════════════════

    _buildTasksPage(window, settings) {
        const page = new Adw.PreferencesPage({
            title: _('Tasks'),
            icon_name: 'polindora-tasks-symbolic',
        });
        window.add(page);

        const _readTasks = () => {
            try {
                let t = JSON.parse(settings.get_string('tasks'));
                return Array.isArray(t) ? t : [];
            } catch (e) { return []; }
        };

        // ── Mini Analytics Summary ──
        const miniGroup = new Adw.PreferencesGroup({
            title: _('Task Overview'),
        });
        page.add(miniGroup);

        let tasks = _readTasks();
        let total = tasks.length;
        let done = tasks.filter(t => t.done).length;
        let active = total - done;
        let deletedInc = settings.get_int('deleted-incomplete-count');
        let effTotal = total + deletedInc;
        let rate = effTotal > 0 ? Math.round((done / effTotal) * 100) : 0;

        const summaryTotalRow = new Adw.ActionRow({ title: _('Total Tasks'), icon_name: 'polindora-list-symbolic' });
        const summaryTotalLabel = new Gtk.Label({ label: `${total}`, css_classes: ['title-2'] });
        summaryTotalRow.add_suffix(summaryTotalLabel);
        miniGroup.add(summaryTotalRow);

        const summaryDoneRow = new Adw.ActionRow({ title: _('Completed'), icon_name: 'polindora-complete-symbolic' });
        const summaryDoneLabel = new Gtk.Label({ label: `${done}`, css_classes: ['title-2'] });
        summaryDoneRow.add_suffix(summaryDoneLabel);
        miniGroup.add(summaryDoneRow);

        const summaryActiveRow = new Adw.ActionRow({ title: _('Remaining'), icon_name: 'polindora-pending-symbolic' });
        const summaryActiveLabel = new Gtk.Label({ label: `${active}`, css_classes: ['title-2'] });
        summaryActiveRow.add_suffix(summaryActiveLabel);
        miniGroup.add(summaryActiveRow);

        const summaryRateRow = new Adw.ActionRow({ title: _('Completion Rate'), icon_name: 'polindora-percent-symbolic' });
        const summaryRateLabel = new Gtk.Label({ label: `${rate}%`, css_classes: ['title-2'] });
        summaryRateRow.add_suffix(summaryRateLabel);
        miniGroup.add(summaryRateRow);

        const _refreshMiniStats = () => {
            let t = _readTasks();
            let tot = t.length, dn = t.filter(x => x.done).length;
            let act = tot - dn;
            let delInc = settings.get_int('deleted-incomplete-count');
            let effTot = tot + delInc;
            let rt = effTot > 0 ? Math.round((dn / effTot) * 100) : 0;
            summaryTotalLabel.set_label(`${tot}`);
            summaryDoneLabel.set_label(`${dn}`);
            summaryActiveLabel.set_label(`${act}`);
            summaryRateLabel.set_label(`${rt}%`);
        };

        // ── Create New Task ──
        const entryGroup = new Adw.PreferencesGroup({
            title: _('Create New Task'),
        });
        page.add(entryGroup);

        const taskNameRow = new Adw.EntryRow({ title: _('Task Name') });
        entryGroup.add(taskNameRow);

        const taskCatRow = new Adw.EntryRow({ title: _('Category (optional)') });
        entryGroup.add(taskCatRow);

        const addBtn = new Gtk.Button({
            label: _('Add Task'),
            css_classes: ['suggested-action'],
            margin_top: 12,
        });
        entryGroup.add(addBtn);

        // ── Active Tasks ──
        const activeGroup = new Adw.PreferencesGroup({
            title: _('Active Tasks'),
        });
        page.add(activeGroup);

        // ── Completed Tasks ──
        const doneGroup = new Adw.PreferencesGroup({
            title: _('Completed Tasks'),
        });
        page.add(doneGroup);

        let _activeRows = [];
        let _doneRows = [];

        const renderTasks = () => {
            for (const r of _activeRows) activeGroup.remove(r);
            for (const r of _doneRows) doneGroup.remove(r);
            _activeRows = [];
            _doneRows = [];

            let allTasks = _readTasks();

            // Active tasks
            let activeTasks = allTasks.filter(t => !t.done);
            if (activeTasks.length === 0) {
                let emptyRow = new Adw.ActionRow({
                    title: _('No active tasks'),
                    subtitle: _('Add a task above to get started'),
                });
                activeGroup.add(emptyRow);
                _activeRows.push(emptyRow);
            } else {
                activeTasks.forEach(t => {
                    let pomInfo = t.pomodorosSpent ? ` · ${t.pomodorosSpent} Pomo` : '';
                    let row = new Adw.ActionRow({
                        icon_name: 'polindora-bullet-symbolic',
                        title: t.text || '(unnamed)',
                        subtitle: `${t.category || 'General'}${pomInfo}`,
                    });
                    // Mark done button
                    let doneBtn = new Gtk.Button({
                        icon_name: 'polindora-complete-symbolic',
                        valign: Gtk.Align.CENTER,
                        tooltip_text: _('Mark as done'),
                        css_classes: ['suggested-action'],
                    });
                    doneBtn.connect('clicked', () => {
                        let cur = _readTasks();
                        let idx = cur.findIndex(x => x.id === t.id);
                        if (idx >= 0) {
                            cur[idx].done = true;
                            cur[idx].completedAt = new Date().toISOString();
                        }
                        settings.set_string('tasks', JSON.stringify(cur));
                        renderTasks();
                        _refreshMiniStats();
                    });
                    row.add_suffix(doneBtn);
                    // Delete button (active/incomplete task)
                    let delBtn = new Gtk.Button({
                        icon_name: 'polindora-delete-symbolic',
                        valign: Gtk.Align.CENTER,
                        css_classes: ['destructive-action'],
                        tooltip_text: _('⚠ Deleting an incomplete task will lower your completion rate'),
                    });
                    delBtn.connect('clicked', () => {
                        // Show confirmation dialog warning about completion rate impact
                        const dialog = new Adw.AlertDialog({
                            heading: _('Delete Task?'),
                            body: _('Deleting an incomplete task will permanently lower your task completion rate. Consider marking it as done instead.'),
                        });
                        dialog.add_response('cancel', _('Cancel'));
                        dialog.add_response('delete', _('Delete Anyway'));
                        dialog.set_response_appearance('delete', Adw.ResponseAppearance.DESTRUCTIVE);
                        dialog.set_default_response('cancel');
                        dialog.set_close_response('cancel');
                        dialog.connect('response', (dlg, response) => {
                            if (response === 'delete') {
                                let cur = _readTasks();
                                let idx = cur.findIndex(x => x.id === t.id);
                                if (idx >= 0) {
                                    cur.splice(idx, 1);
                                    // Increment deleted incomplete counter
                                    let delCount = settings.get_int('deleted-incomplete-count');
                                    settings.set_int('deleted-incomplete-count', delCount + 1);
                                }
                                settings.set_string('tasks', JSON.stringify(cur));
                                renderTasks();
                                _refreshMiniStats();
                            }
                        });
                        dialog.present(window);
                    });
                    row.add_suffix(delBtn);
                    activeGroup.add(row);
                    _activeRows.push(row);
                });
            }

            // Completed tasks
            let completedTasks = allTasks.filter(t => t.done);
            if (completedTasks.length === 0) {
                let emptyRow = new Adw.ActionRow({
                    icon_name: 'polindora-complete-symbolic',
                    title: _('No completed tasks yet'),
                    subtitle: _('Finish tasks to see them here'),
                });
                doneGroup.add(emptyRow);
                _doneRows.push(emptyRow);
            } else {
                completedTasks.forEach(t => {
                    let dateStr = '';
                    if (t.completedAt) {
                        try {
                            let d = new Date(t.completedAt);
                            dateStr = ` · ${d.toLocaleDateString()}`;
                        } catch (e) { }
                    }
                    let pomInfo = t.pomodorosSpent ? ` · ${t.pomodorosSpent} Pomo` : '';
                    let row = new Adw.ActionRow({
                        icon_name: 'polindora-complete-symbolic',
                        title: `${t.text || '(unnamed)'}`,
                        subtitle: `${t.category || 'General'}${pomInfo}${dateStr}`,
                    });
                    // Undo button
                    let undoBtn = new Gtk.Button({
                        icon_name: 'polindora-undo-symbolic',
                        valign: Gtk.Align.CENTER,
                        tooltip_text: _('Send back to active tasks'),
                        css_classes: ['flat'],
                    });
                    undoBtn.connect('clicked', () => {
                        let cur = _readTasks();
                        let idx = cur.findIndex(x => x.id === t.id);
                        if (idx >= 0) {
                            cur[idx].done = false;
                            cur[idx].completedAt = null;
                        }
                        settings.set_string('tasks', JSON.stringify(cur));
                        renderTasks();
                        _refreshMiniStats();
                    });
                    row.add_suffix(undoBtn);

                    // Delete button
                    let delBtn = new Gtk.Button({
                        icon_name: 'polindora-delete-symbolic',
                        valign: Gtk.Align.CENTER,
                        css_classes: ['destructive-action', 'flat'],
                    });
                    delBtn.connect('clicked', () => {
                        let cur = _readTasks();
                        let idx = cur.findIndex(x => x.id === t.id);
                        if (idx >= 0) cur.splice(idx, 1);
                        settings.set_string('tasks', JSON.stringify(cur));
                        renderTasks();
                        _refreshMiniStats();
                    });
                    row.add_suffix(delBtn);
                    doneGroup.add(row);
                    _doneRows.push(row);
                });
            }
        };
        renderTasks();

        addBtn.connect('clicked', () => {
            let name = taskNameRow.get_text().trim();
            let rawCat = taskCatRow.get_text().trim() || 'General';
            // Bug 2: Normalize category — Title Case, collapse whitespace
            let cat = rawCat.replace(/\s+/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            if (name) {
                let cur = _readTasks();
                cur.push({
                    text: name, category: cat, done: false,
                    id: Date.now(), pomodorosSpent: 0, completedAt: null,
                });
                settings.set_string('tasks', JSON.stringify(cur));
                taskNameRow.set_text('');
                taskCatRow.set_text('');
                renderTasks();
                _refreshMiniStats();
            }
        });

        // Listen for external task changes
        const taskSid = settings.connect('changed::tasks', () => {
            renderTasks();
            _refreshMiniStats();
        });
        window.connect('close-request', () => {
            settings.disconnect(taskSid);
            return false;
        });
    }

    _buildThemePage(window, settings) {
        const themePage = new Adw.PreferencesPage({
            title: _('Theme'),
            icon_name: 'polindora-appearance-symbolic',
        });
        window.add(themePage);

        const themeGroup = new Adw.PreferencesGroup({
            title: _('App Theme'),
            description: _('Select the visual style for the entire application'),
        });
        themePage.add(themeGroup);

        const themeMap = [
            { id: 'default', label: _('Default Glassmorphism') },
            { id: 'black-pink', label: _('Black & Pink Glassmorphism') },
        ];

        const themeRow = new Adw.ComboRow({
            title: _('Theme'),
            subtitle: _('Choose the color palette and background style'),
            model: Gtk.StringList.new(themeMap.map(x => x.label)),
        });

        const currentTheme = settings.get_string('theme-name') || 'default';
        const themeIndex = Math.max(0, themeMap.findIndex(x => x.id === currentTheme));
        themeRow.set_selected(themeIndex);

        themeRow.connect('notify::selected', row => {
            const selected = row.get_selected();
            const item = themeMap[selected];
            if (item) {
                settings.set_string('theme-name', item.id);
                // Auto switch colors
                if (item.id === 'black-pink') {
                    settings.set_string('work-bar-color', '#ff69b4');
                    settings.set_string('break-bar-color', '#ff1493');
                    settings.set_string('idle-bar-color', '#ffb6c1');
                    settings.set_string('heart-color', '#4a0024');
                    settings.set_string('heart-outline-color', '#ff1493');
                } else {
                    settings.set_string('work-bar-color', '#a3d5ff');
                    settings.set_string('break-bar-color', '#eaf2ff');
                    settings.set_string('idle-bar-color', '#ffffff');
                    settings.set_string('heart-color', '#999999');
                    settings.set_string('heart-outline-color', '#ff0000');
                }
            }
        });
        themeGroup.add(themeRow);
    }
}
