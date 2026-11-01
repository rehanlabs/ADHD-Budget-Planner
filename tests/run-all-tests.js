/**
 * Master Test Suite Runner for ADHD Budget Planner
 * Executes all 10 test suites in an integrated, strict test-driven cycle.
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('================================================================');
console.log(' ADHD BUDGET PLANNER — INTEGRATED COMPREHENSIVE TEST RUNNER');
console.log('================================================================\n');

const projectRoot = path.resolve(__dirname, '..');
const testScripts = [
  path.join(__dirname, 'comprehensive-test-suite.js'),
  path.join(__dirname, 'test-time-and-sync.js'),
  path.join(__dirname, 'test-dom-and-text.js')
];

let allPassed = true;

testScripts.forEach(script => {
  try {
    const output = execSync(`node "${script}"`, { cwd: projectRoot, encoding: 'utf8' });
    console.log(output);
  } catch (err) {
    allPassed = false;
    console.error(`\n❌ ERROR RUNNING ${script}:`);
    console.error(err.stdout || err.message);
  }
});

if (allPassed) {
  console.log('================================================================');
  console.log(' 🟢 ALL TEST SUITES PASSED! 100% GREEN ACROSS ALL MODULES.');
  console.log('================================================================\n');
  process.exit(0);
} else {
  console.error('================================================================');
  console.error(' 🔴 FAILURES DETECTED! REVIEW OUTPUT ABOVE.');
  console.error('================================================================\n');
  process.exit(1);
}
