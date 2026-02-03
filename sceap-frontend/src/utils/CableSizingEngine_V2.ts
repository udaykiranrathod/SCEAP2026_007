/**
 * SIMPLIFIED CABLE SIZING ENGINE - V2
 * Direct catalog lookup approach per user requirements
 * 
 * LOGIC:
 * 1. Calculate required current (FLC) from load
 * 2. Apply derating factors (K_total)
 * 3. Required conductor area = FLC / (K_total × catalog_rating)
 * 4. Search catalog for smallest size ≥ required area
 * 5. Repeat for V-drop and ISc constraints
 * 6. Pick maximum size across all three constraints
 * 7. Cable designation includes core config (e.g., "3C×95mm²")
 * 
 * NO parallel runs, NO complex calculations — just match catalog
 */

import { AmpacityTables, DeratingTables, LoadTypeSpecs } from './CableEngineeringData';

export interface CableSizingInput {
  // Load & installation
  loadType: 'Motor' | 'Heater' | 'Transformer' | 'Feeder' | 'Pump' | 'Fan' | 'Compressor';
  ratedPowerKW: number;
  voltage: number;
  phase: '1Ø' | '3Ø';
  efficiency?: number;
  powerFactor?: number;
  cableLength: number;
  
  // Cable & environment
  numberOfCores: '1C' | '2C' | '3C' | '4C';
  conductorMaterial: 'Cu' | 'Al'; // Cu only in new catalog
  insulation: 'XLPE' | 'PVC';
  installationMethod: 'Air' | 'Trench' | 'Duct'; // Matches catalog
  ambientTemp?: number;
  
  // Protection & ISc (ISc only for ACB)
  protectionType?: 'ACB' | 'MCCB' | 'MCB' | 'None';
  maxShortCircuitCurrent?: number;
  protectionClearingTime?: number;
}

export interface CableSizingResult {
  // Catalog selection
  coreConfig: string; // e.g., "3C"
  conductorArea: number; // mm²
  
  // Current calcs
  fullLoadCurrent: number; // A
  deratingFactor: number; // K_total
  deredCurrent: number; // FLC / K_total
  
  // Sizing constraints
  sizeByAmpacity: number; // mm² from ampacity
  sizeByVoltageDrop: number; // mm² to limit V-drop
  sizeByISc?: number; // mm² for ISc (if ACB)
  
  // Selection
  selectedConductorArea: number; // mm² - final choice
  cableDesignation: string; // e.g., "3C×95mm² XLPE"
  catalogRating: number; // A @ 90°C
  installedRating: number; // catalogRating × K_total
  
  // Voltage drop
  voltageDropPercent: number;
  voltageDropVolt: number;
  
  // Status
  status: 'APPROVED' | 'WARNING' | 'FAILED';
  warnings: string[];
  drivingConstraint?: 'Ampacity' | 'VoltageDrop' | 'ISc';
}

class CableSizingEngine_V2 {
  private input!: CableSizingInput;
  private catalog: any;
  private allSizes: string[] = []; // All available mm² for the core config

  sizeCable(input: CableSizingInput): CableSizingResult {
    this.input = input;
    
    const result: CableSizingResult = {
      coreConfig: input.numberOfCores,
      conductorArea: 0,
      fullLoadCurrent: 0,
      deratingFactor: 1.0,
      deredCurrent: 0,
      sizeByAmpacity: 0,
      sizeByVoltageDrop: 0,
      selectedConductorArea: 0,
      cableDesignation: '',
      catalogRating: 0,
      installedRating: 0,
      voltageDropPercent: 0,
      voltageDropVolt: 0,
      status: 'APPROVED',
      warnings: []
    };

    try {
      // Step 1: Select catalog for this core config
      this.catalog = (AmpacityTables as any)[input.numberOfCores];
      if (!this.catalog) {
        throw new Error(`No catalog data for core config: ${input.numberOfCores}`);
      }
      this.allSizes = Object.keys(this.catalog).map(Number).sort((a, b) => a - b).map(String);

      // Step 2: Calculate FLC
      result.fullLoadCurrent = this.calculateFLC();

      // Step 3: Calculate derating K_total
      result.deratingFactor = this.calculateDerating();
      result.deredCurrent = result.fullLoadCurrent / result.deratingFactor;

      // Step 4: Size by ampacity - search catalog
      result.sizeByAmpacity = this.findSizeByAmpacity(result.deredCurrent);

      // Step 5: Size by voltage drop
      result.sizeByVoltageDrop = this.findSizeByVoltageDrop(result.fullLoadCurrent);

      // Step 6: Size by ISc (only if ACB)
      if (input.protectionType === 'ACB' && input.maxShortCircuitCurrent) {
        result.sizeByISc = this.findSizeByISc(input.maxShortCircuitCurrent);
      }

      // Step 7: Select final size (max of all constraints)
      result.selectedConductorArea = Math.max(
        result.sizeByAmpacity,
        result.sizeByVoltageDrop,
        result.sizeByISc || 0
      );

      // Determine driving constraint
      if (result.sizeByISc && result.selectedConductorArea === result.sizeByISc) {
        result.drivingConstraint = 'ISc';
      } else if (result.sizeByVoltageDrop && result.selectedConductorArea === result.sizeByVoltageDrop) {
        result.drivingConstraint = 'VoltageDrop';
      } else {
        result.drivingConstraint = 'Ampacity';
      }

      // Step 8: Lookup catalog entry for final size
      const catalogEntry = this.catalog[String(result.selectedConductorArea)];
      if (!catalogEntry) {
        throw new Error(`Selected size ${result.selectedConductorArea}mm² not in catalog`);
      }

      const installation = input.installationMethod.toLowerCase() as 'air' | 'trench' | 'duct';
      result.catalogRating = catalogEntry[installation];
      result.installedRating = result.catalogRating * result.deratingFactor;

      // Step 9: Calculate actual V-drop at final size
      const vdrop = this.calculateVoltageDropPercent(result.fullLoadCurrent, result.selectedConductorArea, catalogEntry);
      result.voltageDropPercent = vdrop.percent;
      result.voltageDropVolt = vdrop.voltage;

      // Step 10: Generate designation
      result.cableDesignation = `${input.numberOfCores}×${result.selectedConductorArea}mm² (${input.conductorMaterial} ${input.insulation})`;

      // Validate results
      if (result.voltageDropPercent > 5) {
        result.warnings.push(`Voltage drop high: ${result.voltageDropPercent.toFixed(2)}% (limit 5%)`);
        result.status = 'WARNING';
      }
      if (result.selectedConductorArea > 240) {
        result.warnings.push(`Large conductor size selected (${result.selectedConductorArea}mm²); consider parallel smaller cables or higher voltage`);
      }

    } catch (error) {
      result.status = 'FAILED';
      result.warnings.push(`Error: ${error}`);
    }

    return result;
  }

