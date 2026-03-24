import test from 'node:test';
import assert from 'node:assert/strict';
import { twoPassDistribution } from '../src/core/projection.js';

test('projection pass2 moves average toward target', () => {
  const out = twoPassDistribution({
    aggregateRows: [{ category: 'Retention', takersByFy: { FY2027: 9 } }],
    bonusInfoRows: [
      { id: 'low', category: 'Retention', budgetLineItem: 'R1', oe: 'E', bonusType: 'L', amount: 10000, installments: 1, initialPaymentPct: 100, anniversaryPaymentPct: 0 },
      { id: 'high', category: 'Retention', budgetLineItem: 'R2', oe: 'E', bonusType: 'H', amount: 30000, installments: 1, initialPaymentPct: 100, anniversaryPaymentPct: 0 }
    ],
    targetRows: [{ category: 'Retention', targetsByFy: { FY2027: 28000 } }],
    fiscalYears: ['FY2027']
  });
  assert.ok(out.explainability[0].pass2AvgInitial >= out.explainability[0].pass1AvgInitial);
});
