import { seedAggregateTakers, seedBonusInfo, seedControls, seedCrosswalk, seedExecution, seedTargetAverage } from '../fixtures/seed.js';
import { applyCrosswalk } from '../core/crosswalk.js';
import { transformExecutionToPayoutSchedule } from '../core/transformation.js';
import { buildProjectionFiscalYears, twoPassDistribution } from '../core/projection.js';
import { calculateBudgetVariance } from '../core/reconciliation.js';

const KEY = 'bonus-ecosystem-state-v2';

const initialState = {
  bonusInfo: seedBonusInfo,
  targetAverage: seedTargetAverage,
  controls: seedControls,
  aggregateTakers: seedAggregateTakers,
  crosswalk: seedCrosswalk,
  execution: seedExecution,
  transformed: [],
  transformedIssues: [],
  projections: [],
  projectionPayoutSchedule: [],
  projectionExplainability: [],
  variances: [],
  runMeta: { transformedAt: null, projectedAt: null },
  settings: { fyStartMonth: 10 },
  ui: { tables: {}, dashboard: { filters: {} }, waterfall: { filters: {} } },
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
  const transformResult = transformExecutionToPayoutSchedule(mapped, state.settings?.fyStartMonth || 10);
  const projectionResult = twoPassDistribution({
    aggregateRows: state.aggregateTakers,
    bonusInfoRows: state.bonusInfo,
    targetRows: state.targetAverage,
    fiscalYears: buildProjectionFiscalYears('FY2026', 'FY2032')
  });
  const variances = calculateBudgetVariance(projectionResult.projections, state.controls);
  return {
    ...state,
    transformed: transformResult.rows,
    transformedIssues: transformResult.issues,
    projections: projectionResult.projections,
    projectionPayoutSchedule: projectionResult.payoutSchedule,
    projectionExplainability: projectionResult.explainability,
    variances,
    runMeta: {
      transformedAt: new Date().toISOString(),
      projectedAt: new Date().toISOString()
    }
  };
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
  },
  patchUi(nextUi) {
    this.set({ ui: { ...this.state.ui, ...nextUi } });
  },
  resetDemo() {
    this.set(initialState);
  },
  clearStorage() {
    localStorage.removeItem(KEY);
    this.state = computeDerived(initialState);
    this.listeners.forEach((fn) => fn(this.state));
  }
};
