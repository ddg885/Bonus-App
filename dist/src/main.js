import { renderLayout } from './components/layout.js';
import { bindInteractiveTables } from './components/table.js';
import { store } from './state/store.js';
import { overviewPage } from './pages/overview.js';
import { executionDashboardPage } from './pages/executionDashboard.js';
import { transformationPage } from './pages/transformation.js';
import { pomInputsPage } from './pages/pomInputs.js';
import { pomProjectionsPage } from './pages/pomProjections.js';
import { payoutWaterfallPage } from './pages/waterfall.js';
import { rulesPage } from './pages/rules.js';
import { adminQaPage } from './pages/adminQa.js';
import { parseCSV, toCSV } from './utils/csv.js';
import { findFiscalYearColumns, normalizeRowHeaders } from './utils/headerNormalization.js';
import { validateRequiredColumns } from './utils/validation.js';
import { parsePlanningWorkbook } from './utils/workbook.js';

const app = document.getElementById('app');
const INPUTS_ROUTE = 'Inputs and Planning Tables';
const DATASET_KEYS = ['execution', 'bonusInfo', 'targetAverage', 'controls', 'aggregateTakers', 'crosswalk'];

const pageMap = {
  Overview: overviewPage,
  'Execution Dashboard': executionDashboardPage,
  'Data Transformation': transformationPage,
  [INPUTS_ROUTE]: pomInputsPage,
  'POM Projections': pomProjectionsPage,
  'Payout Waterfall': payoutWaterfallPage,
  'Data Dictionary / Rules': rulesPage,
  'Admin / QA': adminQaPage
};

const required = {
  execution: ['dodid'],
  bonusInfo: ['budgetLineItem', 'category', 'oe', 'bonusType', 'amount'],
  targetAverage: ['category'],
  controls: ['budgetLineItem', 'category', 'oe', 'bonusType'],
  aggregateTakers: ['category'],
  crosswalk: ['matchField', 'matchValue', 'category', 'budgetLineItem', 'oe', 'bonusType']
};

const DEFAULT_CROSSWALK_ROWS = [
  { code: 'EAB', bonusType: 'Affiliation', category: 'PS', grouped: 'Prior Svc SELRES' },
  { code: 'ENB', bonusType: 'Affiliation', category: 'PS', grouped: 'Prior Svc SELRES' },
  { code: 'NAT', bonusType: 'Accession', category: 'NAT', grouped: 'EB SELRES' },
  { code: 'OAC', bonusType: 'Accession', category: 'DCO', grouped: 'Officer Affiliation/Accession Bonus' },
  { code: 'OAF', bonusType: 'Affiliation', category: 'NAVET', grouped: 'Officer Affiliation/Accession Bonus' },
  { code: 'R10', bonusType: 'CWSB', category: 'HPO', grouped: 'Officer Retention Bonus' },
  { code: 'R12', bonusType: 'Retention', category: 'GENOFF-RET', grouped: 'Officer Retention Bonus' },
  { code: 'R15', bonusType: 'CWSB', category: 'HPO', grouped: 'Officer Retention Bonus' },
  { code: 'R17', bonusType: 'CWSB', category: 'HPO', grouped: 'Officer Retention Bonus' },
  { code: 'R20', bonusType: 'CWSB', category: 'HPO', grouped: 'Officer Retention Bonus' },
  { code: 'R25', bonusType: 'CWSB', category: 'HPO', grouped: 'Officer Retention Bonus' },
  { code: 'R30', bonusType: 'CWSB', category: 'HPO', grouped: 'Officer Retention Bonus' },
  { code: 'R35', bonusType: 'CWSB', category: 'HPO', grouped: 'Officer Retention Bonus' },
  { code: 'R40', bonusType: 'CWSB', category: 'HPO', grouped: 'Officer Retention Bonus' },
  { code: 'R45', bonusType: 'CWSB', category: 'HPO', grouped: 'Officer Retention Bonus' },
  { code: 'R50', bonusType: 'CWSB', category: 'HPO', grouped: 'Officer Retention Bonus' },
  { code: 'R60', bonusType: 'CWSB', category: 'HPO', grouped: 'Officer Retention Bonus' },
  { code: 'R75', bonusType: 'CWSB', category: 'HPO', grouped: 'Officer Retention Bonus' },
  { code: 'REENL', bonusType: 'Retention', category: 'SRB SELRES', grouped: 'SRB SELRES' },
  { code: 'S12', bonusType: 'Retention', category: 'GENOFF-RET', grouped: 'Officer Retention Bonus' }
];

let crosswalkRows = DEFAULT_CROSSWALK_ROWS.map((r, i) => ({ id: `cw-${i + 1}`, ...r }));
let crosswalkRowCounter = crosswalkRows.length;

