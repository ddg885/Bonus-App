export function applyCrosswalk(normalizedExecutionRows, rules) {
  return normalizedExecutionRows.map((row) => {
    const ordered = [...rules].sort((a, b) => a.priority - b.priority);
    const rule = ordered.find((r) => String(row[r.matchField] ?? '').toUpperCase() === r.matchValue.toUpperCase());
    if (!rule) {
      return {
        ...row,
        category: row.category || 'UNMAPPED',
        budgetLineItem: row.budgetLineItem || 'UNMAPPED',
        oe: row.oe || 'UNK',
        bonusType: row.bonusType || row.rawTypeCode || 'UNKNOWN',
        mappingRuleId: null
      };
    }
    return {
      ...row,
      category: rule.category,
      budgetLineItem: rule.budgetLineItem,
      oe: rule.oe,
      bonusType: rule.bonusType,
      mappingRuleId: rule.id
    };
  });
}
