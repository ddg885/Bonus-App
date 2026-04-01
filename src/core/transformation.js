import { addYears, calculateFiscalYear } from '../utils/fiscalYear.js';

export const transformationAssumptions = [
  'Crosswalk mapping is applied before transformation to normalize category/BLI/OE/bonus type.',
  'If installments <= 1, all dollars are initial payout in effective-date FY.',
  'If obligationDate is present, obligation FY uses it; otherwise effective date.',
  'For installment schedules, payout FY increments annually per installment sequence.'
];

export function transformExecutionToPayoutSchedule(mappedRows, fyStartMonth = 10) {
  const output = [];
  const issues = [];
  const stats = {
    sourceRows: mappedRows.length,
    transformedRows: 0,
    skippedInvalidAmount: 0,
    skippedInvalidDate: 0
  };

  mappedRows.forEach((row) => {
    const count = Math.max(1, Number(row.installments || 1));
    const total = Number(row.installmentAmount || row.baseAmount || 0);
    if (!row.effectiveDate || Number.isNaN(new Date(row.effectiveDate).getTime())) {
      stats.skippedInvalidDate += 1;
      return;
    }
    if (!Number.isFinite(total) || total <= 0) {
      stats.skippedInvalidAmount += 1;
      return;
    }

    const perInstallment = count ? total / count : total;
    for (let i = 0; i < count; i += 1) {
      const payoutType = i === 0 ? 'INITIAL' : 'ANNIVERSARY';
      const payoutDate = addYears(row.effectiveDate, i);
      output.push({
        id: `${row.sourceId}-${i + 1}`,
        sourceId: row.sourceId,
        status: row.status || row.approvalFlag || 'UNKNOWN',
        category: row.category,
        budgetLineItem: row.budgetLineItem,
        oe: row.oe,
        bonusType: row.bonusType,
        payoutType,
        payoutDate,
        payoutFy: calculateFiscalYear(payoutDate, fyStartMonth),
        obligationFy: calculateFiscalYear(row.obligationDate || row.effectiveDate, fyStartMonth),
        amount: Number(perInstallment.toFixed(2)),
        initialAmount: i === 0 ? Number(perInstallment.toFixed(2)) : 0,
        anniversaryAmount: i > 0 ? Number(perInstallment.toFixed(2)) : 0,
        installmentNumber: i + 1,
        payoutSequence: i + 1,
        traceSourceRow: row._row || null,
        trace: { sourceRowId: row.sourceId, ruleId: row.mappingRuleId || undefined }
      });
      stats.transformedRows += 1;
    }
  });

  issues.push(`Rows transformed successfully: ${stats.transformedRows}`);
  if (stats.skippedInvalidAmount) issues.push(`Rows skipped (missing/invalid/non-positive amount): ${stats.skippedInvalidAmount}`);
  if (stats.skippedInvalidDate) issues.push(`Rows skipped (missing/invalid payout date): ${stats.skippedInvalidDate}`);

  return { rows: output, issues, stats };
}