function validateCrosswalkRows(rows) {
  const seen = new Set();
  const duplicates = new Set();
  rows.forEach((row) => {
    const code = String(row.code || '').trim().toUpperCase();
    if (!code) return;
    if (seen.has(code)) duplicates.add(code);
    seen.add(code);
  });
  return {
    valid: duplicates.size === 0,
    warning: duplicates.size ? `Duplicate category code(s) detected. Last row wins for: ${Array.from(duplicates).join(', ')}` : ''
  };
}

function buildCrosswalkMapFromRows() {
  const map = new Map();
  crosswalkRows.forEach((row) => {
    const code = String(row.code || '').trim().toUpperCase();
    if (!code) return;
    map.set(code, {
      bonusType: String(row.bonusType || '').trim(),
      category: String(row.category || '').trim(),
      grouped: String(row.grouped || '').trim()
    });
  });
  return map;
}

function currentRoute() {
  const hash = decodeURIComponent(location.hash.replace('#', ''));
  return hash || 'Overview';
}

function toMultiValues(selectEl) {
  return Array.from(selectEl.selectedOptions).map((o) => o.value);
}

function triggerDownload(filename, text) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function reshapeRows(datasetKey, rows) {
  if (datasetKey === 'targetAverage') {
    return rows.map((r, idx) => {
      const fyCols = findFiscalYearColumns(r);
      const targetsByFy = Object.fromEntries(fyCols.map((fy) => [fy.toUpperCase(), Number(r[fy] || 0)]));
      return { category: r.category, targetsByFy, sourceId: r.sourceId || `targetAverage-${idx + 1}` };
    });
  }
  if (datasetKey === 'aggregateTakers') {
    return rows.map((r, idx) => {
      const fyCols = findFiscalYearColumns(r);
      const takersByFy = Object.fromEntries(fyCols.map((fy) => [fy.toUpperCase(), Number(r[fy] || 0)]));
      return { category: r.category, takersByFy, sourceRef: r.sourceRef || 'upload', sourceId: r.sourceId || `aggregateTakers-${idx + 1}` };
    });
  }
  if (datasetKey === 'controls') {
    return rows.map((r, idx) => {
      const fyCols = findFiscalYearColumns(r);
      const controlsByFy = Object.fromEntries(fyCols.map((fy) => [fy.toUpperCase(), Number(r[fy] || 0)]));
      return { ...r, controlsByFy, sourceId: r.sourceId || `controls-${idx + 1}` };
    });
  }
  return rows.map((r, idx) => ({ ...r, sourceId: r.sourceId || `${datasetKey}-${idx + 1}` }));
}

function validateAndCastDataset(datasetKey, rows) {
  const normalized = rows.map(normalizeRowHeaders);
  const check = validateRequiredColumns(normalized, required[datasetKey] || []);
  if (!check.valid) return { valid: false, errors: check.errors };
  return { valid: true, rows: reshapeRows(datasetKey, normalized) };
}

function setPomInputsNotice(type, message) {
  store.patchUi({ pomInputs: { notice: { type, message, at: Date.now() } } });
}

function applyUpload(datasetKey, rows) {
  const casted = validateAndCastDataset(datasetKey, rows);
  if (!casted.valid) {
    setPomInputsNotice('error', `Validation failed for ${datasetKey}: ${casted.errors.join('; ')}`);
    return;
  }
  store.updateWorkingDataset(datasetKey, casted.rows, true);
  setPomInputsNotice('success', `${datasetKey} loaded into working state.`);
}

async function applyWorkbookUpload(file) {
  try {
    const workbookData = await parsePlanningWorkbook(file);
    const updates = {};
    const errors = [];
    for (const key of DATASET_KEYS) {
      const casted = validateAndCastDataset(key, workbookData[key] || []);
      if (!casted.valid) {
        errors.push(`${key}: ${casted.errors.join(', ')}`);
        continue;
      }
      updates[key] = casted.rows;
    }

    if (errors.length) {
      setPomInputsNotice('error', `Workbook validation failed. ${errors.join(' | ')}`);
      return;
    }

    store.replaceWorkingInputs(updates, Object.fromEntries(DATASET_KEYS.map((key) => [key, true])));
    setPomInputsNotice('success', `Workbook '${file.name}' loaded into working state.`);
  } catch (error) {
    setPomInputsNotice('error', error?.message || 'Unable to parse workbook.');
  }
}

function bindUploadHandlers() {
  document.querySelectorAll('input[data-upload]').forEach((input) => {
    input.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
        setPomInputsNotice('error', 'Use the workbook uploader on Inputs and Planning Tables for Excel files.');
        return;
      }
      const key = input.getAttribute('data-upload');
      applyUpload(key, parseCSV(await file.text()));
    });
  });

  const sourceSelector = document.getElementById('source-type-selector');
  if (sourceSelector) {
    sourceSelector.addEventListener('change', () => {
      store.patchUi({ intakeSource: sourceSelector.value });
    });
  }

  const toolbarInput = document.getElementById('file-upload-input');
  if (toolbarInput) {
    toolbarInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      const datasetKey = sourceSelector?.value || store.state.ui?.intakeSource || 'execution';
      const csvFiles = files.filter((file) => !file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls'));
      if (!csvFiles.length) {
        setPomInputsNotice('error', 'Use the workbook uploader on Inputs and Planning Tables for Excel files.');
        return;
      }
      const mergedRows = [];
      for (const file of csvFiles) {
        mergedRows.push(...parseCSV(await file.text()));
      }
      applyUpload(datasetKey, mergedRows);
      toolbarInput.value = '';
    });
  }
}