  private calculateFLC(): number {
    const P = this.input.ratedPowerKW;
    const V = this.input.voltage;
    const η = this.input.efficiency || (LoadTypeSpecs[this.input.loadType] as any).typicalEfficiency || 0.95;
    const cosφ = this.input.powerFactor || (LoadTypeSpecs[this.input.loadType] as any).typicalPowerFactor || 0.85;

    if (this.input.phase === '3Ø') {
      return (P * 1000) / (Math.sqrt(3) * V * cosφ * η);
    } else {
      return (P * 1000) / (V * cosφ * η);
    }
  }

  private calculateDerating(): number {
    // Simple derating: look up K value from installation method
    const method = this.input.installationMethod.toLowerCase() as 'air' | 'trench' | 'duct';
    const isSingle = this.input.numberOfCores === '1C';
    const tempFactors = (DeratingTables.temperature_factor as any)[method];
    const tempK = isSingle ? tempFactors.single : tempFactors.multi;
    
    // Assume single feeder (grouping = 1.0) and standard conditions
    return tempK; // K_total = temp factor × 1.0 (grouping) × 1.0 (ground) × 1.0 (depth) × 1.0 (thermal)
  }

  private findSizeByAmpacity(requiredCurrent: number): number {
    // Search catalog for smallest size where catalogRating ≥ requiredCurrent
    for (const sizeStr of this.allSizes) {
      const size = Number(sizeStr);
      const entry = this.catalog[sizeStr];
      const method = this.input.installationMethod.toLowerCase() as 'air' | 'trench' | 'duct';
      const rating = entry[method];
      
      if (rating >= requiredCurrent) {
        return size;
      }
    }
    
    // If no size found, return largest available
    return Number(this.allSizes[this.allSizes.length - 1]);
  }

  private findSizeByVoltageDrop(flc: number): number {
    // V-drop = (√3 × I × L × R × cosφ) / 1000 (for 3-phase)
    // V-drop% = (V-drop / V) × 100
    // Limit: ≤ 5% per IEC 60364
    const maxVDrop = 0.05;
    const cosφ = this.input.powerFactor || 0.85;
    const sqrt3 = Math.sqrt(3);

    for (const sizeStr of this.allSizes) {
      const size = Number(sizeStr);
      const entry = this.catalog[sizeStr];
      const resistance = entry.resistance_90C; // Ω/km @ 90°C
      
      let vdrop: number;
      if (this.input.phase === '3Ø') {
        vdrop = (sqrt3 * flc * this.input.cableLength * resistance * cosφ) / (1000 * 1000);
      } else {
        vdrop = (flc * this.input.cableLength * resistance * cosφ) / (1000 * 1000);
      }

      const vdropPercent = (vdrop / this.input.voltage) * 100;
      
      if (vdropPercent <= maxVDrop * 100) {
        return size;
      }
    }

    // If no size meets V-drop limit, return largest
    return Number(this.allSizes[this.allSizes.length - 1]);
  }

  private findSizeByISc(isc_kA: number): number {
    // ISc withstand: Isc ≤ k × A × √t
    // A ≥ Isc / (k × √t)
    // For Cu XLPE @ 90°C: k ≈ 143
    const k = 143; // Cu, XLPE, 90°C
    const t = this.input.protectionClearingTime || 0.1; // seconds
    const isc_A = isc_kA * 1000;
    const minArea = isc_A / (k * Math.sqrt(t));

    // Search for smallest size ≥ minArea
    for (const sizeStr of this.allSizes) {
      const size = Number(sizeStr);
      if (size >= minArea) {
        return size;
      }
    }

    return Number(this.allSizes[this.allSizes.length - 1]);
  }

  private calculateVoltageDropPercent(
    flc: number,
    _conductorArea: number,
    catalogEntry: any
  ): { percent: number; voltage: number } {
    const resistance = catalogEntry.resistance_90C; // Ω/km @ 90°C
    const cosφ = this.input.powerFactor || 0.85;
    const sqrt3 = Math.sqrt(3);

    let vdrop: number;
    if (this.input.phase === '3Ø') {
      vdrop = (sqrt3 * flc * this.input.cableLength * resistance * cosφ) / (1000 * 1000);
    } else {
      vdrop = (flc * this.input.cableLength * resistance * cosφ) / (1000 * 1000);
    }

    const vdropPercent = (vdrop / this.input.voltage) * 100;
    return { percent: vdropPercent, voltage: vdrop };
  }
}

export default CableSizingEngine_V2;
