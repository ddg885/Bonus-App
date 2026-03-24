export function simpleTable({ title, rows, columns, sticky = false }) {
  if (!rows.length) return `<section class="panel"><h2>${title}</h2><p class="empty">No data available.</p></section>`;
  const head = columns.map((c) => `<th>${c.label}</th>`).join('');
  const body = rows.map((r) => `<tr>${columns.map((c) => `<td>${r[c.key] ?? ''}</td>`).join('')}</tr>`).join('');
  return `<section class="panel"><h2>${title}</h2><div class="table-wrap ${sticky ? 'sticky' : ''}"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div></section>`;
}
