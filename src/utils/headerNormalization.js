const aliases = {
  budgetlineitem: 'budgetLineItem',
  budget_line_item: 'budgetLineItem',
  category: 'category',
  oe: 'oe',
  o_e: 'oe',
  bonustype: 'bonusType',
  bonus_type: 'bonusType',
  tier: 'tier',
  amount: 'amount',
  payout: 'payout',
  term: 'term',
  installments: 'installments',
  initialpayment: 'initialPaymentPct',
  initialpaymentpct: 'initialPaymentPct',
  anniversarypayment: 'anniversaryPaymentPct',
  anniversarypaymentpct: 'anniversaryPaymentPct',
  dodid: 'dodid',
  typecode: 'typeCode',
  effectivedate: 'effectiveDate',
  mbrreservebonussubmeffectivedate: 'effectiveDate',
  reservbonussubmeffectivedate: 'effectiveDate',
  mbrreservebonuseffectivedate: 'effectiveDate',
  installmentamount: 'installmentAmount',
  mbrreservebonusamount: 'installmentAmount',
  reservebonusamount: 'installmentAmount',
  bonusauthorizedamount: 'installmentAmount',
  amountauthorized: 'installmentAmount',
  installmenteffectivedate: 'installmentDate',
  installmentnumber: 'installmentNumber',
  numberofinstallments: 'installments',
  installmentcount: 'installments',
  paygrade: 'paygrade',
  uic: 'uic',
  approvalflag: 'status',
  approvalstatus: 'status',
  bonusapprovalflag: 'status'
};

export function normalizeHeader(input) {
  const key = input.toLowerCase().replace(/[^a-z0-9]/g, '');
  return aliases[key] || input;
}

export function normalizeRowHeaders(row) {
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [normalizeHeader(k), v]));
}

export function findFiscalYearColumns(row) {
  return Object.keys(row).filter((k) => /^fy\d{4}$/i.test(k));
}
