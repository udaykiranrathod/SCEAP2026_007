/**
 * COMPLETE EXCEL COLUMN MAPPING
 * Maps all 51 columns from the reference Excel "LV Cable sizing_SS-1" sheet
 * This ensures 100% fidelity with the reference design
 */

export interface ExcelColumnDef {
  key: string;
  label: string;
  group: string;
  position: number;
  inputField?: string;
  calculatedFrom?: string;
  format?: 'number' | 'text' | 'select' | 'formula';
  precision?: number;
  unit?: string;
}

export const EXCEL_COLUMNS: ExcelColumnDef[] = [
  // ID & ROUTING (to be added by system)
  { key: 'SL', label: 'SL No.', group: 'ID', position: 1, format: 'number' },
  { key: 'Tag No', label: 'Tag No.', group: 'ID', position: 2, format: 'text', inputField: 'cableNumber' },
  { key: 'From', label: 'From', group: 'ID', position: 3, format: 'text', inputField: 'fromBus' },
  { key: 'To', label: 'To', group: 'ID', position: 4, format: 'text', inputField: 'toBus' },
  { key: 'Description', label: 'Description', group: 'ID', position: 5, format: 'text', inputField: 'description' },

  // LOAD DATA
  { key: 'Equipment Location', label: 'Equipment Location', group: 'LOAD', position: 6, format: 'text', inputField: 'equipmentLocation' },
  { key: 'Bus', label: 'Bus', group: 'LOAD', position: 7, format: 'text', inputField: 'bus' },
  { key: 'Type of feeder', label: 'Type of feeder', group: 'LOAD', position: 8, format: 'select', inputField: 'feederType', unit: 'MOTOR/PUMP/TRANSFORMER/FEEDER' },
  { key: 'Rated power', label: 'Rated power', group: 'LOAD', position: 9, format: 'number', inputField: 'ratedPower', precision: 2 },
  { key: 'UNIT', label: 'UNIT (kW / kVa)', group: 'LOAD', position: 10, format: 'select', inputField: 'unit', unit: 'kW/kVA' },
  { key: '3Phase', label: '3Phase / 1Phase', group: 'LOAD', position: 11, format: 'select', inputField: 'phase', unit: '3Phase/1Phase' },
  { key: 'Rated Voltage', label: 'Rated Voltage (V)', group: 'LOAD', position: 12, format: 'number', inputField: 'ratedVoltage_V', precision: 0, unit: 'V' },
  { key: 'Power factor', label: 'Power factor', group: 'LOAD', position: 13, format: 'number', inputField: 'powerFactor', precision: 2 },
  { key: 'Efficiency', label: 'Efficiency', group: 'LOAD', position: 14, format: 'number', inputField: 'efficiency', precision: 4, unit: '%' },
  { key: 'Rated full load current', label: 'Rated full load current', group: 'LOAD', position: 15, format: 'formula', calculatedFrom: 'FLC', precision: 2, unit: 'A' },
  { key: 'Motor starting current', label: 'Motor starting current', group: 'LOAD', position: 16, format: 'number', inputField: 'motorStartingCurrent_A', precision: 2, unit: 'A' },
  { key: 'Motor starting PF', label: 'Motor starting power factor', group: 'LOAD', position: 17, format: 'number', inputField: 'motorStartingPF', precision: 2 },

  // SHORT CIRCUIT CURRENT WITHSTAND CAPABILITY
  { key: 'Short circuit current', label: 'Short circuit current of switchboard (kA)', group: 'SC WITHSTAND', position: 18, format: 'number', inputField: 'scCurrentSwitchboard_kA', precision: 2, unit: 'kA' },
  { key: 'SC duration', label: 'Short circuit current withstand duration (sec)', group: 'SC WITHSTAND', position: 19, format: 'number', inputField: 'scWithstandDuration_Sec', precision: 2, unit: 'sec' },
  { key: 'Min size SC', label: 'Minimum size required for Short circuit withstand capacity (Sq.mm)', group: 'SC WITHSTAND', position: 20, format: 'formula', calculatedFrom: 'ISc calculation', precision: 0, unit: 'Sq.mm' },

  // CABLE DATA
  { key: 'Installation', label: 'Installation', group: 'CABLE DATA', position: 21, format: 'select', inputField: 'installation', unit: 'Air/Trench/Duct/Ground' },
  { key: 'No. of Cores', label: 'No. of Cores', group: 'CABLE DATA', position: 22, format: 'select', inputField: 'numberOfCores', unit: '1C/2C/3C/4C' },
  { key: 'Size in Sq.mm', label: 'Size in (Sq.mm)', group: 'CABLE DATA', position: 23, format: 'formula', calculatedFrom: 'Cable sizing', precision: 0, unit: 'Sq.mm' },
  { key: 'Cable size', label: 'Cable size', group: 'CABLE DATA', position: 24, format: 'formula', calculatedFrom: 'Concatenate', precision: 0 },
  { key: 'Cable size PE', label: 'Cable size With (PE) Core', group: 'CABLE DATA', position: 25, format: 'formula', calculatedFrom: 'Concatenate', precision: 0 },
  { key: 'Cable Voltage', label: 'Cable Voltage (kV)', group: 'CABLE DATA', position: 26, format: 'text', inputField: 'cableVoltage_kV', unit: 'kV' },
  { key: 'Current Rating', label: 'Current Rating of the Cable (A)', group: 'CABLE DATA', position: 27, format: 'formula', calculatedFrom: 'VLOOKUP Catalogue', precision: 1, unit: 'A' },
  { key: 'Cable Resistance 90C', label: 'Cable resistance at 90°C (Ohm / Ph / km)', group: 'CABLE DATA', position: 28, format: 'formula', calculatedFrom: 'VLOOKUP Catalogue', precision: 4, unit: 'Ω/km' },
  { key: 'Cable Reactance 50Hz', label: 'Cable reactance at 50Hz (Ohm / Ph / km)', group: 'CABLE DATA', position: 29, format: 'formula', calculatedFrom: 'VLOOKUP Catalogue', precision: 4, unit: 'Ω/km' },

  // CABLE LENGTH CALCULATIONS
  { key: 'Cable Length Building', label: 'Cable Length with in Electrical Building (m)', group: 'CABLE LENGTH', position: 30, format: 'number', inputField: 'cableLengthBuilding_m', precision: 1, unit: 'm' },
  { key: 'Cable Length to Equipment', label: 'Cable Length from Electrical Building to Equipment (m)', group: 'CABLE LENGTH', position: 31, format: 'number', inputField: 'cableLengthToEquipment_m', precision: 1, unit: 'm' },
  { key: 'Cable Length Riser', label: 'Cable length Riser & Dropper (m)', group: 'CABLE LENGTH', position: 32, format: 'number', inputField: 'cableLengthRiser_m', precision: 1, unit: 'm' },
  { key: 'Cable Length Dropping', label: 'Cable length both side dropping & Termination (m)', group: 'CABLE LENGTH', position: 33, format: 'number', inputField: 'cableLengthDropping_m', precision: 1, unit: 'm' },
  { key: 'Spare 10%', label: 'Spare 10%', group: 'CABLE LENGTH', position: 34, format: 'formula', calculatedFrom: 'SUM * 0.1', precision: 1, unit: 'm' },
  { key: 'Cable Length Total', label: 'Cable length for each run (m)', group: 'CABLE LENGTH', position: 35, format: 'formula', calculatedFrom: 'SUM all lengths', precision: 1, unit: 'm' },

  // DERATING FACTORS
  { key: 'K1 Ambient Temp', label: 'Ambient temperature (K1)', group: 'CAPACITY', position: 36, format: 'formula', calculatedFrom: 'VLOOKUP', precision: 3 },
  { key: 'K2 Grouping', label: 'Grouping factor (K2)', group: 'CAPACITY', position: 37, format: 'formula', calculatedFrom: 'VLOOKUP', precision: 3 },
  { key: 'K3 Ground Temp', label: 'Ground temperature (K3)', group: 'CAPACITY', position: 38, format: 'formula', calculatedFrom: 'VLOOKUP', precision: 3 },
  { key: 'K4 Depth', label: 'Depth of laying (K4)', group: 'CAPACITY', position: 39, format: 'formula', calculatedFrom: 'VLOOKUP', precision: 3 },
  { key: 'K5 Thermal', label: 'Thermal resistivity of ground (K5)', group: 'CAPACITY', position: 40, format: 'formula', calculatedFrom: 'VLOOKUP', precision: 3 },
  { key: 'K Total', label: 'Overall derating factor', group: 'CAPACITY', position: 41, format: 'formula', calculatedFrom: 'K1*K2*K3*K4*K5', precision: 3 },
  { key: 'Derated Capacity', label: 'Derated current carrying capacity (A)', group: 'CAPACITY', position: 42, format: 'formula', calculatedFrom: 'CurrentRating * K_total', precision: 1, unit: 'A' },
  { key: 'No. of Runs', label: 'No. of Runs', group: 'CAPACITY', position: 43, format: 'formula', calculatedFrom: 'CEILING(FLC/DeratedCap)', precision: 0 },
  { key: 'Capacity Check', label: 'Derated current > Rated current', group: 'CAPACITY', position: 44, format: 'formula', calculatedFrom: 'IF(DeratedCap >= FLC)', unit: 'YES/NO' },

  // RUNNING VOLTAGE DROP
  { key: 'Running VD Volts', label: '% VOLTAGE DROP DURING RUNNING CONDITION', group: 'RUNNING V-DROP', position: 45, format: 'formula', calculatedFrom: 'SQRT(3)*I*L*(R*cos(phi)+X*sin(phi))*100/(V*Runs)', precision: 2, unit: '%' },
  { key: 'Running VD Check', label: '% VOLTAGE DROP WITHIN PERMISSIBLE LIMIT (YES/NO)', group: 'RUNNING V-DROP', position: 46, format: 'formula', calculatedFrom: 'IF(VD <= 3%)', unit: 'YES/NO' },

  // STARTING VOLTAGE DIP
  { key: 'Starting VD Volts', label: '% VOLTAGE DROP DURING STARTING CONDITION', group: 'STARTING V-DIP', position: 47, format: 'formula', calculatedFrom: 'SQRT(3)*I_starting*L*(R*cos(PF)+X*sin(PF))*100/(V*Runs)', precision: 2, unit: '%' },
  { key: 'Starting VD Check', label: '% VOLTAGE DROP WITHIN PERMISSIBLE LIMIT DURING STARTING CONDITION (YES/NO)', group: 'STARTING V-DIP', position: 48, format: 'formula', calculatedFrom: 'IF(VD <= 15% for motors)', unit: 'YES/NO' },

  // SELECTION & REMARKS
  { key: 'Selected Cable 1', label: 'Selected cable size (1)', group: 'SELECTION', position: 49, format: 'text' },
  { key: 'Selected Cable 2', label: 'Selected cable size (2)', group: 'SELECTION', position: 50, format: 'text' },
  { key: 'Total Cable Length', label: 'Total Cable Length in meters', group: 'SELECTION', position: 51, format: 'formula', calculatedFrom: 'CableLengthTotal * Runs', precision: 1, unit: 'm' },
  { key: 'Remarks', label: 'Remarks', group: 'REMARKS', position: 52, format: 'text', inputField: 'remarks' }
];

