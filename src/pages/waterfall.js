import { interactiveTable } from '../components/table.js';

function options(values, selected = []) {
  return values.map((v) => `<option value="${v}" ${selected.includes(v) ? 'selected' : ''}>${v}</option>`).join('');
}

function uniq(rows, key) {
  return Array.from(new Set(rows.map((r) => r[key]).filter(Boolean))).sort();
}

function apply(rows, f = {}) {
  const inSet = (k, val) => !(f[k]?.length) || f[k].includes(val || '');
  return rows.filter((r) => inSet('category', r.category)
    && inSet('budgetLineItem', r.budgetLineItem)
    && inSet('oe', r.oe)
    && inSet('payoutFy', r.payoutFy)
    && inSet('payoutType', r.payoutType));
}

function buildExecutionWaterfallRows(executionRows = []) {
  return executionRows
    .filter((row) => row && (row.payoutFy || row['Payout FY']))
    .map((row) => ({
      category: row.category || row.Category || '',
      budgetLineItem: row.budgetLineItemCombined || row['Budget Line Item Combined'] || row.budgetLineItem || row['Budget Line Item'] || '',
      oe: row.oe || row.O_E || '',
      payoutFy: row.payoutFy || row['Payout FY'] || '',
      payoutType: row.payoutType || row.Payout || '',
      dueDateFy: row['Due Date FY'] || row.dueDateFy || row['Installment Due FY'] || '',
      amount: Number(row.amount || row['Installment Amount'] || 0),
      takers: 1
    }));
}

export function payoutWaterfallPage(state) {
  const sourceMode = state.ui.waterfall?.sourceMode || 'projection';
  const projectionRows = state.projectionPayoutSchedule || [];
  const executionRows = buildExecutionWaterfallRows(state.executionDashboardRuntime?.transformedRows || []);
  const hasExecutionRows = executionRows.length > 0;
  const base = sourceMode === 'execution'
    ? executionRows
    : sourceMode === 'combined'
      ? [...projectionRows, ...executionRows]
      : projectionRows;
  const f = state.ui.waterfall?.filters || {};
  const filtered = apply(base, f);
  const payoutFys = uniq(filtered, 'payoutFy');
  const matrixRows = Object.values(filtered.reduce((acc, r) => {
    const rowKey = [r.dueDateFy, r.payoutType].join('|');
    if (!acc[rowKey]) acc[rowKey] = { dueDateFy: r.dueDateFy, payoutType: r.payoutType };
    const fy = r.payoutFy;
    const takersKey = `${fy}_takers`;
    const amountKey = `${fy}_amount`;
    acc[rowKey][takersKey] = Number(acc[rowKey][takersKey] || 0) + Number(r.takers || 0);
    acc[rowKey][amountKey] = Number(acc[rowKey][amountKey] || 0) + Number(r.amount || 0);
    return acc;
  }, {})).map((row) => {
    payoutFys.forEach((fy) => {
      const amountKey = `${fy}_amount`;
      row[`${fy}_takers`] = Number(row[`${fy}_takers`] || 0);
      row[amountKey] = Number((row[amountKey] || 0).toFixed(2));
    });
    return row;
  });
  const matrixColumns = [
    { key: 'dueDateFy', label: 'Due Date FY' },
    { key: 'payoutType', label: 'Payout Type' },
    ...payoutFys.flatMap((fy) => ([
      { key: `${fy}_takers`, label: `${fy} Takers` },
      { key: `${fy}_amount`, label: `${fy} Amount` }
    ]))
  ];
  const executionEmptyMessage = sourceMode === 'execution' && !hasExecutionRows
    ? '<p class="subtle waterfall-empty-note">No transformed execution data is available. Upload and transform data on the Execution Dashboard page to view execution waterfall results.</p>'
    : '';

  return `
    <div class="page-header"><div><h2>Payout Waterfall</h2><p>Matrix payout view by Due Date FY and Payout Type, pivoted across Payout FY with export-ready tabular detail.</p></div></div>
    <section class="panel waterfall-source-panel">
      <h3>Data Source</h3>
      <div class="segmented-control" role="group" aria-label="Waterfall data source">
        <button type="button" data-waterfall-source-mode="projection" class="segment-btn ${sourceMode === 'projection' ? 'active' : ''}">Projection</button>
        <button type="button" data-waterfall-source-mode="execution" class="segment-btn ${sourceMode === 'execution' ? 'active' : ''}">Execution</button>
        <button type="button" data-waterfall-source-mode="combined" class="segment-btn ${sourceMode === 'combined' ? 'active' : ''}">Combined</button>
      </div>
    </section>
    <section class="panel"><h3>Filters</h3><div class="filter-grid">
      <label>Category<select multiple data-waterfall-filter="category">${options(uniq(base, 'category'), f.category)}</select></label>
      <label>Budget Line Item<select multiple data-waterfall-filter="budgetLineItem">${options(uniq(base, 'budgetLineItem'), f.budgetLineItem)}</select></label>
      <label>O/E<select multiple data-waterfall-filter="oe">${options(uniq(base, 'oe'), f.oe)}</select></label>
      <label>Payout FY<select multiple data-waterfall-filter="payoutFy">${options(uniq(base, 'payoutFy'), f.payoutFy)}</select></label>
      <label>Payout Type<select multiple data-waterfall-filter="payoutType">${options(uniq(base, 'payoutType'), f.payoutType)}</select></label>
    </div></section>
    ${executionEmptyMessage}
    ${interactiveTable({
      title: 'Waterfall Matrix Table',
      tableId: 'waterfall-matrix',
      rows: matrixRows,
      exportName: 'waterfall-matrix.csv',
      ui: state.ui.tables?.['waterfall-matrix'],
      sticky: true,
      columns: matrixColumns
    })}
  `;
}
