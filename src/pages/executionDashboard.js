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

function normalizeStringArray(values = []) {
  return values.map((value) => String(value ?? '')).filter((value) => value !== '');
}

function normalizePayoutFy(value) {
  const raw = String(value ?? '').trim().toUpperCase();
  if (!raw) return '';
  const fyMatch = raw.match(/^FY\s*([0-9]{2,4})$/);
  if (fyMatch) {
    const numeric = Number(fyMatch[1]);
    if (!Number.isFinite(numeric)) return '';
    return String(numeric < 100 ? 2000 + numeric : numeric);
  }
  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) return '';
  return String(numeric < 100 ? 2000 + numeric : Math.trunc(numeric));
}

function formatPayoutFyLabel(value) {
  const normalized = normalizePayoutFy(value);
  if (!normalized) return String(value ?? '');
  return `FY${String(Number(normalized) % 100).padStart(2, '0')}`;
}

function distinctValues(rows, key) {
  return Array.from(new Set(rows.map((row) => String(row[key] ?? '')).filter((value) => value !== ''))).sort();
}

function groupedCount(rows, key) {
  return Object.entries(rows.reduce((acc, row) => {
    const bucket = String(row[key] ?? '').trim() || 'UNKNOWN';
    acc[bucket] = (acc[bucket] || 0) + 1;
    return acc;
  }, {})).map(([label, value]) => ({ label, value }));
}

function options(values, selected = []) {
  const selectedValues = new Set((Array.isArray(selected) ? selected : []).map((value) => String(value ?? '')));
  const selectedPayoutFyValues = new Set(Array.from(selectedValues).map((value) => normalizePayoutFy(value)).filter(Boolean));
  return values
    .map((v) => {
      const normalized = String(v ?? '');
      const payoutFyNormalized = normalizePayoutFy(normalized);
      const isSelected = selectedValues.has(normalized) || (payoutFyNormalized && selectedPayoutFyValues.has(payoutFyNormalized));
      const label = payoutFyNormalized ? formatPayoutFyLabel(payoutFyNormalized) : normalized;
      return `<option value="${normalized}" ${isSelected ? 'selected' : ''}>${label}</option>`;
    })
    .join('');
}

function selectionSummary(values, selected = []) {
  const selectedValues = Array.isArray(selected) ? selected : [];
  const summary = (() => {
    if (!values.length) return 'No values available.';
    if (!selectedValues.length) return `All (${values.length}) selected`;
    if (selectedValues.length <= 2) return `Selected: ${selectedValues.join(', ')}`;
    return `${selectedValues.length} selected`;
  })();
  return `<div class="filter-selection-summary"><span class="muted">${summary}</span></div>`;
}

function filterSummaryWithClear(values, selected = [], key) {
  const summary = selectionSummary(values, selected);
  return `${summary}<a href="#" class="filter-clear-link" data-clear-dashboard-filter="${key}">Clear Filter</a>`;
}

function activeFilterValue(values) {
  const selectedValues = Array.isArray(values) ? values.map((value) => String(value ?? '')).filter((value) => value !== '') : [];
  if (!selectedValues.length) return 'All';
  const normalizedPayoutFyValues = selectedValues.map((value) => normalizePayoutFy(value));
  if (normalizedPayoutFyValues.every(Boolean)) {
    return normalizedPayoutFyValues.map((value) => formatPayoutFyLabel(value)).join(', ');
  }
  return selectedValues.join(', ');
}

function activeSearchValue(value) {
  const trimmed = String(value ?? '').trim();
  return trimmed ? trimmed : 'Blank';
}

function getApprovalStatus(row) {
  return String(row.status || row['Approval Flag'] || '').trim().toLowerCase();
}

function getBonusTrackingNumber(row) {
  return String(
    row['Bonus Tracking Num']
    || row.bonusTrackingNum
    || row.bonusTrackingNumber
    || row.trackNumActual
    || row['Mbr Reserve Bonus Subm Track Num Actual']
    || ''
  ).trim();
}

function sumAmount(rows) {
  return rows.reduce((acc, row) => acc + Number(row.amount || 0), 0);
}

function approvedRows(rows) {
  return rows.filter((row) => getApprovalStatus(row) === 'approved');
}

