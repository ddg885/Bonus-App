export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line, idx) => {
    const values = line.split(',').map((v) => v.trim());
    const row = { _row: idx + 2 };
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return row;
  });
}

export function toCSV(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const out = [headers.join(',')];
  rows.forEach((r) => out.push(headers.map((h) => `${r[h] ?? ''}`).join(',')));
  return out.join('\n');
}
