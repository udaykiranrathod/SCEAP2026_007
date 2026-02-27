/**
 * Path Discovery Service - Core utility for extracting and validating cable paths
 * Used by both Sizing and Optimization pages
 */

import { CableSizingEngine_V2 } from './CableSizingEngine_V2';

export interface CablePath {
  pathId: string;
  startEquipment: string;
  startEquipmentDescription: string;
  startPanel: string;
  endTransformer: string;
  cables: CableSegment[];
  totalDistance: number;
  totalVoltage: number;
  cumulativeLoad: number;
  voltageDrop: number;
  voltageDropPercent: number;
  // breakdown of each segment's voltage drop and intermediate formula, plus sizing info
  voltageDropDetails?: Array<{
    cableNumber: string;
    length: number;
    resistance: number;
    current: number;
    deratedCurrent: number;
    drop: number;
    formula: string;
    size: number;
    numberOfRuns?: number;
    sizePerRun?: number;
  }>;
  isValid: boolean;
  validationMessage: string;
}

export interface CableSegment {
  // ID & ROUTING
  serialNo: number;
  cableNumber: string;
  feederDescription: string;
  fromBus: string;
  toBus: string;

  // LOAD DATA
  equipmentLocation?: string;
  bus?: string;
  feederType?: string;
  unit?: 'kW' | 'kVA';
  ratedPower?: number; // Rated Power KW (for Excel compatibility)
  ratedVoltageKV?: number; // Voltage in kV
  ratedVoltage_V?: number; // Voltage in Volts (same as voltage field)
  voltage: number;
  phase?: '1Ø' | '3Ø';
  loadKW: number;
  powerFactor?: number;
  efficiency?: number;
  loadType?: 'Motor' | 'Heater' | 'Transformer' | 'Feeder' | 'Pump' | 'Fan' | 'Compressor';

  // SHORT CIRCUIT
  maxShortCircuitCurrent?: number; // kA
  motorStartingCurrent?: number; // A
  motorStartingPF?: number;
  protectionClearingTime?: number; // seconds
  scDuration?: number; // SC withstand duration

  // CABLE DATA
  length: number;
  numberOfCores?: '1C' | '2C' | '3C' | '3C+E' | '4C'; // used for cross-checking, not currently consumed
  conductorMaterial?: 'Cu' | 'Al';
  installationMethod?: string;
  resistance?: number;
  reactance?: number;
  cableSpacing?: 'touching' | 'spaced_400mm' | 'spaced_600mm';

  // CABLE LENGTH COMPONENTS (for granular tracking)
  cableLengthBuilding?: number; // m
  cableLengthToEquipment?: number; // m
  cableLengthRiser?: number; // m
  cableLengthDropping?: number; // m
  cableLengthSpare?: number; // 10% margin

  // DERATING
  ambientTemp?: number; // °C
  soilThermalResistivity?: number; // K·m/W
  depthOfLaying?: number; // cm
  groundTemp?: number; // °C
  numberOfLoadedCircuits?: number;
  deratingFactor?: number;

  // CAPACITY & PROTECTION
  protectionType?: 'ACB' | 'MCCB' | 'MCB' | 'None';
  breakerType?: string;
  
  // ADVANCED FIELDS
  startingMethod?: 'DOL' | 'StarDelta' | 'SoftStarter' | 'VFD';
  insulation?: 'XLPE' | 'PVC';

  // UI/EDITOR FIELDS
  forcedSize?: number; // User override for cable size
  selectedSize?: string; // e.g., '1R X 11kV X 3C X 240 Sqmm'
  parallelCount?: number; // For parallel cables
  originalCables?: string[];
  remarks?: string;
  status?: 'APPROVED' | 'WARNING' | 'FAILED';
}

export interface PathAnalysisResult {
  totalPaths: number;
  validPaths: number;
  invalidPaths: number;
  paths: CablePath[];
  averageVoltageDrop: number;
  criticalPaths: CablePath[]; // Paths exceeding 5% V-drop limit
}

/**
 * Helper: Flexible column lookup with multiple naming variations
 * Tries exact match first, then case-insensitive, then key contains
 */
const getColumnValue = (row: any, ...variations: string[]): any => {
  // Try exact match first (important for standardized field names like 'loadKW')
  for (const v of variations) {
    if (v in row && row[v] !== undefined && row[v] !== null && row[v] !== '') {
      return row[v];
    }
  }
  
  // Try case-insensitive match
  const lowerRow = Object.keys(row).reduce((acc: any, key) => {
    acc[key.toLowerCase().trim()] = row[key];
    return acc;
  }, {});
  
  for (const v of variations) {
    const lower = v.toLowerCase().trim();
    if (lower in lowerRow && lowerRow[lower] !== undefined && lowerRow[lower] !== null && lowerRow[lower] !== '') {
      return lowerRow[lower];
    }
  }
  
  // Try partial match (key contains variation) - but prioritize longer variations (more specific)
  const rowKeys = Object.keys(row);
  // Sort variations by length descending (longer = more specific)
  const sortedVariations = [...variations].sort((a, b) => b.length - a.length);
  
  for (const v of sortedVariations) {
    const partial = rowKeys.find(k => k.toLowerCase().includes(v.toLowerCase()));
    if (partial && row[partial] !== undefined && row[partial] !== null && row[partial] !== '') {
      return row[partial];
    }
  }
  
  return undefined;
};

