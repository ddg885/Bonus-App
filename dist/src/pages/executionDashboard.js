import { metricCards } from '../components/cards.js';
import { barList } from '../components/chart.js';
import { interactiveTable } from '../components/table.js';

function uniq(rows, key) {
  return Array.from(new Set(rows.map((r) => r[key]).filter(Boolean))).sort();
}

function groupedAmount(rows, key) {
  return Object.entries(rows.reduce((acc, r) => {
    const k = r[key] || 'UNKNOWN';
    acc[k] = (acc[k] || 0) + Number(r.amount || 0);
    return acc;
  }, {})).map(([label, value]) => ({ label, value: Number(value.toFixed(2)) }));
}

function options(values, selected = []) {
  return values.map((v) => `<option value="${v}" ${selected.includes(v) ? 'selected' : ''}>${v}</option>`).join('');
}

function applyFilters(rows, f = {}) {
  return rows.filter((r) => {
    const text = (f.search || '').toLowerCase();
    const matchesSearch = !text || JSON.stringify(r).toLowerCase().includes(text);
    const inSet = (k, val) => !(f[k]?.length) || f[k].includes(val || '');
    return matchesSearch
      && inSet('status', r.status)
      && inSet('category', r.category)
      && inSet('budgetLineItem', r.budgetLineItem)
      && inSet('oe', r.oe)
      && inSet('payoutFy', r.payoutFy)
      && inSet('payoutType', r.payoutType);
  });
}

export function executionDashboardPage(state) {
  const f = state.ui.dashboard?.filters || {};
  const filtered = applyFilters(state.transformed, f);
  const topBli = groupedAmount(filtered, 'budgetLineItem').sort((a, b) => b.value - a.value).slice(0, 10);

  return `
    <h2>Execution Dashboard</h2>
    <section class="panel">
      <h3>Filters</h3>
      <div class="filter-grid">
        <label>Approval Flag / Status<select multiple data-dashboard-filter="status">${options(uniq(state.transformed, 'status'), f.status)}</select></label>
        <label>Category<select multiple data-dashboard-filter="category">${options(uniq(state.transformed, 'category'), f.category)}</select></label>
        <label>Budget Line Item<select multiple data-dashboard-filter="budgetLineItem">${options(uniq(state.transformed, 'budgetLineItem'), f.budgetLineItem)}</select></label>
        <label>O/E<select multiple data-dashboard-filter="oe">${options(uniq(state.transformed, 'oe'), f.oe)}</select></label>
        <label>Payout FY<select multiple data-dashboard-filter="payoutFy">${options(uniq(state.transformed, 'payoutFy'), f.payoutFy)}</select></label>
        <label>Payout Type<select multiple data-dashboard-filter="payoutType">${options(uniq(state.transformed, 'payoutType'), f.payoutType)}</select></label>
        <label>Search<input data-dashboard-search type="search" value="${f.search || ''}" placeholder="Search all fields"/></label>
      </div>
    </section>
    ${metricCards([
      { label: 'Filtered Records', value: filtered.length },
      { label: 'Filtered Amount', value: filtered.reduce((a, r) => a + Number(r.amount || 0), 0), currency: true },
      { label: 'Distinct Source Rows', value: new Set(filtered.map((r) => r.sourceId)).size }
    ])}
    <div class="grid-two">${barList('Amount by Payout FY', groupedAmount(filtered, 'payoutFy'))}${barList('Amount by Category', groupedAmount(filtered, 'category'))}</div>
    ${barList('Top Budget Line Items', topBli)}
    ${interactiveTable({
      title: 'Detailed Records',
      tableId: 'execution-detailed',
      rows: filtered,
      sticky: true,
      exportName: 'execution-filtered.csv',
      ui: state.ui.tables?.['execution-detailed'],
      columns: [
        { key: 'sourceId', label: 'Source ID' },
        { key: 'status', label: 'Status' },
        { key: 'category', label: 'Category' },
        { key: 'budgetLineItem', label: 'Budget Line Item' },
        { key: 'oe', label: 'O/E' },
        { key: 'bonusType', label: 'Bonus Type' },
        { key: 'payoutType', label: 'Payout Type' },
        { key: 'payoutFy', label: 'Payout FY' },
        { key: 'obligationFy', label: 'Obligation FY' },
        { key: 'amount', label: 'Amount' }
      ]
    })}
  `;
}
