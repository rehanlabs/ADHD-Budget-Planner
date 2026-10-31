/**
 * ADHD Budget Planner - Comprehensive Test-Driven Hardening Suite
 * Tests financial engine, storage, data integrity, time/duration features, and UI sync.
 */

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

// Set up VM environment
let store = {};
const fakeLocalStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { store = {}; }
};

let sessionStore = {};
const fakeSessionStorage = {
  getItem: (k) => (k in sessionStore ? sessionStore[k] : null),
  setItem: (k, v) => { sessionStore[k] = String(v); },
  removeItem: (k) => { delete sessionStore[k]; },
  clear: () => { sessionStore = {}; }
};

const context = {
  console,
  Math,
  Date,
  setTimeout,
  clearTimeout,
  localStorage: fakeLocalStorage,
  sessionStorage: fakeSessionStorage,
  btoa: (s) => Buffer.from(s).toString('base64'),
  atob: (s) => Buffer.from(s, 'base64').toString('utf8'),
  encodeURIComponent,
  decodeURIComponent,
  window: {}
};
context.window = context;

vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/engine.js'), 'utf8') + '; this.FocusEngine = FocusEngine || this.FocusEngine;', context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/storage.js'), 'utf8') + '; this.FocusStorage = FocusStorage || this.FocusStorage;', context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/personas.js'), 'utf8') + '; this.FocusPersonas = FocusPersonas || this.FocusPersonas;', context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/help-content.js'), 'utf8') + '; this.FocusHelp = FocusHelp || this.FocusHelp;', context);

const Engine = context.FocusEngine;
const Storage = context.FocusStorage;
const Personas = context.FocusPersonas;

