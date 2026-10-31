const fs = require('fs');
const path = require('path');
const vm = require('vm');

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

const context = {
  console,
  Math,
  Date,
  setTimeout,
  clearTimeout,
  btoa: (s) => Buffer.from(s).toString('base64'),
  atob: (s) => Buffer.from(s, 'base64').toString('utf8'),
  encodeURIComponent,
  decodeURIComponent
};

vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/engine.js'), 'utf8') + '; this.FocusEngine = FocusEngine || this.FocusEngine;', context);

const Engine = context.FocusEngine;

console.log('\n======================================================');
console.log(' SUITE 7: Same-Day Balance Update & No Double Counting');
console.log('======================================================');

const T0 = 1700000000000;
const T1 = T0 + 1000 * 60 * 30; // 30 min later
const T2 = T0 + 1000 * 60 * 60; // 1 hour later
const T3 = T0 + 1000 * 60 * 90; // 1.5 hours later

// User starts with $1,000
const accountState = {
  profile: { currency: 'USD' },
  accounts: [{ id: 'acct-main', balanceCents: 100000, balanceAsOf: '2026-10-24', balanceUpdatedAt: T0 }],
  income: [{ id: 'inc-1', cycle: 'biweekly', anchor: '2026-10-30', amountCents: 200000 }],
  bills: [],
  transactions: []
};

let res0 = Engine.calculateSafeToSpend(accountState, '2026-10-24');
assertEqual(res0.spendablePoolCents, 100000, 'initial spendable pool is $1,000');

// User logs $50 spend at T1
accountState.transactions.push({
  id: 'tx-' + T1,
  timestamp: T1,
  date: '2026-10-24',
  amountCents: 5000,
  kind: 'spend'
});

let res1 = Engine.calculateSafeToSpend(accountState, '2026-10-24');
assertEqual(res1.spendablePoolCents, 95000, 'after $50 spend, spendable pool is $950');

// User updates checking balance in Settings at T2 to $950 (reflecting bank balance)
accountState.accounts[0].balanceCents = 95000;
accountState.accounts[0].balanceAsOf = '2026-10-24';
accountState.accounts[0].balanceUpdatedAt = T2;

let res2 = Engine.calculateSafeToSpend(accountState, '2026-10-24');
assertEqual(res2.spendablePoolCents, 95000, 'after updating bank balance to $950, spendable pool remains $950 (NO double deduction)');

// Later at T3, user spends another $20
accountState.transactions.push({
  id: 'tx-' + T3,
  timestamp: T3,
  date: '2026-10-24',
  amountCents: 2000,
  kind: 'spend'
});

let res3 = Engine.calculateSafeToSpend(accountState, '2026-10-24');
assertEqual(res3.spendablePoolCents, 93000, 'new spend after balance update correctly deducts to $930');

console.log('\n======================================================');
console.log(' SUITE 8: Impulse Vault 48-Hour Timer & Cooldown Math');
console.log('======================================================');

const baseTime = 1700000000000;

// Item 1: Parked right now (0 hours elapsed)
const itemNow = {
  id: 'imp-now',
  title: 'Smart Watch',
  priceCents: 25000,
  createdAt: baseTime,
  dateAdded: '2026-10-24',
  hoursTimer: 48,
  status: 'cooling'
};

const statusNow = Engine.getImpulseStatus(itemNow, baseTime);
assertEqual(statusNow.isReady, false, 'item created now is not ready');
assertEqual(statusNow.remainingHours, 48, 'item created now has 48h remaining');
assertEqual(statusNow.status, 'cooling', 'item created now has status cooling');

// Item 2: Parked 36 hours ago (12 hours remaining)
const item36h = {
  id: 'imp-36h',
  title: 'Espresso Machine',
  priceCents: 40000,
  createdAt: baseTime - (36 * 60 * 60 * 1000),
  dateAdded: '2026-10-22',
  hoursTimer: 48,
  status: 'cooling'
};

const status36h = Engine.getImpulseStatus(item36h, baseTime);
assertEqual(status36h.isReady, false, 'item parked 36h ago is still cooling');
assertEqual(status36h.remainingHours, 12, 'item parked 36h ago has 12h remaining');

// Item 3: Parked 48.5 hours ago (Cooldown complete!)
const item49h = {
  id: 'imp-49h',
  title: 'Wireless Keyboard',
  priceCents: 9900,
  createdAt: baseTime - (48.5 * 60 * 60 * 1000),
  dateAdded: '2026-10-22',
  hoursTimer: 48,
  status: 'cooling'
};

const status49h = Engine.getImpulseStatus(item49h, baseTime);
assertEqual(status49h.isReady, true, 'item parked >48h ago is ready for decision');
assertEqual(status49h.remainingHours, 0, 'item parked >48h ago has 0h remaining');
assertEqual(status49h.status, 'unlocked', 'item status transitions to unlocked');

// Item 4: Explicit unlocked status from persona
const itemUnlocked = {
  id: 'imp-unlocked',
  title: 'Desk Chair',
  priceCents: 35000,
  dateAdded: '2026-10-22',
  status: 'unlocked'
};

const statusUnlocked = Engine.getImpulseStatus(itemUnlocked, baseTime);
assertEqual(statusUnlocked.isReady, true, 'explicit unlocked status is ready');
assertEqual(statusUnlocked.remainingHours, 0, 'explicit unlocked status has 0h remaining');

console.log('\n======================================================');
console.log(' TEST SUMMARY');
console.log('======================================================');
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);

if (failures.length > 0) {
  process.exit(1);
} else {
  console.log('\n🎉 ALL TIME & SYNC TESTS PASSED!\n');
  process.exit(0);
}
