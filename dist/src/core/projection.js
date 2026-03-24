import { fiscalYearRange } from '../utils/fiscalYear.js';

function categoryTarget(category, fy, targetRows) {
  const row = targetRows.find((r) => r.category === category);
  return row ? Number(row.targetsByFy?.[fy] || 0) : 0;
}

function optionInitial(option) {
  return Number(option.amount || 0) * (Number(option.initialPaymentPct || 0) / 100);
}

function optionAnniversary(option) {
  return Number(option.amount || 0) * (Number(option.anniversaryPaymentPct || 0) / 100);
}

function avgInitial(buckets, takers) {
  const total = buckets.reduce((acc, b) => acc + b.takers * optionInitial(b.opt), 0);
  return takers ? total / takers : 0;
}

function makeScheduleRows(bucket, startFy) {
  const installments = Math.max(1, Number(bucket.opt.installments || bucket.opt.term || 1));
  const rows = [];
  for (let i = 0; i < installments; i += 1) {
    const fy = `FY${Number(startFy.slice(2)) + i}`;
    rows.push({
      payoutFy: fy,
      obligationFy: startFy,
      payoutType: i === 0 ? 'INITIAL' : 'ANNIVERSARY',
      amount: Number(((i === 0 ? optionInitial(bucket.opt) : optionAnniversary(bucket.opt)) * bucket.takers).toFixed(2)),
      takers: bucket.takers
    });
  }
  return rows;
}

export function twoPassDistribution({ aggregateRows, bonusInfoRows, targetRows, fiscalYears }) {
  const projections = [];
  const payoutSchedule = [];
  const explainability = [];

  aggregateRows.forEach((agg) => {
    fiscalYears.forEach((fy) => {
      const takers = Number(agg.takersByFy?.[fy] || 0);
      if (takers <= 0) return;
      const options = bonusInfoRows.filter((b) => b.category === agg.category);
      if (!options.length) return;

      const buckets = options.map((o) => ({ opt: o, takers: Math.floor(takers / options.length) }));
      for (let i = 0; i < takers % options.length; i += 1) buckets[i].takers += 1;

      const target = categoryTarget(agg.category, fy, targetRows);
      const startAvg = avgInitial(buckets, takers);
      let iterations = 0;
      while (Math.abs(avgInitial(buckets, takers) - target) > 1 && iterations < takers * 20) {
        iterations += 1;
        const current = avgInitial(buckets, takers);
        const sorted = [...buckets].sort((a, b) => optionInitial(a.opt) - optionInitial(b.opt));
        const low = sorted[0];
        const high = sorted[sorted.length - 1];
        if (current < target && low.takers > 0 && low !== high) {
          low.takers -= 1; high.takers += 1;
        } else if (current > target && high.takers > 0 && low !== high) {
          high.takers -= 1; low.takers += 1;
        } else break;
      }

      const endAvg = avgInitial(buckets, takers);
      explainability.push({
        category: agg.category,
        fiscalYear: fy,
        totalTakers: takers,
        options: options.length,
        pass1AvgInitial: Number(startAvg.toFixed(2)),
        pass2AvgInitial: Number(endAvg.toFixed(2)),
        targetAverage: target,
        distanceToTarget: Number((endAvg - target).toFixed(2)),
        iterations
      });

      buckets.forEach((bucket) => {
        if (!bucket.takers) return;
        const initial = optionInitial(bucket.opt) * bucket.takers;
        const anniv = optionAnniversary(bucket.opt) * bucket.takers * Math.max(0, Number(bucket.opt.installments || 1) - 1);
        projections.push({
          category: agg.category,
          fiscalYear: fy,
          budgetLineItem: bucket.opt.budgetLineItem,
          oe: bucket.opt.oe,
          bonusType: bucket.opt.bonusType,
          bonusRecordId: bucket.opt.id,
          takers: bucket.takers,
          initialPayoutTotal: Number(initial.toFixed(2)),
          anniversaryPayoutTotal: Number(anniv.toFixed(2)),
          avgInitialPayout: Number(optionInitial(bucket.opt).toFixed(2)),
          targetAverage: target,
          targetVariance: Number((optionInitial(bucket.opt) - target).toFixed(2)),
          sourceRef: agg.sourceRef || `aggregate:${agg.category}`
        });

        makeScheduleRows(bucket, fy).forEach((s, idx) => payoutSchedule.push({
          category: agg.category,
          budgetLineItem: bucket.opt.budgetLineItem,
          oe: bucket.opt.oe,
          bonusType: bucket.opt.bonusType,
          dueDateFy: s.obligationFy,
          payoutFy: s.payoutFy,
          payoutType: s.payoutType,
          takers: s.takers,
          amount: s.amount,
          sequence: idx + 1
        }));
      });
    });
  });

  return { projections, payoutSchedule, explainability };
}

export function buildProjectionFiscalYears(start = 'FY2025', end = 'FY2030') {
  return fiscalYearRange(start, end);
}
