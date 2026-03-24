import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCrosswalk } from '../src/core/crosswalk.js';

test('crosswalk maps known type code', () => {
  const rows = [{ sourceId: '1', rawTypeCode: 'EAB' }];
  const mapped = applyCrosswalk(rows, [{ id: 'a', matchField: 'rawTypeCode', matchValue: 'EAB', category: 'Affiliation', budgetLineItem: 'PS', oe: 'E', bonusType: 'Prior', priority: 1 }]);
  assert.equal(mapped[0].category, 'Affiliation');
});
