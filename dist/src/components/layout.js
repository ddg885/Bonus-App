export const routes = [
  'Overview',
  'Execution Dashboard',
  'Data Transformation',
  'POM Inputs',
  'POM Projections',
  'Payout Waterfall',
  'Data Dictionary / Rules',
  'Admin / QA'
];

export function renderLayout(active, content) {
  const nav = routes.map((r) => `<a href="#${encodeURIComponent(r)}" class="nav-item ${active === r ? 'active' : ''}">${r}</a>`).join('');
  return `<div class="app-shell"><aside class="sidebar"><h1>Bonus Ecosystem</h1>${nav}</aside><main class="content">${content}</main></div>`;
}
