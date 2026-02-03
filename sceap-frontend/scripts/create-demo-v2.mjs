#!/usr/bin/env node
/**
 * Generate DEMO SHEET V2 with multiple feeders per equipment
 * and varied core configurations (2C, 3C, 4C)
 */

import XLSX from 'xlsx';
import path from 'path';

const demoData = [
  // Equipment 1: Boiler Feed Pump with dual feeders (redundancy)
  {
    serialNo: 1,
    cableNumber: 'C-BFP-001-A',
    feederDescription: 'Boiler Feed Pump - Feeder A (Primary)',
    fromBus: 'MCC-MAIN',
    toBus: 'BFP-MOTOR-1',
    voltage: 11000,
    loadKW: 280,
    length: 150,
    phaseType: '3-phase',
    numberOfCores: '3C',
    material: 'Cu',
    powerFactor: 0.88,
    efficiency: 92,
    installationMethod: 'Trench',
    ambientTemp: 40,
    protectionType: 'ACB'
  },
  {
    serialNo: 2,
    cableNumber: 'C-BFP-001-B',
    feederDescription: 'Boiler Feed Pump - Feeder B (Backup)',
    fromBus: 'MCC-BACKUP',
    toBus: 'BFP-MOTOR-1',
    voltage: 11000,
    loadKW: 280,
    length: 160,
    phaseType: '3-phase',
    numberOfCores: '3C',
    material: 'Cu',
    powerFactor: 0.88,
    efficiency: 92,
    installationMethod: 'Trench',
    ambientTemp: 40,
    protectionType: 'ACB'
  },

  // Equipment 2: Cooling Tower Fan with 2-core low-voltage
  {
    serialNo: 3,
    cableNumber: 'C-CTF-002-A',
    feederDescription: 'Cooling Tower Fan - Feeder A',
    fromBus: 'LV-PANEL-1',
    toBus: 'CT-FAN-MOTOR',
    voltage: 415,
    loadKW: 75,
    length: 95,
    phaseType: '3-phase',
    numberOfCores: '2C',
    material: 'Cu',
    powerFactor: 0.85,
    efficiency: 90,
    installationMethod: 'Air',
    ambientTemp: 45,
    protectionType: 'MCCB'
  },

  // Equipment 3: Heater Load (high current, single conductor per phase)
  {
    serialNo: 4,
    cableNumber: 'C-HTR-003',
    feederDescription: 'Preheating Element - 400 kW',
    fromBus: 'MV-PANEL-2',
    toBus: 'HEATER-1',
    voltage: 6600,
    loadKW: 400,
    length: 200,
    phaseType: '3-phase',
    numberOfCores: '1C',
    material: 'Cu',
    powerFactor: 1.0,
    efficiency: 99,
    installationMethod: 'Duct',
    ambientTemp: 50,
    protectionType: 'ACB'
  },

  // Equipment 4: Pump with 4-core cable (3-phase + neutral)
  {
    serialNo: 5,
    cableNumber: 'C-PMP-004',
    feederDescription: 'Circulation Pump - 150 kW',
    fromBus: 'MCC-AUX',
    toBus: 'PUMP-CIRC',
    voltage: 415,
    loadKW: 150,
    length: 120,
    phaseType: '3-phase',
    numberOfCores: '4C',
    material: 'Cu',
    powerFactor: 0.87,
    efficiency: 91,
    installationMethod: 'Air',
    ambientTemp: 40,
    protectionType: 'ACB'
  },

  // Equipment 5: Transformer Feeder (long run, 2-core)
  {
    serialNo: 6,
    cableNumber: 'C-TRF-005',
    feederDescription: 'Main Transformer Primary - 500 kW',
    fromBus: 'MAIN-DIST',
    toBus: 'TRF-MAIN',
    voltage: 11000,
    loadKW: 500,
    length: 300,
    phaseType: '3-phase',
    numberOfCores: '2C',
    material: 'Cu',
    powerFactor: 0.95,
    efficiency: 98,
    installationMethod: 'Duct',
    ambientTemp: 35,
    protectionType: 'ACB'
  },

  // Equipment 6: Fan with low-current 3C cable
  {
    serialNo: 7,
    cableNumber: 'C-FAN-006',
    feederDescription: 'Process Fan - 45 kW',
    fromBus: 'LV-PANEL-2',
    toBus: 'FAN-INLET',
    voltage: 415,
    loadKW: 45,
    length: 80,
    phaseType: '3-phase',
    numberOfCores: '3C',
    material: 'Cu',
    powerFactor: 0.85,
    efficiency: 89,
    installationMethod: 'Air',
    ambientTemp: 45,
    protectionType: 'MCCB'
  },

  // Equipment 7: Compressor with dual feeders (redundancy)
  {
    serialNo: 8,
    cableNumber: 'C-CMP-007-A',
    feederDescription: 'Air Compressor - Feeder A (Primary)',
    fromBus: 'MCC-COMP-1',
    toBus: 'COMPRESSOR',
    voltage: 415,
    loadKW: 110,
    length: 60,
    phaseType: '3-phase',
    numberOfCores: '3C',
    material: 'Cu',
    powerFactor: 0.84,
    efficiency: 90,
    installationMethod: 'Air',
    ambientTemp: 50,
    protectionType: 'ACB'
  },
  {
    serialNo: 9,
    cableNumber: 'C-CMP-007-B',
    feederDescription: 'Air Compressor - Feeder B (Backup)',
    fromBus: 'MCC-COMP-2',
    toBus: 'COMPRESSOR',
    voltage: 415,
    loadKW: 110,
    length: 65,
    phaseType: '3-phase',
    numberOfCores: '3C',
    material: 'Cu',
    powerFactor: 0.84,
    efficiency: 90,
    installationMethod: 'Air',
    ambientTemp: 50,
    protectionType: 'ACB'
  },

  // Equipment 8: Small Motor with 2-core
  {
    serialNo: 10,
    cableNumber: 'C-MTR-008',
    feederDescription: 'Auxiliary Motor - 22 kW',
    fromBus: 'LV-PANEL-3',
    toBus: 'MOTOR-AUX',
    voltage: 415,
    loadKW: 22,
    length: 50,
    phaseType: '3-phase',
    numberOfCores: '2C',
    material: 'Cu',
    powerFactor: 0.80,
    efficiency: 88,
    installationMethod: 'Air',
    ambientTemp: 40,
    protectionType: 'MCB'
  }
];

