export function calculateFiscalYear(dateInput, fyStartMonth = 10) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date: ${dateInput}`);
  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();
  return month >= fyStartMonth ? `FY${year + 1}` : `FY${year}`;
}

export function fiscalYearRange(startFy, endFy) {
  const s = Number(startFy.replace('FY', ''));
  const e = Number(endFy.replace('FY', ''));
  const out = [];
  for (let y = s; y <= e; y += 1) out.push(`FY${y}`);
  return out;
}

export function addYears(dateInput, years) {
  const d = new Date(dateInput);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d.toISOString().slice(0, 10);
}

export function fiscalYear(dateInput) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;
  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();
  return month >= 10 ? year + 1 : year;
}
