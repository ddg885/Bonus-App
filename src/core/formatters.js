import { toCSV } from '../utils/csv.js';

export function currency(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v || 0);
}

export function number(v) {
  return new Intl.NumberFormat('en-US').format(v || 0);
}

export function exportRows(filename, rows) {
  const csv = toCSV(rows);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