function bindExecutionDashboardActions() {
  const getRuntimeDashboardState = () => store.state.executionDashboardRuntime || { rawRows: [], transformedRows: [], pendingFileName: '' };
  const patchRuntimeDashboardState = (next) => {
    store.set({ executionDashboardRuntime: next });
  };
  const resetDashboardFilters = () => {
    store.patchUi({ dashboard: { filters: {} } });
  };

  const setExecutionDashboardState = (next) => {
    store.patchUi({
      executionDashboard: next,
      dashboard: { filters: {} }
    });
  };

  const setRawExecutionRows = (dashboardState, rows, fileName) => {
    patchRuntimeDashboardState({
      ...getRuntimeDashboardState(),
      rawRows: rows,
      transformedRows: [],
      pendingFileName: fileName
    });
    setExecutionDashboardState({
      ...dashboardState,
      fileName: '',
      rawRowCount: 0,
      transformedRowCount: 0,
      hasTransformed: false,
      transformedAt: null,
      issues: []
    });
  };

  const setExecutionUploadError = (dashboardState, error, fileName = '') => {
    patchRuntimeDashboardState({
      ...getRuntimeDashboardState(),
      rawRows: [],
      transformedRows: [],
      pendingFileName: ''
    });
    setExecutionDashboardState({
      ...dashboardState,
      fileName,
      rawRowCount: 0,
      transformedRowCount: 0,
      hasTransformed: false,
      transformedAt: null,
      issues: [error]
    });
  };

  const parseExecutionAmount = (value) => {
    if (value == null) return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    const cleaned = String(value).trim().replace(/[$,]/g, '');
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const trimText = (value) => (value == null ? '' : String(value).trim());
  const upperTrimText = (value) => trimText(value).toUpperCase();

  const parseIntSafe = (value) => {
    if (value == null || value === '') return null;
    if (typeof value === 'number') return Number.isFinite(value) ? Math.trunc(value) : null;
    const cleaned = String(value).trim().replace(/[,$]/g, '');
    if (!cleaned) return null;
    const parsed = Number.parseInt(cleaned, 10);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const parseDate = (value) => {
    if (value == null || value === '') return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    if (typeof value === 'number' && Number.isFinite(value)) {
      const excelEpoch = Date.UTC(1899, 11, 30);
      const asDate = new Date(excelEpoch + Math.round(value) * 24 * 60 * 60 * 1000);
      return Number.isNaN(asDate.getTime()) ? null : asDate;
    }
    const text = String(value).trim();
    if (!text) return null;
    if (/^\d+(\.\d+)?$/.test(text)) {
      const serial = Number(text);
      if (Number.isFinite(serial)) {
        const excelEpoch = Date.UTC(1899, 11, 30);
        const asDate = new Date(excelEpoch + Math.round(serial) * 24 * 60 * 60 * 1000);
        if (!Number.isNaN(asDate.getTime())) return asDate;
      }
    }
    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const cleanBonusRating = (value) => {
    const raw = trimText(value).replace(/\s+/g, '');
    if (!raw) return '';
    if (/(CM|CS)$/i.test(raw)) return raw.slice(0, -2);
    if (/(A|N|R)$/i.test(raw)) return raw.slice(0, -2);
    if (/C$/i.test(raw)) return raw.slice(0, -1);
    if (/\d$/.test(raw)) return raw.slice(0, -1);
    return raw;
  };

  const fyFromDate = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
    return date.getMonth() + 1 >= 10 ? date.getFullYear() + 1 : date.getFullYear();
  };

  const isBlankRow = (row) => Object.values(row || {}).every((value) => trimText(value) === '');

  const assignBonusOrder = (rows) => {
    const earliestEventByKey = new Map();
    rows.forEach((row) => {
      const dodid = trimText(row.DODID);
      const trackingNum = trimText(row['Bonus Tracking Num']);
      const dueDate = row['Due Date'];
      if (!dodid || !trackingNum || !(dueDate instanceof Date) || Number.isNaN(dueDate.getTime())) return;
      const key = `${dodid}||${trackingNum}`;
      const existing = earliestEventByKey.get(key);
      if (!existing || dueDate < existing) earliestEventByKey.set(key, dueDate);
    });

    const eventsByDodid = new Map();
    earliestEventByKey.forEach((eventStartDate, key) => {
      const [dodid, trackingNum] = key.split('||');
      if (!eventsByDodid.has(dodid)) eventsByDodid.set(dodid, []);
      eventsByDodid.get(dodid).push({ dodid, trackingNum, eventStartDate });
    });

    const eventIndex = new Map();
    eventsByDodid.forEach((events, dodid) => {
      events
        .sort((a, b) => (
          a.eventStartDate.getTime() - b.eventStartDate.getTime()
          || String(a.trackingNum).localeCompare(String(b.trackingNum))
        ))
        .forEach((event, idx) => {
          eventIndex.set(`${dodid}||${event.trackingNum}`, {
            BonusOrder: idx + 1,
            EventStartDate: event.eventStartDate
          });
        });
    });

    return eventIndex;
  };

  const applyHpoSubtype = (row) => {
    const submType = trimText(row['Mbr Reserve Bonus Subm Type']).toLowerCase();
    const ratingDesignator = trimText(row.Bonus_Rating_Designator || row['Bonus Rating_Designator']);
    const hasKeyword = ['critical wartime', 'retention bonus', 'officer retention'].some((key) => submType.includes(key));
    const hasCode = ['2105', '2205', '2305', '2905'].some((code) => ratingDesignator.includes(code));
    if (!hasKeyword || !hasCode) return null;
    if (row.BonusOrder === 1) return 'AB';
    if (row.BonusOrder > 1) return 'RB';
    return null;
  };

  const countDistinctBonusesByMember = (rows) => {
    const tracker = new Map();
    rows.forEach((row) => {
      const dodid = trimText(row.DODID);
      const trackingNum = trimText(row['Bonus Tracking Num']);
      if (!dodid || !trackingNum) return;
      if (!tracker.has(dodid)) tracker.set(dodid, new Set());
      tracker.get(dodid).add(trackingNum);
    });
    const result = new Map();
    tracker.forEach((set, dodid) => result.set(dodid, set.size));
    return result;
  };

  const applyTransforms = (rows) => {
    const crosswalkMap = buildCrosswalkMapFromRows();
    const ineligibleDutyStatCodes = new Set([147, 247, 248, 500, 900]);
    const parsedRows = rows
      .filter((r) => !isBlankRow(r))
      .map((r) => {
        const code = upperTrimText(r['Mbr Reserve Bonus Subm Category Code'] || r.rawTypeCode) || null;
        const cw = crosswalkMap.get(code) || {};
        const installNum = parseIntSafe(r['Mbr Reserve Bonus Subm Install Num'] ?? r.installmentNumber) || 1;
        const approvalDate = parseDate(r['Mbr Reserve Bonus Subm Install Process Dttm']);
        const dueDate = parseDate(r['Mbr Reserve Bonus Subm Effective Date'] ?? r.effectiveDate ?? r['Due Date']);
        const installmentDueDate = parseDate(r['Installment Due Date'] ?? r['Mbr Reserve Bonus Subm Install Due Date']);
        const affiliationDate = parseDate(r['Affiliation Date'] ?? r['Mbr Reserve Bonus Subm Affiliation Date']);
        const terminationDate = parseDate(r['Termination Date'] ?? r['Mbr Reserve Bonus Subm Termination Date']);
        const dutyStatCode = parseIntSafe(r['Duty Stat Code'] ?? r['Mbr Reserve Bonus Duty Stat Cd']);
        const designator = trimText(r['Mbr Reserve Bonus Subm Desig Cd'] ?? r.officerDesignator ?? r['Current Designator']);
        const rating = cleanBonusRating(r['Mbr Reserve Bonus Subm Rate Rank'] ?? r.rateRank);
        const ratingDesignator = `${rating}${designator}`.trim();
        const oe = !ratingDesignator
          ? 'Enlisted'
          : /^\d/.test(String(ratingDesignator))
            ? 'Officer'
            : 'Enlisted';
        const payout = installNum > 1 ? 'Anniversary' : 'Initial';
        const rawCategory = trimText(r['Mbr Reserve Bonus Subm Category'] || r.category);
        const grouped = trimText(cw.grouped || rawCategory) || '(blank)';
        const bonusType = trimText(cw.bonusType);
        const categoryBase = trimText(cw.category || rawCategory);
        const installmentAmount = parseExecutionAmount(r['Mbr Reserve Bonus Subm Install Amount'] ?? r.installmentAmount) || 0;
        const approvalFlag = approvalDate ? 'Approved' : 'Committed';
        const rawInstallmentStatus = String(
          r['Bonus Installment Status Ind']
          ?? r['Mbr Reserve Bonus Subm Install Stat Ind']
          ?? ''
        ).trim();
        let payoutFY = null;
        let payoutFySource = '';
        if (approvalDate) {
          payoutFY = fyFromDate(approvalDate);
          payoutFySource = 'Approval Date';
        } else if (dueDate) {
          payoutFY = dueDate.getMonth() + 1 >= 10
            ? dueDate.getFullYear() + installNum
            : dueDate.getFullYear() + (installNum - 1);
          payoutFySource = 'Due Date + Installment Number';
        }

        return {
          DODID: trimText(r.DODID ?? r.dodid),
          Name: trimText(r['Member Name'] || r.Name),
          'Bonus Tracking Num': trimText(r['Mbr Reserve Bonus Subm Track Num Actual'] || r.trackNumActual || r['Bonus Tracking Num']),
          Category: categoryBase,
          'Bonus Type': bonusType,
          'Approval Flag': approvalFlag,
          O_E: oe,
          'Payout FY': payoutFY,
          'Payout FY Source': payoutFySource,
          'Payout FY Debug Approval Date': approvalDate,
          'Payout FY Debug Due Date': dueDate,
          'Payout FY Debug Installment Number': installNum,
          Payout: payout,
          'Installment Number': installNum,
          'Installment Amount': installmentAmount,
          'Budget Line Item Grouped': grouped,
          'Budget Line Item': `${grouped} ${payout}`.trim(),
          'Mbr Reserve Bonus Subm Category Code': code,
          'Bonus Installment Status Ind': rawInstallmentStatus,
          'Approval Date': approvalDate,
          'Due Date': dueDate,
          'Installment Due Date': installmentDueDate,
          'Affiliation Date': affiliationDate,
          'Termination Date': terminationDate,
          'Termination Reason': trimText(r['Termination Reason'] ?? r['Mbr Reserve Bonus Subm Term Rsn']),
          'Duty Stat Code': dutyStatCode,
          UIC: trimText(r.UIC ?? r['Mbr Reserve Bonus UIC']),
          'Reserve UIC Indicator': trimText(r['Reserve UIC Indicator'] ?? r['Mbr Reserve Bonus Reserve UIC Indicator']),
          'Mbr Reserve Bonus Subm Type': trimText(r['Mbr Reserve Bonus Subm Type']),
          'Bonus Rating': rating,
          'Bonus Designator': designator,
          'Bonus Rating_Designator': ratingDesignator,
          Bonus_Rating_Designator: ratingDesignator,
          'Current Paygrade': trimText(r['Current Paygrade']),
          'Current Rank/Rate': trimText(r['Current Rank/Rate'] ?? r['Current Rank Rate'] ?? r['Current Rate Rank']),
          'Current Rating': trimText(r['Current Rating']),
          'Current Designator': trimText(r['Current Designator'] ?? designator),
          sourceId: r.sourceId || '',
          status: approvalFlag,
          category: categoryBase,
          budgetLineItem: `${grouped} ${payout}`.trim(),
          budgetLineItemGrouped: grouped,
          oe,
          bonusType,
          payoutFy: payoutFY,
          payoutType: payout,
          amount: installmentAmount
        };
      })
      .filter((row) => !(row['Termination Date'] && !row['Approval Date']))
      .filter((row) => !(!row['Approval Date'] && ineligibleDutyStatCodes.has(parseIntSafe(row['Duty Stat Code']))))
      .filter((row) => !['SRB10', 'SRB15'].includes(String(row['Mbr Reserve Bonus Subm Category Code'] || '').trim()));

    const withInstallmentKeys = parsedRows.map((row) => ({
      ...row,
      'Installment ID': trimText(row['Bonus Tracking Num']) ? `${trimText(row['Bonus Tracking Num'])}-${row['Installment Number']}` : '',
      'Installment Due FY': fyFromDate(row['Installment Due Date']),
      'Due Date FY': fyFromDate(row['Due Date']),
      'Affiliation FY': fyFromDate(row['Affiliation Date'])
    }));

    const bonusOrderByEvent = assignBonusOrder(withInstallmentKeys);
    const bonusCountsByMember = countDistinctBonusesByMember(withInstallmentKeys);
    const withDerivedFields = withInstallmentKeys.map((row) => {
      const eventKey = `${trimText(row.DODID)}||${trimText(row['Bonus Tracking Num'])}`;
      const event = bonusOrderByEvent.get(eventKey) || {};
      const bonusOrder = event.BonusOrder ?? null;
      const eventStartDate = event.EventStartDate ?? null;
      const bonusSubtype = applyHpoSubtype({ ...row, BonusOrder: bonusOrder });
      const categoryWithSubtype = bonusSubtype ? `${trimText(row.Category)} ${bonusSubtype}`.trim() : row.Category;
      const currentPaygrade = trimText(row['Current Paygrade']) === '0' ? '' : row['Current Paygrade'];
      return {
        ...row,
        Category: categoryWithSubtype,
        category: categoryWithSubtype,
        BonusOrder: bonusOrder,
        EventStartDate: eventStartDate,
        BonusSubtype: bonusSubtype,
        'Bonuses Received Count': bonusCountsByMember.get(trimText(row.DODID)) ?? 0,
        'Current Paygrade': currentPaygrade,
        'Payout FY': parseIntSafe(row['Payout FY']),
        'Due Date FY': parseIntSafe(row['Due Date FY']),
        'Installment Due FY': parseIntSafe(row['Installment Due FY']),
        'Affiliation FY': parseIntSafe(row['Affiliation FY']),
        payoutFy: parseIntSafe(row['Payout FY']),
        budgetLineItem: `${row['Budget Line Item Grouped']} ${row.Payout}`.trim()
      };
    });

    const groupedPayouts = withDerivedFields.reduce((acc, row) => {
      const key = row['Budget Line Item Grouped'] || '(blank)';
      if (!acc[key]) acc[key] = new Set();
      acc[key].add(row.Payout);
      return acc;
    }, {});
    const finalColumnOrder = [
      'DODID', 'Name', 'Bonus Tracking Num', 'Installment ID', 'Mbr Reserve Bonus Subm Category Code', 'Bonus Type', 'Category', 'BonusSubtype',
      'Budget Line Item Grouped', 'Budget Line Item', 'Budget Line Item Combined', 'O_E', 'Current Paygrade', 'Current Rank/Rate', 'Current Rating',
      'Current Designator', 'Due Date', 'Due Date FY', 'Installment Due Date', 'Installment Due FY', 'Approval Date', 'Approval Flag',
      'Affiliation Date', 'Affiliation FY', 'Installment Number', 'Payout', 'Payout FY', 'Payout FY Source', 'Payout FY Debug Approval Date',
      'Payout FY Debug Due Date', 'Payout FY Debug Installment Number', 'Installment Amount', 'Duty Stat Code', 'Termination Date',
      'Termination Reason', 'BonusOrder', 'EventStartDate', 'Bonuses Received Count', 'Bonus Installment Status Ind', 'UIC', 'Reserve UIC Indicator',
      'Bonus Rating', 'Bonus Designator', 'Bonus Rating_Designator', 'Mbr Reserve Bonus Subm Type'
    ];
    return withDerivedFields.map((row) => {
      const key = row['Budget Line Item Grouped'] || '(blank)';
      const hasBoth = groupedPayouts[key]?.has('Initial') && groupedPayouts[key]?.has('Anniversary');
      const combined = hasBoth ? key : row['Budget Line Item'];
      const enriched = {
        ...row,
        'Budget Line Item Combined': combined,
        budgetLineItemCombined: combined,
        payoutFy: row['Payout FY'],
        payoutType: row.Payout,
        status: row['Approval Flag'],
        oe: row.O_E,
        bonusType: row['Bonus Type'],
        amount: row['Installment Amount'],
        budgetLineItem: row['Budget Line Item'],
        budgetLineItemGrouped: row['Budget Line Item Grouped'],
        category: row.Category
      };
      const ordered = {};
      finalColumnOrder.forEach((column) => {
        ordered[column] = enriched[column] ?? null;
      });
      return { ...ordered, ...enriched };
    });
  };

  const normalizeExecutionRow = (row, idx) => {
    const normalized = normalizeRowHeaders(row);
    const effectiveDate = normalized.effectiveDate
      || normalized.installmentDate
      || normalized.submissionEffectiveDate
      || '';
    const installmentAmount = parseExecutionAmount(
      normalized.installmentAmount
      ?? normalized.amount
      ?? normalized.baseAmount
    );
    return {
      ...normalized,
      effectiveDate,
      installmentAmount,
      installments: Number(normalized.installments || normalized.installmentNumber || 1) || 1,
      sourceId: normalized.sourceId || `execution-upload-${idx + 1}`
    };
  };

  const validateExecutionColumns = (rows) => {
    const requiredColumns = validateRequiredColumns(rows, required.execution || []);
    if (!requiredColumns.valid) return requiredColumns;
    const keys = Object.keys(rows[0] || {});
    if (!keys.includes('effectiveDate')) {
      return { valid: false, errors: ['Missing required date column. Expected Effective Date or Install Effdt field.'] };
    }
    return { valid: true, errors: [] };
  };

  const parseExecutionFile = async (file) => {
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.csv')) {
      return parseCSV(await file.text()).map(normalizeExecutionRow);
    }
    if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
      const XLSX = window.XLSX;
      if (!XLSX) throw new Error('Excel parser is unavailable. Refresh the page and try again.');
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false });
      const executionSheet = workbook.SheetNames.find((sheetName) => {
        const normalized = String(sheetName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return ['execution', 'executionapprovaldata', 'executiondata', 'approvaldata'].includes(normalized);
      }) || workbook.SheetNames[0];
      const sheet = workbook.Sheets[executionSheet];
      return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false }).map(normalizeExecutionRow);
    }
    throw new Error('Invalid file type. Upload a Bonus Execution CSV or Excel file.');
  };

  const handleExecutionFileSelected = async (file) => {
    const dashboardState = store.state.ui?.executionDashboard || {};
    if (!file) {
      setExecutionUploadError(dashboardState, 'No file selected. Choose a Bonus Execution file to continue.');
      return;
    }
    try {
      const rows = await parseExecutionFile(file);
      const validation = validateExecutionColumns(rows);
      if (!validation.valid) {
        setExecutionUploadError(dashboardState, `Validation failed: ${validation.errors.join('; ')}`, file.name);
        return false;
      }
      setRawExecutionRows(dashboardState, rows, file.name);
      return true;
    } catch (error) {
      setExecutionUploadError(dashboardState, error?.message || 'Unable to read or parse Bonus Execution file.', file.name);
      return false;
    }
  };

  const handleTransformExecutionData = () => {
    const dashboardState = store.state.ui?.executionDashboard || {};
    const runtimeState = getRuntimeDashboardState();
    const rawRows = runtimeState.rawRows || [];
    if (!rawRows.length) {
      store.patchUi({
        executionDashboard: {
          ...dashboardState,
          hasTransformed: false,
          transformedRowCount: 0,
          issues: ['Upload Bonus Execution data before running transforms.']
        }
      });
      return;
    }
    const resultRows = applyTransforms(rawRows);
    patchRuntimeDashboardState({
      rawRows: [...rawRows],
      transformedRows: resultRows,
      pendingFileName: runtimeState.pendingFileName || ''
    });
    store.patchUi({
      executionDashboard: {
        ...dashboardState,
        fileName: runtimeState.pendingFileName || '',
        rawRowCount: rawRows.length,
        transformedRowCount: resultRows.length,
        issues: [`Rows transformed successfully: ${resultRows.length}`],
        hasTransformed: true,
        transformedAt: new Date().toISOString()
      },
      dashboard: { filters: {} }
    });

    const uploadInput = document.getElementById('execution-dashboard-upload');
    if (uploadInput) uploadInput.value = '';
  };

  const uploadInput = document.getElementById('execution-dashboard-upload');
  if (uploadInput) {
    uploadInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      await handleExecutionFileSelected(file);
    });
  }

  const transformBtn = document.getElementById('execution-transform-btn');
  if (transformBtn) {
    transformBtn.addEventListener('click', handleTransformExecutionData);
  }

  const clearFiltersBtn = document.getElementById('dashboard-clear-filters');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      resetDashboardFilters();
    });
  }
}