async function runAllTests() {
  console.log('\n======================================================');
  console.log(' SUITE 1: Financial Math & Currency Edge Cases');
  console.log('======================================================');

  // parseToCents
  assertEqual(Engine.parseToCents('45.99'), 4599, 'parseToCents standard decimal string');
  assertEqual(Engine.parseToCents('$1,250.50'), 125050, 'parseToCents formatted currency with commas');
  assertEqual(Engine.parseToCents('-45.00'), -4500, 'parseToCents negative value');
  assertEqual(Engine.parseToCents('-$50.25'), -5025, 'parseToCents negative with symbol');
  assertEqual(Engine.parseToCents(null), 0, 'parseToCents handles null');
  assertEqual(Engine.parseToCents(undefined), 0, 'parseToCents handles undefined');
  assertEqual(Engine.parseToCents(''), 0, 'parseToCents handles empty string');
  assertEqual(Engine.parseToCents('abc'), 0, 'parseToCents handles non-numeric string');
  assertEqual(Engine.parseToCents(100), 10000, 'parseToCents numeric 100');
  assertEqual(Engine.parseToCents(0.01), 1, 'parseToCents single cent float');

  // formatCents
  assertEqual(Engine.formatCents(125050, 'USD'), '$1,250.50', 'formatCents USD positive');
  assertEqual(Engine.formatCents(-5025, 'USD'), '-$50.25', 'formatCents USD negative');
  assertEqual(Engine.formatCents(0, 'USD'), '$0.00', 'formatCents USD zero');
  assertEqual(Engine.formatCents(500000, 'JPY'), '¥5,000', 'formatCents JPY zero decimals');
  assertEqual(Engine.formatCents(1050, 'EUR'), '€10.50', 'formatCents EUR symbol');
  assertEqual(Engine.formatCents(1050, 'GBP'), '£10.50', 'formatCents GBP symbol');

  // Date utilities
  assertEqual(Engine.toISODate(new Date('2026-10-24T12:00:00Z')), '2026-10-24', 'toISODate standard date');
  assertEqual(Engine.addDays('2026-10-24', 5), '2026-10-29', 'addDays positive');
  assertEqual(Engine.addDays('2026-10-24', -4), '2026-10-20', 'addDays negative');
  assertEqual(Engine.diffDays('2026-10-20', '2026-10-24'), 4, 'diffDays standard 4 days');
  assertEqual(Engine.diffDays('2026-10-24', '2026-10-24'), 0, 'diffDays same day 0');

  // Leap year edge case
  assertEqual(Engine.addDays('2028-02-28', 1), '2028-02-29', 'addDays leap year Feb 28 -> Feb 29');
  assertEqual(Engine.addDays('2028-02-29', 1), '2028-03-01', 'addDays leap year Feb 29 -> Mar 1');

  // Weekend adjustment
  // 2026-10-24 is Saturday -> should shift to Friday 2026-10-23
  assertEqual(Engine.adjustWeekendEarly('2026-10-24'), '2026-10-23', 'adjustWeekendEarly Saturday moves to Friday');
  // 2026-10-25 is Sunday -> should shift to Friday 2026-10-23
  assertEqual(Engine.adjustWeekendEarly('2026-10-25'), '2026-10-23', 'adjustWeekendEarly Sunday moves to Friday');
  // 2026-10-26 is Monday -> remains Monday 2026-10-26
  assertEqual(Engine.adjustWeekendEarly('2026-10-26'), '2026-10-26', 'adjustWeekendEarly Monday remains unchanged');

  console.log('\n======================================================');
  console.log(' SUITE 2: Payday Projections & Bill Occurrence Engine');
  console.log('======================================================');

  const testState = {
    profile: { currency: 'USD' },
    accounts: [{ id: 'acct-main', balanceCents: 150000, balanceAsOf: '2026-10-24' }],
    income: [
      { id: 'inc-1', label: 'Bi-weekly Pay', cycle: 'biweekly', anchor: '2026-10-16', amountCents: 200000, weekendEarly: true }
    ],
    bills: [
      { id: 'b-rent', name: 'Apartment Rent', amountCents: 90000, dueDay: 1, recurrence: 'monthly', isPaid: false }
    ],
    debts: [],
    savings: [],
    transactions: []
  };

  const nextPay = Engine.getNextPayday(testState, '2026-10-24');
  // Anchor 2026-10-16 + 14 days = 2026-10-30
  assertEqual(nextPay.date, '2026-10-30', 'getNextPayday projects biweekly cycle accurately');

  // Test empty income fallback (defaults to 14 days)
  const emptyIncomeState = { ...testState, income: [] };
  const fallbackPay = Engine.getNextPayday(emptyIncomeState, '2026-10-24');
  assertEqual(fallbackPay.date, '2026-11-07', 'getNextPayday falls back to 14 days when no income is configured');

  // Semi-monthly payday projection
  const semiMonthlyState = {
    ...testState,
    income: [{ id: 'inc-semi', label: 'Semi-monthly', cycle: 'semimonthly', anchor: '2026-10-15', amountCents: 200000, weekendEarly: true }]
  };
  const semiPay1 = Engine.getNextPayday(semiMonthlyState, '2026-10-16');
  assertEqual(semiPay1.date, '2026-10-30', 'semimonthly projects end of month (adjusted for weekend if early)');

  // User scenario: Setting Next Payday to 25 Nov when today is in October (2026-10-24)
  const userScenarioMonthly = {
    ...testState,
    income: [{ id: 'inc-user-m', label: 'Monthly Pay', cycle: 'monthly', anchor: '2026-11-25', amountCents: 200000, weekendEarly: true }]
  };
  const userPayMonthly = Engine.getNextPayday(userScenarioMonthly, '2026-10-24');
  assertEqual(userPayMonthly.date, '2026-11-25', 'monthly with future anchor Nov 25 projects Nov 25 (NOT Oct 30)');

  const userScenarioBiweekly = {
    ...testState,
    income: [{ id: 'inc-user-bw', label: 'Biweekly Pay', cycle: 'biweekly', anchor: '2026-11-25', amountCents: 200000, weekendEarly: true }]
  };
  const userPayBiweekly = Engine.getNextPayday(userScenarioBiweekly, '2026-10-24');
  assertEqual(userPayBiweekly.date, '2026-11-25', 'biweekly with future anchor Nov 25 projects Nov 25 (NOT Oct 28)');

  const userScenarioSemi = {
    ...testState,
    income: [{ id: 'inc-user-sm', label: 'Semimonthly Pay', cycle: 'semimonthly', anchor: '2026-11-25', amountCents: 200000, weekendEarly: true }]
  };
  const userPaySemi = Engine.getNextPayday(userScenarioSemi, '2026-10-24');
  assertEqual(userPaySemi.date, '2026-11-25', 'semimonthly with future anchor Nov 25 projects Nov 25 (NOT Oct 30)');

  console.log('\n======================================================');
  console.log(' SUITE 3: Safe-to-Spend Runway & Cashflow Math');
  console.log('======================================================');

  // Runway from 2026-10-24 to 2026-10-30 (6 days left: 24, 25, 26, 27, 28, 29)
  // Checking: $1,500. Rent due Nov 1 (outside runway) -> Unpaid bills in runway = $0.
  // Spendable pool = $1,500.
  // Base daily safe = $1,500 / 6 = $250.00 / day.
  const calc1 = Engine.calculateSafeToSpend(testState, '2026-10-24');
  assertEqual(calc1.daysLeft, 6, 'calculateSafeToSpend computes correct days left');
  assertEqual(calc1.spendablePoolCents, 150000, 'spendablePool equals checking when no bills due in runway');
  assertEqual(calc1.dailySafeCents, 25000, 'dailySafe equals spendablePool / daysLeft');
  assertEqual(calc1.leftTodayCents, 25000, 'leftToday equals dailySafe when zero spend today');

  // When a bill falls INSIDE runway
  const stateWithBillInRunway = {
    ...testState,
    bills: [
      { id: 'b-util', name: 'Electric', amountCents: 12000, dueDay: 26, recurrence: 'monthly', isPaid: false }
    ]
  };
  const calc2 = Engine.calculateSafeToSpend(stateWithBillInRunway, '2026-10-24');
  assertEqual(calc2.unpaidBillsCents, 12000, 'unpaid bills within runway correctly totaled');
  // Spendable pool: 150,000 - 12,000 = 138,000
  // Daily safe: Math.floor(138,000 / 6) = 23,000 ($230.00)
  assertEqual(calc2.dailySafeCents, 23000, 'daily safe deducts bill before payday');

  // When bill in runway is marked PAID
  const stateWithPaidBill = {
    ...testState,
    bills: [
      { id: 'b-util', name: 'Electric', amountCents: 12000, dueDay: 26, recurrence: 'monthly', isPaid: true }
    ]
  };
  const calcPaid = Engine.calculateSafeToSpend(stateWithPaidBill, '2026-10-24');
  assertEqual(calcPaid.unpaidBillsCents, 0, 'paid bill is NOT deducted from spendable pool');
  assertEqual(calcPaid.dailySafeCents, 25000, 'daily safe restored when bill is paid');

  // Non-punitive overspending test
  const stateWithSpend = {
    ...testState,
    transactions: [
      { id: 'tx-1', date: '2026-10-24', amountCents: 30000, kind: 'spend' } // Spent $300 (daily allowance was $250)
    ]
  };
  const calcOver = Engine.calculateSafeToSpend(stateWithSpend, '2026-10-24');
  assert(calcOver.isOverToday === true, 'detects user exceeded today starting daily safe');
  assertEqual(calcOver.todayOverCents, 5000, 'calculates exact overspent cents');
  assertEqual(calcOver.leftTodayCents, 0, 'leftToday floors at 0 and NEVER goes negative');

  console.log('\n======================================================');
  console.log(' SUITE 4: Debt Payoff Engine (Snowball vs Avalanche)');
  console.log('======================================================');

  const debtsSample = [
    { id: 'd-1', name: 'Store Card', balanceCents: 80000, aprBp: 2499, minPaymentCents: 3500 }, // $800, 24.99%
    { id: 'd-2', name: 'Visa Gold', balanceCents: 250000, aprBp: 1650, minPaymentCents: 6500 }   // $2,500, 16.5%
  ];

  const snowballSim = Engine.simulateDebtPayoff(debtsSample, 5000, 'snowball');
  assert(snowballSim !== null && snowballSim.months > 0, 'snowball simulation produces valid payoff estimate');
  assert(typeof snowballSim.debtFreeDate === 'string' && snowballSim.debtFreeDate.length === 10, 'snowball returns ISO debt free date');

  const avalancheSim = Engine.simulateDebtPayoff(debtsSample, 5000, 'avalanche');
  assert(avalancheSim !== null && avalancheSim.months > 0, 'avalanche simulation produces valid payoff estimate');
  assert(avalancheSim.totalInterestCents <= snowballSim.totalInterestCents, 'avalanche interest paid is <= snowball interest paid');

  // Negative Amortization / Underwater Edge Case:
  // Debt of $50,000 with min payment of $10 and 29% APR (monthly interest is ~$120 > $10).
  // With $0 extra, balance grows every month.
  const underwaterDebts = [
    { id: 'd-bad', name: 'Predatory Loan', balanceCents: 5000000, aprBp: 2900, minPaymentCents: 1000 }
  ];
  const underwaterSim = Engine.simulateDebtPayoff(underwaterDebts, 0, 'avalanche');
  assert(underwaterSim !== null, 'underwater simulation returns object without crashing');
  assert(underwaterSim.months === 360, 'underwater simulation terminates safely at 360-month safety ceiling');

  console.log('\n======================================================');
  console.log(' SUITE 5: Storage, Backup & Migration Suite');
  console.log('======================================================');

  const defaultState = Storage.createDefaultState();
  assert(defaultState.schema === 1, 'default state schema version is 1');
  assert(Array.isArray(defaultState.accounts), 'accounts array initialized');
  assert(Array.isArray(defaultState.bills), 'bills array initialized');
  assert(Array.isArray(defaultState.debts), 'debts array initialized');
  assert(Array.isArray(defaultState.impulseVault), 'impulseVault array initialized');
  assert(Array.isArray(defaultState.quickSpends) && defaultState.quickSpends.length === 3, 'quickSpends initialized with 3 default routine slots');

  // Migration test: state with missing fields should be hydrated
  const legacyState = {
    schema: 0,
    profile: { currency: 'EUR' },
    accounts: [{ id: 'acct-main', balanceCents: 50000 }]
  };
  const migrated = Storage.migrateState(legacyState);
  assertEqual(migrated.schema, 1, 'migrates schema to current version (1)');
  assert(Array.isArray(migrated.bills), 'hydrates missing bills array');
  assert(Array.isArray(migrated.debts), 'hydrates missing debts array');
  assert(Array.isArray(migrated.impulseVault), 'hydrates missing impulseVault array');
  assert(Array.isArray(migrated.quickSpends) && migrated.quickSpends.length === 3, 'hydrates missing quickSpends array');
  assertEqual(migrated.profile.currency, 'EUR', 'preserves user existing profile currency');

  // Preserves custom user pinned quick spends
  const userCustomState = {
    ...legacyState,
    quickSpends: [
      { id: 'qs-1', label: 'Matcha', amountCents: 650, icon: '🍵', category: 'Drink' },
      { id: 'qs-2', label: 'Gasoline', amountCents: 4000, icon: '🚗', category: 'Auto' }
    ]
  };
  const migratedCustom = Storage.migrateState(userCustomState);
  assertEqual(migratedCustom.quickSpends.length, 2, 'preserves custom pinned quick spends');
  assertEqual(migratedCustom.quickSpends[0].label, 'Matcha', 'preserves custom pinned quick spend label');

  // Demo personas persistence test
  for (const fn of ['createDebtCrusher', 'createFreelancer', 'createStudent']) {
    const p = Personas[fn]();
    await Storage.saveState(p);
    const loaded = await Storage.loadState();
    assertEqual(loaded.profile.name, p.profile.name, `${fn} loads with matching profile name`);
    assert(loaded.accounts[0].balanceCents > 0, `${fn} preserves account balance`);
    assert(loaded.bills.length > 0, `${fn} preserves demo bills`);
  }

  // Device Transfer Payload (Base64 URL-safe roundtrip with UTF-8 / emojis)
  const emojiState = Personas.createDebtCrusher();
  emojiState.profile.name = '🌿 Morgan & Café ☕';
  emojiState.brainDump = [{ id: 'bd-1', text: 'Buy dog food 🐕 & groceries 🛒', done: false }];
  
  const payload = Storage.generateTransferPayload(emojiState);
  assert(typeof payload === 'string' && payload.length > 0, 'generates non-empty transfer string');
  
  const restoredFromTransfer = Storage.importTransferPayload(payload);
  assertEqual(restoredFromTransfer.profile.name, '🌿 Morgan & Café ☕', 'transfer payload preserves unicode emojis in profile');
  assertEqual(restoredFromTransfer.brainDump[0].text, 'Buy dog food 🐕 & groceries 🛒', 'transfer payload preserves unicode emojis in notes');

  // Corrupted / Malformed Backup Import Handling
  let importErrorCaught = false;
  try {
    Storage.importJSONBackup('INVALID_JSON_CORRUPT_DATA{{{');
  } catch (err) {
    importErrorCaught = true;
  }
  assert(importErrorCaught === true, 'importJSONBackup throws clean error on corrupt JSON string');

  console.log('\n======================================================');
  console.log(' SUITE 6: Daily Quests & Help Content');
  console.log('======================================================');

  const quests = Engine.generateDailyQuests(testState, '2026-10-24');
  assert(Array.isArray(quests) && quests.length >= 2, 'generateDailyQuests generates daily actionable quests');

  const helpTopics = Object.keys(context.FocusHelp || {});
  assert(helpTopics.length >= 8, 'help content contains full suite of ADHD financial topics');

  console.log('\n======================================================');
  console.log(' TEST SUMMARY');
  console.log('======================================================');
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);

  if (failures.length > 0) {
    console.log('\nFailed Tests:');
    failures.forEach(f => console.log(` - ${f.testName}: ${f.details}`));
    process.exit(1);
  } else {
    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  }
}

runAllTests().catch(err => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
