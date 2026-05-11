import GLib from 'gi://GLib';

function formatTime(totalSeconds) {
    if (!Number.isFinite(totalSeconds)) totalSeconds = 0;
    totalSeconds = Math.floor(Math.max(0, totalSeconds));
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function clampInt(value, min, max, fallback) {
    if (!Number.isFinite(value)) return fallback;
    return Math.max(min, Math.min(max, Math.floor(value)));
}

function adjustSaturation(hex, sat) {
    if (!hex || hex.length < 7) return hex;
    try {
        let r = parseInt(hex.slice(1,3), 16) / 255;
        let g = parseInt(hex.slice(3,5), 16) / 255;
        let b = parseInt(hex.slice(5,7), 16) / 255;
        
        if (isNaN(r) || isNaN(g) || isNaN(b)) return hex;

        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max == min) { h = s = 0; }
        else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch(max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        
        s = Math.min(1.0, Math.max(0, s * sat));
        
        let hue2rgb = (p, q, t) => {
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        let p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
        
        let toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    } catch(e) {
        return hex;
    }
}

// Tests
let passed = 0;
let failed = 0;

function assertEqual(actual, expected, name) {
    if (actual === expected) {
        print(`[PASS] ${name}`);
        passed++;
    } else {
        print(`[FAIL] ${name} | Expected: ${expected}, Got: ${actual}`);
        failed++;
    }
}

print('--- Testing formatTime ---');
assertEqual(formatTime(25*60), '25:00', 'formatTime exactly 25 mins');
assertEqual(formatTime(0), '00:00', 'formatTime zero');
assertEqual(formatTime(-10), '00:00', 'formatTime negative bounds check');
assertEqual(formatTime(NaN), '00:00', 'formatTime NaN bounds check');
assertEqual(formatTime(Infinity), '00:00', 'formatTime Infinity bounds check');
assertEqual(formatTime(65.5), '01:05', 'formatTime floats');

print('--- Testing clampInt ---');
assertEqual(clampInt(50, 1, 60, 25), 50, 'clampInt normal');
assertEqual(clampInt(100, 1, 60, 25), 60, 'clampInt upper bounds');
assertEqual(clampInt(-10, 1, 60, 25), 1, 'clampInt lower bounds');
assertEqual(clampInt(NaN, 1, 60, 25), 25, 'clampInt NaN fallback');
assertEqual(clampInt(Infinity, 1, 60, 25), 25, 'clampInt Infinity fallback');

print('--- Testing adjustSaturation ---');
assertEqual(adjustSaturation('#ff0000', 1.0), '#ff0000', 'adjustSaturation red normal');
assertEqual(adjustSaturation('#ff0000', 0.0), '#808080', 'adjustSaturation red to grayscale');
assertEqual(adjustSaturation('#00d4ff', 1.5), '#00d4ff', 'adjustSaturation cyan oversaturated');
assertEqual(adjustSaturation('invalid', 1.0), 'invalid', 'adjustSaturation invalid length');
assertEqual(adjustSaturation('#zzzzzz', 1.0), '#zzzzzz', 'adjustSaturation invalid hex returns original hex securely');

print(`\nResults: ${passed} passed, ${failed} failed.`);
