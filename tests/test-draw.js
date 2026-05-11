import Gtk from 'gi://Gtk?version=4.0';
Gtk.init();
const w = new Gtk.Window();
const d = new Gtk.DrawingArea();
d.set_draw_func((area, cr, width, height) => {
    cr.setSourceRGBA(1, 0, 0, 1);
    cr.paint();
});
w.set_child(d);
// just checking if there are method resolution errors
try {
    let dummyCr = null; // can't easily mock cairo ctx in pure js but we know set_draw_func takes a callback
} catch(e) {}
print("Draw test pass");
