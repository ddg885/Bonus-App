import { renderLayout } from './components/layout.js';
import { bindInteractiveTables } from './components/table.js';
import { store } from './state/store.js';
import { overviewPage } from './pages/overview.js';
import { executionDashboardPage } from './pages/executionDashboard.js';
import { transformationPage } from './pages/transformation.js';
import { pomInputsPage } from './pages/pomInputs.js';
import { pomProjectionsPage } from './pages/pomProjections.js';
import { payoutWaterfallPage } from './pages/waterfall.js';
import { rulesPage } from './pages/rules.js';
import { adminQaPage } from './pages/adminQa.js';
import { parseCSV, toCSV } from './utils/csv.js';
import { findFiscalYearColumns, normalizeRowHeaders } from './utils/headerNormalization.js';
import { validateRequiredColumns } from './utils/validation.js';
import { parsePlanningWorkbook } from './utils/workbook.js';
import { applyCrosswalk } from './core/crosswalk.js';
import { transformExecutionToPayoutSchedule } from './core/transformation.js';

const app = document.getElementById('app');
const INPUTS_ROUTE = 'Inputs and Planning Tables';
const DATASET_KEYS = ['execution', 'bonusInfo', 'targetAverage', 'controls', 'aggregateTakers', 'crosswalk'];

const pageMap = {
  Overview: overviewPage,
  'Execution Dashboard': executionDashboardPage,
  'Data Transformation': transformationPage,
  [INPUTS_ROUTE]: pomInputsPage,
  'POM Projections': pomProjectionsPage,
  'Payout Waterfall': payoutWaterfallPage,
  'Data Dictionary / Rules': rulesPage,
  'Admin / QA': adminQaPage
};

const required = {
  execution: ['dodid', 'effectiveDate'],
  bonusInfo: ['budgetLineItem', 'category', 'oe', 'bonusType', 'amount'],
  targetAverage: ['category'],
  controls: ['budgetLineItem', 'category', 'oe', 'bonusType'],
  aggregateTakers: ['category'],
  crosswalk: ['matchField', 'matchValue', 'category', 'budgetLineItem', 'oe', 'bonusType']
};

function currentRoute() {
  const hash = decodeURIComponent(location.hash.replace('#', ''));
  return hash || 'Overview';
}

function toMultiValues(selectEl) {
  return Array.from(selectEl.selectedOptions).map((o) => o.value);
}

function triggerDownload(filename, text) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function reshapeRows(datasetKey, rows) {
  if (datasetKey === 'targetAverage') {
    return rows.map((r, idx) => {
      const fyCols = findFiscalYearColumns(r);
      const targetsByFy = Object.fromEntries(fyCols.map((fy) => [fy.toUpperCase(), Number(r[fy] || 0)]));
      return { category: r.category, targetsByFy, sourceId: r.sourceId || `targetAverage-${idx + 1}` };
    });
  }
  if (datasetKey === 'aggregateTakers') {
    return rows.map((r, idx) => {
      const fyCols = findFiscalYearColumns(r);
      const takersByFy = Object.fromEntries(fyCols.map((fy) => [fy.toUpperCase(), Number(r[fy] || 0)]));
      return { category: r.category, takersByFy, sourceRef: r.sourceRef || 'upload', sourceId: r.sourceId || `aggregateTakers-${idx + 1}` };
    });
  }
  if (datasetKey === 'controls') {
    return rows.map((r, idx) => {
      const fyCols = findFiscalYearColumns(r);
      const controlsByFy = Object.fromEntries(fyCols.map((fy) => [fy.toUpperCase(), Number(r[fy] || 0)]));
      return { ...r, controlsByFy, sourceId: r.sourceId || `controls-${idx + 1}` };
    });
  }
  return rows.map((r, idx) => ({ ...r, sourceId: r.sourceId || `${datasetKey}-${idx + 1}` }));
}

function validateAndCastDataset(datasetKey, rows) {
  const normalized = rows.map(normalizeRowHeaders);
  const check = validateRequiredColumns(normalized, required[datasetKey] || []);
  if (!check.valid) return { valid: false, errors: check.errors };
  return { valid: true, rows: reshapeRows(datasetKey, normalized) };
}

function setPomInputsNotice(type, message) {
  store.patchUi({ pomInputs: { notice: { type, message, at: Date.now() } } });
}

function applyUpload(datasetKey, rows) {
  const casted = validateAndCastDataset(datasetKey, rows);
  if (!casted.valid) {
    setPomInputsNotice('error', `Validation failed for ${datasetKey}: ${casted.errors.join('; ')}`);
    return;
  }
  store.updateWorkingDataset(datasetKey, casted.rows, true);
  setPomInputsNotice('success', `${datasetKey} loaded into working state.`);
}