function bindDashboardFilters() {
  document.querySelectorAll('[data-dashboard-filter]').forEach((el) => {
    const syncFilter = () => {
      const key = el.dataset.dashboardFilter;
      if (!key) return;
      const selectedValues = Array.from(el.selectedOptions).map((o) => o.value);
      const prevFilters = store.state.ui.dashboard?.filters || {};
      const prevValues = Array.isArray(prevFilters[key]) ? prevFilters[key] : [];
      if (prevValues.length === selectedValues.length && prevValues.every((value, idx) => value === selectedValues[idx])) return;
      const filters = { ...prevFilters, [key]: selectedValues };
      store.patchUi({ dashboard: { filters } });
    };
    el.addEventListener('input', syncFilter);
    el.addEventListener('change', syncFilter);
  });
  document.querySelectorAll('[data-clear-dashboard-filter]').forEach((el) => {
    el.addEventListener('click', (event) => {
      event.preventDefault();
      const key = el.dataset.clearDashboardFilter;
      if (!key) return;
      const filters = { ...(store.state.ui.dashboard?.filters || {}), [key]: [] };
      store.patchUi({ dashboard: { filters } });
    });
  });
  const search = document.querySelector('[data-dashboard-search]');
  if (search) {
    search.addEventListener('input', () => {
      const filters = { ...(store.state.ui.dashboard?.filters || {}), search: search.value };
      store.patchUi({ dashboard: { filters } });
    });
  }
  const clearAllBtn = document.getElementById('dashboard-clear-all-filters');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      store.patchUi({ dashboard: { filters: {} } });
    });
  }
}

