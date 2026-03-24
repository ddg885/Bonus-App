import { simpleTable } from '../components/table.js';
import { transformationAssumptions } from '../core/transformation.js';

export function transformationPage(state) {
  return `
    <h2>Data Transformation</h2>
    <section class="panel"><h3>Transformation Rules & Assumptions</h3><ul>${transformationAssumptions.map((a) => `<li>${a}</li>`).join('')}</ul></section>
    ${simpleTable({
      title: 'Traceable Payout Schedule Output',
      rows: state.transformed,
      columns: [
        { key: 'id', label: 'Output ID' },
        { key: 'sourceId', label: 'Source Row ID' },
        { key: 'payoutType', label: 'Type' },
        { key: 'payoutDate', label: 'Payout Date' },
        { key: 'payoutFy', label: 'Payout FY' },
        { key: 'obligationFy', label: 'Obligation FY' },
        { key: 'amount', label: 'Amount' }
      ]
    })}
  `;
}