function committedRows(rows) {
  return rows.filter((row) => getApprovalStatus(row) === 'committed');
}

function distinctBonuses(rows) {
  return new Set(rows.map(getBonusTrackingNumber).filter(Boolean)).size;
}

function applyFilters(rows, f = {}) {
  return rows.filter((r) => {
    const text = (f.search || '').toLowerCase();
    const matchesSearch = !text || JSON.stringify(r).toLowerCase().includes(text);
    const inSet = (k, val) => {
      const selected = Array.isArray(f[k]) ? f[k].map((item) => String(item ?? '')) : [];
      const current = String(val ?? '');
      if (k === 'payoutFy') {
        const normalizedSelected = selected.map((item) => normalizePayoutFy(item)).filter(Boolean);
        const normalizedCurrent = normalizePayoutFy(current);
        return !normalizedSelected.length || normalizedSelected.includes(normalizedCurrent);
      }
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
  const allValues = key === 'payoutFy'
    ? distinctValues(allRows, key).sort((a, b) => Number(normalizePayoutFy(a)) - Number(normalizePayoutFy(b)))
    : uniq(allRows, key);
  return `<label>${label}<select multiple data-dashboard-filter="${key}">${options(allValues, filters[key])}</select>${filterSummaryWithClear(allValues, filters[key], key)}</label>`;
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
  const selectedPayoutFy = normalizeStringArray(f.payoutFy);
  const fy26FilterActive = selectedPayoutFy.map((value) => normalizePayoutFy(value)).includes('2026');
  const filteredFy26Rows = hasTransformed && fy26FilterActive
    ? filtered.filter((row) => normalizePayoutFy(row.payoutFy) === '2026')
    : [];
  const transformedDistinctPayoutFy = distinctValues(transformedRows, 'payoutFy');
  const filteredDistinctPayoutFy = distinctValues(filtered, 'payoutFy');
  const payoutFyCountsTransformed = sortPayoutFy(groupedCount(transformedRows, 'payoutFy'));
  const payoutFyCountsFiltered = sortPayoutFy(groupedCount(filtered, 'payoutFy'));
  const payoutFySourceCountsTransformed = sortByValueDesc(groupedCount(transformedRows, 'Payout FY Source'));
  const payoutFyAmountTransformed = sortPayoutFy(groupedAmount(transformedRows, 'payoutFy'));
  const payoutFySourceCountsFiltered = sortByValueDesc(groupedCount(filtered, 'Payout FY Source'));
  const suspiciousRows = transformedRows.filter((row) => {
    const isCommitted = getApprovalStatus(row) === 'committed';
    const payoutFyIs2026 = normalizePayoutFy(row.payoutFy) === '2026';
    const dueDateFyIs2026 = String(row['Due Date FY'] ?? '') === '2026';
    const installmentDueFyIs2026 = String(row['Installment Due FY'] ?? '') === '2026';
    return isCommitted && !payoutFyIs2026 && (dueDateFyIs2026 || installmentDueFyIs2026);
  });
  const fy26DetailRows = fy26FilterActive ? filteredFy26Rows.slice(0, 100) : [];
  const topBli = groupedAmount(filtered, 'budgetLineItemCombined').sort((a, b) => b.value - a.value).slice(0, 10);
  const payoutFyData = sortPayoutFy(groupedAmount(filtered, 'payoutFy'));
  const categoryData = sortByValueDesc(
    groupedAmount(filtered.map((row) => ({ ...row, category: normalizeExecutiveCategory(row.category) })), 'category')
  );
  const visibleRows = filtered.length;
  const installmentAmount = sumAmount(filtered);
  const approvedAmount = sumAmount(approvedRows(filtered));
  // Keep all committed KPI/drilldown logic on a single source to avoid hidden subset drift.
  const committedDetailRows = committedRows(filtered);
  const committedAmount = sumAmount(committedDetailRows);
  const committedVerification = {
    rows: committedDetailRows.length,
    amount: committedAmount,
    payoutFyValues: uniq(committedDetailRows, 'payoutFy')
  };
  const distinctBonusCount = distinctBonuses(filtered);
  const activeFilterSummary = [
    { label: 'Approval Flag', value: activeFilterValue(f.status) },
    { label: 'Category', value: activeFilterValue(f.category) },
    { label: 'Budget Line Item', value: activeFilterValue(f.budgetLineItemCombined) },
    { label: 'O/E', value: activeFilterValue(f.oe) },
    { label: 'Payout FY', value: activeFilterValue(f.payoutFy) },
    { label: 'Payout', value: activeFilterValue(f.payoutType) },
    { label: 'Search', value: activeSearchValue(f.search) }
  ];

  return `
    <div class="execution-dashboard">
      <div class="page-header execution-dashboard-header"><div><h2>Execution Dashboard</h2><p class="header-description">Review transformed execution outcomes with interactive filtering and exports.</p></div></div>
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
        <p class="muted">Filters apply after transformation. Each filter supports multiple selections (use Control + click to select multiple options); leaving a filter unchanged includes all values. Search checks all fields in the displayed rows.</p>
        <div class="filter-grid">
          ${renderFilter('Approval Flag', 'status', transformedRows, f)}
          ${renderFilter('Category', 'category', transformedRows, f)}
          ${renderFilter('Budget Line Item', 'budgetLineItemCombined', transformedRows, f)}
          ${renderFilter('O/E', 'oe', transformedRows, f)}
          ${renderFilter('Payout FY', 'payoutFy', transformedRows, f)}
          ${renderFilter('Payout', 'payoutType', transformedRows, f)}
          <label class="dashboard-search-label">Search<input data-dashboard-search type="search" value="${f.search || ''}" placeholder="Search all fields" ${hasTransformed ? '' : 'disabled'} /><button type="button" id="dashboard-clear-all-filters" class="secondary-btn" ${hasTransformed ? '' : 'disabled'}>Clear All Filters</button></label>
        </div>
        <div class="dataset-status">
          ${activeFilterSummary.map((item) => `<div><strong>${item.label}</strong> <span>${item.value}</span></div>`).join('')}
        </div>
      </section>
      ${hasTransformed ? `
        <section class="panel">
          <h3>Payout FY Investigation (Temporary)</h3>
          <p class="muted">Diagnostics prove how Payout FY is assigned in transformed data and which rows are captured when filtering for FY26.</p>
          <div class="dataset-status">
            <div><strong>Transformed Distinct Payout FY</strong> <span>${transformedDistinctPayoutFy.join(', ') || '(none)'}</span></div>
            <div><strong>Transformed Row Count</strong> <span>${transformedRows.length}</span></div>
            <div><strong>Transformed Installment Amount</strong> <span>${Number(sumAmount(transformedRows) || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</span></div>
            <div><strong>Filtered Distinct Payout FY</strong> <span>${filteredDistinctPayoutFy.join(', ') || '(none)'}</span></div>
            <div><strong>Filtered Row Count</strong> <span>${filtered.length}</span></div>
            <div><strong>Filtered Installment Amount</strong> <span>${Number(installmentAmount || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</span></div>
            <div><strong>Filtered Committed Row Count</strong> <span>${committedDetailRows.length}</span></div>
            <div><strong>Filtered Committed Amount</strong> <span>${Number(committedAmount || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</span></div>
            <div><strong>FY26 Rows In Current Filtered Set</strong> <span>${fy26FilterActive ? filteredFy26Rows.length : 'N/A (Payout FY FY26 not selected)'}</span></div>
            <div><strong>FY26 Amount In Current Filtered Set</strong> <span>${fy26FilterActive ? Number(sumAmount(filteredFy26Rows) || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' }) : 'N/A (Payout FY FY26 not selected)'}</span></div>
          </div>
          <div class="execution-chart-row">
            ${barList('Counts by Payout FY (Transformed)', payoutFyCountsTransformed)}
            ${barList('Amounts by Payout FY (Transformed)', payoutFyAmountTransformed)}
          </div>
          <div class="execution-chart-row">
            ${barList('Counts by Payout FY (Filtered)', payoutFyCountsFiltered)}
            ${barList('Counts by Payout FY Source (Transformed)', payoutFySourceCountsTransformed)}
          </div>
          <div class="execution-chart-row">
            ${barList('Counts by Payout FY Source (Filtered)', payoutFySourceCountsFiltered)}
          </div>
          ${interactiveTable({
            title: fy26FilterActive ? 'FY26 Filtered Row Sample (First 100)' : 'FY26 Filtered Row Sample (Select FY26 to populate)',
            tableId: 'execution-fy26-investigation-rows',
            rows: fy26FilterActive ? fy26DetailRows : [],
            exportName: 'execution-fy26-investigation-rows.csv',
            ui: state.ui.tables?.['execution-fy26-investigation-rows'],
            columns: [
              { key: 'Bonus Tracking Num', label: 'Bonus Tracking Num' },
              { key: 'Approval Flag', label: 'Approval Flag' },
              { key: 'Payout FY', label: 'Payout FY' },
              { key: 'Payout FY Source', label: 'Payout FY Source' },
              { key: 'Approval Date', label: 'Approval Date' },
              { key: 'Due Date', label: 'Due Date' },
              { key: 'Installment Due Date', label: 'Installment Due Date' },
              { key: 'Installment Number', label: 'Installment Number' },
              { key: 'Installment Amount', label: 'Installment Amount' },
              { key: 'Mbr Reserve Bonus Subm Category Code', label: 'Mbr Reserve Bonus Subm Category Code' },
              { key: 'Budget Line Item Combined', label: 'Budget Line Item Combined' }
            ],
            defaultPageSize: 100
          })}
          ${interactiveTable({
            title: 'Suspicious Committed Rows (Payout FY ≠ 2026, but Due Date FY or Installment Due FY = 2026)',
            tableId: 'execution-fy26-suspicious-rows',
            rows: suspiciousRows,
            exportName: 'execution-fy26-suspicious-rows.csv',
            ui: state.ui.tables?.['execution-fy26-suspicious-rows'],
            columns: [
              { key: 'Bonus Tracking Num', label: 'Bonus Tracking Num' },
              { key: 'Approval Flag', label: 'Approval Flag' },
              { key: 'Payout FY', label: 'Payout FY' },
              { key: 'Payout FY Source', label: 'Payout FY Source' },
              { key: 'Due Date FY', label: 'Due Date FY' },
              { key: 'Installment Due FY', label: 'Installment Due FY' },
              { key: 'Due Date', label: 'Due Date' },
              { key: 'Installment Due Date', label: 'Installment Due Date' },
              { key: 'Installment Number', label: 'Installment Number' },
              { key: 'Installment Amount', label: 'Installment Amount' },
              { key: 'Mbr Reserve Bonus Subm Category Code', label: 'Mbr Reserve Bonus Subm Category Code' },
              { key: 'Budget Line Item Combined', label: 'Budget Line Item Combined' }
            ],
            defaultPageSize: 25
          })}
        </section>
        <div class="execution-kpi-stack">
          ${metricCards([
            { label: 'VISIBLE ROWS', value: visibleRows, subtitle: 'After filters' },
            { label: 'INSTALLMENT AMOUNT', value: installmentAmount, currency: true, subtitle: 'Visible rows' },
            { label: 'APPROVED AMOUNT', value: approvedAmount, currency: true, subtitle: 'Approval Date present' },
            { label: 'COMMITTED AMOUNT', value: committedAmount, currency: true, subtitle: 'Approval Date blank' },
            { label: 'DISTINCT BONUSES', value: distinctBonusCount, subtitle: 'Distinct tracking nums' }
          ])}
        </div>
        <section class="panel">
          <h3>Committed KPI Verification (Temporary)</h3>
          <p class="muted">Verification uses the exact rows behind COMMITTED AMOUNT after all active filters/search are applied.</p>
          <div class="dataset-status">
            <div><strong>Committed Detail Rows</strong> <span>${committedVerification.rows}</span></div>
            <div><strong>Committed Amount Source Sum</strong> <span>${Number(committedVerification.amount || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</span></div>
            <div><strong>Committed Payout FY Values</strong> <span>${committedVerification.payoutFyValues.join(', ') || '(none)'}</span></div>
          </div>
        </section>
        <div class="execution-chart-row">
          ${barList('Amount by Payout FY', payoutFyData)}
          ${barList('Amount by Category', categoryData)}
        </div>
        <div class="execution-table-row">
          ${barList('Top Budget Line Items', topBli)}
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
