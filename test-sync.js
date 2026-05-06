import GLib from 'gi://GLib';

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

// Mock Settings to test Sync Logic
class MockSettings {
    constructor() {
        this.store = {};
    }
    set_string(key, val) { this.store[key] = val; }
    get_string(key) { return this.store[key] || ''; }
    set_double(key, val) { this.store[key] = val; }
    get_double(key) { return this.store[key] || 0.0; }
    set_boolean(key, val) { this.store[key] = val; }
    get_boolean(key) { return this.store[key] || false; }
    set_int(key, val) { this.store[key] = val; }
    get_int(key) { return this.store[key] || 0; }
}

print('=== STARTING SYNC STATE TESTS ===');

let settings = new MockSettings();

// Simulate extension starting work
let startMonotonic = GLib.get_monotonic_time();
settings.set_string('timer-state', 'work');
settings.set_double('timer-start-time', startMonotonic);
settings.set_double('timer-elapsed-accumulated', 0.0);
settings.set_int('timer-duration-secs', 25 * 60);
settings.set_boolean('timer-is-paused', false);

// Simulate prefs UI opening and calculating elapsed time
const simulatePrefsSync = (delaySecs) => {
    let _homeState = settings.get_string('timer-state');
    let _homePaused = settings.get_boolean('timer-is-paused');
    let _homeDuration = settings.get_int('timer-duration-secs');
    let _homeElapsed = settings.get_double('timer-elapsed-accumulated');
    
    if (!_homePaused && _homeState !== 'idle') {
        let start = settings.get_double('timer-start-time');
        // Simulate "now" as start + delaySecs
        let now = start + (delaySecs * 1000000); 
        _homeElapsed += (now - start) / 1000000;
    }
    return Math.floor(_homeElapsed);
};

// 1. Initial State
assertEqual(simulatePrefsSync(0), 0, 'Elapsed is 0 at start');

// 2. After 5 seconds
assertEqual(simulatePrefsSync(5), 5, 'Elapsed is 5s after 5s');

// 3. Pause the timer at 10s
settings.set_boolean('timer-is-paused', true);
settings.set_double('timer-elapsed-accumulated', 10.0);
// Opening prefs during pause should return exactly the accumulated time regardless of delay
assertEqual(simulatePrefsSync(50), 10, 'Elapsed remains 10s while paused');

// 4. Resume the timer
settings.set_boolean('timer-is-paused', false);
settings.set_double('timer-start-time', GLib.get_monotonic_time());
// Check elapsed 15s after resume
assertEqual(simulatePrefsSync(15), 25, 'Elapsed is 25s (10s acc + 15s delay)');

print(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
if (failed > 0) throw new Error(`${failed} tests failed!`);
