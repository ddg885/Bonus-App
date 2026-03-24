function parseLine(line) {
  const out = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  out.push(current.trim());
  return out;
}

export function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length);
  if (!lines.length) return [];
  const headers = parseLine(lines[0]);
  return lines.slice(1).map((line, idx) => {
    const values = parseLine(line);
    const row = { _row: idx + 2 };
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return row;
  });
}

function csvCell(value) {
  if (value === null || value === undefined) return '';
  const raw = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

export function toCSV(rows) {
  if (!rows.length) return '';
  const headers = Array.from(rows.reduce((acc, row) => {
    Object.keys(row).forEach((k) => acc.add(k));
    return acc;
  }, new Set()));
  const out = [headers.join(',')];
  rows.forEach((r) => out.push(headers.map((h) => csvCell(r[h])).join(',')));
  return out.join('\n');
}
