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

// 1. Streak Calculation Algorithm
function calculateStreak(history, sessionsToday) {
    let currentStreak = 0;
    
    const _getTodayStr = () => {
        let d = new Date();
        return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
    };
    
    let today = _getTodayStr();
    let sortedDates = history.map(e => e.date).filter(d => d);
    if (sessionsToday > 0 && !sortedDates.includes(today)) sortedDates.push(today);
    
    sortedDates = [...new Set(sortedDates)].sort().reverse();
    
    let expected = new Date();
    if (sortedDates.length > 0 && sortedDates[0] !== today) {
        let y = new Date();
        y.setDate(y.getDate() - 1);
        let yStr = `${y.getFullYear()}-${(y.getMonth()+1).toString().padStart(2,'0')}-${y.getDate().toString().padStart(2,'0')}`;
        if (sortedDates[0] === yStr) {
            expected.setDate(expected.getDate() - 1);
        }
    }

    for (let i = 0; i < sortedDates.length; i++) {
        let expStr = `${expected.getFullYear()}-${(expected.getMonth()+1).toString().padStart(2,'0')}-${expected.getDate().toString().padStart(2,'0')}`;
        if (sortedDates[i] === expStr) {
            currentStreak++;
            expected.setDate(expected.getDate() - 1);
        } else {
            break;
        }
    }
    
    return currentStreak;
}

// 2. Task Pomodoro Association
function associatePomodoroToTask(tasksJson, category) {
    let allTasks = JSON.parse(tasksJson);
    if (Array.isArray(allTasks)) {
        allTasks.forEach(t => {
            if (!t.done && (t.category || 'General') === category) {
                t.pomodorosSpent = (t.pomodorosSpent || 0) + 1;
            }
        });
    }
    return JSON.stringify(allTasks);
}

// 3. Task Stats Aggregation
function aggregateTaskStats(taskStatsJson) {
    let tStats = JSON.parse(taskStatsJson);
    let total = 0;
    for (let c in tStats) {
        total += tStats[c];
    }
    return total;
}

print('=== STARTING TEST-V2 ===\n');

print('--- Streak Calculation ---');
let todayStr = `${new Date().getFullYear()}-${(new Date().getMonth()+1).toString().padStart(2,'0')}-${new Date().getDate().toString().padStart(2,'0')}`;

const getPastDateStr = (daysAgo) => {
    let d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
}

let yesterdayStr = getPastDateStr(1);
let twoDaysAgoStr = getPastDateStr(2);

assertEqual(calculateStreak([], 0), 0, 'Zero streak for no history');
assertEqual(calculateStreak([], 1), 1, 'One streak if session today');
assertEqual(calculateStreak([{date: yesterdayStr}], 0), 1, 'Streak maintained if pending today');
assertEqual(calculateStreak([{date: yesterdayStr}], 1), 2, 'Two streak if yesterday + today');
assertEqual(calculateStreak([{date: twoDaysAgoStr}, {date: yesterdayStr}], 1), 3, 'Three streak');
assertEqual(calculateStreak([{date: twoDaysAgoStr}], 1), 1, 'Streak broken yesterday, starts fresh today');
assertEqual(calculateStreak([{date: twoDaysAgoStr}], 0), 0, 'Streak broken yesterday, no session today');

print('\n--- Task Pomodoro Association ---');
let initialTasks = JSON.stringify([
    { id: 1, category: 'Coding', done: false, pomodorosSpent: 0 },
    { id: 2, category: 'General', done: false, pomodorosSpent: 1 },
    { id: 3, category: 'Coding', done: true, pomodorosSpent: 5 }
]);
let result1 = JSON.parse(associatePomodoroToTask(initialTasks, 'Coding'));
assertEqual(result1[0].pomodorosSpent, 1, 'Active coding task increments');
assertEqual(result1[1].pomodorosSpent, 1, 'General task ignores');
assertEqual(result1[2].pomodorosSpent, 5, 'Done coding task ignores');

let result2 = JSON.parse(associatePomodoroToTask(initialTasks, 'General'));
assertEqual(result2[1].pomodorosSpent, 2, 'General task increments');

print('\n--- Stats Aggregation ---');
assertEqual(aggregateTaskStats('{"General":25,"Coding":50}'), 75, 'Aggregates multiple categories');
assertEqual(aggregateTaskStats('{}'), 0, 'Aggregates empty');

print(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
if (failed > 0) throw new Error(`${failed} tests failed!`);
