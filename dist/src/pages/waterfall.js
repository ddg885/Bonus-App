import { simpleTable } from '../components/table.js';

export function payoutWaterfallPage(state) {
  const grouped = Object.values(state.transformed.reduce((acc, r) => {
    const key = [r.category, r.budgetLineItem, r.oe, r.payoutFy, r.payoutType].join('|');
    if (!acc[key]) acc[key] = { category: r.category, budgetLineItem: r.budgetLineItem, oe: r.oe, payoutFy: r.payoutFy, payoutType: r.payoutType, takers: 0, amount: 0 };
    acc[key].takers += 1;
    acc[key].amount += r.amount;
    return acc;
  }, {}));

  return `<h2>Payout Waterfall</h2>${simpleTable({ title: 'Grouped Waterfall Schedule', rows: grouped, columns: [
    { key: 'category', label: 'Category' }, { key: 'budgetLineItem', label: 'BLI' }, { key: 'oe', label: 'O/E' }, { key: 'payoutFy', label: 'Payout FY' }, { key: 'payoutType', label: 'Type' }, { key: 'takers', label: 'Sum Takers' }, { key: 'amount', label: 'Sum Amount' }
  ] })}`;
}
