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
  const grouped = Object.values(filtered.reduce((acc, r) => {
    const key = [r.dueDateFy, r.payoutFy, r.payoutType, r.category, r.budgetLineItem, r.oe].join('|');
    if (!acc[key]) {
      acc[key] = { dueDateFy: r.dueDateFy, payoutFy: r.payoutFy, payoutType: r.payoutType, category: r.category, budgetLineItem: r.budgetLineItem, oe: r.oe, takers: 0, amount: 0 };
    }
    acc[key].takers += Number(r.takers || 0);
    acc[key].amount += Number(r.amount || 0);
    return acc;
  }, {})).map((r) => ({ ...r, amount: Number(r.amount.toFixed(2)) }));

  return `
    <div class="page-header"><div><h2>Payout Waterfall</h2><p>Grouped payout stream with configurable dimensions and export-ready tabular detail.</p></div></div>
    <section class="panel"><h3>Filters</h3><div class="filter-grid">
      <label>Category<select multiple data-waterfall-filter="category">${options(uniq(base, 'category'), f.category)}</select></label>
      <label>Budget Line Item<select multiple data-waterfall-filter="budgetLineItem">${options(uniq(base, 'budgetLineItem'), f.budgetLineItem)}</select></label>
      <label>O/E<select multiple data-waterfall-filter="oe">${options(uniq(base, 'oe'), f.oe)}</select></label>
      <label>Payout FY<select multiple data-waterfall-filter="payoutFy">${options(uniq(base, 'payoutFy'), f.payoutFy)}</select></label>
      <label>Payout Type<select multiple data-waterfall-filter="payoutType">${options(uniq(base, 'payoutType'), f.payoutType)}</select></label>
    </div></section>
    ${interactiveTable({
      title: 'Grouped Waterfall Table',
      tableId: 'waterfall-grouped',
      rows: grouped,
      exportName: 'waterfall-grouped.csv',
      ui: state.ui.tables?.['waterfall-grouped'],
      sticky: true,
      columns: [
        { key: 'dueDateFy', label: 'Due Date FY' },
        { key: 'payoutFy', label: 'Payout FY' },
        { key: 'payoutType', label: 'Payout Type' },
        { key: 'category', label: 'Category' },
        { key: 'budgetLineItem', label: 'BLI' },
        { key: 'oe', label: 'O/E' },
        { key: 'takers', label: 'Sum of Takers' },
        { key: 'amount', label: 'Sum of Amount' }
      ]
    })}
  `;
}
