import test from 'node:test';
import assert from 'node:assert/strict';
import { twoPassDistribution } from '../src/core/projection.js';

test('two-pass distribution creates explainable taker allocations', () => {
  const out = twoPassDistribution({
    aggregateRows: [{ category: 'Affiliation', takersByFy: { FY2026: 10 }, sourceRef: 'x' }],
    bonusInfoRows: [
      { id: 'b1', category: 'Affiliation', budgetLineItem: 'PS', oe: 'E', bonusType: 'A', amount: 10000, installments: 1, initialPaymentPct: 100, anniversaryPaymentPct: 0 },
      { id: 'b2', category: 'Affiliation', budgetLineItem: 'PS', oe: 'E', bonusType: 'B', amount: 20000, installments: 1, initialPaymentPct: 100, anniversaryPaymentPct: 0 }
    ],
    targetRows: [{ category: 'Affiliation', targetsByFy: { FY2026: 18000 } }],
    fiscalYears: ['FY2026']
  });
  const takers = out.projections.reduce((a, r) => a + r.takers, 0);
  assert.equal(takers, 10);
  assert.equal(out.explainability.length, 1);
});
