import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFiscalYear } from '../src/utils/fiscalYear.js';

test('federal fiscal year starts Oct 1', () => {
  assert.equal(calculateFiscalYear('2025-09-30'), 'FY2025');
  assert.equal(calculateFiscalYear('2025-10-01'), 'FY2026');
});
