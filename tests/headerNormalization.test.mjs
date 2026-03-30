import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRowHeaders } from '../src/utils/headerNormalization.js';

test('normalizes common headers', () => {
  const row = normalizeRowHeaders({ 'Budget Line Item': 'PS', 'Bonus Type': 'X', 'Initial Payment %': '50' });
  assert.equal(row.budgetLineItem, 'PS');
  assert.equal(row.bonusType, 'X');
  assert.equal(row.initialPaymentPct, '50');
});

test('normalizes bonus authorized execution headers', () => {
  const row = normalizeRowHeaders({
    DODID: '123',
    'Mbr Reserve Bonus Subm Effective Date': '2025-10-01',
    'Mbr Reserve Bonus Subm Install Amount': '2500',
    'Mbr Reserve Bonus Subm Install Effdt': '2025-10-01',
    'Mbr Reserve Bonus Subm Track Num Actual': 'TRK-1',
    'Mbr Reserve Bonus Subm Type Code': 'A1',
    'Mbr Reserve Bonus Subm Category': 'AFF'
  });
  assert.equal(row.dodid, '123');
  assert.equal(row.effectiveDate, '2025-10-01');
  assert.equal(row.installmentAmount, '2500');
  assert.equal(row.installmentDate, '2025-10-01');
  assert.equal(row.trackNumber, 'TRK-1');
  assert.equal(row.typeCode, 'A1');
  assert.equal(row.category, 'AFF');
});
