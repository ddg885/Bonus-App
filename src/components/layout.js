export const routes = [
  'Overview',
  'Execution Dashboard',
  'Data Transformation',
  'Inputs and Planning Tables',
  'POM Projections',
  'Payout Waterfall',
  'Data Dictionary / Rules',
  'Admin / QA'
];

const intakeSources = [
  ['execution', 'Execution / Approval Data'],
  ['bonusInfo', 'Bonus Info Table'],
  ['targetAverage', 'Target Average Initial Bonus'],
  ['controls', 'Controls Table'],
  ['aggregateTakers', 'Aggregate Initial Takers'],
  ['crosswalk', 'Crosswalk Table']
];

function uniq(rows, key) {
  return Array.from(new Set((rows || []).map((r) => r?.[key]).filter(Boolean))).sort();
}

function options(values, selected) {
  return values.map((value) => `<option value="${value}" ${selected === value ? 'selected' : ''}>${value}</option>`).join('');
}

function readinessSummary(state) {
  const total = Object.keys(state.inputStatus || {}).length;
  const loaded = Object.values(state.inputStatus || {}).filter(Boolean).length;
  if (loaded === total) return { label: 'Ready', tone: 'positive' };
  if (loaded === 0) return { label: 'Not Ready', tone: 'negative' };
  return { label: `${loaded}/${total} Sources`, tone: 'warning' };
}

function topbar(state) {
  const readiness = readinessSummary(state);
  const filters = state.ui?.globalFilters || {};
  const transformed = state.transformed || [];
  const fyOptions = uniq(transformed, 'payoutFy');
  const categoryOptions = uniq(transformed, 'category');
  const oeOptions = uniq(transformed, 'oe');
  const bonusTypeOptions = uniq(transformed, 'bonusType');
  const statusOptions = uniq(transformed, 'status');

  return `<header class="topbar">
    <div class="topbar-left">
      <div class="readiness-summary">
        <span class="label">Model Readiness</span>
        <span class="badge ${readiness.tone}" id="model-readiness-badge">${readiness.label}</span>
      </div>
      <div id="last-rebuild" class="last-rebuild">Latest rebuild: ${state.runMeta?.projectedAt || 'not yet run'}</div>
    </div>
    <div class="topbar-right">
      <label>Fiscal Year<select id="fy-filter"><option value="">All</option>${options(fyOptions, filters.payoutFy || '')}</select></label>
      <label>Category<select id="category-filter"><option value="">All</option>${options(categoryOptions, filters.category || '')}</select></label>
      <label>O/E<select id="oe-filter"><option value="">All</option>${options(oeOptions, filters.oe || '')}</select></label>
      <label>Bonus Type<select id="bonus-type-filter"><option value="">All</option>${options(bonusTypeOptions, filters.bonusType || '')}</select></label>
      <label>Status<select id="status-filter"><option value="">All</option>${options(statusOptions, filters.status || '')}</select></label>
      <button id="rebuild-model-btn" class="primary-btn">Rebuild Model</button>
      <button id="clear-state-btn" class="secondary-btn danger-btn">Clear Saved State</button>
      <button id="export-view-btn" class="secondary-btn">Export Current View</button>
    </div>
  </header>`;
}

function intakeToolbar(state) {
  const selectedSource = state.ui?.intakeSource || 'execution';
  return `<section class="intake-toolbar">
    <div class="intake-toolbar-left">
      <label>Source Type
        <select id="source-type-selector">${intakeSources.map(([id, label]) => `<option value="${id}" ${selectedSource === id ? 'selected' : ''}>${label}</option>`).join('')}</select>
      </label>
      <input id="file-upload-input" type="file" multiple accept=".csv,.xlsx,.xls" />
    </div>
    <div class="intake-toolbar-actions">
      <button id="load-samples-btn" class="secondary-btn">Reload Bundled Samples</button>
      <span class="subtle">Upload into the selected source. Existing parsing and validation rules are preserved.</span>
    </div>
  </section>`;
}

export function renderLayout(active, content, state) {
  const nav = routes
    .map((r) => `<a href="#${encodeURIComponent(r)}" class="sidebar-link ${active === r ? 'active' : ''}">${r}</a>`)
    .join('');

  return `<div class="app-shell">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-eyebrow">Financial Planning MVP</div>
        <h1 class="brand-title">Bonus Ecosystem Platform</h1>
      </div>
      <nav class="sidebar-nav">${nav}</nav>
    </aside>
    <main class="main-shell">
      ${topbar(state)}
      ${active === 'Execution Dashboard' ? '' : intakeToolbar(state)}
      <section class="page-container">${content}</section>
    </main>
  </div>`;
}
