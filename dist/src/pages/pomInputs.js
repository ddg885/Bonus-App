import { interactiveTable } from '../components/table.js';
import { uploadZone } from '../components/uploadZone.js';

const datasets = [
  ['execution', 'Execution / Approval Data'],
  ['bonusInfo', 'Bonus Info Table'],
  ['targetAverage', 'Target Average Initial Bonus Table'],
  ['controls', 'Controls Table'],
  ['aggregateTakers', 'Aggregate Initial Takers Table'],
  ['crosswalk', 'Crosswalk Table']
];

function statusBadge(loaded) {
  return loaded ? '<span class="ok">Loaded</span>' : '<span class="warn">Missing</span>';
}

function editableMiniTable(state, key, title, columns) {
  const rows = (state[key] || []).slice(0, 20);
  if (!rows.length) return `<section class="panel"><h3>${title}</h3><p class="empty">No rows loaded.</p></section>`;
  const head = columns.map((c) => `<th>${c.label}</th>`).join('');
  const body = rows.map((r, idx) => `<tr>${columns.map((c) => `<td contenteditable="true" data-edit-cell="${key}" data-row="${idx}" data-col="${c.key}">${r[c.key] ?? ''}</td>`).join('')}</tr>`).join('');
  return `<section class="panel"><h3>${title} <small>(inline editable sample)</small></h3><p class="muted">Editing persists locally. For bulk updates, import CSV.</p><div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div></section>`;
}

export function pomInputsPage(state) {
  const status = state.inputStatus;
  return `
    <h2>POM Inputs and Editable Planning Tables</h2>
    <section class="panel"><h3>Dataset Status</h3><div class="dataset-status">${datasets.map(([k, label]) => `<div><strong>${label}</strong> ${statusBadge(status[k])} <button data-export-dataset="${k}">Export</button></div>`).join('')}</div></section>
    <div class="grid-three">${datasets.map(([k, label]) => uploadZone(k, label, status[k])).join('')}</div>
    ${editableMiniTable(state, 'bonusInfo', 'Bonus Info', [
      { key: 'budgetLineItem', label: 'BLI' }, { key: 'category', label: 'Category' }, { key: 'oe', label: 'O/E' }, { key: 'bonusType', label: 'Bonus Type' }, { key: 'amount', label: 'Amount' }, { key: 'installments', label: 'Installments' }, { key: 'initialPaymentPct', label: 'Initial %' }, { key: 'anniversaryPaymentPct', label: 'Anniversary %' }
    ])}
    ${interactiveTable({ title: 'Target Average Initial Bonus', tableId: 'target-average', rows: state.targetAverage, ui: state.ui.tables?.['target-average'], columns: [{ key: 'category', label: 'Category' }, { key: 'targetsByFy', label: 'FY Targets' }] })}
    ${interactiveTable({ title: 'Aggregate Initial Takers', tableId: 'aggregate-takers', rows: state.aggregateTakers, ui: state.ui.tables?.['aggregate-takers'], columns: [{ key: 'category', label: 'Category' }, { key: 'takersByFy', label: 'FY Takers' }] })}
    ${editableMiniTable(state, 'crosswalk', 'Crosswalk Rules Editor', [
      { key: 'matchField', label: 'Match Field' }, { key: 'matchValue', label: 'Raw Code' }, { key: 'category', label: 'Category' }, { key: 'budgetLineItem', label: 'BLI' }, { key: 'oe', label: 'O/E' }, { key: 'bonusType', label: 'Bonus Type' }, { key: 'priority', label: 'Priority' }
    ])}
  `;
}
