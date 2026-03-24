export function rulesPage(state) {
  return `
    <h2>Data Dictionary / Rules</h2>
    <section class="panel"><h3>Expected datasets</h3><ul>
      <li>Execution / approvals: DoDID, type code, effective date, installments, amount, approval flag/status.</li>
      <li>Bonus info: Budget Line Item, Category, O/E, Bonus Type, Tier, Amount, Payout, Term, Installments, Initial %, Anniversary %.</li>
      <li>Aggregate Initial Takers: Category with FY columns.</li>
      <li>Target Average Initial Bonus: Category with FY columns.</li>
      <li>Controls: BLI/Category/OE/Bonus Type with FY values.</li>
      <li>Crosswalk rules: raw source code mapping to normalized category/BLI/OE/bonus type.</li>
    </ul></section>
    <section class="panel"><h3>Accepted aliases</h3><p>Headers are normalized via alias logic (e.g., "Budget Line Item" => budgetLineItem, "O/E" => oe, "Approval Flag" => status).</p></section>
    <section class="panel"><h3>Fiscal year logic</h3><p>Default FY start month is ${state.settings?.fyStartMonth || 10} (October). Dates on/after the start month roll into the next FY label.</p></section>
    <section class="panel"><h3>Transformation rules</h3><ul>
      <li>Crosswalk runs first to normalize core dimensions.</li>
      <li>Installments produce one payout row per sequence.</li>
      <li>Payout FY derives from payout date; obligation FY derives from obligation/effective date.</li>
      <li>Traceability fields retain source row references.</li>
    </ul></section>
    <section class="panel"><h3>Projection rules</h3><ul>
      <li>Pass 1 evenly distributes category-year takers across eligible bonus options.</li>
      <li>Pass 2 shifts takers one-by-one between lowest/highest initial payouts to approach target average.</li>
      <li>Payout schedules are expanded across installment years for waterfall reporting.</li>
    </ul></section>
    <section class="panel"><h3>Mapping assumptions and validation behavior</h3><ul>
      <li>Unmapped execution codes default to UNMAPPED dimensions and appear in outputs.</li>
      <li>Required-column validation blocks uploads when core fields are missing.</li>
      <li>Non-positive amounts and invalid dates are flagged in the transformation issues panel.</li>
    </ul></section>
  `;
}
