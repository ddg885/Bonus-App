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

function selectionSummary(values, selected = []) {
  if (!values.length) return '<span class="muted">No values available.</span>';
  if (!selected.length) return `<span class="muted">All (${values.length}) selected</span>`;
  if (selected.length <= 2) return `<span class="muted">Selected: ${selected.join(', ')}</span>`;
  return `<span class="muted">${selected.length} selected</span>`;
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

function renderFilter(label, key, allRows, filters) {
  const allValues = uniq(allRows, key);
  return `<label>${label}<select multiple data-dashboard-filter="${key}">${options(allValues, filters[key])}</select>${selectionSummary(allValues, filters[key])}</label>`;
}

function emptyState(rawCount) {
  const guidance = rawCount
    ? 'Raw rows are loaded. Click Transform Data to run the execution pipeline and populate dashboard results.'
    : 'Upload execution data, then click Transform Data to populate this dashboard.';
  return `<section class="panel"><h3>Execution Summary</h3><p class="empty">${guidance}</p></section>`;
}

export function executionDashboardPage(state) {
  const dashboardState = state.ui?.executionDashboard || {};
  const rawRows = dashboardState.rawRows || [];
  const transformedRows = dashboardState.transformedRows || [];
  const hasTransformed = Boolean(dashboardState.hasTransformed);
  const f = state.ui.dashboard?.filters || {};
  const filtered = hasTransformed ? applyFilters(transformedRows, f) : [];
  const topBli = groupedAmount(filtered, 'budgetLineItem').sort((a, b) => b.value - a.value).slice(0, 10);

  return `
    <div class="page-header"><div><h2>Execution Dashboard</h2><p>Review transformed execution outcomes with interactive filtering and exports.</p></div></div>
    <section class="panel">
      <h3>Bonus Execution Data</h3>
      <div class="intake-toolbar-left">
        <label>Upload Execution CSV
          <input id="execution-dashboard-upload" type="file" accept=".csv,text/csv" />
        </label>
        <button id="execution-transform-btn" class="primary-btn" ${rawRows.length ? '' : 'disabled'}>Transform Data</button>
        <button id="dashboard-clear-filters" class="secondary-btn" ${hasTransformed ? '' : 'disabled'}>Clear Filters</button>
      </div>
      <div class="dataset-status">
        <div><strong>Raw Rows Loaded</strong> <span>${rawRows.length}</span></div>
        <div><strong>Transformed Rows</strong> <span>${hasTransformed ? transformedRows.length : 0}</span></div>
      </div>
      <p class="muted">Upload only stores raw rows. Dashboard metrics/charts render after you click Transform Data.</p>
    </section>
    <section class="panel">
      <h3>Filters</h3>
      <div class="filter-grid">
        ${renderFilter('Approval Flag', 'status', transformedRows, f)}
        ${renderFilter('Category', 'category', transformedRows, f)}
        ${renderFilter('Budget Line Item', 'budgetLineItem', transformedRows, f)}
        ${renderFilter('O/E', 'oe', transformedRows, f)}
        ${renderFilter('Payout FY', 'payoutFy', transformedRows, f)}
        ${renderFilter('Payout', 'payoutType', transformedRows, f)}
        <label>Search<input data-dashboard-search type="search" value="${f.search || ''}" placeholder="Search all fields" ${hasTransformed ? '' : 'disabled'} /></label>
      </div>
    </section>
    ${hasTransformed ? `
      ${metricCards([
        { label: 'Filtered Records', value: filtered.length },
        { label: 'Filtered Amount', value: filtered.reduce((a, r) => a + Number(r.amount || 0), 0), currency: true },
        { label: 'Distinct Source Rows', value: new Set(filtered.map((r) => r.sourceId)).size }
      ])}
      <div class="grid-two">${barList('Amount by Payout FY', groupedAmount(filtered, 'payoutFy'))}${barList('Amount by Category', groupedAmount(filtered, 'category'))}</div>
      <div class="grid-two">${barList('Amount by Approval Flag', groupedAmount(filtered, 'status'))}${barList('Amount by Payout', groupedAmount(filtered, 'payoutType'))}</div>
      ${barList('Amount by O/E', groupedAmount(filtered, 'oe'))}
      ${interactiveTable({
        title: 'Top Budget Line Items',
        tableId: 'execution-top-budget-line-items',
        rows: topBli,
        exportName: 'execution-top-budget-line-items.csv',
        ui: state.ui.tables?.['execution-top-budget-line-items'],
        columns: [
          { key: 'label', label: 'Budget Line Item' },
          { key: 'value', label: 'Amount' }
        ]
      })}
    ` : emptyState(rawRows.length)}
  `;
}