/**
 * Auto-detect column mappings from Excel headers using flexible matching
 * Returns a mapping of standardized field names to Excel column headers
 */
export const autoDetectColumnMappings = (headers: string[]): Record<string, string> => {
  const mappings: Record<string, string> = {};
  const headerMap = new Map<string, string>(); // normalized -> original
  
  headers.forEach(h => {
    const norm = h.toLowerCase().trim();
    headerMap.set(norm, h);
  });

  const fieldSynonyms: Record<string, string[]> = {
    serialNo: ['serial no', 's.no', 'sno', 'index', 'no', 'serial', 'num', 'number'],
    cableNumber: ['cable number', 'cable no', 'cable #', 'cable', 'feeder', 'feeder id', 'feed no', 'id'],
    feederDescription: ['feeder description', 'description', 'name', 'desc', 'feeder name', 'equipment name'],
    fromBus: ['from bus', 'from', 'source', 'load', 'equipment', 'start', 'origin'],
    toBus: ['to bus', 'to', 'destination', 'panel', 'target', 'end'],
    voltage: ['voltage (v)', 'voltage', 'v (v)', 'v', 'nominal voltage', 'rated voltage', 'supply voltage'],
    loadKW: ['load (kw)', 'load kw', 'kw', 'power', 'p', 'load', 'power (kw)'],
    length: ['length (m)', 'length', 'l (m)', 'l', 'distance', 'cable length', 'route length'],
    powerFactor: ['power factor', 'pf', 'cos φ', 'cos phi', 'power factor (pf)', 'cos'],
    efficiency: ['efficiency (%)', 'efficiency', 'eff', 'eff (%)', 'efficiency %'],
    deratingFactor: ['derating factor', 'derating', 'k', 'factor', 'derating k'],
    ambientTemp: ['ambient temp (°c)', 'ambient temp', 'temp', 'ambient temperature', 'temperature', 'ambient (°c)'],
    installationMethod: ['installation method', 'installation', 'method', 'type', 'cable installation'],
    numberOfLoadedCircuits: ['grouped loaded circuits', 'circuits', 'groups', 'grouped circuits', 'number of circuits'],
    protectionType: ['breaker type', 'protection type', 'breaker', 'protection', 'circuit breaker'],
    maxShortCircuitCurrent: ['short circuit current (ka)', 'isc', 'isc (ka)', 'short circuit', 'sc current', 'trip time (ms)'],
    ratedPowerKVA: ['rated power (kva)', 'kva', 'power kva'],
    ratedPowerKW: ['rated power (kw)', 'kw', 'power kw'],
    motorStartingCurrent: ['motor starting current', 'starting current', 'startup current'],
    motorStartingPF: ['motor starting pf', 'starting power factor'],
    scDuration: ['sc withstand duration', 'withstand duration', 'duration (sec)'],
    noOfCores: ['no. of cores', 'number of cores', 'cores', 'core count'],
    groundTemp: ['ground temp', 'ground temperature', 'soil temp']
  };

  for (const [field, synonyms] of Object.entries(fieldSynonyms)) {
    for (const syn of synonyms) {
      const norm = syn.toLowerCase().trim();
      if (headerMap.has(norm)) {
        mappings[field] = headerMap.get(norm)!;
        break; // Use first match
      }
    }
  }

  return mappings;
};

/**
 * Normalize feeder data from Excel
 * Maps various column naming conventions to standard properties
 */