function bindWaterfallFilters() {
  document.querySelectorAll('[data-waterfall-filter]').forEach((el) => {
    el.addEventListener('change', () => {
      const key = el.dataset.waterfallFilter;
      const filters = { ...(store.state.ui.waterfall?.filters || {}), [key]: toMultiValues(el) };
      store.patchUi({
        waterfall: {
          ...(store.state.ui.waterfall || {}),
          filters
        }
      });
    });
  });

  document.querySelectorAll('[data-waterfall-source-mode]').forEach((el) => {
    el.addEventListener('click', () => {
      const sourceMode = el.dataset.waterfallSourceMode || 'projection';
      if (store.state.ui.waterfall?.sourceMode === sourceMode) return;
      store.patchUi({
        waterfall: {
          ...(store.state.ui.waterfall || {}),
          sourceMode
        }
      });
    });
  });
}

function setPathValue(target, path, rawText) {
  const keys = path.split('.');
  if (keys.length === 1) {
    const current = target[keys[0]];
    target[keys[0]] = typeof current === 'number' ? Number(rawText || 0) : rawText;
    return;
  }
  let cursor = target;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const part = keys[i];
    if (!cursor[part] || typeof cursor[part] !== 'object') cursor[part] = {};
    cursor = cursor[part];
  }
  const leaf = keys[keys.length - 1];
  const current = cursor[leaf];
  cursor[leaf] = typeof current === 'number' ? Number(rawText || 0) : rawText;
}