async function applyWorkbookUpload(file) {
  try {
    const workbookData = await parsePlanningWorkbook(file);
    const updates = {};
    const errors = [];
    for (const key of DATASET_KEYS) {
      const casted = validateAndCastDataset(key, workbookData[key] || []);
      if (!casted.valid) {
        errors.push(`${key}: ${casted.errors.join(', ')}`);
        continue;
      }
      updates[key] = casted.rows;
    }

    if (errors.length) {
      setPomInputsNotice('error', `Workbook validation failed. ${errors.join(' | ')}`);
      return;
    }

    store.replaceWorkingInputs(updates, Object.fromEntries(DATASET_KEYS.map((key) => [key, true])));
    setPomInputsNotice('success', `Workbook '${file.name}' loaded into working state.`);
  } catch (error) {
    setPomInputsNotice('error', error?.message || 'Unable to parse workbook.');
  }
}

function bindUploadHandlers() {
  document.querySelectorAll('input[data-upload]').forEach((input) => {
    input.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
        setPomInputsNotice('error', 'Use the workbook uploader on Inputs and Planning Tables for Excel files.');
        return;
      }
      const key = input.getAttribute('data-upload');
      applyUpload(key, parseCSV(await file.text()));
    });
  });

  const sourceSelector = document.getElementById('source-type-selector');
  if (sourceSelector) {
    sourceSelector.addEventListener('change', () => {
      store.patchUi({ intakeSource: sourceSelector.value });
    });
  }

  const toolbarInput = document.getElementById('file-upload-input');
  if (toolbarInput) {
    toolbarInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      const datasetKey = sourceSelector?.value || store.state.ui?.intakeSource || 'execution';
      const csvFiles = files.filter((file) => !file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls'));
      if (!csvFiles.length) {
        setPomInputsNotice('error', 'Use the workbook uploader on Inputs and Planning Tables for Excel files.');
        return;
      }
      const mergedRows = [];
      for (const file of csvFiles) {
        mergedRows.push(...parseCSV(await file.text()));
      }
      applyUpload(datasetKey, mergedRows);
      toolbarInput.value = '';
    });
  }
}


function bindExecutionDashboardActions() {
  const setExecutionDashboardState = (next) => {
    store.patchUi({
      executionDashboard: next,
      dashboard: { filters: {} }
    });
  };

  const setRawExecutionRows = (dashboardState, rows, fileName) => {
    setExecutionDashboardState({
      ...dashboardState,
      fileName,
      rawRows: rows,
      transformedRows: [],
      hasTransformed: false,
      transformedAt: null,
      issues: []
    });
  };

  const setExecutionUploadError = (dashboardState, error, fileName = '') => {
    setExecutionDashboardState({
      ...dashboardState,
      fileName,
      rawRows: [],
      transformedRows: [],
      hasTransformed: false,
      transformedAt: null,
      issues: [error]
    });
  };

  const normalizeExecutionRow = (row, idx) => {
    const normalized = normalizeRowHeaders(row);
    const effectiveDate = normalized.effectiveDate
      || normalized.installmentDate
      || normalized.submissionEffectiveDate
      || '';
    const installmentAmount = normalized.installmentAmount
      || normalized.amount
      || normalized.baseAmount
      || 0;
    return {
      ...normalized,
      effectiveDate,
      installmentAmount: Number(installmentAmount || 0),
      installments: Number(normalized.installments || normalized.installmentNumber || 1) || 1,
      sourceId: normalized.sourceId || `execution-upload-${idx + 1}`
    };
  };

  const validateExecutionColumns = (rows) => validateRequiredColumns(rows, required.execution || []);

  const parseExecutionFile = async (file) => {
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.csv')) {
      return parseCSV(await file.text()).map(normalizeExecutionRow);
    }
    if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
      const XLSX = window.XLSX;
      if (!XLSX) throw new Error('Excel parser is unavailable. Refresh the page and try again.');
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false });
      const executionSheet = workbook.SheetNames.find((sheetName) => {
        const normalized = String(sheetName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return ['execution', 'executionapprovaldata', 'executiondata', 'approvaldata'].includes(normalized);
      }) || workbook.SheetNames[0];
      const sheet = workbook.Sheets[executionSheet];
      return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false }).map(normalizeExecutionRow);
    }
    throw new Error('Invalid file type. Upload a Bonus Execution CSV or Excel file.');
  };

  const handleExecutionFileSelected = async (file) => {
    const dashboardState = store.state.ui?.executionDashboard || {};
    if (!file) {
      setExecutionUploadError(dashboardState, 'No file selected. Choose a Bonus Execution file to continue.');
      return;
    }
    try {
      const rows = await parseExecutionFile(file);
      const validation = validateExecutionColumns(rows);
      if (!validation.valid) {
        setExecutionUploadError(dashboardState, `Validation failed: ${validation.errors.join('; ')}`, file.name);
        return;
      }
      setRawExecutionRows(dashboardState, rows, file.name);
    } catch (error) {
      setExecutionUploadError(dashboardState, error?.message || 'Unable to read or parse Bonus Execution file.', file.name);
    }
  };

  const handleTransformExecutionData = () => {
    const dashboardState = store.state.ui?.executionDashboard || {};
    const rawRows = dashboardState.rawRows || [];
    if (!rawRows.length) {
      store.patchUi({
        executionDashboard: {
          ...dashboardState,
          hasTransformed: false,
          transformedRows: [],
          issues: ['Upload Bonus Execution data before running transforms.']
        }
      });
      return;
    }
    const mapped = applyCrosswalk(rawRows, store.state.crosswalk || []);
    const result = transformExecutionToPayoutSchedule(mapped, store.state.settings?.fyStartMonth || 10);
    store.patchUi({
      executionDashboard: {
        ...dashboardState,
        transformedRows: result.rows,
        issues: result.issues || [],
        hasTransformed: true,
        transformedAt: new Date().toISOString()
      }
    });
  };

  const uploadInput = document.getElementById('execution-dashboard-upload');
  if (uploadInput) {
    uploadInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      await handleExecutionFileSelected(file);
      uploadInput.value = '';
    });
  }

  const transformBtn = document.getElementById('execution-transform-btn');
  if (transformBtn) {
    transformBtn.addEventListener('click', handleTransformExecutionData);
  }

  const clearFiltersBtn = document.getElementById('dashboard-clear-filters');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      store.patchUi({ dashboard: { filters: {} } });
    });
  }
}

