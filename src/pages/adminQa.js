import { interactiveTable } from '../components/table.js';

const datasetKeys = ['execution', 'bonusInfo', 'targetAverage', 'controls', 'aggregateTakers', 'crosswalk'];

export function adminQaPage(state) {
  const rows = datasetKeys.map((k) => ({ dataset: k, loaded: state.inputStatus[k] ? 'YES' : 'NO', rows: (state[k] || []).length }));
  const checks = [
    { check: 'Execution loaded', result: state.inputStatus.execution ? 'PASS' : 'FAIL' },
    { check: 'Crosswalk loaded', result: state.inputStatus.crosswalk ? 'PASS' : 'FAIL' },
    { check: 'Transformation output rows', result: state.transformed.length > 0 ? 'PASS' : 'WARN' },
    { check: 'Projection output rows', result: state.projections.length > 0 ? 'PASS' : 'WARN' },
    { check: 'Transformation issues', result: state.transformedIssues.length ? 'WARN' : 'PASS' }
  ];

  return `
    <div class="page-header"><div><h2>Admin / QA</h2><p>Operational controls and validation checkpoints for local runs.</p></div></div>
    <section class="panel"><h3>Actions</h3><div class="button-row"><button class="secondary-btn" data-admin-action="load-demo">Load Demo Data</button><button class="secondary-btn danger-btn" data-admin-action="clear-storage">Clear Local Storage</button></div></section>
    ${interactiveTable({ title: 'Loaded Dataset Summary', tableId: 'qa-datasets', rows, ui: state.ui.tables?.['qa-datasets'], columns: [{ key: 'dataset', label: 'Dataset' }, { key: 'loaded', label: 'Loaded' }, { key: 'rows', label: 'Rows' }] })}
    ${interactiveTable({ title: 'Validation Issues', tableId: 'qa-issues', rows: state.transformedIssues, ui: state.ui.tables?.['qa-issues'], columns: [{ key: 'sourceId', label: 'Source' }, { key: 'severity', label: 'Severity' }, { key: 'message', label: 'Message' }] })}
    ${interactiveTable({ title: 'System Checks', tableId: 'qa-checks', rows: checks, ui: state.ui.tables?.['qa-checks'], columns: [{ key: 'check', label: 'Check' }, { key: 'result', label: 'Result' }] })}
    <section class="panel"><h3>Run Metadata</h3><p>Last transform run: ${state.runMeta.transformedAt || 'n/a'}</p><p>Last projection run: ${state.runMeta.projectedAt || 'n/a'}</p></section>
  `;
}