export const normalizeFeeders = (rawFeeders: any[]): CableSegment[] => {
  // DEBUG: Log first feeder's keys to see what columns are available
  if (rawFeeders.length > 0) {
    console.log('[NORMALIZEFEEDERS] Available columns in first feeder:', Object.keys(rawFeeders[0]));
  }

  return rawFeeders
    .filter((f: any) => {
      // Check if row has at least From Bus data
      const fromBus = getColumnValue(f, 'From Bus', 'From', 'Source', 'Load', 'Equipment', 'from bus', 'from', 'source');
      return fromBus && String(fromBus).trim() !== '';
    })
    .map((feeder: any) => {
      // Helper to safely get numeric values with fallback
      // - Extracts the first numeric token from strings like "11 kV", "6.6kV", "415V"
      // - Accepts decimals and negative signs
      const getNumber = (value: any, fallback = 0): number => {
        if (value === null || value === undefined || value === '') return fallback;
        const s = String(value).trim();
        // Try direct numeric parse first (handles plain numbers)
        const direct = Number(s.replace(/,/g, ''));
        if (Number.isFinite(direct)) return direct;
        // Otherwise extract first numeric substring
        const m = s.match(/-?\d+(?:[\.,]\d+)?/);
        if (m) {
          // Normalize comma decimal to dot
          const token = m[0].replace(',', '.');
          const parsed = Number(token);
          if (Number.isFinite(parsed)) return parsed;
        }
        return fallback;
      };

      // Helper to safely get string values
      const getString = (value: any, fallback = ''): string => {
        return String(value || fallback).trim();
      };

      // Note: numberOfCores will be extracted as part of the return object below

      // Get voltage for phase detection
      const voltageRaw = getColumnValue(feeder, 'Voltage (V)', 'Voltage', 'V (V)', 'V', 'voltage (v)', 'rated voltage', 'nominal voltage');
      // Parse numeric part first
      let voltage = getNumber(voltageRaw, 415);

      // If the original raw value contains 'k' or 'kv' (case-insensitive), treat it as kV
      if (voltageRaw && typeof voltageRaw === 'string' && /k\s?v/i.test(String(voltageRaw))) {
        // e.g., '11 kV', '6.6kV' -> numeric part parsed above, convert to V
        if (voltage > 0 && voltage < 100000) voltage = voltage * 1000;
      } else {
        // Fallback heuristic: if numeric value looks like kV (small number < 100), convert
        if (voltage > 0 && voltage < 100) {
          voltage = voltage * 1000; // Convert kV to V
        }
      }

      // Determine phase early so we can use it during loadKW conversion
      const phaseRaw = getColumnValue(feeder, 'Phase', '3Phase / 1Phase', 'Phase', 'phase', '1Ph', '3Ph');
      let phase: '1Ø' | '3Ø' = '3Ø';
      if (phaseRaw && typeof phaseRaw === 'string') {
        const p = phaseRaw.toLowerCase();
        if (p.includes('1')) phase = '1Ø';
        else if (p.includes('3')) phase = '3Ø';
      } else {
        // default based on voltage
        phase = voltage >= 400 ? '3Ø' : '1Ø';
      }

      // DEBUG: Log voltage extraction
      const cableNum = getString(getColumnValue(feeder, 'cableNumber', 'Cable Number', 'Cable No', 'Cable', 'Feeder', 'cable number', 'cable no', 'feeder id'), '');
      if (!voltageRaw) {
        console.log(`[NORMALIZEFEEDERS] Cable ${cableNum}: voltageRaw=undefined, using default 415`);
      } else {
        console.log(`[NORMALIZEFEEDERS] Cable ${cableNum}: voltageRaw=${voltageRaw}, converted to voltage=${voltage}V, phase=${phase}`);
      }

      return {
        serialNo: getNumber(getColumnValue(feeder, 'serialNo', 'Serial No', 'S.No', 'SL No', 'SNo', 'serial no', 'index', 'no'), 0),
        cableNumber: getString(getColumnValue(feeder, 'cableNumber', 'Cable Number', 'Cable No', 'Tag No', 'Cable', 'Feeder', 'cable number', 'cable no', 'feeder id'), ''),
        feederDescription: getString(
          getColumnValue(feeder, 'feederDescription', 'Feeder Description', 'Description', 'Name', 'feeder description', 'desc'),
          ''
        ),
        fromBus: getString(getColumnValue(feeder, 'fromBus', 'From Bus', 'From', 'Source', 'Load', 'Equipment', 'from bus', 'from', 'source'), ''),
        toBus: getString(getColumnValue(feeder, 'toBus', 'To Bus', 'To', 'Destination', 'Panel', 'to bus', 'to', 'destination'), ''),

        // LOAD DATA - NEW FIELDS
        equipmentLocation: getString(getColumnValue(feeder, 'equipmentLocation', 'Equipment Location', 'Location'), ''),
        bus: getString(getColumnValue(feeder, 'bus', 'Bus', 'bus identifier'), ''),
        feederType: getString(getColumnValue(feeder, 'feederType', 'Type of feeder', 'Feeder Type'), ''),
        ratedPower: getNumber(getColumnValue(feeder, 'ratedPower', 'Rated power', 'Rated Power', 'Power', 'Load'), 0),
        ratedVoltageKV: voltage / 1000,
        ratedVoltage_V: voltage,
        voltage,
        phase: (getString(getColumnValue(feeder, 'phase', 'Phase', '3Phase / 1Phase', 'phase'), '') as '1Ø' | '3Ø') || (voltage >= 400 ? '3Ø' : '1Ø'),
        unit: (() => {
          const unitRaw = getColumnValue(feeder, 'UNIT', 'UNIT (kW / kVa)', 'Unit (kW/kVA)', 'unit', 'Power Unit');
          let u: 'kW' | 'kVA' = 'kW';
          if (unitRaw && typeof unitRaw === 'string' && unitRaw.toLowerCase().includes('kva')) {
            u = 'kVA';
          }
          return u;
        })(),

        loadKW: (() => {
          const unit: 'kW' | 'kVA' = (() => {
            const unitRaw = getColumnValue(feeder, 'UNIT', 'UNIT (kW / kVa)', 'Unit (kW/kVA)', 'unit', 'Power Unit');
            let u: 'kW' | 'kVA' = 'kW';
            if (unitRaw && typeof unitRaw === 'string' && unitRaw.toLowerCase().includes('kva')) {
              u = 'kVA';
            }
            return u;
          })();

          const direct = getNumber(getColumnValue(feeder, 'loadKW', 'Load (kW)', 'Load KW', 'Rated power', 'Load', 'Power', 'kW', 'load (kw)', 'power (kw)'), NaN);
          if (!isNaN(direct) && direct > 0) return direct;

          if (unit === 'kW') {
            const kw = getNumber(getColumnValue(feeder, 'ratedPowerKW', 'Rated Power (kW)', 'kW', 'Rated power'), NaN);
            if (!isNaN(kw) && kw > 0) return kw;
          }

          const kva = getNumber(getColumnValue(feeder, 'ratedPowerKVA', 'Rated Power (kVA)', 'kVA', 'Rated power'), NaN);
          if (!isNaN(kva) && kva > 0) {
            const pf = getNumber(getColumnValue(feeder, 'powerFactor', 'Power Factor', 'PF', 'Power factor'), 0.85);
            const eff = getNumber(getColumnValue(feeder, 'efficiency', 'Efficiency', 'Efficiency (%)', 'Eff'), 0.92);
            const vval = voltage || 415;
            const p_kw = kva * pf * eff;
            if (phase === '3Ø') {
              return (p_kw * 1000) / (Math.sqrt(3) * vval);
            } else {
              return (p_kw * 1000) / vval;
            }
          }

          return 0;
        })(),

        // SHORT CIRCUIT & PROTECTION
        maxShortCircuitCurrent: (() => {
          const raw = getColumnValue(feeder, 'maxShortCircuitCurrent', 'Short circuit current of switchboard', 'Short Circuit Current (kA)', 'Short circuit current (kA)', 'ISc', 'Isc', 'short circuit', 'sc current');
          if (raw === undefined || raw === null || raw === '') return undefined;
          const n = getNumber(raw);
          return Number.isFinite(n) ? n : undefined;
        })(),
        motorStartingCurrent: getNumber(getColumnValue(feeder, 'motorStartingCurrent', 'Motor starting current', 'Motor Starting Current', 'Starting Current'), 0),
        motorStartingPF: getNumber(getColumnValue(feeder, 'motorStartingPF', 'Motor starting power factor', 'Motor Starting PF', 'Starting PF'), 0.2),
        scDuration: getNumber(getColumnValue(feeder, 'scDuration', 'Short circuit current withstand duration', 'SC withstand duration', 'SC Withstand Duration', 'Duration (sec)'), 0.265),
        protectionType: (getString(getColumnValue(feeder, 'protectionType', 'Breaker Type', 'Protection Type', 'Breaker', 'breaker type', 'protection'), 'MCCB')) as 'ACB' | 'MCCB' | 'MCB' | 'None',
        breakerType: getString(getColumnValue(feeder, 'breakerType', 'Breaker Type', 'Protection Type', 'Breaker', 'breaker type', 'protection'), 'MCCB'),

        // CABLE DATA
        length: getNumber(getColumnValue(feeder, 'length', 'Cable length for each run', 'Length (m)', 'Length', 'L', 'Distance', 'length (m)', 'cable length'), 0),
        numberOfCores: (() => {
          let numberOfCores: '1C' | '2C' | '3C' | '3C+E' | '4C' | undefined;
          const ncValue = getColumnValue(feeder, 'numberOfCores', 'No. of Cores', 'Number of Cores', 'Core', 'Cores', 'core', 'Cable Type') || '3C';
          if (typeof ncValue === 'string') {
            numberOfCores = ncValue as any;
          } else if (typeof ncValue === 'number') {
            const coreMap: Record<number, '1C' | '2C' | '3C' | '3C+E' | '4C'> = { 1: '1C', 2: '2C', 3: '3C', 4: '4C' };
            numberOfCores = coreMap[ncValue] || '3C';
          }
          return numberOfCores;
        })(),
        conductorMaterial: 'Al',
        installationMethod: getString(getColumnValue(feeder, 'installationMethod', 'Installation', 'Installation Method', 'method'), 'Air'),
        resistance: getNumber(getColumnValue(feeder, 'resistance', 'Resistance', 'R', 'resistance'), 0),
        reactance: getNumber(getColumnValue(feeder, 'reactance', 'Reactance', 'X', 'reactance'), 0),
        cableSpacing: (getString(getColumnValue(feeder, 'cableSpacing', 'Cable Spacing', 'Spacing', 'cable spacing'), 'touching')) as 'touching' | 'spaced_400mm' | 'spaced_600mm',

        // CABLE LENGTH COMPONENTS
        cableLengthBuilding: getNumber(getColumnValue(feeder, 'cableLengthBuilding', 'Cable Length with in Electrical Building', 'Cable Length Building', 'Cable Length Building (m)'), 0),
        cableLengthToEquipment: getNumber(getColumnValue(feeder, 'cableLengthToEquipment', 'Cable Length from Electrical Building to Equipment', 'Cable Length to Equipment', 'Cable Length to Equipment (m)'), 0),
        cableLengthRiser: getNumber(getColumnValue(feeder, 'cableLengthRiser', 'Cable length Riser & Dropper', 'Cable Length Riser', 'Cable Length Riser (m)'), 0),
        cableLengthDropping: getNumber(getColumnValue(feeder, 'cableLengthDropping', 'Cable length both side dropping & Termination', 'Cable Length Dropping', 'Cable Length Dropping (m)'), 0),
        cableLengthSpare: getNumber(getColumnValue(feeder, 'cableLengthSpare', 'Spare 10%', 'Spare'), 0),

        // DERATING
        ambientTemp: getNumber(getColumnValue(feeder, 'ambientTemp', 'Ambient Temp (°C)', 'Ambient temperature (K1)', 'Ambient Temp', 'Temp', 'ambient temp', 'temperature'), 40),
        groundTemp: getNumber(getColumnValue(feeder, 'groundTemp', 'Ground Temp (°C)', 'Ground temperature', 'Ground Temp', 'Soil Temp'), 20),
        depthOfLaying: getNumber(getColumnValue(feeder, 'depthOfLaying', 'Depth of Laying (cm)', 'Depth', 'depth'), 100),
        soilThermalResistivity: getNumber(getColumnValue(feeder, 'soilThermalResistivity', 'Thermal Resistivity (K·m/W)', 'Soil Thermal Resistivity (K·m/W)', 'Soil Resistivity', 'soil resistivity'), 1.5),
        numberOfLoadedCircuits: getNumber(getColumnValue(feeder, 'numberOfLoadedCircuits', 'Grouped Loaded Circuits', 'Circuits', 'grouped circuits'), 1),
        deratingFactor: getNumber(getColumnValue(feeder, 'deratingFactor', 'Derating Factor', 'K', 'derating factor', 'derating k'), 0),

        // OPTIONAL UI FIELDS
        powerFactor: (() => {
          const v = getNumber(getColumnValue(feeder, 'powerFactor', 'Power Factor', 'Power factor', 'PF', 'power factor', 'pf'), 0.85);
          return v > 1 ? v / 100 : v;
        })(),
        efficiency: (() => {
          const v = getNumber(getColumnValue(feeder, 'efficiency', 'Efficiency', 'Efficiency (%)', 'Eff', 'efficiency', 'eff'), 0.95);
          return v > 1 ? v / 100 : v;
        })(),
        startingMethod: (getString(getColumnValue(feeder, 'startingMethod', 'Starting Method', 'Starting', 'starting method'), 'DOL')) as 'DOL' | 'StarDelta' | 'SoftStarter' | 'VFD',
        insulation: (getString(getColumnValue(feeder, 'insulation', 'Insulation', 'insulation'), 'XLPE')) as 'XLPE' | 'PVC',
        loadType: (getString(getColumnValue(feeder, 'loadType', 'Load Type', 'Type of feeder', 'Type', 'load type', 'type'), 'Motor')) as any,
        selectedSize: getString(getColumnValue(feeder, 'selectedSize', 'Selected Cable Size', 'Selected cable size'), ''),
        remarks: getString(getColumnValue(feeder, 'remarks', 'Remarks', 'remarks'), '')
      };
    });
};

