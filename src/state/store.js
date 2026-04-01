import { seedAggregateTakers, seedBonusInfo, seedControls, seedCrosswalk, seedExecution, seedTargetAverage } from '../fixtures/seed.js';
import { applyCrosswalk } from '../core/crosswalk.js';
import { transformExecutionToPayoutSchedule } from '../core/transformation.js';
import { buildProjectionFiscalYears, twoPassDistribution } from '../core/projection.js';
import { calculateBudgetVariance } from '../core/reconciliation.js';

const KEY = 'bonus-ecosystem-state-v2';
const DATASET_KEYS = ['execution', 'bonusInfo', 'targetAverage', 'controls', 'aggregateTakers', 'crosswalk'];
let persistenceDisabled = false;

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

const initialState = {
  bonusInfo: seedBonusInfo,
  targetAverage: seedTargetAverage,
  controls: seedControls,
  aggregateTakers: seedAggregateTakers,
  crosswalk: seedCrosswalk,
  execution: seedExecution,
  workingInputs: {
    bonusInfo: seedBonusInfo,
    targetAverage: seedTargetAverage,
    controls: seedControls,
    aggregateTakers: seedAggregateTakers,
    crosswalk: seedCrosswalk,
    execution: seedExecution
  },
  transformed: [],
  transformedIssues: [],
  projections: [],
  projectionPayoutSchedule: [],
  projectionExplainability: [],
  variances: [],
  runMeta: { transformedAt: null, projectedAt: null },
  settings: { fyStartMonth: 10 },
  ui: { tables: {}, dashboard: { filters: {} }, waterfall: { filters: {} }, pomInputs: {} },
  inputStatus: {
    execution: true,
    bonusInfo: true,
    targetAverage: true,
    controls: true,
    aggregateTakers: true,
    crosswalk: true
  }
};

function deepClone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function pickCommitted(state) {
  return Object.fromEntries(DATASET_KEYS.map((key) => [key, ensureArray(state[key])]));
}

function buildWorkingInputs(state, committed) {
  const existing = state.workingInputs || {};
  return Object.fromEntries(DATASET_KEYS.map((key) => [
    key,
    Array.isArray(existing[key]) ? existing[key] : deepClone(committed[key])
  ]));
}

function computeDerived(state) {
  const committed = pickCommitted(state);
  const mapped = applyCrosswalk(committed.execution, committed.crosswalk);
  const transformResult = transformExecutionToPayoutSchedule(mapped, state.settings?.fyStartMonth || 10);
  const projectionResult = twoPassDistribution({
    aggregateRows: committed.aggregateTakers,
    bonusInfoRows: committed.bonusInfo,
    targetRows: committed.targetAverage,
    fiscalYears: buildProjectionFiscalYears('FY2026', 'FY2032')
  });
  const variances = calculateBudgetVariance(projectionResult.projections, committed.controls);
  return {
    ...state,
    ...committed,
    workingInputs: buildWorkingInputs(state, committed),
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

function pickPersistedUi(ui = {}) {
  const executionDashboard = ui.executionDashboard || {};
  const tables = Object.fromEntries(Object.entries(ui.tables || {}).map(([tableId, tableUi]) => [tableId, {
    sortKey: tableUi?.sortKey || '',
    sortDir: tableUi?.sortDir || 'asc',
    pageSize: Number(tableUi?.pageSize || 25),
    page: Number(tableUi?.page || 1),
    visibleColumns: Array.isArray(tableUi?.visibleColumns) ? tableUi.visibleColumns : []
  }]));
  return {
    tables,
    dashboard: { filters: ui.dashboard?.filters || {} },
    waterfall: { filters: ui.waterfall?.filters || {} },
    pomInputs: ui.pomInputs || {},
    intakeSource: ui.intakeSource || '',
    executionDashboard: {
      fileName: executionDashboard.fileName || '',
      rawRowCount: Number(executionDashboard.rawRowCount || 0),
      transformedRowCount: Number(executionDashboard.transformedRowCount || 0),
      hasTransformed: Boolean(executionDashboard.hasTransformed),
      transformedAt: executionDashboard.transformedAt || null,
      issues: Array.isArray(executionDashboard.issues) ? executionDashboard.issues : []
    }
  };
}

function serializeForStorage(state) {
  return {
    settings: state.settings || initialState.settings,
    ui: pickPersistedUi(state.ui),
    inputStatus: state.inputStatus || initialState.inputStatus
  };
}

function persistState(state) {
  if (persistenceDisabled) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(serializeForStorage(state)));
  } catch (error) {
    if (error?.name === 'QuotaExceededError') persistenceDisabled = true;
    console.warn('Unable to persist app state; continuing with in-memory state only.', error);
  }
}

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
    return parsed ? computeDerived({ ...initialState, ...parsed }) : computeDerived(initialState);
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
    persistState(this.state);
    this.listeners.forEach((fn) => fn(this.state));
  },
  patchUi(nextUi) {
    this.set({ ui: { ...this.state.ui, ...nextUi } });
  },
  updateWorkingDataset(datasetKey, rows, status = true) {
    const nextWorking = { ...this.state.workingInputs, [datasetKey]: rows };
    this.set({
      workingInputs: nextWorking,
      inputStatus: { ...this.state.inputStatus, [datasetKey]: status }
    });
  },
  replaceWorkingInputs(nextWorkingInputs, statusMap = {}) {
    this.set({
      workingInputs: { ...this.state.workingInputs, ...nextWorkingInputs },
      inputStatus: { ...this.state.inputStatus, ...statusMap }
    });
  },
  commitWorkingInputs() {
    const committed = Object.fromEntries(DATASET_KEYS.map((key) => [key, deepClone(this.state.workingInputs[key] || [])]));
    this.set(committed);
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
