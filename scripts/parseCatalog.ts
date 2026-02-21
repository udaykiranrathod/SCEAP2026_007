import * as XLSX from 'xlsx';

// repurpose the parsing logic from SizingTab.onCatalogueDrop
const getColValue = (row: any, ...variations: string[]): any => {
  for (const v of variations) {
    if (v in row && row[v] !== '' && row[v] !== null) return row[v];
  }
  const lowerKeys = Object.keys(row).reduce((acc: any, k) => {
    acc[k.toLowerCase().trim()] = row[k];
    return acc;
  }, {});
  for (const v of variations) {
    const lower = v.toLowerCase().trim();
    if (lower in lowerKeys && lowerKeys[lower] !== '' && lowerKeys[lower] !== null) return lowerKeys[lower];
  }
  return undefined;
};

interface CableCatalogue {
  size: number;
  cores?: '1C' | '2C' | '3C' | '4C';
  current: number;
  resistance: number;
  reactance: number;
  material?: 'Al' | 'Cu';
  cableDia?: number;
  airRating?: number;
  trenchRating?: number;
  ductRating?: number;
  deratingK1?: number;
  deratingK2?: number;
  deratingK3?: number;
  deratingK4?: number;
  deratingK5?: number;
  [key: string]: any;
}

const parseWorkbook = (filePath: string) => {
  const workbook = XLSX.readFile(filePath, { cellDates: true, cellNF: false, cellText: false });
  const allSheetsData: Record<string, any> = {};
  let firstSheetName = '3C';
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '', blankrows: false });

    const mappedData = jsonData
      .map((row: any): CableCatalogue | null => {
        const size = getColValue(row, 'Size (mm²)', 'size', 'Size', 'Area', 'area');
        const current = getColValue(row, 'Current (A)', 'current', 'Current', 'Air Rating (A)', 'air', 'rating');
        const resistance = getColValue(row, 'Resistance (Ω/km)', 'Resistance (Ohm/km)', 'resistance', 'Resistance @ 90°C (Ω/km)', 'R', 'resistance (ohm/km)');
        const reactance = getColValue(row, 'Reactance (Ω/km)', 'Reactance (Ohm/km)', 'reactance', 'Reactance', 'X', 'reactance (ohm/km)');
        const coresRaw = getColValue(row, 'Core Config', 'Cores', 'No. of Cores', 'Core Configuration', 'Configuration', 'core config');
        const materialRaw = getColValue(row, 'Material', 'Mat', 'Conductor Material');
        const deratingK1 = getColValue(row, 'Derating K1 (Temp)', 'K1 (Temp)', 'Derating K1', 'K1');
        const deratingK2 = getColValue(row, 'Derating K2 (Grouping)', 'K2', 'Derating K2');
        const deratingK3 = getColValue(row, 'Derating K3 (Ground Temp)', 'K3', 'Derating K3');
        const deratingK4 = getColValue(row, 'Derating K4 (Depth)', 'K4', 'Derating K4');
        const deratingK5 = getColValue(row, 'Derating K5 (Soil)', 'K5', 'Derating K5');

        if (size === undefined || size === '' || size === null) return null;
        const parseNum = (val: any): number => {
          if (val === undefined || val === null || val === '') return 0;
          const trimmed = String(val).trim().replace('%', '').replace(',', '');
          const n = Number(trimmed);
          return Number.isFinite(n) ? n : 0;
        };

        let material: 'Al' | 'Cu' | undefined;
        if (materialRaw && typeof materialRaw === 'string') {
          const m = materialRaw.toString().toLowerCase();
          if (m.includes('cu')) material = 'Cu';
          else if (m.includes('al')) material = 'Al';
        }
        if (!material) {
          const lowerSheet = sheetName.toLowerCase();
          if (lowerSheet.includes('cu')) material = 'Cu';
          else if (lowerSheet.includes('al')) material = 'Al';
        }

        return {
          size: parseNum(size),
          current: parseNum(current),
          resistance: parseNum(resistance),
          reactance: parseNum(reactance),
          cores: (coresRaw || sheetName) as any,
          material,
          deratingK1: parseNum(deratingK1),
          deratingK2: parseNum(deratingK2),
          deratingK3: parseNum(deratingK3),
          deratingK4: parseNum(deratingK4),
          deratingK5: parseNum(deratingK5)
        };
      })
      .filter((item): item is CableCatalogue => item !== null && item.size > 0);

    if (mappedData.length > 0) {
      const sizesMap: Record<string, any> = {};
      mappedData.forEach(entry => {
        const air = entry.current || entry.airRating || entry['Air Rating (A)'] || 0;
        const trench = entry.trench || entry.trenchRating || entry['Trench Rating (A)'] || air;
        const duct = entry.duct || entry.ductRating || entry['Duct Rating (A)'] || air;
        const resistance90 = entry.resistance_90C || entry.resistance || entry['Resistance @ 90°C (Ω/km)'] || entry.R || 0;
        const reactance = entry.reactance || entry.X || entry['Reactance (Ω/km)'] || 0;
        const cableDia = entry.dia || entry['Cable Diameter (mm)'] || entry.cableDia || 0;
        sizesMap[String(entry.size)] = {
          air,
          trench,
          duct,
          resistance_90C: resistance90,
          reactance,
          cableDia,
          material: entry.material,
          cores: entry.cores,
          deratingK1: entry.deratingK1,
          deratingK2: entry.deratingK2,
          deratingK3: entry.deratingK3,
          deratingK4: entry.deratingK4,
          deratingK5: entry.deratingK5
        };
      });
      allSheetsData[sheetName] = sizesMap;
      if (Object.keys(allSheetsData).length === 1) firstSheetName = sheetName;
      console.log(`[TEST] Sheet "${sheetName}" entries:`, Object.keys(sizesMap).length);
      console.log(`[TEST] Sample item:`, sizesMap[Object.keys(sizesMap)[0]]);
    }
  });
  console.log('All sheets parsed:', Object.keys(allSheetsData));
  return allSheetsData;
};

