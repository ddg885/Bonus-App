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

const app = document.getElementById('app');

const pageMap = {
  Overview: overviewPage,
  'Execution Dashboard': executionDashboardPage,
  'Data Transformation': transformationPage,
  'POM Inputs': pomInputsPage,
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

function applyUpload(datasetKey, rows) {
  const normalized = rows.map(normalizeRowHeaders);
  const check = validateRequiredColumns(normalized, required[datasetKey] || []);
  if (!check.valid) {
    alert(`Validation failed for ${datasetKey}:\n${check.errors.join('\n')}`);
    return;
  }
  const casted = reshapeRows(datasetKey, normalized);
  store.set({ [datasetKey]: casted, inputStatus: { ...store.state.inputStatus, [datasetKey]: true } });
}

function bindUploadHandlers() {
  document.querySelectorAll('input[data-upload]').forEach((input) => {
    input.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.name.toLowerCase().endsWith('.xlsx')) {
        alert('XLSX recognized. Convert to CSV for this runtime.');
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
      const csvFiles = files.filter((file) => !file.name.toLowerCase().endsWith('.xlsx'));
      if (!csvFiles.length) {
        alert('XLSX recognized. Convert to CSV for this runtime.');
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

function bindInlineEdits() {
  document.querySelectorAll('[data-edit-cell]').forEach((cell) => {
    cell.addEventListener('blur', () => {
      const dataset = cell.dataset.editCell;
      const row = Number(cell.dataset.row);
      const col = cell.dataset.col;
      const clone = [...store.state[dataset]];
      if (!clone[row]) return;
      clone[row] = { ...clone[row], [col]: cell.textContent.trim() };
      store.set({ [dataset]: clone });
    });
  });
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
      triggerDownload(`${key}.csv`, toCSV(store.state[key] || []));
    });
  });
}

function bindShellActions() {
  const filterKeyMap = {
    'fy-filter': 'payoutFy',
    'category-filter': 'category',
    'oe-filter': 'oe',
    'bonus-type-filter': 'bonusType',
    'status-filter': 'status'
  };

  Object.entries(filterKeyMap).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
      const value = el.value;
      const globalFilters = { ...(store.state.ui.globalFilters || {}), [key]: value };
      const dashboardFilters = { ...(store.state.ui.dashboard?.filters || {}), [key]: value ? [value] : [] };
      const waterfallFilters = { ...(store.state.ui.waterfall?.filters || {}) };
      if (['category', 'oe', 'payoutFy'].includes(key)) waterfallFilters[key] = value ? [value] : [];
      store.patchUi({ globalFilters, dashboard: { filters: dashboardFilters }, waterfall: { filters: waterfallFilters } });
    });
  });

  document.getElementById('rebuild-model-btn')?.addEventListener('click', () => {
    store.set({});
  });

  document.getElementById('clear-state-btn')?.addEventListener('click', () => {
    store.clearStorage();
  });

  document.getElementById('load-samples-btn')?.addEventListener('click', () => {
    store.resetDemo();
  });

  document.getElementById('export-view-btn')?.addEventListener('click', () => {
    const route = currentRoute();
    const filename = `${route.toLowerCase().replace(/\s+/g, '-')}-view.csv`;
    const rows = route === 'Execution Dashboard' ? store.state.transformed : route === 'Payout Waterfall' ? store.state.projectionPayoutSchedule : store.state.projections;
    triggerDownload(filename, toCSV(rows));
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
  const route = currentRoute();
  const fn = pageMap[route] || overviewPage;
  app.innerHTML = renderLayout(route, fn(store.state), store.state);
  bindUploadHandlers();
  bindDashboardFilters();
  bindWaterfallFilters();
  bindInlineEdits();
  bindAdminActions();
  bindDatasetExports();
  bindShellActions();
  bindTableHandlers();
}

window.addEventListener('hashchange', render);
store.subscribe(render);
render();
