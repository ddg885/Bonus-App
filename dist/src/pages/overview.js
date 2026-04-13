import { metricCards } from '../components/cards.js';
import { stackedColumnChart } from '../components/chart.js';

function executionRows(state) {
  const dashboardRows = state.executionDashboardRuntime?.transformedRows || [];
  if (dashboardRows.length) return dashboardRows;
  return state.transformed || [];
}

function currentFiscalYear(fyStartMonth = 10) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return month >= fyStartMonth ? year + 1 : year;
}

function statusValue(row) {
  return String(row.status || row['Approval Flag'] || '').trim().toLowerCase();
}

function getBonusTrackingNumber(row) {
  return String(
    row['Bonus Tracking Num']
    || row.bonusTrackingNum
    || row.bonusTrackingNumber
    || row.trackNumActual
    || row['Mbr Reserve Bonus Subm Track Num Actual']
    || ''
  ).trim();
}

function sumAmount(rows) {
  return rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
}

function distinctBonuses(rows) {
  return new Set(rows.map(getBonusTrackingNumber).filter(Boolean)).size;
}

export function overviewPage(state) {
  const fyStartMonth = Number(state.settings?.fyStartMonth || 10);
  const currentFY = currentFiscalYear(fyStartMonth);
  const rows = executionRows(state);
  const currentFyRows = rows.filter((row) => Number(row.payoutFy) === currentFY);
  const approved = currentFyRows.filter((row) => statusValue(row) === 'approved');
  const committed = currentFyRows.filter((row) => statusValue(row) === 'committed');
  const approvedAmount = sumAmount(approved);
  const approvedBonusCount = distinctBonuses(approved);
  const committedAmount = sumAmount(committed);
  const committedBonusCount = distinctBonuses(committed);

  return `
    <div class="page-header"><div><h2>Overview</h2><p>Current fiscal year execution summary from transformed execution data.</p></div></div>
    ${metricCards([
      { label: 'APPROVED AMOUNT TO DATE', value: approvedAmount, currency: true, tone: 'positive' },
      { label: 'APPROVED BONUSES TO DATE', value: approvedBonusCount, tone: 'positive' },
      { label: 'COMMITTED AMOUNT REMAINING', value: committedAmount, currency: true, tone: 'warning' },
      { label: 'COMMITTED BONUSES REMAINING', value: committedBonusCount, tone: 'warning' }
    ])}
    ${stackedColumnChart('Current FY Execution', [
      {
        label: `FY${currentFY}`,
        segments: [
          { label: 'Approved', value: approvedAmount, tone: 'approved' },
          { label: 'Committed', value: committedAmount, tone: 'committed' }
        ]
      }
    ])}
  `;
}
