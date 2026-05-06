import GLib from 'gi://GLib';

// ==========================================
// PURE FUNCTIONS EXTRACTED FROM CODEBASE
// ==========================================

function formatTime(totalSeconds) {
    if (!Number.isFinite(totalSeconds)) totalSeconds = 0;
    totalSeconds = Math.max(0, Math.floor(totalSeconds));
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

function hslToRgb(h, s, l) {
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

function getTodayStr(date) {
    const now = date || new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
}

// ==========================================
// TEST RUNNER
// ==========================================
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

function assertDeepEqual(actual, expected, name) {
    const actStr = JSON.stringify(actual);
    const expStr = JSON.stringify(expected);
    if (actStr === expStr) {
        print(`[PASS] ${name}`);
        passed++;
    } else {
        print(`[FAIL] ${name} | Expected: ${expStr}, Got: ${actStr}`);
        failed++;
    }
}

print('=== STARTING ALL-IN-ONE TESTS ===\n');

// 1. Time Management Tests
print('--- formatTime ---');
assertEqual(formatTime(25*60), '25:00', 'formatTime 25 mins');
assertEqual(formatTime(0), '00:00', 'formatTime 0 secs');
assertEqual(formatTime(-10), '00:00', 'formatTime bounds check negative');
assertEqual(formatTime(NaN), '00:00', 'formatTime NaN bounds check');
assertEqual(formatTime(Infinity), '00:00', 'formatTime Infinity bounds check');
assertEqual(formatTime(125.7), '02:05', 'formatTime floating point round down');

// 2. Clamp Tests
print('\n--- clampInt ---');
assertEqual(clampInt(50, 1, 60, 25), 50, 'clampInt normal');
assertEqual(clampInt(100, 1, 60, 25), 60, 'clampInt upper bound');
assertEqual(clampInt(-10, 1, 60, 25), 1, 'clampInt lower bound');
assertEqual(clampInt(NaN, 1, 60, 25), 25, 'clampInt fallback on NaN');
assertEqual(clampInt(Infinity, 1, 60, 25), 25, 'clampInt fallback on Infinity');

// 3. Date / Rollover Simulation Tests
print('\n--- getTodayStr / Rollover ---');
const date1 = new Date('2026-05-06T23:59:00');
const date2 = new Date('2026-05-07T00:01:00');
assertEqual(getTodayStr(date1), '2026-05-06', 'getTodayStr formats correctly');
assertEqual(getTodayStr(date1) !== getTodayStr(date2), true, 'Detects midnight rollover');

// 4. Color Logic Tests
print('\n--- Color utilities ---');
// adjustSaturation
assertEqual(adjustSaturation('#ff0000', 1.0), '#ff0000', 'adjustSaturation red normal');
assertEqual(adjustSaturation('#ff0000', 0.0), '#808080', 'adjustSaturation grayscale');
assertEqual(adjustSaturation('#zzzzzz', 1.0), '#zzzzzz', 'adjustSaturation invalid hex returns original hex securely');
assertEqual(adjustSaturation('invalid', 1.0), 'invalid', 'adjustSaturation invalid string');
assertEqual(adjustSaturation('#00d4ff', 1.5), '#00d4ff', 'adjustSaturation oversaturated bounds');

// hslToRgb
assertDeepEqual(hslToRgb(0, 100, 50), {r: 255, g: 0, b: 0}, 'hslToRgb red');
assertDeepEqual(hslToRgb(120, 100, 50), {r: 0, g: 255, b: 0}, 'hslToRgb green');
assertDeepEqual(hslToRgb(240, 100, 50), {r: 0, g: 0, b: 255}, 'hslToRgb blue');
assertDeepEqual(hslToRgb(360, 100, 50), {r: 255, g: 0, b: 0}, 'hslToRgb 360 is red');

print(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
if (failed > 0) throw new Error(`${failed} tests failed!`);