function bindInlineEdits() {
  document.querySelectorAll('[data-edit-cell]').forEach((cell) => {
    cell.addEventListener('blur', () => {
      const dataset = cell.dataset.editCell;
      const row = Number(cell.dataset.row);
      const col = cell.dataset.col;
      const clone = [...(store.state.workingInputs?.[dataset] || [])];
      if (!clone[row]) return;
      const rowClone = { ...clone[row] };
      setPathValue(rowClone, col, cell.textContent.trim());
      clone[row] = rowClone;
      store.updateWorkingDataset(dataset, clone, true);
    });
  });
}

function renderCrosswalkTable() {
  const warning = validateCrosswalkRows(crosswalkRows).warning;
  const current = store.state.ui?.pomInputs || {};
  const unchanged = JSON.stringify(current.crosswalkEditorRows || []) === JSON.stringify(crosswalkRows)
    && (current.crosswalkWarning || '') === warning;
  if (unchanged) return;
  store.patchUi({
    pomInputs: {
      ...current,
      crosswalkEditorRows: crosswalkRows,
      crosswalkWarning: warning
    }
  });
}

function addCrosswalkRow() {
  crosswalkRowCounter += 1;
  crosswalkRows = [...crosswalkRows, {
    id: `cw-${crosswalkRowCounter}`,
    code: '',
    bonusType: '',
    category: '',
    grouped: ''
  }];
  renderCrosswalkTable();
}

