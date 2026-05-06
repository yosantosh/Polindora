import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk?version=4.0';

Adw.init();
const app = new Gtk.Application({ application_id: 'org.gnome.PomodoroPrefsTest' });
app.connect('activate', () => {
    const window = new Adw.PreferencesWindow({ application: app });
    const settings = new Gio.Settings({ schema_id: 'org.gnome.shell.extensions.pomodoro-timer' });
    
    try {
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
});
app.run([]);
