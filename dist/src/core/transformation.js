import { addYears, calculateFiscalYear } from '../utils/fiscalYear.js';

export const transformationAssumptions = [
  'If installments <= 1, entire amount is treated as initial payout in effective-date FY.',
  'For multi-installment records, first installment uses effective date; anniversary installments advance by one year.',
  'Obligation FY is sourced from effective date unless source includes explicit obligation date.'
];

export function transformExecutionToPayoutSchedule(mappedRows) {
  const output = [];
  mappedRows.forEach((row) => {
    const count = Math.max(1, Number(row.installments || 1));
    const total = Number(row.installmentAmount || row.baseAmount || 0);
    const perInstallment = total / count;
    for (let i = 0; i < count; i += 1) {
      const payoutType = i === 0 ? 'INITIAL' : 'ANNIVERSARY';
      const payoutDate = addYears(row.effectiveDate, i);
      output.push({
        id: `${row.sourceId}-${i + 1}`,
        sourceId: row.sourceId,
        category: row.category,
        budgetLineItem: row.budgetLineItem,
        oe: row.oe,
        bonusType: row.bonusType,
        payoutType,
        payoutDate,
        payoutFy: calculateFiscalYear(payoutDate),
        obligationFy: calculateFiscalYear(row.effectiveDate),
        amount: Number(perInstallment.toFixed(2)),
        installmentNumber: i + 1,
        installmentSequence: i + 1,
        trace: { sourceRowId: row.sourceId, ruleId: row.mappingRuleId || undefined }
      });
    }
  });
  return output;
}
