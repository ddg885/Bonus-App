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

function normalizeExecutiveCategory(label) {
  const trimmed = String(label || '').trim();
  if (/^HPO(\s|[-_/]|$)/i.test(trimmed)) return 'HPO';
  return trimmed || 'UNKNOWN';
}

function sortPayoutFy(data) {
  return [...data].sort((a, b) => Number(a.label) - Number(b.label));
}

function sortByValueDesc(data) {
  return [...data].sort((a, b) => b.value - a.value);
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
    const inSet = (k, val) => {
      const selected = Array.isArray(f[k]) ? f[k].map((item) => String(item ?? '')) : [];
      const current = String(val ?? '');
      return !selected.length || selected.includes(current);
    };
    return matchesSearch
      && inSet('status', r.status)
      && inSet('category', r.category)
      && inSet('budgetLineItemCombined', r.budgetLineItemCombined || r.budgetLineItem)
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
    : 'Upload Bonus Execution data, then click Transform Data to populate this dashboard.';
  return `<section class="panel"><h3>Execution Summary</h3><p class="empty">${guidance}</p></section>`;
}

function detailColumns(rows) {
  const first = rows[0] || {};
  return Object.keys(first).map((key) => (
    key === 'budgetLineItemCombined'
      ? { key, label: 'Budget Line Item' }
      : { key, label: key }
  ));
}

export function executionDashboardPage(state) {
  const dashboardState = state.ui?.executionDashboard || {};
  const runtimeState = state.executionDashboardRuntime || {};
  const rawRows = runtimeState.rawRows || [];
  const transformedRows = runtimeState.transformedRows || [];
  const hasTransformed = Boolean(dashboardState.hasTransformed && transformedRows.length);
  const rawRowCount = hasTransformed ? Number(dashboardState.rawRowCount || rawRows.length || 0) : 0;
  const transformedRowCount = hasTransformed ? Number(dashboardState.transformedRowCount || transformedRows.length || 0) : 0;
  const fileName = hasTransformed ? (dashboardState.fileName || '') : '';
  const issues = dashboardState.issues || [];
  const f = state.ui.dashboard?.filters || {};
  const filtered = hasTransformed ? applyFilters(transformedRows, f) : [];
  const topBli = groupedAmount(filtered, 'budgetLineItemCombined').sort((a, b) => b.value - a.value).slice(0, 10);
  const payoutFyData = sortPayoutFy(groupedAmount(filtered, 'payoutFy'));
  const categoryData = sortByValueDesc(
    groupedAmount(filtered.map((row) => ({ ...row, category: normalizeExecutiveCategory(row.category) })), 'category')
  );

  return `
    <div class="execution-dashboard">
      <div class="page-header execution-dashboard-header"><div><h2>Execution Dashboard</h2><p>Review transformed execution outcomes with interactive filtering and exports.</p></div></div>
      <section class="panel">
        <h3>Bonus Execution Data</h3>
        <div class="intake-toolbar-left">
          <label>Upload Bonus Execution File
            <input id="execution-dashboard-upload" type="file" accept=".csv,text/csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" />
          </label>
          <button id="execution-transform-btn" class="primary-btn" ${rawRows.length ? '' : 'disabled'}>Transform Data</button>
          <button id="dashboard-clear-filters" class="secondary-btn" ${hasTransformed ? '' : 'disabled'}>Clear Filters</button>
        </div>
        <div class="dataset-status">
          <div><strong>Selected File</strong> <span>${fileName}</span></div>
          <div><strong>Raw Rows Loaded</strong> <span>${rawRowCount}</span></div>
          <div><strong>Transformed Rows</strong> <span>${transformedRowCount}</span></div>
        </div>
        ${issues.length ? `<p class="danger">${issues.map((issue) => (typeof issue === 'string' ? issue : issue?.message || JSON.stringify(issue))).join(' | ')}</p>` : ''}
        <p class="muted">This page only supports Bonus Execution data. Upload only stores raw rows; dashboard metrics/charts render after you click Transform Data.</p>
      </section>
      <section class="panel">
        <h3>Filters</h3>
        <p class="muted">Filters apply after transformation. Each filter supports multiple selections; leaving a filter unchanged includes all values. Search checks all fields in the displayed rows.</p>
        <div class="filter-grid">
          ${renderFilter('Approval Flag', 'status', transformedRows, f)}
          ${renderFilter('Category', 'category', transformedRows, f)}
          ${renderFilter('Budget Line Item', 'budgetLineItemCombined', transformedRows, f)}
          ${renderFilter('O/E', 'oe', transformedRows, f)}
          ${renderFilter('Payout FY', 'payoutFy', transformedRows, f)}
          ${renderFilter('Payout', 'payoutType', transformedRows, f)}
          <label>Search<input data-dashboard-search type="search" value="${f.search || ''}" placeholder="Search all fields" ${hasTransformed ? '' : 'disabled'} /></label>
        </div>
      </section>
      ${hasTransformed ? `
        <div class="execution-kpi-stack">
          ${metricCards([
            { label: 'Filtered Records', value: filtered.length },
            { label: 'Filtered Amount', value: filtered.reduce((a, r) => a + Number(r.amount || 0), 0), currency: true },
            { label: 'Distinct Source Rows', value: new Set(filtered.map((r) => r.sourceId)).size }
          ])}
        </div>
        <div class="execution-chart-row">
          ${barList('Amount by Payout FY', payoutFyData)}
          ${barList('Amount by Category', categoryData)}
        </div>
        <div class="execution-table-row">
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
          ${interactiveTable({
            title: 'Detail Rows',
            tableId: 'execution-detail-rows',
            rows: filtered,
            exportName: 'execution-detail-rows.csv',
            ui: state.ui.tables?.['execution-detail-rows'],
            columns: detailColumns(filtered),
            defaultPageSize: 10
          })}
        </div>
      ` : emptyState(rawRowCount)}
    </div>
  `;
}
