function parseNumber(value) {
  if (value == null || value === '') return 0;
  const cleaned = typeof value === 'number' ? value : String(value).replace(/[$,()%]/g, '').trim();
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function parseInteger(value) {
  return Math.trunc(parseNumber(value));
}

function average(values) {
  const valid = values.filter((v) => Number.isFinite(v));
  if (!valid.length) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function weightedAverage(values, weights) {
  const numerator = values.reduce((sum, value, i) => sum + value * (weights[i] || 0), 0);
  const denominator = weights.reduce((sum, value) => sum + value, 0);
  return denominator ? numerator / denominator : 0;
}

function normalizeBonusInfoRow(row) {
  const normalized = { ...row };
  if (!('Anniversary Payment %' in normalized) && 'Anniversary Payment%' in normalized) {
    normalized['Anniversary Payment %'] = normalized['Anniversary Payment%'];
  }
  return normalized;
}

function getInitialPaymentAmount(row) {
  return parseNumber(row.Amount || row['Amount']) * (parseNumber(row['Initial Payment %']) / 100);
}

function getAnniversaryPaymentAmount(row) {
  const amount = parseNumber(row['Amount']);
  const annPct = parseNumber(row['Anniversary Payment %']);
  const installments = Math.max(1, parseInteger(row['Installments']) || 1);
  if (annPct > 0) return (amount * annPct) / 100;
  if (installments <= 1) return 0;
  const initialAmount = getInitialPaymentAmount(row);
  return Math.max(0, amount - initialAmount) / (installments - 1);
}

function deriveDueDateFYFromRow(row) {
  const explicit = parseInteger(row['Due Date FY'] ?? row['Start FY'] ?? row.FY);
  return explicit || new Date().getUTCFullYear();
}

function buildTargetAverageMap(rows) {
  const map = new Map();
  rows.forEach((row) => {
    const keys = Object.keys(row || {});
    const categoryKey = keys.find((k) => k.toLowerCase().includes('category'));
    const valueKey = keys.find((k) => k.toLowerCase().includes('target') || k.toLowerCase().includes('average'));
    if (!categoryKey || !valueKey) return;
    const category = String(row[categoryKey] || '').trim();
    if (category) map.set(category, parseNumber(row[valueKey]));
  });
  return map;
}

function buildAggregateTakerMap(rows) {
  const map = new Map();
  rows.forEach((row) => {
    const keys = Object.keys(row || {});
    const categoryKey = keys.find((k) => k.toLowerCase().includes('category'));
    const valueKey = keys.find((k) => k.toLowerCase().includes('taker'));
    if (!categoryKey || !valueKey) return;
    const category = String(row[categoryKey] || '').trim();
    if (category) map.set(category, parseInteger(row[valueKey]));
  });
  return map;
}

function uniqueSorted(values) {
  return [...new Set(values.filter((v) => v != null && v !== ''))].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
}

export function twoPassDistribution({ aggregateRows, bonusInfoRows, targetRows }) {
  const pomData = {
    bonusInfo: (bonusInfoRows || []).map((row) => ({
      Category: row.category ?? row.Category ?? '',
      'Budget Line Item': row.budgetLineItem ?? row['Budget Line Item'] ?? '',
      'O/E': row.oe ?? row['O/E'] ?? '',
      'Bonus Type': row.bonusType ?? row['Bonus Type'] ?? '',
      Tier: row.tier ?? row.Tier ?? '',
      Amount: row.amount ?? row.Amount ?? 0,
      Payout: row.payout ?? row.Payout ?? '',
      Term: row.term ?? row.Term ?? '',
      Installments: row.installments ?? row.Installments ?? 1,
      'Initial Payment %': row.initialPaymentPct ?? row['Initial Payment %'] ?? 0,
      'Anniversary Payment %': row.anniversaryPaymentPct ?? row['Anniversary Payment %'] ?? 0
    })),
    targetAverageInitialBonus: targetRows || [],
    aggregateInitialTakers: aggregateRows || []
  };

  const result = buildProjectionResult(pomData);

  const projections = result.distributionRows.map((row) => ({
    category: row.Category,
    fiscalYear: `FY${deriveDueDateFYFromRow(row)}`,
    budgetLineItem: row['Budget Line Item'],
    oe: row['O/E'],
    bonusType: row['Bonus Type'],
    takers: row['Assigned Takers'],
    avgInitialPayout: row['Initial Payment Amount'],
    targetAverage: 0,
    targetVariance: 0,
    initialPayoutTotal: row['Assigned Takers'] * row['Initial Payment Amount'],
    anniversaryPayoutTotal: row['Assigned Takers'] * row['Anniversary Payment Amount'] * Math.max(0, parseInteger(row.Installments) - 1)
  }));

  const payoutSchedule = result.scheduleRows.map((row, index) => ({
    category: row.Category,
    budgetLineItem: row['Budget Line Item'],
    oe: row['O/E'],
    dueDateFy: `FY${row['Due Date FY']}`,
    payoutFy: `FY${row['Payout FY']}`,
    payoutType: row.Payout.toUpperCase(),
    takers: row.Takers,
    amount: row.Amount,
    sequence: index + 1
  }));

  return { projections, payoutSchedule, explainability: [] };
}

function buildProjectionResult(pomData) {
  const bonusInfo = (pomData.bonusInfo || []).map(normalizeBonusInfoRow).filter((row) => String(row.Category || '').trim());
  const targetMap = buildTargetAverageMap(pomData.targetAverageInitialBonus || []);
  const takerMap = buildAggregateTakerMap(pomData.aggregateInitialTakers || []);

  const distributionRows = [];
  const scheduleRows = [];

  uniqueSorted(bonusInfo.map((r) => r.Category)).forEach((category) => {
    const categoryRows = bonusInfo.filter((r) => r.Category === category);
    const totalTakers = takerMap.get(category) || 0;
    const targetAverage = targetMap.get(category) || average(categoryRows.map(getInitialPaymentAmount));

    const assigned = twoPassDistribute(categoryRows, totalTakers, targetAverage);

    assigned.forEach((assignedTakers, idx) => {
      const row = categoryRows[idx];
      const initialPaymentAmount = getInitialPaymentAmount(row);
      const anniversaryPaymentAmount = getAnniversaryPaymentAmount(row);
      const installments = Math.max(1, parseInteger(row.Installments) || 1);
      const dueDateFY = deriveDueDateFYFromRow(row);

      distributionRows.push({ ...row, 'Initial Payment Amount': initialPaymentAmount, 'Anniversary Payment Amount': anniversaryPaymentAmount, 'Assigned Takers': assignedTakers });

      if (assignedTakers <= 0) return;
      scheduleRows.push({ Category: row.Category, 'Budget Line Item': row['Budget Line Item'], 'O/E': row['O/E'], 'Due Date FY': dueDateFY, Payout: 'Initial', 'Payout FY': dueDateFY, Takers: assignedTakers, Amount: assignedTakers * initialPaymentAmount });
      for (let i = 1; i <= Math.max(0, installments - 1); i += 1) {
        scheduleRows.push({ Category: row.Category, 'Budget Line Item': row['Budget Line Item'], 'O/E': row['O/E'], 'Due Date FY': dueDateFY, Payout: 'Anniversary', 'Payout FY': dueDateFY + i, Takers: assignedTakers, Amount: assignedTakers * anniversaryPaymentAmount });
      }
    });
  });

  return { distributionRows, scheduleRows };
}

function twoPassDistribute(rows, totalTakers, targetAverage) {
  const n = rows.length;
  const assigned = Array(n).fill(0);
  if (!n || !totalTakers || totalTakers <= 0) return assigned;

  const base = Math.floor(totalTakers / n);
  for (let i = 0; i < n; i += 1) assigned[i] = base;
  for (let i = 0; i < totalTakers % n; i += 1) assigned[i] += 1;

  const initialAmounts = rows.map(getInitialPaymentAmount);
  let improved = true;
  while (improved) {
    improved = false;
    const currentGap = Math.abs(weightedAverage(initialAmounts, assigned) - targetAverage);
    let bestMove = null;
    let bestGap = currentGap;

    for (let from = 0; from < n; from += 1) {
      if (assigned[from] <= 0) continue;
      for (let to = 0; to < n; to += 1) {
        if (from === to) continue;
        const next = [...assigned];
        next[from] -= 1;
        next[to] += 1;
        const nextGap = Math.abs(weightedAverage(initialAmounts, next) - targetAverage);
        if (nextGap + 1e-9 < bestGap) {
          bestGap = nextGap;
          bestMove = { from, to };
        }
      }
    }

    if (bestMove) {
      assigned[bestMove.from] -= 1;
      assigned[bestMove.to] += 1;
      improved = true;
    }
  }

  return assigned;
}

export function buildProjectionFiscalYears(start = 'FY2025', end = 'FY2030') {
  const startYear = Number(start.replace('FY', ''));
  const endYear = Number(end.replace('FY', ''));
  const out = [];
  for (let y = startYear; y <= endYear; y += 1) out.push(`FY${y}`);
  return out;
}
