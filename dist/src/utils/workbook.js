const sheetAliases = {
  execution: ['execution', 'executionapprovaldata', 'executiondata', 'approvaldata'],
  bonusInfo: ['bonusinfo', 'bonusinfotable'],
  targetAverage: ['targetaverage', 'targetaverageinitialbonustable'],
  controls: ['controls', 'controlstable'],
  aggregateTakers: ['aggregatetakers', 'aggregateinitialtakers', 'aggregateinitialtakerstable'],
  crosswalk: ['crosswalk', 'crosswalktable']
};

const datasets = Object.keys(sheetAliases);

function normalizeName(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getXlsxLib() {
  const lib = window.XLSX;
  if (!lib) {
    throw new Error('Excel parser is unavailable. Refresh the page and try again.');
  }
  return lib;
}

function resolveDatasetSheet(workbook, datasetKey) {
  const aliasSet = new Set(sheetAliases[datasetKey]);
  return workbook.SheetNames.find((name) => aliasSet.has(normalizeName(name)));
}

export async function parsePlanningWorkbook(file) {
  const ext = file.name.toLowerCase();
  if (!ext.endsWith('.xlsx') && !ext.endsWith('.xls')) {
    throw new Error('Please upload an Excel workbook (.xlsx or .xls).');
  }

  const XLSX = getXlsxLib();
  const bytes = await file.arrayBuffer();
  const workbook = XLSX.read(bytes, { type: 'array', cellDates: false });
  const dataByDataset = {};
  const missingSheets = [];

  for (const datasetKey of datasets) {
    const sheetName = resolveDatasetSheet(workbook, datasetKey);
    if (!sheetName) {
      missingSheets.push(datasetKey);
      continue;
    }
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
    dataByDataset[datasetKey] = rows;
  }

  if (missingSheets.length) {
    throw new Error(`Workbook is missing required sheets: ${missingSheets.join(', ')}.`);
  }

  return dataByDataset;
}
