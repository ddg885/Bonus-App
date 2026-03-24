import { renderLayout } from './components/layout.js';
import { store } from './state/store.js';
import { overviewPage } from './pages/overview.js';
import { executionDashboardPage } from './pages/executionDashboard.js';
import { transformationPage } from './pages/transformation.js';
import { pomInputsPage } from './pages/pomInputs.js';
import { pomProjectionsPage } from './pages/pomProjections.js';
import { payoutWaterfallPage } from './pages/waterfall.js';
import { rulesPage } from './pages/rules.js';
import { adminQaPage } from './pages/adminQa.js';
import { parseCSV } from './utils/csv.js';
import { normalizeRowHeaders } from './utils/headerNormalization.js';
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
  execution: ['dodid', 'typeCode', 'effectiveDate', 'installmentAmount'],
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

function render() {
  const route = currentRoute();
  const fn = pageMap[route] || overviewPage;
  app.innerHTML = renderLayout(route, fn(store.state));
  bindUploadHandlers();
}

function applyUpload(datasetKey, rows) {
  const normalized = rows.map(normalizeRowHeaders);
  const check = validateRequiredColumns(normalized, required[datasetKey] || []);
  if (!check.valid) {
    alert(`Validation failed for ${datasetKey}:\n${check.errors.join('\n')}`);
    return;
  }

  const casted = normalized.map((r, idx) => ({ ...r, sourceId: r.sourceId || `${datasetKey}-${idx + 1}` }));
  const patch = { [datasetKey]: casted, inputStatus: { ...store.state.inputStatus, [datasetKey]: true } };
  store.set(patch);
}

function bindUploadHandlers() {
  document.querySelectorAll('input[data-upload]').forEach((input) => {
    input.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const key = input.getAttribute('data-upload');
      const name = file.name.toLowerCase();
      if (name.endsWith('.xlsx')) {
        alert('XLSX recognized. For this MVP runtime, convert XLSX to CSV before upload.');
        return;
      }
      const text = await file.text();
      applyUpload(key, parseCSV(text));
    });
  });
}

window.addEventListener('hashchange', render);
store.subscribe(render);
render();
