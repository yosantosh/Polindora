#!/usr/bin/env node

const fs = require('fs');
const { exec } = require('child_process');

console.log("=== POMODORO UI TEST SCRIPT ===");

// 1. Verify files exist
const cssFile = 'stylesheet.css';
const htmlFile = 'preview.html';

if (!fs.existsSync(cssFile) || !fs.existsSync(htmlFile)) {
    console.error(`[ERROR] Missing required files: ${cssFile} or ${htmlFile}`);
    process.exit(1);
}

const css = fs.readFileSync(cssFile, 'utf8');

// 2. Linting checks for common CSS issues
let issues = 0;

console.log("\n--- Running CSS Validation Checks ---");

// Check for missing units on non-zero values (basic check)
const missingUnitRegex = /:\s*[1-9][0-9]*\s*(?:;|})/g;
let match;
while ((match = missingUnitRegex.exec(css)) !== null) {
    // Exclude properties that accept unitless values
    const lineStr = css.substring(Math.max(0, match.index - 30), match.index + 10);
    if (!lineStr.includes('font-weight') && !lineStr.includes('opacity') && !lineStr.includes('flex') && !lineStr.includes('z-index')) {
        console.warn(`[WARN] Possible missing unit near: "${lineStr.trim()}"`);
        issues++;
    }
}

// Check for unclosed brackets
const openBrackets = (css.match(/\{/g) || []).length;
const closeBrackets = (css.match(/\}/g) || []).length;
if (openBrackets !== closeBrackets) {
    console.error(`[ERROR] Mismatched brackets: ${openBrackets} open, ${closeBrackets} closed.`);
    issues++;
}

// Check for valid RGBA formatting (St compatibility sometimes fails on missing spaces or alpha > 1)
const rgbaRegex = /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([^\)]+)\)/g;
while ((match = rgbaRegex.exec(css)) !== null) {
    const alpha = parseFloat(match[1]);
    if (isNaN(alpha) || alpha < 0 || alpha > 1) {
        console.error(`[ERROR] Invalid alpha value in rgba: ${match[0]}`);
        issues++;
    }
}

// 3. Output results
if (issues === 0) {
    console.log("[PASS] No syntax or format issues found in stylesheet.css.");
} else {
    console.log(`\n[FAIL] Found ${issues} potential issue(s). Please review the warnings above.`);
}

console.log("\n--- Launching Visual Preview ---");
console.log("Opening preview.html in your default web browser for visual inspection...");

// Launch browser depending on OS (Linux uses xdg-open)
exec(`xdg-open ${htmlFile}`, (error) => {
    if (error) {
        console.error(`Failed to automatically open browser. Please open ${htmlFile} manually.`);
    } else {
        console.log("Preview launched successfully.");
    }
});
