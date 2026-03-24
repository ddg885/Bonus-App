import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBudgetVariance } from '../src/core/reconciliation.js';

test('budget variance compares projected and controls', () => {
  const out = calculateBudgetVariance(
    [{ category: 'Affiliation', fiscalYear: 'FY2026', initialPayoutTotal: 100, anniversaryPayoutTotal: 50 }],
    [{ budgetLineItem: 'PS', category: 'Affiliation', oe: 'E', bonusType: 'Prior', controlsByFy: { FY2026: 120 } }]
  );
  assert.equal(out[0].variance, 30);
  assert.equal(out[0].status, 'OVER');
});
