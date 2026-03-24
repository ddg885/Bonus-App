import { metricCards } from '../components/cards.js';
import { simpleTable } from '../components/table.js';
import { barList } from '../components/chart.js';

export function executionDashboardPage(state) {
  const rows = state.transformed;
  const byFy = Object.entries(rows.reduce((acc, r) => ({ ...acc, [r.payoutFy]: (acc[r.payoutFy] || 0) + r.amount }), {})).map(([label, value]) => ({ label, value }));
  const byCategory = Object.entries(rows.reduce((acc, r) => ({ ...acc, [r.category]: (acc[r.category] || 0) + r.amount }), {})).map(([label, value]) => ({ label, value }));

  return `
    <h2>Execution Dashboard</h2>
    ${metricCards([
      { label: 'Records', value: rows.length },
      { label: 'Approved Records', value: state.execution.filter((e) => e.status === 'APPROVED').length },
      { label: 'Total Amount', value: rows.reduce((a, r) => a + r.amount, 0), currency: true }
    ])}
    <div class="grid-two">${barList('Amount by Payout FY', byFy)}${barList('Amount by Category', byCategory)}</div>
    ${simpleTable({
      title: 'Detailed Payout Records',
      sticky: true,
      rows,
      columns: [
        { key: 'sourceId', label: 'Source ID' },
        { key: 'category', label: 'Category' },
        { key: 'budgetLineItem', label: 'BLI' },
        { key: 'oe', label: 'O/E' },
        { key: 'bonusType', label: 'Bonus Type' },
        { key: 'payoutType', label: 'Payout Type' },
        { key: 'payoutFy', label: 'Payout FY' },
        { key: 'amount', label: 'Amount' }
      ]
    })}
  `;
}
