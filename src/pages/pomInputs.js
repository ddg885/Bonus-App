import { statusBadge } from '../components/cards.js';

const datasets = [
  ['bonusInfo', 'Bonus Info Table'],
  ['targetAverage', 'Target Average Initial Bonus Table'],
  ['controls', 'Controls Table'],
  ['aggregateTakers', 'Aggregate Initial Takers Table'],
  ['crosswalk', 'Crosswalk Table']
];

function tableRows(state, key) {
  return state.workingInputs?.[key] || [];
}

function getFiscalColumns(rows, sourceKey) {
  const fySet = new Set();
  rows.forEach((row) => {
    Object.keys(row?.[sourceKey] || {}).forEach((fy) => fySet.add(fy));
  });
  return Array.from(fySet).sort();
}

function editableTable(state, key, title, columns) {
  const rows = tableRows(state, key);
  if (!rows.length) return `<section class="panel"><h3>${title}</h3><p class="empty">No rows loaded.</p></section>`;
  const head = columns.map((c) => `<th>${c.label}</th>`).join('');
  const body = rows.map((r, idx) => `<tr>${columns.map((c) => `<td contenteditable="true" data-edit-cell="${key}" data-row="${idx}" data-col="${c.key}">${c.value ? c.value(r) : (r[c.key] ?? '')}</td>`).join('')}</tr>`).join('');
  return `<section class="panel"><h3>${title}</h3><div class="table-wrap"><table class="data-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div><p class="muted">Inline edits update working state immediately; click Commit Changes to apply globally.</p></section>`;
}

function renderNotice(notice) {
  if (!notice?.message) return '';
  return `<section class="panel ${notice.type === 'error' ? 'error-panel' : 'success-panel'}"><strong>${notice.type === 'error' ? 'Error:' : 'Success:'}</strong> ${notice.message}</section>`;
}

function hasWorkingDiff(state) {
  return datasets.some(([key]) => JSON.stringify(state.workingInputs?.[key] || []) !== JSON.stringify(state[key] || []));
}

function crosswalkEditor(state) {
  const rows = state.ui?.pomInputs?.crosswalkEditorRows || [];
  const warning = state.ui?.pomInputs?.crosswalkWarning || '';
  const body = rows.map((row) => `
    <tr>
      <td><input type="text" value="${row.code || ''}" data-crosswalk-cell="code" data-crosswalk-row-id="${row.id}" /></td>
      <td><input type="text" value="${row.bonusType || ''}" data-crosswalk-cell="bonusType" data-crosswalk-row-id="${row.id}" /></td>
      <td><input type="text" value="${row.category || ''}" data-crosswalk-cell="category" data-crosswalk-row-id="${row.id}" /></td>
      <td><input type="text" value="${row.grouped || ''}" data-crosswalk-cell="grouped" data-crosswalk-row-id="${row.id}" /></td>
      <td><button class="danger-btn" data-crosswalk-delete-row="${row.id}">Delete</button></td>
    </tr>
  `).join('');

  return `
    <section class="panel">
      <h3>Execution Crosswalk Editor</h3>
      <div class="intake-toolbar-left">
        <button id="crosswalk-add-row-btn" class="secondary-btn">Add Crosswalk Row</button>
        <button id="crosswalk-reset-default-btn" class="secondary-btn">Reset to Default</button>
      </div>
      <p class="muted">Execution transforms use the values below for this session.</p>
      ${warning ? `<p class="danger">${warning}</p>` : ''}
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Category Code</th>
              <th>Bonus Type</th>
              <th>Category</th>
              <th>Budget Line Item Grouped</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </section>
  `;
}

export function pomInputsPage(state) {
  const status = state.inputStatus;
  const notice = state.ui?.pomInputs?.notice;

  const targetFy = getFiscalColumns(tableRows(state, 'targetAverage'), 'targetsByFy');
  const aggregateFy = getFiscalColumns(tableRows(state, 'aggregateTakers'), 'takersByFy');
  const controlsFy = getFiscalColumns(tableRows(state, 'controls'), 'controlsByFy');

  const commitDisabled = !hasWorkingDiff(state);

  return `
    <div class="page-header"><div><h2>Inputs and Planning Tables</h2><p>Manage working table edits, upload Excel workbooks, and commit approved changes to the global model.</p></div></div>
    ${renderNotice(notice)}
    <section class="panel">
      <h3>Working State Actions</h3>
      <div class="intake-toolbar-left">
        <label>Upload Workbook (.xlsx, .xls)
          <input id="workbook-upload-input" type="file" accept=".xlsx,.xls" />
        </label>
        <button id="commit-inputs-btn" class="primary-btn" ${commitDisabled ? 'disabled' : ''}>Commit Changes</button>
      </div>
      <p class="muted">Workbook uploads replace only the working tables on this page after full validation.</p>
    </section>
    <section class="panel"><h3>Dataset Status</h3><div class="dataset-status">${datasets.map(([k, label]) => `<div><strong>${label}</strong> ${statusBadge(status[k] ? 'Loaded' : 'Missing', status[k] ? 'positive' : 'warning')} <button class="secondary-btn" data-export-dataset="${k}">Export</button></div>`).join('')}</div></section>
    ${editableTable(state, 'bonusInfo', 'Bonus Info Table', [

      { key: 'budgetLineItem', label: 'BLI' }, { key: 'category', label: 'Category' }, { key: 'oe', label: 'O/E' }, { key: 'bonusType', label: 'Bonus Type' }, { key: 'amount', label: 'Amount' }, { key: 'installments', label: 'Installments' }, { key: 'initialPaymentPct', label: 'Initial %' }, { key: 'anniversaryPaymentPct', label: 'Anniversary %' }
    ])}
    ${crosswalkEditor(state)}
    ${editableTable(state, 'targetAverage', 'Target Average Initial Bonus Table', [
      { key: 'category', label: 'Category' },
      ...targetFy.map((fy) => ({ key: `targetsByFy.${fy}`, label: fy, value: (row) => row.targetsByFy?.[fy] ?? '' }))
    ])}
    ${editableTable(state, 'controls', 'Controls Table', [
      { key: 'budgetLineItem', label: 'BLI' },
      { key: 'category', label: 'Category' },
      { key: 'oe', label: 'O/E' },
      { key: 'bonusType', label: 'Bonus Type' },
      ...controlsFy.map((fy) => ({ key: `controlsByFy.${fy}`, label: fy, value: (row) => row.controlsByFy?.[fy] ?? '' }))
    ])}
    ${editableTable(state, 'aggregateTakers', 'Aggregate Initial Takers Table', [
      { key: 'category', label: 'Category' },
      ...aggregateFy.map((fy) => ({ key: `takersByFy.${fy}`, label: fy, value: (row) => row.takersByFy?.[fy] ?? '' }))
    ])}
    ${editableTable(state, 'crosswalk', 'Crosswalk Table', [
      { key: 'matchField', label: 'Match Field' }, { key: 'matchValue', label: 'Raw Code' }, { key: 'category', label: 'Category' }, { key: 'budgetLineItem', label: 'BLI' }, { key: 'oe', label: 'O/E' }, { key: 'bonusType', label: 'Bonus Type' }, { key: 'priority', label: 'Priority' }
    ])}
  `;
}
