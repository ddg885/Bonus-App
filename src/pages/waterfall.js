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

export function payoutWaterfallPage(state) {
  const base = state.projectionPayoutSchedule;
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

  return `
    <div class="page-header"><div><h2>Payout Waterfall</h2><p>Matrix payout view by Due Date FY and Payout Type, pivoted across Payout FY with export-ready tabular detail.</p></div></div>
    <section class="panel"><h3>Filters</h3><div class="filter-grid">
      <label>Category<select multiple data-waterfall-filter="category">${options(uniq(base, 'category'), f.category)}</select></label>
      <label>Budget Line Item<select multiple data-waterfall-filter="budgetLineItem">${options(uniq(base, 'budgetLineItem'), f.budgetLineItem)}</select></label>
      <label>O/E<select multiple data-waterfall-filter="oe">${options(uniq(base, 'oe'), f.oe)}</select></label>
      <label>Payout FY<select multiple data-waterfall-filter="payoutFy">${options(uniq(base, 'payoutFy'), f.payoutFy)}</select></label>
      <label>Payout Type<select multiple data-waterfall-filter="payoutType">${options(uniq(base, 'payoutType'), f.payoutType)}</select></label>
    </div></section>
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
