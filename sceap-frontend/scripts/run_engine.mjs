#!/usr/bin/env node
import path from 'path';
import fs from 'fs';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';

// Get __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// For now, just output a message indicating this is a placeholder test
// In production, the actual TypeScript compilation would be used by the frontend
console.log('🚀 Cable Sizing Engine V2 Test Script');
console.log('====================================\n');

const demoPath = path.resolve(__dirname, '..', '..', 'DEMO_SHEET_V2.xlsx');
if (!fs.existsSync(demoPath)) {
  console.error('❌ DEMO_SHEET_V2.xlsx not found at', demoPath);
  process.exit(1);
}

// Read the Excel file to show the feeders
const wb = XLSX.readFile(demoPath);
const sheetName = wb.SheetNames[0];
const data = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });

console.log(`✅ Loaded ${data.length} feeders from DEMO_SHEET_V2.xlsx\n`);
console.log('Feeders:');
data.forEach((f, idx) => {
  const cores = f['Number of Cores'] || '3C';
  const desc = f['Feeder Description'] || '';
  const load = f['Load KW'] || 0;
  console.log(`  [${idx + 1}] ${desc} (${cores}, ${load}kW)`);
});

console.log('\n✅ Test script complete — engine will be tested through the UI');
console.log('   Upload DEMO_SHEET_V2.xlsx and CATALOG_TEMPLATE.xlsx in the frontend');

