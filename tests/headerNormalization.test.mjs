import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRowHeaders } from '../src/utils/headerNormalization.js';

test('normalizes common headers', () => {
  const row = normalizeRowHeaders({ 'Budget Line Item': 'PS', 'Bonus Type': 'X', 'Initial Payment %': '50' });
  assert.equal(row.budgetLineItem, 'PS');
  assert.equal(row.bonusType, 'X');
  assert.equal(row.initialPaymentPct, '50');
});
