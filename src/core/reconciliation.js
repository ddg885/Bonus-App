export function calculateBudgetVariance(projectedRows, controls) {
  const grouped = new Map();
  projectedRows.forEach((p) => {
    const key = [p.category, p.budgetLineItem || '', p.oe || '', p.bonusType || '', p.fiscalYear].join('|');
    grouped.set(key, (grouped.get(key) || 0) + Number(p.initialPayoutTotal || 0) + Number(p.anniversaryPayoutTotal || 0));
  });

  const out = [];
  controls.forEach((control) => {
    Object.entries(control.controlsByFy || {}).forEach(([fy, controlAmount]) => {
      const key = [control.category, control.budgetLineItem || '', control.oe || '', control.bonusType || '', fy].join('|');
      const projectedAmount = Number((grouped.get(key) || 0).toFixed(2));
      const variance = Number((projectedAmount - Number(controlAmount || 0)).toFixed(2));
      out.push({
        budgetLineItem: control.budgetLineItem,
        category: control.category,
        oe: control.oe,
        bonusType: control.bonusType,
        fiscalYear: fy,
        projectedAmount,
        controlAmount: Number(controlAmount || 0),
        variance,
        status: variance > 0 ? 'OVER' : variance < 0 ? 'UNDER' : 'ON_PLAN'
      });
    });
  });
  return out;
}
