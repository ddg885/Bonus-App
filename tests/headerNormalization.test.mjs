import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRowHeaders } from '../src/utils/headerNormalization.js';

test('normalizes common headers', () => {
  const row = normalizeRowHeaders({ 'Budget Line Item': 'PS', 'Bonus Type': 'X', 'Initial Payment %': '50' });
  assert.equal(row.budgetLineItem, 'PS');
  assert.equal(row.bonusType, 'X');
  assert.equal(row.initialPaymentPct, '50');
});

test('normalizes bonus execution upload headers', () => {
  const row = normalizeRowHeaders({
    DODID: '1234567890',
    'Mbr Reserve Bonus Subm Effective Date': '2025-10-15',
    'Mbr Reserve Bonus Amount': '12000',
    'Approval Status': 'APPROVED'
  });
  assert.equal(row.dodid, '1234567890');
  assert.equal(row.effectiveDate, '2025-10-15');
  assert.equal(row.installmentAmount, '12000');
  assert.equal(row.status, 'APPROVED');
});