function resetCrosswalkToDefault() {
  crosswalkRows = DEFAULT_CROSSWALK_ROWS.map((r, i) => ({ id: `cw-${i + 1}`, ...r }));
  crosswalkRowCounter = crosswalkRows.length;
  renderCrosswalkTable();
}

function handleCrosswalkCellChange(rowId, field, value) {
  crosswalkRows = crosswalkRows.map((row) => (
    row.id === rowId ? { ...row, [field]: value } : row
  ));
  renderCrosswalkTable();
}

function bindPomInputsActions() {
  renderCrosswalkTable();
  const commitBtn = document.getElementById('commit-inputs-btn');
  if (commitBtn) {
    commitBtn.addEventListener('click', () => {
      store.commitWorkingInputs();
      setPomInputsNotice('success', 'Inputs and Planning Tables changes committed.');
    });
  }

  const workbookInput = document.getElementById('workbook-upload-input');
  if (workbookInput) {
    workbookInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await applyWorkbookUpload(file);
      workbookInput.value = '';
    });
  }

  const addRowBtn = document.getElementById('crosswalk-add-row-btn');
  if (addRowBtn) {
    addRowBtn.addEventListener('click', addCrosswalkRow);
  }

  const resetBtn = document.getElementById('crosswalk-reset-default-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetCrosswalkToDefault);
  }

  document.querySelectorAll('[data-crosswalk-cell]').forEach((input) => {
    input.addEventListener('input', () => {
      handleCrosswalkCellChange(input.dataset.crosswalkRowId, input.dataset.crosswalkCell, input.value);
    });
  });

  document.querySelectorAll('[data-crosswalk-delete-row]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const rowId = btn.dataset.crosswalkDeleteRow;
      crosswalkRows = crosswalkRows.filter((row) => row.id !== rowId);
      renderCrosswalkTable();
    });
  });
}

