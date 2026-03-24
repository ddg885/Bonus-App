import { interactiveTable } from '../components/table.js';
import { barList } from '../components/chart.js';
import { metricCards } from '../components/cards.js';

function group(rows, key, valueKey) {
  return Object.entries(rows.reduce((acc, r) => {
    acc[r[key]] = (acc[r[key]] || 0) + Number(r[valueKey] || 0);
    return acc;
  }, {})).map(([label, value]) => ({ label, value: Number(value.toFixed(2)) }));
}

export function pomProjectionsPage(state) {
  const streamByFy = group(state.projectionPayoutSchedule, 'payoutFy', 'amount');
  return `
    <h2>POM Projections</h2>
    ${metricCards([
      { label: 'Projection Rows', value: state.projections.length },
      { label: 'Payout Schedule Rows', value: state.projectionPayoutSchedule.length },
      { label: 'Budget Variances', value: state.variances.length }
    ])}
    <div class="grid-two">${barList('Projected Payout Stream by FY', streamByFy)}${barList('Projected Initial by Category', group(state.projections, 'category', 'initialPayoutTotal'))}</div>
    ${interactiveTable({
      title: 'Category-Year Distribution Table',
      tableId: 'projection-distribution',
      rows: state.projections,
      exportName: 'projection-distribution.csv',
      ui: state.ui.tables?.['projection-distribution'],
      columns: [
        { key: 'category', label: 'Category' }, { key: 'fiscalYear', label: 'FY' }, { key: 'budgetLineItem', label: 'BLI' }, { key: 'oe', label: 'O/E' }, { key: 'bonusType', label: 'Bonus Type' },
        { key: 'takers', label: 'Takers' }, { key: 'avgInitialPayout', label: 'Avg Initial' }, { key: 'targetAverage', label: 'Target Avg' }, { key: 'targetVariance', label: 'Variance' }, { key: 'initialPayoutTotal', label: 'Initial Total' }, { key: 'anniversaryPayoutTotal', label: 'Anniversary Total' }
      ]
    })}
    ${interactiveTable({
      title: 'Average Initial vs Target Explainability',
      tableId: 'projection-explainability',
      rows: state.projectionExplainability,
      ui: state.ui.tables?.['projection-explainability'],
      columns: [
        { key: 'category', label: 'Category' }, { key: 'fiscalYear', label: 'FY' }, { key: 'totalTakers', label: 'Takers' }, { key: 'options', label: 'Bonus Options' },
        { key: 'pass1AvgInitial', label: 'Pass1 Avg' }, { key: 'pass2AvgInitial', label: 'Pass2 Avg' }, { key: 'targetAverage', label: 'Target Avg' }, { key: 'distanceToTarget', label: 'Distance' }, { key: 'iterations', label: 'Iterations' }
      ]
    })}
    ${interactiveTable({
      title: 'Budget Comparison and Variance',
      tableId: 'projection-variance',
      rows: state.variances,
      exportName: 'projection-budget-variance.csv',
      ui: state.ui.tables?.['projection-variance'],
      columns: [
        { key: 'budgetLineItem', label: 'BLI' }, { key: 'category', label: 'Category' }, { key: 'oe', label: 'O/E' }, { key: 'bonusType', label: 'Bonus Type' }, { key: 'fiscalYear', label: 'FY' },
        { key: 'projectedAmount', label: 'Projected' }, { key: 'controlAmount', label: 'Control' }, { key: 'variance', label: 'Variance' }, { key: 'status', label: 'Indicator' }
      ]
    })}
  `;
}
