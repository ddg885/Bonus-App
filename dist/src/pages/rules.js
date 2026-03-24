export function rulesPage() {
  return `
    <h2>Data Dictionary / Rules</h2>
    <section class="panel">
      <h3>Core Domains</h3>
      <ul>
        <li>Bonus Info: BLI, category, O/E, bonus type, amount and payout profile.</li>
        <li>Execution rows normalized using header variants and mapped via editable crosswalk.</li>
        <li>Projection engine distributes aggregate takers using two-pass balancing toward target average initial bonus.</li>
        <li>Budget controls compared against projected obligations and payout streams by fiscal year.</li>
      </ul>
    </section>
  `;
}