function bindAdminActions() {
  document.querySelectorAll('[data-admin-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.adminAction === 'load-demo') store.resetDemo();
      if (btn.dataset.adminAction === 'clear-storage') store.clearStorage();
    });
  });
}

function bindDatasetExports() {
  document.querySelectorAll('[data-export-dataset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.exportDataset;
      const rows = store.state.workingInputs?.[key] || [];
      triggerDownload(`${key}.csv`, toCSV(rows));
    });
  });
}

function bindTableHandlers() {
  bindInteractiveTables({
    uiTables: store.state.ui.tables || {},
    onUpdate: (tableId, tableState) => {
      const tables = { ...(store.state.ui.tables || {}), [tableId]: tableState };
      store.patchUi({ tables });
    }
  });
}

function render() {
  if (!app) return;
  const route = currentRoute();
  const fn = pageMap[route] || overviewPage;
  app.innerHTML = renderLayout(route, fn(store.state));
  bindUploadHandlers();
  bindExecutionDashboardActions();
  bindDashboardFilters();
  bindWaterfallFilters();
  bindInlineEdits();
  bindPomInputsActions();
  bindAdminActions();
  bindDatasetExports();
  bindTableHandlers();
}

window.addEventListener('hashchange', render);
store.subscribe(render);
render();
