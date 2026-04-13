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

export function renderLayout(active, content) {
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
      <section class="page-container">${content}</section>
    </main>
  </div>`;
}