const sheet = [
  [
    'Serial No',
    'Cable Number',
    'Feeder Description',
    'From Bus',
    'To Bus',
    'Voltage (V)',
    'Load KW',
    'Length (m)',
    'Phase Type',
    'Number of Cores',
    'Material',
    'Power Factor',
    'Efficiency (%)',
    'Installation Method',
    'Ambient Temp (°C)',
    'Protection Type'
  ],
  ...demoData.map(d => [
    d.serialNo,
    d.cableNumber,
    d.feederDescription,
    d.fromBus,
    d.toBus,
    d.voltage,
    d.loadKW,
    d.length,
    d.phaseType,
    d.numberOfCores,
    d.material,
    d.powerFactor,
    d.efficiency,
    d.installationMethod,
    d.ambientTemp,
    d.protectionType
  ])
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet), 'Feeders');

const outFile = path.join(process.cwd(), '..', 'DEMO_SHEET_V2.xlsx');
XLSX.writeFile(wb, outFile);
console.log('✅ Demo sheet V2 generated:', outFile);
console.log('   - 10 equipment/feeders');
console.log('   - Multiple cores per equipment (2C, 3C, 4C, 1C)');
console.log('   - Dual feeders for critical equipment');
console.log('   - Mixed installation methods (Air, Trench, Duct)');
