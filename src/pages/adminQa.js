import { simpleTable } from '../components/table.js';

export function adminQaPage(state) {
  const checks = [
    { name: 'Execution loaded', status: state.inputStatus.execution ? 'PASS' : 'FAIL' },
    { name: 'Crosswalk loaded', status: state.inputStatus.crosswalk ? 'PASS' : 'FAIL' },
    { name: 'Transformation output rows', status: state.transformed.length > 0 ? 'PASS' : 'WARN' },
    { name: 'Projection output rows', status: state.projections.length > 0 ? 'PASS' : 'WARN' }
  ];
  return `<h2>Admin / QA</h2>${simpleTable({ title: 'System Checks', rows: checks, columns: [{ key: 'name', label: 'Check' }, { key: 'status', label: 'Result' }] })}`;
}
