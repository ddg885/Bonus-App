import { simpleTable } from '../components/table.js';
import { uploadZone } from '../components/uploadZone.js';

export function pomInputsPage(state) {
  const status = state.inputStatus;
  return `
    <h2>POM Inputs</h2>
    <div class="grid-three">
      ${uploadZone('execution', 'Execution / Approval Data', status.execution)}
      ${uploadZone('bonusInfo', 'Bonus Info Table', status.bonusInfo)}
      ${uploadZone('targetAverage', 'Target Average Initial Bonus', status.targetAverage)}
      ${uploadZone('controls', 'Controls / Budget Table', status.controls)}
      ${uploadZone('aggregateTakers', 'Aggregate Initial Takers', status.aggregateTakers)}
      ${uploadZone('crosswalk', 'Crosswalk Mapping', status.crosswalk)}
    </div>
    ${simpleTable({ title: 'Bonus Info', rows: state.bonusInfo, columns: [
      { key: 'budgetLineItem', label: 'BLI' }, { key: 'category', label: 'Category' }, { key: 'oe', label: 'O/E' }, { key: 'bonusType', label: 'Bonus Type' }, { key: 'amount', label: 'Amount' }, { key: 'initialPaymentPct', label: 'Initial %' }
    ] })}
    ${simpleTable({ title: 'Crosswalk Rules', rows: state.crosswalk, columns: [
      { key: 'matchValue', label: 'Raw Code' }, { key: 'category', label: 'Category' }, { key: 'budgetLineItem', label: 'BLI' }, { key: 'oe', label: 'O/E' }, { key: 'bonusType', label: 'Normalized Type' }
    ] })}
  `;
}