/**
 * Calculate voltage drop for a cable segment
 * V-drop = (I × R × L) / 1000 for single phase
 * For three-phase: V-drop = (√3 × I × R × L) / 1000
 */
export const calculateSegmentVoltageDrop = (
  segment: CableSegment,
  cableResistance: number
): { voltageDrop: number; current: number; percent: number } => {
  // If missing data, return zeros
  if (!segment.loadKW || !segment.length || !cableResistance || !segment.voltage) {
    return { voltageDrop: 0, current: 0, percent: 0 };
  }

  // Calculate running current: I = (P × 1000) / (√3 × V × PF × Efficiency)
  const pf = segment.powerFactor ?? 0.85;
  const efficiency = segment.efficiency ?? 0.95;
  const sqrt3 = Math.sqrt(3);

  const current = (segment.loadKW * 1000) / (sqrt3 * segment.voltage * pf * efficiency);

  // V-drop uses actual running current (not derated capacity)
  const vdrop = (sqrt3 * current * cableResistance * segment.length) / 1000;

  const percent = segment.voltage > 0 ? (vdrop / segment.voltage) * 100 : 0;
  return { voltageDrop: vdrop, current, percent };
};

/**
 * CORRECT PATH DISCOVERY ALGORITHM (Per IEC 60287/60364 & User Guide)
 * 
 * Backward traversal from each end-load through intermediate panels to transformer
 * Ensures each path shows complete sequence: Load → Parent Panel → Main Dist → Transformer
 * 
 * Example: PUMP-P1 → HVAC-PANEL → MAIN-DISTRIBUTION → TRF-MAIN
 */
