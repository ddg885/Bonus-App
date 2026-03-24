import { simpleTable } from '../components/table.js';
import { barList } from '../components/chart.js';

export function pomProjectionsPage(state) {
  const byFy = Object.entries(state.projections.reduce((acc, r) => ({ ...acc, [r.fiscalYear]: (acc[r.fiscalYear] || 0) + r.initialPayoutTotal + r.anniversaryPayoutTotal }), {})).map(([label, value]) => ({ label, value }));
  return `
    <h2>POM Projections</h2>
    ${barList('Projected Payout by FY', byFy)}
    ${simpleTable({
      title: 'Two-Pass Distribution Output',
      rows: state.projections,
      columns: [
        { key: 'category', label: 'Category' },
        { key: 'fiscalYear', label: 'FY' },
        { key: 'bonusRecordId', label: 'Bonus ID' },
        { key: 'takers', label: 'Takers' },
        { key: 'initialPayoutTotal', label: 'Initial Total' },
        { key: 'anniversaryPayoutTotal', label: 'Anniv Total' },
        { key: 'avgInitialPayout', label: 'Avg Initial' },
        { key: 'targetAverage', label: 'Target Avg' },
        { key: 'targetVariance', label: 'Variance' }
      ]
    })}
    ${simpleTable({
      title: 'Budget Reconciliation',
      rows: state.variances,
      columns: [
        { key: 'category', label: 'Category' }, { key: 'fiscalYear', label: 'FY' }, { key: 'projectedAmount', label: 'Projected' }, { key: 'controlAmount', label: 'Control' }, { key: 'variance', label: 'Variance' }, { key: 'status', label: 'Status' }
      ]
    })}
  `;
}
