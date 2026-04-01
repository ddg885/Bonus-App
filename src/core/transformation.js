import { CATEGORY_CROSSWALK } from './crosswalk.js';
import { fiscalYear } from '../utils/fiscalYear.js';

const EXCLUDED_CATEGORY_CODES = new Set(['SRB10', 'SRB15']);
const ALLOWED_INSTALLMENT_STATUS = new Set(['P', 'S', '']);

const EXECUTION_COLUMN_ALIASES = {
  categoryCode: ['Mbr Reserve Bonus Subm Category Code', 'Category Code', 'Bonus Category Code', 'categoryCode'],
  bonusType: ['Mbr Reserve Bonus Subm Type', 'Bonus Type', 'bonusType'],
  approvalDate: ['Approval Date', 'Mbr Reserve Bonus Subm Approval Date', 'approvalDate'],
  dueDate: ['Mbr Reserve Bonus Subm Install Effdt', 'Due Date', 'Installment Eff Date', 'effectiveDate', 'dueDate'],
  installmentAmount: ['Mbr Reserve Bonus Subm Install Amount', 'Installment Amount', 'Amount', 'installmentAmount'],
  installmentNumber: ['Mbr Reserve Bonus Subm Install Num', 'Installment Number', 'installmentNumber'],
  bonusRateRank: ['Mbr Reserve Bonus Subm Rate Rank', 'Bonus Rate Rank', 'bonusRateRank'],
  bonusDesignator: ['Mbr Reserve Bonus Subm Desig Cd', 'Bonus Designator', 'Designator', 'bonusDesignator'],
  installmentStatus: ['Bonus Installment Status Ind', 'Installment Status', 'installmentStatus'],
  dodid: ['DODID', 'DoD ID', 'dodid'],
  memberPaygrade: ['Member Paygrade', 'Paygrade', 'memberPaygrade'],
  reserveUIC: ['Reserve UIC Indicator', 'Reserve UIC', 'reserveUIC'],
  bonusId: ['Bonus ID', 'Agreement ID', 'Contract ID', 'bonusId']
};

export function transformExecutionToPayoutSchedule(rawRows) {
  const normalized = rawRows
    .map((row, idx) => normalizeExecutionRow(row, idx))
    .filter(Boolean)
    .map(deriveExecutionFields)
    .filter(Boolean);

  const combinedLookup = buildCombinedBudgetLineItemLookup(normalized);
  const rows = normalized.map((row) => ({
    ...row,
    budgetLineItemCombined: combinedLookup.get(row.groupingKey) || row.combinedBudgetLineItem || row.budgetLineItem || 'Unmapped',
    amount: row.installmentAmount,
    status: row.approvalFlag,
    payoutType: row.payout,
    payoutFy: row.payoutFY,
    oe: row.o_e,
    budgetLineItem: combinedLookup.get(row.groupingKey) || row.combinedBudgetLineItem || row.budgetLineItem || 'Unmapped'
  }));

  return { rows, issues: [], stats: { sourceRows: rawRows.length, transformedRows: rows.length, skippedInvalidAmount: 0, skippedInvalidDate: 0 } };
}

