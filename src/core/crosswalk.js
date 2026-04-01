export const CATEGORY_CROSSWALK = {
  EAB: { category: 'Affiliation', budgetLineItem: 'PS', combinedBudgetLineItem: 'PS' },
  ENB: { category: 'Affiliation', budgetLineItem: 'PS', combinedBudgetLineItem: 'PS' },
  NAT: { category: 'Accession', budgetLineItem: 'EB SELRES', combinedBudgetLineItem: 'EB SELRES' },
  OAC: { category: 'Accession', budgetLineItem: 'Officer Affiliation/Accession', combinedBudgetLineItem: 'Officer Affiliation/Accession' },
  OAF: { category: 'Affiliation', budgetLineItem: 'Officer Affiliation/Accession', combinedBudgetLineItem: 'Officer Affiliation/Accession' },
  REENL: { category: 'Retention', budgetLineItem: 'SRB SELRES', combinedBudgetLineItem: 'SRB SELRES' },
  R10: { category: 'Retention', budgetLineItem: 'HPO', combinedBudgetLineItem: 'Officer Retention Bonus' },
  R15: { category: 'Retention', budgetLineItem: 'HPO', combinedBudgetLineItem: 'Officer Retention Bonus' },
  R17: { category: 'Retention', budgetLineItem: 'HPO', combinedBudgetLineItem: 'Officer Retention Bonus' },
  R20: { category: 'Retention', budgetLineItem: 'HPO', combinedBudgetLineItem: 'Officer Retention Bonus' },
  R25: { category: 'Retention', budgetLineItem: 'HPO', combinedBudgetLineItem: 'Officer Retention Bonus' },
  R30: { category: 'Retention', budgetLineItem: 'HPO', combinedBudgetLineItem: 'Officer Retention Bonus' },
  R35: { category: 'Retention', budgetLineItem: 'HPO', combinedBudgetLineItem: 'Officer Retention Bonus' },
  R40: { category: 'Retention', budgetLineItem: 'HPO', combinedBudgetLineItem: 'Officer Retention Bonus' },
  R45: { category: 'Retention', budgetLineItem: 'HPO', combinedBudgetLineItem: 'Officer Retention Bonus' },
  R50: { category: 'Retention', budgetLineItem: 'HPO', combinedBudgetLineItem: 'Officer Retention Bonus' },
  R60: { category: 'Retention', budgetLineItem: 'HPO', combinedBudgetLineItem: 'Officer Retention Bonus' },
  R12: { category: 'Retention', budgetLineItem: 'GENOFF-RET', combinedBudgetLineItem: 'Officer Retention Bonus' },
  S12: { category: 'Retention', budgetLineItem: 'GENOFF-RET', combinedBudgetLineItem: 'Officer Retention Bonus' }
};

export function applyCrosswalk(rows) {
  return rows;
}
