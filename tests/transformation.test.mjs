import test from 'node:test';
import assert from 'node:assert/strict';
import { transformExecutionToPayoutSchedule } from '../src/core/transformation.js';

test('transforms installment record into payout stream', () => {
  const out = transformExecutionToPayoutSchedule([{ sourceId: 's1', effectiveDate: '2024-11-01', installments: 4, installmentAmount: 20000, category: 'Affiliation', budgetLineItem: 'PS', oe: 'E', bonusType: 'Prior' }]);
  assert.equal(out.length, 4);
  assert.equal(out[0].payoutType, 'INITIAL');
  assert.equal(out[1].payoutType, 'ANNIVERSARY');
});
