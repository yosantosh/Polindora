const fs = require('fs');

let prefs = fs.readFileSync('prefs.js', 'utf8');

// Inject IconTheme search path
prefs = prefs.replace('const settings = this.getSettings();', `const settings = this.getSettings();
        const display = Gdk.Display.get_default();
        const iconTheme = Gtk.IconTheme.get_for_display(display);
        iconTheme.add_search_path(this.dir.get_child('icons').get_path());`);

// Remove emojis from prefs.js
// We have: ◷ ⊘ ⍝ ◿ ◧ ★ ☑ ✓ ✦ ✧ ➕ 🍅 📊 📋 🔥
prefs = prefs.replace(/_?\('◷  Session Durations'\)/g, "_('Session Durations')");
prefs = prefs.replace(/_?\('⊘  Focus Enforcement'\)/g, "_('Focus Enforcement')");
prefs = prefs.replace(/_?\('⍝  Notifications'\)/g, "_('Notifications')");
prefs = prefs.replace(/_?\('◿  Bar Dimensions'\)/g, "_('Bar Dimensions')");
prefs = prefs.replace(/_?\('◧  Colors'\)/g, "_('Colors')");
prefs = prefs.replace(/_?\('★  Pomodoro Focus'\)/g, "_('Pomodoro Focus')");
prefs = prefs.replace(/_?\('☑  Task Completion'\)/g, "_('Task Completion')");
prefs = prefs.replace(/_?\('📊  Today'\)/g, "_('Today')");
prefs = prefs.replace(/_?\('✦  Today\\'s Focus'\)/g, "_('Today\\'s Focus')");
prefs = prefs.replace(/_?\('🔥  Streak'\)/g, "_('Streak')");
prefs = prefs.replace(/_?\('📋  Task Overview'\)/g, "_('Task Overview')");
prefs = prefs.replace(/_?\('➕  Create New Task'\)/g, "_('Create New Task')");
prefs = prefs.replace(/_?\('✓  Completed Tasks'\)/g, "_('Completed Tasks')");
prefs = prefs.replace(/_?\('Completed ✓'\)/g, "_('Completed')");

// Also replace the dynamic labels containing emojis
// e.g. label: `✦ ${sessions}`, label: `🔥 ${currentStreak}`, heroSessionsLabel.set_label('✦ 0');
prefs = prefs.replace(/label: \`✦ \${sessions}\`/g, "label: `${sessions}`");
prefs = prefs.replace(/label: \`🔥 \${currentStreak}\`/g, "label: `${currentStreak}`");
prefs = prefs.replace(/set_label\('✦ 0'\)/g, "set_label('0')");

// t.pomodorosSpent ? ` · ${t.pomodorosSpent} 🍅` : ''
prefs = prefs.replace(/` · \${t\.pomodorosSpent} 🍅`/g, "` · ${t.pomodorosSpent} Pomo`");

// subtitle: `${doneTasks} finished ✓`
prefs = prefs.replace(/subtitle: \`\${doneTasks} finished ✓\`/g, "subtitle: `${doneTasks} finished`");

// title: `✓ ${t.text || '(unnamed)'}`
prefs = prefs.replace(/title: \`✓ \${t\.text \|\| '\(unnamed\)'}\`/g, "title: `${t.text || '(unnamed)'}`");

// label: '✧ Press play to start your focus session'
prefs = prefs.replace(/label: '✧ Press play to start your focus session'/g, "label: 'Press play to start your focus session'");

// Array of motivational messages
prefs = prefs.replace(/✧ Stay locked in/g, "Stay locked in");
prefs = prefs.replace(/✧ Deep focus activated/g, "Deep focus activated");
prefs = prefs.replace(/✧ The first minutes/g, "The first minutes");
prefs = prefs.replace(/✦ Almost done/g, "Almost done");
prefs = prefs.replace(/✦ Final stretch/g, "Final stretch");
prefs = prefs.replace(/✦ Just a few more/g, "Just a few more");
prefs = prefs.replace(/✧ {n} pomodoros done/g, "{n} pomodoros done");
prefs = prefs.replace(/✧ {n} sessions crushed/g, "{n} sessions crushed");
prefs = prefs.replace(/✧ {n} deep focus blocks/g, "{n} deep focus blocks");

fs.writeFileSync('prefs.js', prefs);
console.log('prefs.js updated');

let ext = fs.readFileSync('extension.js', 'utf8');
// Inject IconTheme search path in extension.js
// We'll inject it inside enable()
ext = ext.replace('enable() {', `enable() {
        const Gtk = imports.gi.Gtk;
        const iconTheme = Gtk.IconTheme.get_default ? Gtk.IconTheme.get_default() : Gtk.IconTheme.get_for_display(imports.gi.Gdk.Display.get_default());
        iconTheme.add_search_path(this.dir.get_child('icons').get_path());`);

// Emojis in extension.js
ext = ext.replace(/✧ Stay locked in/g, "Stay locked in");
ext = ext.replace(/✧ Deep focus activated/g, "Deep focus activated");
ext = ext.replace(/✧ The first minutes/g, "The first minutes");
ext = ext.replace(/✦ Almost done/g, "Almost done");
ext = ext.replace(/✦ Final stretch/g, "Final stretch");
ext = ext.replace(/✦ Just a few more/g, "Just a few more");
ext = ext.replace(/✧ {n} pomodoros done/g, "{n} pomodoros done");
ext = ext.replace(/✧ {n} sessions crushed/g, "{n} sessions crushed");
ext = ext.replace(/✧ {n} deep focus blocks/g, "{n} deep focus blocks");

ext = ext.replace(/'🍅 Pomodoro Complete!'/g, "'Pomodoro Complete!'");
ext = ext.replace(/Stay focused! 🔥/g, "Stay focused!");
ext = ext.replace(/this.setTimeText\('✓'\);/g, "this.setTimeText('Done');");

fs.writeFileSync('extension.js', ext);
console.log('extension.js updated');