// Organize by groups for display
export const COLUMN_GROUPS = [
  { name: 'ID & ROUTING', keys: ['SL', 'Tag No', 'From', 'To', 'Description'] },
  { name: 'LOAD', keys: ['Equipment Location', 'Bus', 'Type of feeder', 'Rated power', 'UNIT', '3Phase', 'Rated Voltage', 'Power factor', 'Efficiency', 'Rated full load current', 'Motor starting current', 'Motor starting PF'] },
  { name: 'SC WITHSTAND', keys: ['Short circuit current', 'SC duration', 'Min size SC'] },
  { name: 'CABLE DATA', keys: ['Installation', 'No. of Cores', 'Size in Sq.mm', 'Cable size', 'Cable size PE', 'Cable Voltage', 'Current Rating', 'Cable Resistance 90C', 'Cable Reactance 50Hz'] },
  { name: 'CABLE LENGTH', keys: ['Cable Length Building', 'Cable Length to Equipment', 'Cable Length Riser', 'Cable Length Dropping', 'Spare 10%', 'Cable Length Total'] },
  { name: 'CAPACITY', keys: ['K1 Ambient Temp', 'K2 Grouping', 'K3 Ground Temp', 'K4 Depth', 'K5 Thermal', 'K Total', 'Derated Capacity', 'No. of Runs', 'Capacity Check'] },
  { name: 'RUNNING V-DROP', keys: ['Running VD Volts', 'Running VD Check'] },
  { name: 'STARTING V-DIP', keys: ['Starting VD Volts', 'Starting VD Check'] },
  { name: 'SELECTION', keys: ['Selected Cable 1', 'Selected Cable 2', 'Total Cable Length'] },
  { name: 'REMARKS', keys: ['Remarks'] }
];

export function getColumnByKey(key: string): ExcelColumnDef | undefined {
  return EXCEL_COLUMNS.find(col => col.key === key);
}

export function getColumnsByGroup(groupName: string): ExcelColumnDef[] {
  const groupDef = COLUMN_GROUPS.find(g => g.name === groupName);
  if (!groupDef) return [];
  return groupDef.keys
    .map(key => EXCEL_COLUMNS.find(col => col.key === key))
    .filter((col): col is ExcelColumnDef => col !== undefined);
}
