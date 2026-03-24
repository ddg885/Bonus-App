import { toCSV } from '../utils/csv.js';

function fmt(v) {
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return v ?? '';
}

function downloadCsv(filename, rows) {
  const blob = new Blob([toCSV(rows)], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function tableState(ui = {}, columns = [], rowCount = 0, defaultPageSize = 25) {
  const visible = ui.visibleColumns?.length ? ui.visibleColumns : columns.map((c) => c.key);
  const pageSize = Number(ui.pageSize || defaultPageSize);
  const page = Math.max(1, Number(ui.page || 1));
  return {
    sortKey: ui.sortKey || columns[0]?.key,
    sortDir: ui.sortDir || 'asc',
    visible,
    pageSize,
    page,
    totalPages: Math.max(1, Math.ceil(rowCount / pageSize))
  };
}

export function sortRows(rows, sortKey, sortDir) {
  const dir = sortDir === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
    return String(av ?? '').localeCompare(String(bv ?? '')) * dir;
  });
}

export function interactiveTable({ title, tableId, rows, columns, ui = {}, sticky = false, defaultPageSize = 25, exportName }) {
  if (!rows.length) return `<section class="panel table-panel"><h3>${title}</h3><p class="empty">No data available.</p></section>`;
  const t = tableState(ui, columns, rows.length, defaultPageSize);
  const sorted = sortRows(rows, t.sortKey, t.sortDir);
  const start = (Math.min(t.page, t.totalPages) - 1) * t.pageSize;
  const paged = sorted.slice(start, start + t.pageSize);
  const visibleColumns = columns.filter((c) => t.visible.includes(c.key));

  const colToggles = columns.map((c) => `<label><input type="checkbox" data-table-col-toggle="${tableId}" value="${c.key}" ${t.visible.includes(c.key) ? 'checked' : ''}/> ${c.label}</label>`).join('');
  const header = visibleColumns.map((c) => `<th><button class="th-sort" data-table-sort="${tableId}" data-key="${c.key}">${c.label}${t.sortKey === c.key ? (t.sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</button></th>`).join('');
  const body = paged.map((r) => `<tr>${visibleColumns.map((c) => `<td>${fmt(r[c.key])}</td>`).join('')}</tr>`).join('');

  return `<section class="panel table-panel">
    <h3>${title}</h3>
    <div class="table-toolbar">
      <button class="secondary-btn" data-table-export="${tableId}">Export CSV</button>
      <label>Page size <select data-table-pagesize="${tableId}">${[10, 25, 50, 100].map((n) => `<option value="${n}" ${n === t.pageSize ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label>Page <input data-table-page="${tableId}" type="number" min="1" max="${t.totalPages}" value="${Math.min(t.page, t.totalPages)}"/></label>
      <details><summary>Columns</summary><div class="col-toggle-list">${colToggles}</div></details>
    </div>
    <div class="table-wrap ${sticky ? 'sticky' : ''}"><table class="data-table"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></div>
    <p class="muted">Showing ${paged.length} of ${rows.length} rows.</p>
    <script type="application/json" id="table-data-${tableId}">${JSON.stringify(sorted)}</script>
    <script type="application/json" id="table-export-${tableId}">${JSON.stringify(exportName || `${tableId}.csv`)}</script>
  </section>`;
}

export function bindInteractiveTables({ uiTables, onUpdate }) {
  document.querySelectorAll('[data-table-sort]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.tableSort;
      const key = btn.dataset.key;
      const t = uiTables[id] || {};
      const nextDir = t.sortKey === key && t.sortDir === 'asc' ? 'desc' : 'asc';
      onUpdate(id, { ...t, sortKey: key, sortDir: nextDir });
    });
  });

  document.querySelectorAll('[data-table-col-toggle]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const id = cb.dataset.tableColToggle;
      const set = new Set(uiTables[id]?.visibleColumns || []);
      if (cb.checked) set.add(cb.value); else set.delete(cb.value);
      onUpdate(id, { ...(uiTables[id] || {}), visibleColumns: Array.from(set), page: 1 });
    });
  });

  document.querySelectorAll('[data-table-pagesize]').forEach((s) => {
    s.addEventListener('change', () => {
      const id = s.dataset.tablePagesize;
      onUpdate(id, { ...(uiTables[id] || {}), pageSize: Number(s.value), page: 1 });
    });
  });

  document.querySelectorAll('[data-table-page]').forEach((input) => {
    input.addEventListener('change', () => {
      const id = input.dataset.tablePage;
      onUpdate(id, { ...(uiTables[id] || {}), page: Number(input.value) || 1 });
    });
  });

  document.querySelectorAll('[data-table-export]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.tableExport;
      const rows = JSON.parse(document.getElementById(`table-data-${id}`)?.textContent || '[]');
      const filename = JSON.parse(document.getElementById(`table-export-${id}`)?.textContent || '"export.csv"');
      downloadCsv(filename, rows);
    });
  });
}
