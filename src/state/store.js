import { seedAggregateTakers, seedBonusInfo, seedControls, seedCrosswalk, seedExecution, seedTargetAverage } from '../fixtures/seed.js';
import { applyCrosswalk } from '../core/crosswalk.js';
import { transformExecutionToPayoutSchedule } from '../core/transformation.js';
import { buildProjectionFiscalYears, twoPassDistribution } from '../core/projection.js';
import { calculateBudgetVariance } from '../core/reconciliation.js';

const KEY = 'bonus-ecosystem-state-v1';

const initialState = {
  bonusInfo: seedBonusInfo,
  targetAverage: seedTargetAverage,
  controls: seedControls,
  aggregateTakers: seedAggregateTakers,
  crosswalk: seedCrosswalk,
  execution: seedExecution,
  transformed: [],
  projections: [],
  variances: [],
  inputStatus: {
    execution: true,
    bonusInfo: true,
    targetAverage: true,
    controls: true,
    aggregateTakers: true,
    crosswalk: true
  }
};

function computeDerived(state) {
  const mapped = applyCrosswalk(state.execution, state.crosswalk);
  const transformed = transformExecutionToPayoutSchedule(mapped);
  const projections = twoPassDistribution({
    aggregateRows: state.aggregateTakers,
    bonusInfoRows: state.bonusInfo,
    targetRows: state.targetAverage,
    fiscalYears: buildProjectionFiscalYears('FY2026', 'FY2028')
  });
  const variances = calculateBudgetVariance(projections, state.controls);
  return { ...state, transformed, projections, variances };
}

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
    return parsed ? computeDerived(parsed) : computeDerived(initialState);
  } catch {
    return computeDerived(initialState);
  }
}

export const store = {
  state: load(),
  listeners: [],
  subscribe(fn) {
    this.listeners.push(fn);
  },
  set(partial) {
    this.state = computeDerived({ ...this.state, ...partial });
    localStorage.setItem(KEY, JSON.stringify(this.state));
    this.listeners.forEach((fn) => fn(this.state));
  }
};