function normalizeExecutionRow(raw, index) {
  const categoryCode = String(getByAlias(raw, EXECUTION_COLUMN_ALIASES.categoryCode) || '').trim();
  if (!categoryCode || EXCLUDED_CATEGORY_CODES.has(categoryCode)) return null;

  const installmentStatus = String(getByAlias(raw, EXECUTION_COLUMN_ALIASES.installmentStatus) || '').trim();
  if (!ALLOWED_INSTALLMENT_STATUS.has(installmentStatus)) return null;

  return {
    _rowIndex: index,
    raw,
    categoryCode,
    bonusType: String(getByAlias(raw, EXECUTION_COLUMN_ALIASES.bonusType) || '').trim(),
    approvalDate: parseDate(getByAlias(raw, EXECUTION_COLUMN_ALIASES.approvalDate)),
    dueDate: parseDate(getByAlias(raw, EXECUTION_COLUMN_ALIASES.dueDate)),
    installmentAmount: parseNumber(getByAlias(raw, EXECUTION_COLUMN_ALIASES.installmentAmount)),
    installmentNumber: parseInteger(getByAlias(raw, EXECUTION_COLUMN_ALIASES.installmentNumber)),
    bonusRateRank: String(getByAlias(raw, EXECUTION_COLUMN_ALIASES.bonusRateRank) || '').trim(),
    bonusDesignator: String(getByAlias(raw, EXECUTION_COLUMN_ALIASES.bonusDesignator) || '').trim(),
    installmentStatus,
    dodid: String(getByAlias(raw, EXECUTION_COLUMN_ALIASES.dodid) || '').trim(),
    memberPaygrade: String(getByAlias(raw, EXECUTION_COLUMN_ALIASES.memberPaygrade) || '').trim(),
    reserveUIC: String(getByAlias(raw, EXECUTION_COLUMN_ALIASES.reserveUIC) || '').trim(),
    bonusId: String(getByAlias(raw, EXECUTION_COLUMN_ALIASES.bonusId) || '').trim()
  };
}

function deriveExecutionFields(row) {
  const crosswalk = CATEGORY_CROSSWALK[row.categoryCode] || {};
  const bonusRating = cleanBonusRateRank(row.bonusRateRank);
  const bonusRatingDesignator = `${bonusRating}${row.bonusDesignator}`.trim();
  const o_e = /^\d/.test(bonusRatingDesignator) ? 'Officer' : 'Enlisted';
  const approvalFlag = row.approvalDate ? 'Approved' : 'Committed';
  const payout = row.installmentNumber === 1 ? 'Initial' : 'Anniversary';
  const payoutFY = derivePayoutFY(row.approvalDate, row.dueDate, row.installmentNumber);

  const budgetLineItem = crosswalk.budgetLineItem || 'Unmapped';
  const combinedBudgetLineItem = crosswalk.combinedBudgetLineItem || budgetLineItem;
  const category = crosswalk.category || 'Unmapped';

  const distinctBonusKey = row.bonusId || `${row.dodid}|${row.categoryCode}|${row.bonusType}|${bonusRatingDesignator}`;
  const groupingKey = `${category}|${combinedBudgetLineItem}|${o_e}|${row.categoryCode}|${bonusRatingDesignator}`;

  return { ...row, bonusRating, bonusRatingDesignator, o_e, approvalFlag, payout, payoutFY, category, budgetLineItem, combinedBudgetLineItem, distinctBonusKey, groupingKey };
}

function buildCombinedBudgetLineItemLookup(rows) {
  const grouped = new Map();
  rows.forEach((row) => {
    if (!grouped.has(row.groupingKey)) grouped.set(row.groupingKey, new Set());
    grouped.get(row.groupingKey).add(row.payout);
  });
  const map = new Map();
  rows.forEach((row) => {
    const payouts = grouped.get(row.groupingKey) || new Set();
    map.set(row.groupingKey, payouts.has('Initial') && payouts.has('Anniversary') ? row.combinedBudgetLineItem || row.budgetLineItem : row.budgetLineItem);
  });
  return map;
}

function derivePayoutFY(approvalDate, dueDate, installmentNumber) {
  if (approvalDate) return fiscalYear(approvalDate);
  if (!dueDate) return null;
  const base = fiscalYear(dueDate);
  return (installmentNumber || 1) <= 1 ? base : base + (installmentNumber - 1);
}

function getByAlias(row, aliases) {
  for (const alias of aliases) {
    if (alias in row) return row[alias];
  }
  return '';
}

function cleanBonusRateRank(value) {
  return String(value || '').replace(/[^A-Za-z0-9]/g, '').trim().toUpperCase();
}

function parseDate(value) {
  if (value == null || value === '') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseNumber(value) {
  if (value == null || value === '') return 0;
  const cleaned = typeof value === 'number' ? value : String(value).replace(/[$,()%]/g, '').trim();
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function parseInteger(value) {
  return Math.trunc(parseNumber(value));
}