// generate sample catalog file using same logic as SizingTab
const generateCatalogTemplate = () => {
  const wb = XLSX.utils.book_new();
  const catalogRows: any[] = [];
  const coreConfigs = ['1C','2C','3C','4C'];
  // we'll simulate using minimal sample data rather than full AmpacityTables
  coreConfigs.forEach(coreConfig => {
    // add one dummy size row for each core config
    catalogRows.push({
      'Core Config': coreConfig,
      'Size (mm²)': 10,
      'Air Rating (A)': 50,
      'Ground Rating (A)': 45,
      'Duct Rating (A)': 40,
      'Resistance @ 90°C (Ω/km)': 1,
      'Reactance (Ω/km)': 0.1,
      'Cable Diameter (mm)': 10,
      'Material': 'Al',
      'Derating K1 (Temp)': '',
      'Derating K2 (Grouping)': '',
      'Derating K3 (Ground Temp)': '',
      'Derating K4 (Depth)': '',
      'Derating K5 (Soil)': ''
    });
  });
  const ws = XLSX.utils.json_to_sheet(catalogRows);
  XLSX.utils.book_append_sheet(wb, ws, 'Catalogue Aluminium');
  XLSX.writeFile(wb, 'CATALOG_TEMPLATE_TEST.xlsx');
};

if (require.main === module) {
  if (process.argv.includes('--make-template')) {
    console.log('Generating test catalogue template');
    generateCatalogTemplate();
    process.exit(0);
  }
  const file = process.argv[2] || 'CATALOG_TEMPLATE_TEST.xlsx';
  console.log('Parsing workbook', file);
  const result = parseWorkbook(file);
  console.log(JSON.stringify(result, null, 2));
}

export { parseWorkbook };

export { parseWorkbook };