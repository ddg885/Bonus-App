import test from 'node:test';
import assert from 'node:assert/strict';
import { overviewPage } from '../src/pages/overview.js';

test('overview page renders cards', () => {
  const html = overviewPage({ transformed: [], projections: [], variances: [] });
  assert.match(html, /Overview/);
  assert.match(html, /card/);
});
