const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';
const { MonthlySummaryService } = require('../dist/services/monthlySummary.service');
const { TransactionService } = require('../dist/services/transaction.service');

test('cross-month partial refunds reduce spending and preserve income and category rollups', async () => {
  const transactions = [
    { date: '2026-08-10', monthYear: '2026-08', type: 'expense', amount: 200, categoryId: 'clothes' },
    { date: '2026-09-05', monthYear: '2026-09', type: 'expense_refund', amount: 80, categoryId: 'clothes' },
    { date: '2026-09-01', monthYear: '2026-09', type: 'income', amount: 1000 },
  ];
  const service = new MonthlySummaryService(
    { listByYear: async () => transactions }, {},
    { listByYear: async () => [{ monthYear: '2026-09', startingBalance: 500, endingBalance: null }] },
    { listByUser: async () => [{ id: 'clothes', path: [{ id: 'shopping', name: 'Shopping' }, { id: 'clothes', name: 'Clothes' }] }] },
  );
  const result = await service.getYear('user', 2026);
  assert.equal(result.months[7].expenses, 200);
  assert.equal(result.months[8].expenses, -80);
  assert.equal(result.months[8].income, 1000);
  assert.equal(result.months[8].endingBalance, 1580);
  assert.deepEqual(result.totals, { income: 1000, expenses: 120, net: 880 });
  assert.equal(result.categorySpend.find(row => row.categoryId === 'clothes').amount, 120);
  assert.equal(result.categorySpend.find(row => row.categoryId === 'shopping').amount, 120);
});

test('refund imports reuse expense categories and skip duplicate refunds', async () => {
  const created = [];
  const service = new TransactionService({
    listByMonths: async () => [],
    create: async (userId, data) => { created.push(data); return data; },
  }, {
    listByUser: async () => [{ id: 'clothes', type: 'expense', parentId: null, name: 'Clothes' }],
    create: async () => { throw new Error('Should reuse the expense category'); },
  });
  const row = { date: '2026-09-05', description: 'Return', amount: 80, type: 'expense_refund', categoryName: 'Clothes' };
  const result = await service.importRows('user', [row, row]);
  assert.equal(created[0].categoryId, 'clothes');
  assert.equal(created[0].type, 'expense_refund');
  assert.equal(result.skippedDuplicates, 1);
});

test('refunds reject income categories, including type-only updates', async () => {
  const service = new TransactionService({
    findById: async () => ({ type: 'income', categoryId: 'salary' }),
  }, { findById: async () => ({ type: 'income' }) });
  await assert.rejects(service.create('user', { categoryId: 'salary', type: 'expense_refund' }), /types do not match/);
  await assert.rejects(service.update('user', 'txn', { type: 'expense_refund' }), /types do not match/);
});

test('custom date ranges aggregate income, net expenses, months, and calendar-day average', async () => {
  const transactions = [
    { date: '2026-04-01', monthYear: '2026-04', type: 'expense', amount: 120, categoryId: 'home' },
    { date: '2026-04-03', monthYear: '2026-04', type: 'expense_refund', amount: 20, categoryId: 'home' },
    { date: '2026-05-01', monthYear: '2026-05', type: 'income', amount: 500 },
  ];
  const service = new MonthlySummaryService(
    { listByDateRange: async () => transactions },
    {},
    {},
    { listByUser: async () => [{ id: 'home', path: [{ id: 'home', name: 'Home' }] }] },
  );

  const result = await service.getRange('user', '2026-04-01', '2026-05-01');
  assert.equal(result.days, 31);
  assert.equal(result.totals.income, 500);
  assert.equal(result.totals.expenses, 100);
  assert.equal(result.totals.net, 400);
  assert.equal(result.totals.averageDailySpend, 100 / 31);
  assert.deepEqual(result.months.map(month => [month.monthYear, month.expenses, month.income]), [
    ['2026-04', 100, 0],
    ['2026-05', 0, 500],
  ]);
  assert.equal(result.categorySpend.find(row => row.categoryId === 'home').amount, 100);
});

test('Sheets imports convert negative amounts and explicit refunds to positive refund records', () => {
  const ts = require('typescript');
  const fs = require('node:fs');
  const path = require('node:path');
  const Module = require('node:module');
  const filename = path.resolve(__dirname, '../../frontend/src/features/import/importTransactions.ts');
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = new Module(filename);
  module._compile(compiled, filename);
  const rows = module.exports.parseImportRows(
    'Date\tDescription\tAmount\tCategory\tType\n2026-09-05\tReturn\t-$80.00\tClothes\texpense\n2026-09-06\tReturn\t($20.00)\tClothes\texpense\n2026-09-07\tReturn\t10\tClothes\texpense_refund',
    'expense', '2026-09',
  );
  assert.deepEqual(rows.map(row => [row.type, row.amount]), [
    ['expense_refund', 80], ['expense_refund', 20], ['expense_refund', 10],
  ]);
});
