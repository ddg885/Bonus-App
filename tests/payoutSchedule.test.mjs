import test from 'node:test';
import assert from 'node:assert/strict';
import { twoPassDistribution } from '../src/core/projection.js';

test('projection builds multi-year payout schedule rows', () => {
  const out = twoPassDistribution({
    aggregateRows: [{ category: 'Affiliation', takersByFy: { FY2026: 2 } }],
    bonusInfoRows: [{ id: 'b1', category: 'Affiliation', budgetLineItem: 'PS', oe: 'E', bonusType: 'X', amount: 12000, installments: 3, initialPaymentPct: 50, anniversaryPaymentPct: 25 }],
    targetRows: [{ category: 'Affiliation', targetsByFy: { FY2026: 6000 } }],
    fiscalYears: ['FY2026']
  });
  assert.equal(out.payoutSchedule.length, 3);
  assert.equal(out.payoutSchedule[0].payoutType, 'INITIAL');
  assert.equal(out.payoutSchedule[1].payoutType, 'ANNIVERSARY');
});