export const discoverPathsToTransformer = (cables: CableSegment[]): CablePath[] => {
  if (!cables || cables.length === 0) {
    console.error('No cable data provided');
    return [];
  }

  const paths: CablePath[] = [];
  const normalizeBus = (b: string) => String(b || '').trim().toUpperCase();

  // STEP 1: Identify all buses in the network
  const allBuses = new Set<string>();
  
  cables.forEach(cable => {
    const fromKey = normalizeBus(cable.fromBus);
    const toKey = normalizeBus(cable.toBus);
    allBuses.add(fromKey);
    allBuses.add(toKey);
  });

  // STEP 2: Identify candidate root/top-level buses.
  // Do not assume a single transformer; treat dead-ends (no parent) or top-level buses
  // as roots for individual paths so all paths are discovered.
  const cableFromBuses = new Set(cables.map(c => normalizeBus(c.fromBus)));
  const cableToBuses = new Set(cables.map(c => normalizeBus(c.toBus)));
  const topLevelBuses = Array.from(cableToBuses).filter(b => !cableFromBuses.has(b));
  if (topLevelBuses.length > 0) {
    console.log(`[PATH DISCOVERY] Top-level buses identified: ${topLevelBuses.join(', ')}`);
  } else {
    console.log('[PATH DISCOVERY] No explicit top-level buses found; will treat dead-ends as roots');
  }

  // STEP 3: For EACH cable originating from a load (leaf node), trace backward to transformer
  let pathIndex = 1;
  
  // Find all cables that originate from end-loads (fromBus is never a toBus of another cable = true leaf)
  const rawEndLoadCables = cables.filter(cable => {
    const fromBusNorm = normalizeBus(cable.fromBus);
    // True end-load: this bus is a fromBus but never a toBus of any other cable
    return !cableToBuses.has(fromBusNorm) || cableToBuses.has(fromBusNorm) === false;
  });

  console.log(`[PATH DISCOVERY] Found ${rawEndLoadCables.length} end-load cables out of ${cables.length} total cables`);

  // Group cables by normalized fromBus so parallel runs are treated as a single logical path
  const groupedMap = new Map<string, CableSegment>();
  rawEndLoadCables.forEach(c => {
    const key = normalizeBus(c.fromBus);
    if (!groupedMap.has(key)) {
      groupedMap.set(key, { ...c, parallelCount: 1, originalCables: [c.cableNumber] });
    } else {
      const existing = groupedMap.get(key)!;
      existing.parallelCount = (existing.parallelCount || 1) + 1;
      existing.originalCables = existing.originalCables || [existing.cableNumber];
      existing.originalCables.push(c.cableNumber);
      // accumulate load and choose longest length for display
      existing.loadKW = (existing.loadKW || 0) + (c.loadKW || 0);
      existing.length = Math.max(existing.length || 0, c.length || 0);
    }
  });

  const endLoadCables = Array.from(groupedMap.values());

  console.log(`[PATH DISCOVERY] Grouped into ${endLoadCables.length} unique starting buses (parallel runs collapsed)`);

  // Trace back each end-load to a root (dead-end or top-level bus)
  for (const startCable of endLoadCables) {
    const pathCables = traceBackToTransformer(startCable, cables, normalizeBus);

    if (pathCables && pathCables.length > 0) {
      const totalDistance = pathCables.reduce((sum, c) => sum + c.length, 0);
      const totalVoltage = pathCables[0]?.voltage || 415;
      const cumulativeLoad = pathCables.reduce((sum, c) => sum + (c.loadKW || 0), 0);

      // Voltage drop analysis: sum of individual cable drops OR estimate from path
      // compute detailed drop per segment including formula strings
      const dropDetails: any[] = [];
      let totalVdrop = 0;
      pathCables.forEach(seg => {
        const r = seg.resistance || 0.1;
        const segDrop = calculateSegmentVoltageDrop(seg, r);
        const drop = segDrop.voltageDrop;
        totalVdrop += drop;
        const formula = `Vdrop = (√3 × ${segDrop.current.toFixed(2)}A × ${r.toFixed(3)}Ω/km × ${seg.length}m) / 1000 = ${drop.toFixed(3)}V (${segDrop.percent.toFixed(2)}%)`;
        dropDetails.push({
          cableNumber: seg.cableNumber,
          length: seg.length,
          resistance: r,
          current: segDrop.current,
          deratedCurrent: (segDrop.current / (seg.deratingFactor || 1)),
          drop,
          percent: segDrop.percent,
          formula
        });
      });
      const voltageDropPercent = totalVoltage > 0 ? (totalVdrop / totalVoltage) * 100 : 0;

      // Determine root bus for this path from the last cable in the traced path
      const pathRootBus = pathCables[pathCables.length - 1]?.toBus || 'UNKNOWN';
      const path: CablePath = {
        pathId: `PATH-${String(pathIndex).padStart(3, '0')}`,
        startEquipment: startCable.fromBus,
        startEquipmentDescription: startCable.feederDescription,
        startPanel: startCable.fromBus,
        endTransformer: pathRootBus,
        cables: pathCables,
        totalDistance,
        totalVoltage,
        cumulativeLoad,
        voltageDrop: totalVdrop,
        voltageDropPercent,
        voltageDropDetails: dropDetails,
        isValid: true, // All discovered paths are structurally valid
        validationMessage:
          voltageDropPercent <= 5
            ? `✓ V-drop: ${voltageDropPercent.toFixed(2)}% (IEC 60364 Compliant)`
            : `⚠ V-drop: ${voltageDropPercent.toFixed(2)}% (Exceeds 5% limit — optimize cable sizing)`
      };

      paths.push(path);
      pathIndex++;
    }
  }

  console.log(`[PATH DISCOVERY] Discovered ${paths.length} complete paths (from end-loads to transformer)`);
  
  if (paths.length === 0 && cables.length > 0) {
    console.warn('[PATH DISCOVERY] WARNING: No complete paths found despite having cable data');
    console.warn('This may indicate: (1) Disconnected equipment, (2) Data hierarchy issues, (3) No transformer identified');
  }

  return paths;
};

