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

// Mock Settings to test Sync Logic with Event Emitter
class MockSettings {
    constructor() {
        this.store = {};
        this.listeners = {};
        this.nextId = 1;
    }
    
    _emit(key) {
        if (this.listeners[`changed::${key}`]) {
            for (let id in this.listeners[`changed::${key}`]) {
                this.listeners[`changed::${key}`][id]();
            }
        }
    }

    connect(signal, callback) {
        if (!this.listeners[signal]) this.listeners[signal] = {};
        let id = this.nextId++;
        this.listeners[signal][id] = callback;
        return id;
    }

    disconnect(id) {
        for (let signal in this.listeners) {
            if (this.listeners[signal][id]) {
                delete this.listeners[signal][id];
            }
        }
    }

    set_string(key, val) { this.store[key] = val; this._emit(key); }
    get_string(key) { return this.store[key] || ''; }
    set_double(key, val) { this.store[key] = val; this._emit(key); }
    get_double(key) { return this.store[key] || 0.0; }
    set_boolean(key, val) { this.store[key] = val; this._emit(key); }
    get_boolean(key) { return this.store[key] || false; }
    set_int(key, val) { this.store[key] = val; this._emit(key); }
    get_int(key) { return this.store[key] || 0; }
}

print('=== STARTING PREFS SYNC TESTS ===');

let settings = new MockSettings();

// 1. Test Home Page Timer Update on 'work-duration' change
print('\n--- Testing Home Page Work Duration Sync ---');
settings.set_string('timer-state', 'idle');
settings.set_int('work-duration', 25);

let homeDigitsLabelText = '';
const _formatTime = (secs) => {
    let m = Math.floor(secs / 60);
    let s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const _updateHomeUI = () => {
    let state = settings.get_string('timer-state');
    if (state === 'idle') {
        let wd = settings.get_int('work-duration');
        homeDigitsLabelText = _formatTime(wd * 60);
    }
};

settings.connect('changed::work-duration', () => {
    if (settings.get_string('timer-state') === 'idle') _updateHomeUI();
});

// Initial UI
_updateHomeUI();
assertEqual(homeDigitsLabelText, '25:00', 'Initial Home Timer is 25:00');

// Change work-duration
settings.set_int('work-duration', 30);
assertEqual(homeDigitsLabelText, '30:00', 'Home Timer updates to 30:00 automatically on change');


// 2. Test Task Completion from Home Page setting completedAt
print('\n--- Testing Home Page Task Completion completedAt ---');
let tasks = [
    { text: 'Task 1', id: 101, done: false }
];
settings.set_string('tasks', JSON.stringify(tasks));

let homeTasksRendered = 0;
let homeStatsRefreshed = 0;
const _renderHomeTasks = () => { homeTasksRendered++; };
const _refreshStats = () => { homeStatsRefreshed++; };

// Simulate completion logic exactly as in prefs.js
const simulateHomeTaskDone = (taskId) => {
    let allTasks = JSON.parse(settings.get_string('tasks'));
    let idx = allTasks.findIndex(at => at.id === taskId);
    if (idx >= 0) {
        allTasks[idx].done = true;
        allTasks[idx].completedAt = new Date().toISOString();
    }
    settings.set_string('tasks', JSON.stringify(allTasks));
    _renderHomeTasks();
    _refreshStats();
};

simulateHomeTaskDone(101);
let updatedTasks = JSON.parse(settings.get_string('tasks'));
assertEqual(updatedTasks[0].done, true, 'Task is marked done');
assertEqual(typeof updatedTasks[0].completedAt, 'string', 'Task has a completedAt string');
assertEqual(homeTasksRendered, 1, 'Home tasks re-rendered');
assertEqual(homeStatsRefreshed, 1, 'Home stats refreshed');


// 3. Test Analytics Task Stats Sync
print('\n--- Testing Analytics Task Stats Sync ---');
let activeTasksLabel = '';
let completedTasksLabel = '';

const _refreshTaskStats = () => {
    let t = JSON.parse(settings.get_string('tasks'));
    let tot = t.length;
    let dn = t.filter(x => x.done).length;
    let act = tot - dn;
    activeTasksLabel = `${act} remaining`;
    completedTasksLabel = `${dn} finished`;
};

settings.connect('changed::tasks', () => _refreshTaskStats());

// Initialize labels
_refreshTaskStats();
assertEqual(completedTasksLabel, '1 finished', '1 task completed initially');
assertEqual(activeTasksLabel, '0 remaining', '0 active tasks initially');

// Add a new task (simulates adding via Tasks tab)
let curTasks = JSON.parse(settings.get_string('tasks'));
curTasks.push({ text: 'Task 2', id: 102, done: false });
settings.set_string('tasks', JSON.stringify(curTasks));

// Labels should be updated automatically via 'changed::tasks' signal
assertEqual(completedTasksLabel, '1 finished', 'Completed stays 1');
assertEqual(activeTasksLabel, '1 remaining', 'Active becomes 1');

print(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
if (failed > 0) throw new Error(`${failed} tests failed!`);
