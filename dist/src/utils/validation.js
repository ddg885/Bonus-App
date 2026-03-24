export function validateRequiredColumns(rows, required) {
  if (!rows.length) return { valid: false, errors: ['No rows found'] };
  const keys = Object.keys(rows[0]);
  const missing = required.filter((r) => !keys.includes(r));
  return { valid: missing.length === 0, errors: missing.map((m) => `Missing column: ${m}`) };
}

export function numeric(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
