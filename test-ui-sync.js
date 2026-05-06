let passed = 0;
let failed = 0;

function assertEqual(actual, expected, name) {
    if (actual === expected) {
        console.log(`[PASS] ${name}`);
        passed++;
    } else {
        console.log(`[FAIL] ${name} | Expected: ${expected}, Got: ${actual}`);
        failed++;
    }
}

// ── Mock Objects ──
class MockEvent {
    constructor(clicks) {
        this.clicks = clicks;
    }
    get_click_count() {
        return this.clicks;
    }
}

class MockSettings {
    constructor() {
        this.store = {
            'strict-mode': true,
            'sessions-completed': 0,
            'total-focus-minutes': 0,
            'all-time-focus-minutes': 120,
            'timer-state': 'idle',
            'timer-command': '',
            'play-sound-notifications': true
        };
    }
    set_string(k, v) { this.store[k] = v; }
    get_string(k) { return this.store[k]; }
    set_int(k, v) { this.store[k] = v; }
    get_int(k) { return this.store[k]; }
    set_boolean(k, v) { this.store[k] = v; }
    get_boolean(k) { return this.store[k]; }
}

const settings = new MockSettings();

// ── Mock Extension Logic ──
let extensionState = 'idle';
let isPaused = false;
let prefsOpened = false;

function onBarClicked(event) {
    if (event.get_click_count() === 2) {
        prefsOpened = true;
        return true;
    } else if (event.get_click_count() === 1) {
        if (extensionState !== 'idle') {
            settings.set_string('timer-command', isPaused ? 'resume' : 'pause');
        }
        return true;
    }
    return false;
}

function updateHomeUI() {
    let state = settings.get_string('timer-state');
    let isStrict = settings.get_boolean('strict-mode');
    
    let skipSensitive = true;
    let resetSensitive = true;
    
    if (state === 'work') {
        skipSensitive = !isStrict;
        resetSensitive = true;
    } else if (state === 'idle' || state === 'short_break' || state === 'long_break') {
        skipSensitive = true;
        resetSensitive = true;
    }
    
    return { skipSensitive, resetSensitive };
}

console.log('=== STARTING UI SYNC TESTS ===\n');

// 1. Progress Bar Clicks
console.log('--- Progress Bar Clicks ---');
onBarClicked(new MockEvent(2));
assertEqual(prefsOpened, true, 'Double click opens preferences');

extensionState = 'work';
isPaused = false;
onBarClicked(new MockEvent(1));
assertEqual(settings.get_string('timer-command'), 'pause', 'Single click pauses active timer');

isPaused = true;
onBarClicked(new MockEvent(1));
assertEqual(settings.get_string('timer-command'), 'resume', 'Single click resumes paused timer');

// 2. Skip/Reset Visibility & Sensitivity
console.log('\n--- Skip/Reset Logic ---');
settings.set_string('timer-state', 'idle');
let ui = updateHomeUI();
assertEqual(ui.skipSensitive, true, 'Skip is sensitive in idle');
assertEqual(ui.resetSensitive, true, 'Reset is sensitive in idle');

settings.set_string('timer-state', 'work');
settings.set_boolean('strict-mode', true);
ui = updateHomeUI();
assertEqual(ui.skipSensitive, false, 'Skip is NOT sensitive during work in strict mode');
assertEqual(ui.resetSensitive, true, 'Reset IS sensitive during work');

settings.set_boolean('strict-mode', false);
ui = updateHomeUI();
assertEqual(ui.skipSensitive, true, 'Skip IS sensitive during work when NOT in strict mode');

settings.set_string('timer-state', 'short_break');
ui = updateHomeUI();
assertEqual(ui.skipSensitive, true, 'Skip is sensitive during break');

console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
