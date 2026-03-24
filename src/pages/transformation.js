import { interactiveTable } from '../components/table.js';
import { transformationAssumptions } from '../core/transformation.js';
import { metricCards } from '../components/cards.js';

export function transformationPage(state) {
  return `
    <h2>Data Transformation Engine</h2>
    ${metricCards([
      { label: 'Output Rows', value: state.transformed.length },
      { label: 'Source Rows', value: state.execution.length },
      { label: 'Validation Issues', value: state.transformedIssues.length }
    ])}
    <section class="panel"><h3>Transformation Rules & Assumptions</h3><ul>${transformationAssumptions.map((a) => `<li>${a}</li>`).join('')}</ul></section>
    ${interactiveTable({
      title: 'Transformed Payout Schedule',
      tableId: 'transformed-schedule',
      rows: state.transformed,
      sticky: true,
      ui: state.ui.tables?.['transformed-schedule'],
      exportName: 'transformed-payout-schedule.csv',
      columns: [
        { key: 'id', label: 'Output ID' },
        { key: 'sourceId', label: 'Source Row ID' },
        { key: 'category', label: 'Category' },
        { key: 'budgetLineItem', label: 'BLI' },
        { key: 'oe', label: 'O/E' },
        { key: 'bonusType', label: 'Bonus Type' },
        { key: 'payoutType', label: 'Payout Type' },
        { key: 'payoutDate', label: 'Payout Date' },
        { key: 'payoutFy', label: 'Payout FY' },
        { key: 'obligationFy', label: 'Obligation FY' },
        { key: 'installmentNumber', label: 'Installment #' },
        { key: 'amount', label: 'Amount' }
      ]
    })}
    ${interactiveTable({
      title: 'Validation / Errors',
      tableId: 'transformed-issues',
      rows: state.transformedIssues,
      ui: state.ui.tables?.['transformed-issues'],
      exportName: 'transformation-issues.csv',
      columns: [
        { key: 'sourceId', label: 'Source ID' },
        { key: 'severity', label: 'Severity' },
        { key: 'message', label: 'Message' }
      ]
    })}
  `;
}
