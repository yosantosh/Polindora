import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk?version=4.0';

const SCHEMA_ID = 'org.gnome.shell.extensions.pomodoro-timer';

function createSettings() {
    let schemaSource = Gio.SettingsSchemaSource.get_default();
    let schema = schemaSource.lookup(SCHEMA_ID, true);

    if (!schema) {
        const localSchemaDir = GLib.build_filenamev([GLib.get_current_dir(), 'schemas']);
        schemaSource = Gio.SettingsSchemaSource.new_from_directory(
            localSchemaDir,
            Gio.SettingsSchemaSource.get_default(),
            false
        );
        schema = schemaSource.lookup(SCHEMA_ID, false);
    }

    if (!schema)
        throw new Error(`GSettings schema ${SCHEMA_ID} not found`);

    return new Gio.Settings({ settings_schema: schema });
}

Adw.init();
const app = new Gtk.Application({ application_id: 'org.gnome.PomodoroPrefsTest' });
app.connect('activate', () => {
    const window = new Adw.PreferencesWindow({ application: app });
    
    try {
        const settings = createSettings();
        const statsStr = settings.get_string('task-stats');
        print('task-stats:', statsStr);
        // ... test creating color button
        const colorBtn = new Gtk.ColorDialogButton({
            valign: Gtk.Align.CENTER,
            dialog: new Gtk.ColorDialog(),
        });
        const rgba = new Gdk.RGBA();
        rgba.parse('#ff0000');
        colorBtn.set_rgba(rgba);
        print('ColorButton created');
    } catch (e) {
        print('Error:', e);
    }
    
    window.present();
    // close immediately for test
    window.close();
    app.quit();
});
app.run([]);