function bindDashboardFilters() {
  document.querySelectorAll('[data-dashboard-filter]').forEach((el) => {
    el.addEventListener('change', () => {
      const key = el.dataset.dashboardFilter;
      const filters = { ...(store.state.ui.dashboard?.filters || {}), [key]: toMultiValues(el) };
      store.patchUi({ dashboard: { filters } });
    });
  });
  const search = document.querySelector('[data-dashboard-search]');
  if (search) {
    search.addEventListener('input', () => {
      const filters = { ...(store.state.ui.dashboard?.filters || {}), search: search.value };
      store.patchUi({ dashboard: { filters } });
    });
  }
}

function bindWaterfallFilters() {
  document.querySelectorAll('[data-waterfall-filter]').forEach((el) => {
    el.addEventListener('change', () => {
      const key = el.dataset.waterfallFilter;
      const filters = { ...(store.state.ui.waterfall?.filters || {}), [key]: toMultiValues(el) };
      store.patchUi({ waterfall: { filters } });
    });
  });
}

function setPathValue(target, path, rawText) {
  const keys = path.split('.');
  if (keys.length === 1) {
    const current = target[keys[0]];
    target[keys[0]] = typeof current === 'number' ? Number(rawText || 0) : rawText;
    return;
  }
  let cursor = target;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const part = keys[i];
    if (!cursor[part] || typeof cursor[part] !== 'object') cursor[part] = {};
    cursor = cursor[part];
  }
  const leaf = keys[keys.length - 1];
  const current = cursor[leaf];
  cursor[leaf] = typeof current === 'number' ? Number(rawText || 0) : rawText;
}

function bindInlineEdits() {
  document.querySelectorAll('[data-edit-cell]').forEach((cell) => {
    cell.addEventListener('blur', () => {
      const dataset = cell.dataset.editCell;
      const row = Number(cell.dataset.row);
      const col = cell.dataset.col;
      const clone = [...(store.state.workingInputs?.[dataset] || [])];
      if (!clone[row]) return;
      const rowClone = { ...clone[row] };
      setPathValue(rowClone, col, cell.textContent.trim());
      clone[row] = rowClone;
      store.updateWorkingDataset(dataset, clone, true);
    });
  });
}

function bindPomInputsActions() {
  const commitBtn = document.getElementById('commit-inputs-btn');
  if (commitBtn) {
    commitBtn.addEventListener('click', () => {
      store.commitWorkingInputs();
      setPomInputsNotice('success', 'Inputs and Planning Tables changes committed.');
    });
  }

  const workbookInput = document.getElementById('workbook-upload-input');
  if (workbookInput) {
    workbookInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await applyWorkbookUpload(file);
      workbookInput.value = '';
    });
  }
}

function bindAdminActions() {
  document.querySelectorAll('[data-admin-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.adminAction === 'load-demo') store.resetDemo();
      if (btn.dataset.adminAction === 'clear-storage') store.clearStorage();
    });
  });
}

function bindDatasetExports() {
  document.querySelectorAll('[data-export-dataset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.exportDataset;
      const rows = store.state.workingInputs?.[key] || [];
      triggerDownload(`${key}.csv`, toCSV(rows));
    });
  });
}

function bindTableHandlers() {
  bindInteractiveTables({
    uiTables: store.state.ui.tables || {},
    onUpdate: (tableId, tableState) => {
      const tables = { ...(store.state.ui.tables || {}), [tableId]: tableState };
      store.patchUi({ tables });
    }
  });
}

function render() {
  if (!app) return;
  const route = currentRoute();
  const fn = pageMap[route] || overviewPage;
  app.innerHTML = renderLayout(route, fn(store.state));
  bindUploadHandlers();
  bindExecutionDashboardActions();
  bindDashboardFilters();
  bindWaterfallFilters();
  bindInlineEdits();
  bindPomInputsActions();
  bindAdminActions();
  bindDatasetExports();
  bindTableHandlers();
}

window.addEventListener('hashchange', render);
store.subscribe(render);
render();
