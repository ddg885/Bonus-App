export const seedCrosswalk = [
  { id: 'cw-1', matchField: 'rawTypeCode', matchValue: 'EAB', category: 'Affiliation', budgetLineItem: 'PS', oe: 'E', bonusType: 'Prior Svc SELRES', priority: 1 },
  { id: 'cw-2', matchField: 'rawTypeCode', matchValue: 'ENB', category: 'Affiliation', budgetLineItem: 'PS', oe: 'E', bonusType: 'Prior Svc SELRES', priority: 2 },
  { id: 'cw-3', matchField: 'rawTypeCode', matchValue: 'NAT', category: 'Accession', budgetLineItem: 'NAT', oe: 'E', bonusType: 'EB SELRES', priority: 3 },
  { id: 'cw-4', matchField: 'rawTypeCode', matchValue: 'OAC', category: 'Accession', budgetLineItem: 'DCO', oe: 'O', bonusType: 'Officer Affiliation/Accession', priority: 4 },
  { id: 'cw-5', matchField: 'rawTypeCode', matchValue: 'OAF', category: 'Affiliation', budgetLineItem: 'NAVET', oe: 'O', bonusType: 'Officer Affiliation/Accession', priority: 5 },
  { id: 'cw-6', matchField: 'rawTypeCode', matchValue: 'REENL', category: 'Retention', budgetLineItem: 'REENL', oe: 'E', bonusType: 'SRB SELRES retention', priority: 6 }
];

export const seedBonusInfo = [
  { id: 'bi-1', budgetLineItem: 'PS', category: 'Affiliation', oe: 'E', bonusType: 'Prior Svc SELRES', tier: 'T1', amount: 20000, payout: 'Installment', term: 4, installments: 4, initialPaymentPct: 50, anniversaryPaymentPct: 50 / 3 },
  { id: 'bi-2', budgetLineItem: 'NAT', category: 'Accession', oe: 'E', bonusType: 'EB SELRES', tier: 'T1', amount: 15000, payout: 'Lump Sum', term: 3, installments: 1, initialPaymentPct: 100, anniversaryPaymentPct: 0 },
  { id: 'bi-3', budgetLineItem: 'DCO', category: 'Accession', oe: 'O', bonusType: 'Officer Affiliation/Accession', tier: 'T2', amount: 25000, payout: 'Installment', term: 4, installments: 4, initialPaymentPct: 40, anniversaryPaymentPct: 20 }
];

export const seedTargetAverage = [
  { category: 'Affiliation', targetsByFy: { FY2026: 11000, FY2027: 11500, FY2028: 12000 } },
  { category: 'Accession', targetsByFy: { FY2026: 14000, FY2027: 14500, FY2028: 15000 } },
  { category: 'Retention', targetsByFy: { FY2026: 12000, FY2027: 12500, FY2028: 13000 } }
];

export const seedControls = [
  { budgetLineItem: 'PS', category: 'Affiliation', oe: 'E', bonusType: 'Prior Svc SELRES', controlsByFy: { FY2026: 900000, FY2027: 920000, FY2028: 940000 } },
  { budgetLineItem: 'NAT', category: 'Accession', oe: 'E', bonusType: 'EB SELRES', controlsByFy: { FY2026: 700000, FY2027: 720000, FY2028: 740000 } }
];

export const seedAggregateTakers = [
  { category: 'Affiliation', takersByFy: { FY2026: 60, FY2027: 62, FY2028: 64 }, sourceRef: 'seed' },
  { category: 'Accession', takersByFy: { FY2026: 45, FY2027: 48, FY2028: 50 }, sourceRef: 'seed' }
];

export const seedExecution = [
  { sourceId: 'ex-1', dodid: '111', rawTypeCode: 'EAB', effectiveDate: '2024-11-01', installmentAmount: 20000, installments: 4, paygrade: 'E6', uic: 'A100', status: 'APPROVED' },
  { sourceId: 'ex-2', dodid: '222', rawTypeCode: 'NAT', effectiveDate: '2025-03-14', installmentAmount: 15000, installments: 1, paygrade: 'E5', uic: 'B200', status: 'APPROVED' },
  { sourceId: 'ex-3', dodid: '333', rawTypeCode: 'OAC', effectiveDate: '2025-07-09', installmentAmount: 25000, installments: 4, paygrade: 'O3', uic: 'C300', status: 'PENDING' }
];
