import { metricCards } from '../components/cards.js';

export function overviewPage(state) {
  const totalExecution = state.transformed.reduce((a, r) => a + r.amount, 0);
  const totalProjected = state.projections.reduce((a, r) => a + r.initialPayoutTotal + r.anniversaryPayoutTotal, 0);
  const overCount = state.variances.filter((v) => v.status === 'OVER').length;
  return `
    <div class="page-header"><div><h2>Overview</h2><p>Integrated view across execution, transformation, POM planning, and budget reconciliation.</p></div></div>
    ${metricCards([
      { label: 'Transformed Execution Amount', value: totalExecution, currency: true },
      { label: 'Projected Payout Amount', value: totalProjected, currency: true },
      { label: 'Over-Control Conditions', value: overCount }
    ])}
  `;
}