/**
 * Recursively trace a single cable backward through parents until reaching transformer
 * 
 * Algorithm:
 * 1. Start with a cable (equipment → parent)
 * 2. Look for cable where fromBus == current cable's toBus (the parent cable)
 * 3. Repeat up the hierarchy until reaching transformer
 */
const traceBackToTransformer = (
  startCable: CableSegment,
  allCables: CableSegment[],
  normalizeBus: (b: string) => string
): CableSegment[] => {
  const path: CableSegment[] = [startCable];
  let currentCable = startCable;
  const visited = new Set<string>();
  
  let iterations = 0;
  const MAX_ITERATIONS = 100; // Safety limit to prevent infinite loops

  // Backward traverse: load's cable → find parent's cable → repeat until transformer
  while (iterations < MAX_ITERATIONS) {
    iterations++;
    // Find the parent cable (cable where fromBus == current.toBus)
    const nextFromBusNorm = normalizeBus(currentCable.toBus);
    
    // If we've reached a transformer bus explicitly, stop tracing
    if (/^TRF/i.test(nextFromBusNorm)) {
      console.log(`[TRACE] Transformer reached at bus: ${currentCable.toBus}`);
      break;
    }

    if (visited.has(nextFromBusNorm)) {
      // Cycle detected - path is malformed
      console.warn(`[TRACE] Cycle detected at bus: ${currentCable.toBus}`);
      break;
    }
    visited.add(nextFromBusNorm);

    const parentCable = allCables.find(c => normalizeBus(c.fromBus) === nextFromBusNorm);
    
    if (!parentCable) {
      // Dead end - no parent cable found. Treat current.toBus as path root
      console.log(`[TRACE] Reached end of hierarchy at: ${currentCable.toBus} (treated as root)`);
      break;
    }

    // Add parent to path and continue upward
    path.push(parentCable);
    currentCable = parentCable;
  }

  if (iterations >= MAX_ITERATIONS) {
    console.error('[TRACE] MAX_ITERATIONS exceeded — possible cycle in data');
  }

  return path;
};

