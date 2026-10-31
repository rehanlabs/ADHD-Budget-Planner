const fs = require('fs');
const path = require('path');
const vm = require('vm');

const context = { console, Math, Date, setTimeout, clearTimeout };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/engine.js'), 'utf8') + '; this.FocusEngine = FocusEngine || this.FocusEngine;', context);

const Engine = context.FocusEngine;

console.log('--- SCENARIO 1: Double-counting on same-day balance update ---');
let state = {
  accounts: [{ id: 'acct-main', balanceCents: 100000, balanceAsOf: '2026-10-24' }],
  transactions: [],
  income: [{ id: 'inc-1', cycle: 'biweekly', anchor: '2026-11-01', amountCents: 200000 }],
  bills: [],
  profile: { currency: 'USD' }
};

let safe1 = Engine.calculateSafeToSpend(state, '2026-10-24');
console.log('Day 1 Initial Spendable:', Engine.formatCents(safe1.spendablePoolCents));

// User spends 50 dollars on Day 1
state.transactions.push({ id: 'tx-1', timestamp: 1700000000000 + 1000 * 60 * 30, date: '2026-10-24', amountCents: 5000, kind: 'spend' });
let safe2 = Engine.calculateSafeToSpend(state, '2026-10-24');
console.log('After spend 50 dollars:', Engine.formatCents(safe2.spendablePoolCents));

// Now user logs into bank, sees balance is 950 dollars, and updates checking balance in Settings to 950!
state.accounts[0].balanceCents = 95000;
state.accounts[0].balanceAsOf = '2026-10-24'; // Same day update!
state.accounts[0].balanceUpdatedAt = 1700000000000 + 1000 * 60 * 60; // 1 hr later than tx-1

let safe3 = Engine.calculateSafeToSpend(state, '2026-10-24');
console.log('After updating balance in settings to 950 dollars:', Engine.formatCents(safe3.spendablePoolCents));

console.log('\n--- SCENARIO 2: Hero number live update with daily spend ---');
let stateHero = {
  accounts: [{ id: 'acct-main', balanceCents: 3500000, balanceAsOf: '2026-10-31' }],
  transactions: [],
  income: [{ id: 'inc-1', cycle: 'monthly', anchor: '2026-11-25', amountCents: 500000 }],
  bills: [],
  profile: { currency: 'USD' }
};
let heroSafe1 = Engine.calculateSafeToSpend(stateHero, '2026-10-31');
console.log('Morning Initial Available Today:', Engine.formatCents(heroSafe1.leftTodayCents));

// User spends $62.75 today
stateHero.transactions.push({ id: 'tx-1', date: '2026-10-31', amountCents: 6275, kind: 'spend' });
let heroSafe2 = Engine.calculateSafeToSpend(stateHero, '2026-10-31');
console.log('After $62.75 spend Available Today (Hero Number):', Engine.formatCents(heroSafe2.leftTodayCents));
console.log('Starting Daily Budget for reference:', Engine.formatCents(heroSafe2.dailySafeCents));
