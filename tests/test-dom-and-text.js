const fs = require('fs');
const path = require('path');

let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, testName, details = '') {
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failedTests++;
    failures.push({ testName, details });
    console.error(`  ❌ FAIL: ${testName} - ${details}`);
  }
}

function assertEqual(actual, expected, testName) {
  const isMatch = JSON.stringify(actual) === JSON.stringify(expected);
  assert(isMatch, testName, `Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`);
}

const htmlPath = path.join(__dirname, '../index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

console.log('\n======================================================');
console.log(' SUITE 9: DOM Structure, Navigation & Text Elements');
console.log('======================================================');

// 1. Check all nav tabs map to screens
const navTabRegex = /data-nav=["']([^"']+)["']/g;
const navTabs = new Set();
let m;
while ((m = navTabRegex.exec(htmlContent)) !== null) {
  navTabs.add(m[1]);
}

const screenRegex = /<section[^>]*id=["']screen-([^"']+)["']/g;
const screens = new Set();
while ((m = screenRegex.exec(htmlContent)) !== null) {
  screens.add(m[1]);
}

navTabs.forEach(tab => {
  assert(screens.has(tab), `Nav tab "${tab}" has matching screen section #screen-${tab}`);
});

screens.forEach(scr => {
  assert(navTabs.has(scr), `Screen section #screen-${scr} has matching navigation tab`);
});

// 2. Check for unwanted text or placeholder artifacts in HTML
const forbiddenTokens = ['NaN', 'undefined', 'null', '[object Object]', 'Lorem ipsum', 'TODO', 'FIXME', 'asdf'];
forbiddenTokens.forEach(token => {
  const hasToken = htmlContent.includes(token);
  assert(!hasToken, `HTML has no unwanted "${token}" text`);
});

// 3. Check all modals have close buttons or data-close-modal attributes
const modalRegex = /<div class=["']modal-overlay["'][^>]*id=["']([^"']+)["']([\s\S]*?)<\/div>\s*<\/div>/g;
let modalMatch;
while ((modalMatch = modalRegex.exec(htmlContent)) !== null) {
  const modalId = modalMatch[1];
  const modalBody = modalMatch[2];
  const hasClose = modalBody.includes('data-close-modal') || modalBody.includes('btn-close') || modalBody.includes('✕') || modalBody.includes('modal-close');
  assert(hasClose, `Modal #${modalId} has a dismiss/close button`);
}

// 4. Verify Service Worker asset cache list against real files on disk
console.log('\n======================================================');
console.log(' SUITE 10: Service Worker & Asset Integrity');
console.log('======================================================');

const swContent = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
const assetListMatch = swContent.match(/const ASSETS_TO_CACHE = \[([\s\S]*?)\];/);
assert(assetListMatch !== null, 'Service worker contains ASSETS_TO_CACHE array');

if (assetListMatch) {
  const assetPaths = assetListMatch[1]
    .split(',')
    .map(s => s.trim().replace(/['"]/g, ''))
    .filter(s => s.length > 0 && s !== './');

  assetPaths.forEach(relPath => {
    const cleanPath = relPath.replace(/^\.\//, '');
    const fullPath = path.join(__dirname, '../', cleanPath);
    const exists = fs.existsSync(fullPath);
    assert(exists, `SW cached asset exists on disk: ${relPath}`);
  });
}

console.log('\n======================================================');
console.log(' TEST SUMMARY');
console.log('======================================================');
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);

if (failures.length > 0) {
  process.exit(1);
} else {
  console.log('\n🎉 ALL DOM, TEXT & ASSET TESTS PASSED!\n');
  process.exit(0);
}