/**
 * Analyze all paths and generate summary report
 */
export const analyzeAllPaths = (cables: CableSegment[], catalogueData?: any): PathAnalysisResult => {
  if (!cables || cables.length === 0) {
    console.error('ERROR: No cable data provided to analyzeAllPaths');
    return {
      totalPaths: 0,
      validPaths: 0,
      invalidPaths: 0,
      paths: [],
      averageVoltageDrop: 0,
      criticalPaths: []
    };
  }

  const paths = discoverPathsToTransformer(cables);

  // run sizing engine to compute accurate voltage drop for each cable segment
  const engine = new CableSizingEngine_V2(catalogueData);

  paths.forEach(p => {
    let totalVdrop = 0;
    const dropDetails: any[] = [];
    p.cables.forEach(seg => {
      // build input using same logic as ResultsTab.calculateExcelFormulas
      const lt = (seg.loadType || '').toString().toLowerCase();
      const feederType = ['transformer', 'feeder'].includes(lt)
        ? 'F'
        : ['motor', 'pump', 'fan', 'compressor', 'heater'].includes(lt)
        ? 'M'
        : lt === ''
        ? 'M'
        : 'F';

      const input: any = {
        loadType: feederType === 'M' ? 'Motor' : 'Feeder',
        ratedPowerKW: seg.loadKW || 0,
        voltage: seg.voltage || 415,
        phase: '3Ø',
        efficiency: feederType === 'M' ? (seg.efficiency || 0.95) : 1,
        powerFactor: seg.powerFactor || 0.85,
        conductorMaterial: 'Cu',
        insulation: 'XLPE',
        numberOfCores: seg.numberOfCores || '3C',
        installationMethod: seg.installationMethod || 'Air',
        cableLength: seg.length || 0,
        ambientTemp: seg.ambientTemp || 40,
        numberOfLoadedCircuits: seg.numberOfLoadedCircuits || 1,
        // allow UI to force a selection
        forceSize: (seg as any).forcedSize || undefined,
        // optional fields defaulted inside engine
      };

      const rres = engine.sizeCable(input);
      const resistance = rres.cableResistance_90C_Ohm_km || 0;
      // drop formula same as earlier helper but using engine data
      // Use engine-calculated drop values when available (engine returns volt and percent)
      const drop = (rres && rres.voltageDropRunning_volt) ? rres.voltageDropRunning_volt : (resistance && seg.length ? (1.732 * (rres.fullLoadCurrent || 0) * resistance * seg.length) / 1000 : 0);
      const percent = rres && rres.voltageDropRunning_percent ? rres.voltageDropRunning_percent : (seg.voltage > 0 ? (drop / seg.voltage) * 100 : 0);

      const formula = `Vdrop = (√3 × ${(rres.fullLoadCurrent || 0).toFixed(2)}A × ${resistance.toFixed(3)}Ω/km × ${seg.length}m) / 1000 = ${drop.toFixed(3)}V (${percent.toFixed(2)}%)`;

      dropDetails.push({
        cableNumber: seg.cableNumber,
        length: seg.length,
        resistance,
        current: rres.fullLoadCurrent || 0,
        deratedCurrent: rres.effectiveCurrentAtRun || 0,
        drop,
        percent,
        formula,
        size: rres.selectedConductorArea || 0,
        numberOfRuns: rres.numberOfRuns,
        sizePerRun: rres.sizePerRun
      });
      totalVdrop += drop;
    });

    // overwrite path values
    p.voltageDropDetails = dropDetails;
    p.voltageDrop = totalVdrop;
    p.voltageDropPercent = p.totalVoltage > 0 ? (totalVdrop / p.totalVoltage) * 100 : 0;
    p.validationMessage =
      p.voltageDropPercent <= 5
        ? `✓ V-drop: ${p.voltageDropPercent.toFixed(2)}% (IEC 60364 Compliant)`
        : `⚠ V-drop: ${p.voltageDropPercent.toFixed(2)}% (Exceeds 5% limit — optimize cable sizing)`;
  });

  // VALIDATION: Warn if no paths discovered despite having cable data
  if (paths.length === 0 && cables.length > 0) {
    console.error('⚠️ CRITICAL DATA INTEGRITY WARNING ⚠️');
    console.error(`System loaded ${cables.length} cables but discovered 0 paths`);
    console.error('REASONS:');
    console.error('1. No cables found connecting to a top-level bus (transformer)');
    console.error('2. All cables form a cycle with no root/source');
    console.error('3. Data structure does not match expected electrical hierarchy');
    console.error('\nEXPECTED FORMAT:');
    console.error('  - Each row = one cable connecting FROM a load TO a panel/source');
    console.error('  - Loads → Panels → Transformer (hierarchical structure)');
    console.error('  - At least one cable must have a toBus that is NEVER a fromBus');
    console.error('  - Example: from_bus="MOTOR-1", to_bus="MCC-PANEL" (MCC is parent)');
  }

  const validPaths = paths.filter(p => p.isValid);
  const invalidPaths = paths.filter(p => !p.isValid);
  const criticalPaths = paths.filter(p => p.voltageDropPercent > 3); // Warning threshold

  const averageVoltageDrop =
    paths.length > 0
      ? paths.reduce((sum, p) => sum + p.voltageDropPercent, 0) / paths.length
      : 0;

  return {
    totalPaths: paths.length,
    validPaths: validPaths.length,
    invalidPaths: invalidPaths.length,
    paths,
    averageVoltageDrop,
    criticalPaths
  };
};
