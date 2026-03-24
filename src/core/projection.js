import { fiscalYearRange } from '../utils/fiscalYear.js';

function categoryTarget(category, fy, targetRows) {
  const row = targetRows.find((r) => r.category === category);
  return row ? Number(row.targetsByFy[fy] || 0) : 0;
}

export function twoPassDistribution({ aggregateRows, bonusInfoRows, targetRows, fiscalYears }) {
  const projections = [];
  aggregateRows.forEach((agg) => {
    fiscalYears.forEach((fy) => {
      const takers = Number(agg.takersByFy[fy] || 0);
      if (takers <= 0) return;
      const options = bonusInfoRows.filter((b) => b.category === agg.category);
      if (!options.length) return;

      const buckets = options.map((o) => ({ opt: o, takers: Math.floor(takers / options.length) }));
      for (let i = 0; i < takers % options.length; i += 1) buckets[i].takers += 1;

      const target = categoryTarget(agg.category, fy, targetRows);
      const avg = () => {
        const total = buckets.reduce((acc, b) => acc + b.takers * (b.opt.amount * b.opt.initialPaymentPct / 100), 0);
        return takers ? total / takers : 0;
      };

      let iterations = 0;
      while (Math.abs(avg() - target) > 1 && iterations < takers * 20) {
        iterations += 1;
        const current = avg();
        const sort = [...buckets].sort((a, b) => (a.opt.amount * a.opt.initialPaymentPct) - (b.opt.amount * b.opt.initialPaymentPct));
        const low = sort[0];
        const high = sort[sort.length - 1];
        if (current < target && low.takers > 0 && low !== high) {
          low.takers -= 1;
          high.takers += 1;
        } else if (current > target && high.takers > 0 && low !== high) {
          high.takers -= 1;
          low.takers += 1;
        } else {
          break;
        }
      }

      buckets.forEach((bucket) => {
        if (!bucket.takers) return;
        const initial = bucket.opt.amount * (bucket.opt.initialPaymentPct / 100) * bucket.takers;
        const anniversary = bucket.opt.amount * (bucket.opt.anniversaryPaymentPct / 100) * bucket.takers;
        projections.push({
          category: agg.category,
          fiscalYear: fy,
          bonusRecordId: bucket.opt.id,
          takers: bucket.takers,
          initialPayoutTotal: Number(initial.toFixed(2)),
          anniversaryPayoutTotal: Number(anniversary.toFixed(2)),
          avgInitialPayout: Number((initial / bucket.takers).toFixed(2)),
          targetAverage: target,
          targetVariance: Number(((initial / bucket.takers) - target).toFixed(2)),
          sourceRef: agg.sourceRef || `aggregate:${agg.category}`
        });
      });
    });
  });

  return projections;
}

export function buildProjectionFiscalYears(start = 'FY2025', end = 'FY2030') {
  return fiscalYearRange(start, end);
}
