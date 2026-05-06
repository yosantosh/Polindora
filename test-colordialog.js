import Gtk from 'gi://Gtk?version=4.0';
import Gdk from 'gi://Gdk?version=4.0';
Gtk.init();
try {
    const btn = new Gtk.ColorDialogButton({ dialog: new Gtk.ColorDialog() });
    const rgba = new Gdk.RGBA();
    rgba.parse('#ff0000');
    // Does set_rgba exist?
    if (typeof btn.set_rgba === 'function') {
        btn.set_rgba(rgba);
        print('set_rgba exists and works');
    } else {
        print('set_rgba DOES NOT EXIST');
        // Check if property is directly assignable
        btn.rgba = rgba;
        print('assignment to rgba works');
    }
} catch(e) {
    print('Error:', e);
}
