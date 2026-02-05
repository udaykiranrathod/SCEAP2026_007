/**
 * EXCEL FORMULA MAPPINGS - SCEAP 2026 Cable Sizing
 * 
 * This file documents the exact formulas from the real project Excel sizing sheet
 * and maps them to our TypeScript engine outputs for complete parity.
 * 
 * Excel Reference: Columns D through CB (52 key calculation columns)
 * Standards: IEC 60287, IEC 60364, IS 732
 * 
 * FORMULA STRUCTURE:
 * Each formula includes:
 * - Formula ID (matches user's numbering 1-52)
 * - Column Name (as per Excel)
 * - Excel Formula (literal formula from sheet)
 * - Implementation Notes (how to compute in TypeScript)
 * - Catalogue References (if any, to which sheet/range)
 */

export interface FormulaReference {
  id: number;
  columnName: string;
  group: string;
  excelFormula: string;
  implementation: string;
  catalogueRef?: string;
  notes: string;
}

export const EXCEL_FORMULA_MAPPINGS: FormulaReference[] = [
  {
    id: 1,
    columnName: 'Rated Current (Amp)(It)',
    group: 'Electrical Specifications',
    excelFormula: 'IF(K7=0.415,(IF(H7="M",I7/SQRT(3)/K7/L7/M7/N7,I7/SQRT(3)/L7/K7/N7)),IF(K7=0.24,(IF(H7="F",I7/K7/L7/N7,I7/K7/L7/N7))))',
    implementation: `
      For 3-phase (0.415kV): It = P*1000 / (√3 * V * cosφ * η)
      For 1-phase (0.24kV): It = P*1000 / (V * cosφ * η)
      Motor's efficiency and power factor applied differently.
    `,
    catalogueRef: 'N/A',
    notes: 'Fundamental FLC calculation. Column I=Load(kW), K=Voltage, L=PF, M=Efficiency'
  },
  {
    id: 2,
    columnName: 'Motor starting current A',
    group: 'Motor Starting',
    excelFormula: 'IF(H7="M",6*O7,0)',
    implementation: 'For Motors: starting_current = 6 * rated_current. For non-motors: 0',
    catalogueRef: 'N/A',
    notes: 'Typical DOL motor starting multiplier = 6x FLC'
  },
  {
    id: 3,
    columnName: 'MOTOR STARTING POWER FACTOR',
    group: 'Motor Starting',
    excelFormula: 'IF(H7="M",0.2,0)',
    implementation: 'For Motors: PF = 0.2 (highly reactive at start). For non-motors: 0',
    catalogueRef: 'N/A',
    notes: 'Motor starting PF is low due to inrush transient'
  },
  {
    id: 4,
    columnName: 'Cable Current Rating (A)',
    group: 'Cable Data',
    excelFormula: 'IF(S7="Air",IF(V7="1C",VLOOKUP(CONCATENATE(V7," X ",W7),Catalogue!$I$7:$N$82,2,FALSE),VLOOKUP(CONCATENATE(V7," X ",W7),Catalogue!$B$7:$G$82,2,FALSE)),IF(V7="1C",VLOOKUP(CONCATENATE(V7," X ",W7),Catalogue!$I$7:$N$82,4,FALSE),VLOOKUP(CONCATENATE(V7," X ",W7),Catalogue!$B$7:$G$82,4,FALSE)))',
    implementation: `
      VLOOKUP cable size in Catalogue sheet
      - If Air: Use columns I:N (Air installation), get column 2 (Air current rating)
      - If Not Air (Duct/Trench): Use columns B:G, get column 4
      - Single core (1C): Columns I:N
      - Multi-core (2C, 3C, 4C): Columns B:G
    `,
    catalogueRef: 'Catalogue!$B$7:$G$82 and Catalogue!$I$7:$N$82',
    notes: 'Catalogue lookup for current carrying capacity'
  },
  {
    id: 5,
    columnName: 'CURRENT CARRYING CAPACITY - DERATING FACTOR - AMBIENT TEMPERATURE (K_temp / A2/A3)',
    group: 'Derating Factors',
    excelFormula: 'IF(S7="AIR",VLOOKUP(S7,Catalogue!$P$7:$Z$8,2,FALSE),"NA")',
    implementation: 'VLOOKUP installation method in Catalogue derating table, column 2 = K_temp',
    catalogueRef: 'Catalogue!$P$7:$Z$8',
    notes: 'Temperature derating factor. Only for AIR (not for trench/duct)'
  },
  {
    id: 6,
    columnName: 'GROUPING FACTOR (A2/A3/D6/D7)',
    group: 'Derating Factors',
    excelFormula: 'IF(V7="1C",VLOOKUP(S7,Catalogue!$P$7:$Z$8,3,FALSE),VLOOKUP(S7,Catalogue!$P$7:$Z$8,4,FALSE))',
    implementation: `
      VLOOKUP installation method in Catalogue
      - If 1C (single core): column 3 (K_group for 1C)
      - If multi-core (2C/3C/4C): column 4 (K_group for multi-core)
    `,
    catalogueRef: 'Catalogue!$P$7:$Z$8',
    notes: 'Grouping/bundling factor depends on core count'
  },
  {
    id: 7,
    columnName: 'GROUND TEMPERATURE (D1)',
    group: 'Derating Factors',
    excelFormula: 'IF(S7="AIR","NA",VLOOKUP(S7,Catalogue!$P$7:$Z$8,5,FALSE))',
    implementation: 'VLOOKUP installation method, column 5 = ground temperature factor. Only if NOT AIR.',
    catalogueRef: 'Catalogue!$P$7:$Z$8',
    notes: 'For buried/duacted cables only'
  },
  {
    id: 8,
    columnName: 'DEPTH OF LAYING (D2/D3)',
    group: 'Derating Factors',
    excelFormula: 'IF(V7="1C",VLOOKUP(S7,Catalogue!$P$7:$Z$8,6,FALSE),VLOOKUP(S7,Catalogue!$P$7:$Z$8,7,FALSE))',
    implementation: `
      VLOOKUP installation method
      - If 1C: column 6
      - If multi-core: column 7
    `,
    catalogueRef: 'Catalogue!$P$7:$Z$8',
    notes: 'Depth of laying factor'
  },
  {
    id: 9,
    columnName: 'THERMAL RESISTIVITY OF GROUND (D4/D5)',
    group: 'Derating Factors',
    excelFormula: 'IF(S7="AIR","NA",IF(V7="1C",(VLOOKUP(W7,Catalogue!$W$8:$X$14,2)),(VLOOKUP(W7,Catalogue!$Y$8:$Z$25,2))))',
    implementation: `
      Only if NOT AIR
      - If 1C: lookup cable material in Catalogue!$W$8:$X$14, column 2
      - If multi-core: lookup in Catalogue!$Y$8:$Z$25, column 2
    `,
    catalogueRef: 'Catalogue!$W$8:$X$14 and $Y$8:$Z$25',
    notes: 'Thermal resistivity depends on cable material (Cu vs Al)'
  },
  {
    id: 10,
    columnName: 'Derating factor - Overall derating factor (K_total)',
    group: 'Derating Factors',
    excelFormula: 'IF(S7="air",Y7*Z7,Z7*AA7*AB7*AC7)',
    implementation: `
      If AIR: K_total = K_temp * K_group
      If NOT AIR: K_total = K_group * K_depth * K_soil * K_thermal
      (Note: soil and thermal are row AA, AB, AC)
    `,
    catalogueRef: 'N/A (composite)',
    notes: 'Overall derating = product of individual factors'
  },
  {
    id: 11,
    columnName: 'Derated current carrying capacity (A)',
    group: 'Current Calculations',
    excelFormula: '=AE7*X7',
    implementation: 'Derated_capacity = Overall_derating * Catalogue_rating',
    catalogueRef: 'N/A',
    notes: 'AE=Overall derating factor, X=Catalogue current rating'
  },
  {
    id: 12,
    columnName: 'DERATED CURRENT > RATED CURRENT',
    group: 'Validation',
    excelFormula: '=IF(AF7*AO7>=O7,"yes","no")',
    implementation: 'Check: (derated_capacity * number_of_runs) >= full_load_current',
    catalogueRef: 'N/A',
    notes: 'Boolean check for ampacity constraint'
  },
  {
    id: 13,
    columnName: 'Voltage drop (Running Condition) ∆U (Volts)',
    group: 'Voltage Drop',
    excelFormula: 'IF(K7=0.415,IF(H7="M",(SQRT(3)*O7*(BS7/1000)*((BT7/AO7)*L7+(BU7/AO7)*SIN(ACOS(L7)))),(SQRT(3)*O7*(BS7/1000)*((BT7/AO7)*L7+(BU7/AO7)*SIN(ACOS(L7))))),2*O7*(BS7/1000)*((BT7/AO7)*L7+(BU7/AO7)*SIN(ACOS(L7))))',
    implementation: `
      3-phase (0.415kV): ∆U = √3 * I * length/1000 * (R*cos(φ) + X*sin(φ))
      1-phase (0.24kV): ∆U = 2 * I * length/1000 * (R*cos(φ) + X*sin(φ))
      Where: O=FLC(A), BS=Resistance(Ω/km), BT=R value, BU=Reactance(Ω/km), AO=per_run_current
    `,
    catalogueRef: 'N/A',
    notes: 'Standard voltage drop formula per IEC 60287'
  },
  {
    id: 14,
    columnName: 'Voltage drop (%) - Running',
    group: 'Voltage Drop',
    excelFormula: '(AH7/(K7*1000))*100',
    implementation: 'V_drop_percent = (V_drop_volts / (system_voltage * 1000)) * 100',
    catalogueRef: 'N/A',
    notes: 'Convert absolute voltage drop to percentage'
  },
  {
    id: 15,
    columnName: 'Allowable (Running V-drop)',
    group: 'Voltage Drop',
    excelFormula: 'IF(H7="I",IF(AI7<=1,"YES","NO"),IF(H7="T",IF(AI7<=1,"YES","NO"),IF(AI7<=3,"YES","NO")))',
    implementation: `
      Incomer (I): allowed ≤ 1%
      Transformer (T): allowed ≤ 1%
      Feeder (F)/Motor (M): allowed ≤ 3%
    `,
    catalogueRef: 'N/A',
    notes: 'IEC 60364 voltage drop limits'
  },
  {
    id: 16,
    columnName: 'Motor Starting Voltage Drop ∆U (Volts)',
    group: 'Motor Starting',
    excelFormula: 'IF(H7="M",(SQRT(3)*T7*(BS7/1000)*((BT7/AO7)*U7+(BU7/AO7)*SIN(ACOS(U7)))),"NA")',
    implementation: `
      If Motor: ∆U_starting = √3 * starting_current * length/1000 * (R*cos(φ_start) + X*sin(φ_start))
      Where: T=starting_current(A), U=starting_pf = 0.2
    `,
    catalogueRef: 'N/A',
    notes: 'V-drop during DOL motor start transient'
  },
  {
    id: 17,
    columnName: 'Motor Starting V-drop (%)',
    group: 'Motor Starting',
    excelFormula: 'IF(H7="M",(AK7/(K7*1000))*100,"NA")',
    implementation: 'V_drop_start_percent = (V_drop_start_volts / (system_voltage * 1000)) * 100',
    catalogueRef: 'N/A',
    notes: 'Starting voltage drop as percentage'
  },
  {
    id: 18,
    columnName: 'Motor Starting Allowable',
    group: 'Motor Starting',
    excelFormula: 'IF(H7="M",IF(AL7<=15,"YES","NO"),"NA")',
    implementation: 'Check: starting_v_drop_percent <= 15% (typical motor starting limit)',
    catalogueRef: 'N/A',
    notes: 'Motor can typically tolerate ≤15% starting V-drop'
  },
  {
    id: 19,
    columnName: 'Derating Factor (copy for reference)',
    group: 'Derating Factors',
    excelFormula: 'IF(S7="air",Y7*Z7,Z7*AA7*AB7*AC7)',
    implementation: 'Same as formula #10 (redundant reference)',
    catalogueRef: 'N/A',
    notes: 'Duplicate - for clarity in sizing logic'
  },
  {
    id: 20,
    columnName: 'No.of Runs (N)',
    group: 'Cable Configuration',
    excelFormula: 'ROUNDUP(((O7)/AF7),0)',
    implementation: 'No_of_runs = ROUNDUP(FLC / derated_capacity, 0)',
    catalogueRef: 'N/A',
    notes: 'Number of parallel cable runs required for ampacity'
  },
  {
    id: 21,
    columnName: 'Ir = It / N(Amp) Current Per Run Per Phase',
    group: 'Cable Configuration',
    excelFormula: 'O7/AO7',
    implementation: 'Current_per_run = Full_load_current / number_of_runs',
    catalogueRef: 'N/A',
    notes: 'Distributes load across parallel runs'
  },
  {
    id: 22,
    columnName: 'Cable Size Based on Full Load Current - Current Rating of the Cable',
    group: 'Cable Data',
    excelFormula: 'IF(S7="Air",IF(V7="1C",VLOOKUP(CONCATENATE(V7," X ",W7),Catalogue!$I$7:$N$82,2,FALSE),VLOOKUP(CONCATENATE(V7," X ",W7),Catalogue!$B$7:$G$82,2,FALSE)),IF(V7="1C",VLOOKUP(CONCATENATE(V7," X ",W7),Catalogue!$I$7:$N$82,4,FALSE),VLOOKUP(CONCATENATE(V7," X ",W7),Catalogue!$B$7:$G$82,4,FALSE)))',
    implementation: 'Same VLOOKUP as formula #4',
    catalogueRef: 'Catalogue!$B$7:$G$82 and $I$7:$N$82',
    notes: 'Get cable current rating from catalogue'
  },
  {
    id: 23,
    columnName: 'Derated Current Carrying Capacity (for sized cable)',
    group: 'Current Calculations',
    excelFormula: 'AS7*Z7',
    implementation: 'Derated_cap = cable_catalogue_rating * overall_derating',
    catalogueRef: 'N/A',
    notes: 'AS=catalogue rating, Z=overall derating'
  },
  {
    id: 24,
    columnName: 'Selected Phase Cable Size',
    group: 'Cable Selection',
    excelFormula: 'IF(H7="M",IF(AND(W7>=CE7,AG7="YES",AJ7="YES",AM7="YES"),CONCATENATE(AO7,"R X ",V7," X ",W7,IF(V7="1C"," Sqmm Per Phase"," Sqmm")),"Cable size is not correct"),IF(AND(W7>=CE7,AG7="YES",AJ7="YES",AM7="NA"),CONCATENATE(AO7,"R X ",V7," X ",W7,IF(V7="1C"," Sqmm Per Phase"," Sqmm")),"Cable size is not correct"))',
    implementation: `
      Build cable designation string IF all constraints met:
        - W7>=CE7: Cable size >= minimum from ISc constraint
        - AG7="YES": Ampacity check passed
        - AJ7="YES": Running V-drop check passed  
        - AM7="YES" or "NA": Starting V-drop OK (or N/A for non-motor)
      Format: "N R X cores X size Sqmm"
    `,
    catalogueRef: 'N/A',
    notes: 'Final cable designation with validation'
  },
  {
    id: 25,
    columnName: 'Cable Size Based on Short Circuit Current - Short Circuit Current (kA)',
    group: 'Short Circuit',
    excelFormula: 'IF(G7="ACB",IF(H7="F",50,IF(H7="M",65,"65")),"---")',
    implementation: `
      Check protection type:
      - If ACB: 50kA for Feeders, 65kA for Motors
      - Otherwise: "---"
    `,
    catalogueRef: 'N/A',
    notes: 'ISc from protection device rating'
  },
  {
    id: 26,
    columnName: 'Time Duration (second)',
    group: 'Short Circuit',
    excelFormula: 'IF(AV7=50,"1",IF(AV7=65,"0.265","---"))',
    implementation: 'If ISc=50kA: t=1s. If ISc=65kA: t=0.265s. Else: "---"',
    catalogueRef: 'N/A',
    notes: 'Protection clearing time per device'
  },
  {
    id: 27,
    columnName: 'Area of Cable (sq. mm) - (E=√Isc²*T/K)',
    group: 'Short Circuit',
    excelFormula: 'IF(AW7=50,"1",IF(AW7=65,"0.265","---"))',
    implementation: 'A_min = √(ISc² * t / K), where K ≈ 143 for Cu (typical)',
    catalogueRef: 'N/A',
    notes: 'Note: formula appears identical to #26 (time), likely typo in original'
  },
  {
    id: 28,
    columnName: 'Csc = Cable Size (Sq. mm) from ISc',
    group: 'Short Circuit',
    excelFormula: 'IF(AX7=50,"1",IF(AX7=65,"0.265","---"))',
    implementation: 'Selected cable size must be >= Isc minimum',
    catalogueRef: 'N/A',
    notes: 'ISc-based sizing result'
  },
  {
    id: 29,
    columnName: 'current rating of cable (from ISc-sized cable)',
    group: 'Cable Data',
    excelFormula: 'IF(AZ7="Air",IF(BA7="1C",VLOOKUP(CONCATENATE(BA7," X ",BB7),Catalogue!$I$7:$N$82,2,FALSE),VLOOKUP(CONCATENATE(BA7," X ",BB7),Catalogue!$B$7:$G$82,2,FALSE)),IF(BA7="1C",VLOOKUP(CONCATENATE(BA7," X ",BB7),Catalogue!$I$7:$N$82,4,FALSE),VLOOKUP(CONCATENATE(BA7," X ",BB7),Catalogue!$B$7:$G$82,4,FALSE)))',
    implementation: 'Same VLOOKUP pattern for ISc-sized cable',
    catalogueRef: 'Catalogue!$B$7:$G$82 and $I$7:$N$82',
    notes: 'Get rating of cable selected by ISc'
  },
  {
    id: 30,
    columnName: 'Cable resistance at  90°C (Ohm / Ph / km)',
    group: 'Cable Properties',
    excelFormula: 'IF(BA7="1C",VLOOKUP(CONCATENATE(BA7," X ",BB7),Catalogue!$I$7:$N$82,5,FALSE),VLOOKUP(CONCATENATE(BA7," X ",BB7),Catalogue!$B$7:$G$82,5,FALSE))',
    implementation: 'VLOOKUP cable size in catalogue, get column 5 (resistance)',
    catalogueRef: 'Catalogue!$B$7:$G$82 and $I$7:$N$82',
    notes: 'Resistance for ISc-sized cable'
  },
  {
    id: 31,
    columnName: 'Cable resistance at  90°C (Ohm / Ph / km) - copy',
    group: 'Cable Properties',
    excelFormula: 'IF(BA7="1C",VLOOKUP(CONCATENATE(BA7," X ",BB7),Catalogue!$I$7:$N$82,5,FALSE),VLOOKUP(CONCATENATE(BA7," X ",BB7),Catalogue!$B$7:$G$82,5,FALSE))',
    implementation: 'Same as formula #30 (reference)',
    catalogueRef: 'Catalogue!$B$7:$G$82 and $I$7:$N$82',
    notes: 'Duplicate for intermediate calculations'
  },
  {
    id: 32,
    columnName: 'Cable length (Meters)',
    group: 'Route Specification',
    excelFormula: 'AQ7',
    implementation: 'Direct reference to input cable length',
    catalogueRef: 'N/A',
    notes: 'Route length in meters'
  },
  {
    id: 33,
    columnName: 'CURRENT CARRYING CAPACITY DERATING FACTOR AMBIENT TEMPERATURE (ISc-path)',
    group: 'Derating Factors',
    excelFormula: 'IF(AZ7="AIR",VLOOKUP(AZ7,Catalogue!$P$7:$Z$8,2,FALSE),"NA")',
    implementation: 'Same as formula #5 but for ISc path',
    catalogueRef: 'Catalogue!$P$7:$Z$8',
    notes: 'Derating for ISc-sized cable'
  },
  {
    id: 34,
    columnName: 'GROUPING FACTOR (A2/A3/D6/D7) - ISc path',
    group: 'Derating Factors',
    excelFormula: 'IF(BA7="1C",VLOOKUP(AZ7,Catalogue!$P$7:$Z$8,3,FALSE),VLOOKUP(AZ7,Catalogue!$P$7:$Z$8,4,FALSE))',
    implementation: 'Same as formula #6 but for ISc path',
    catalogueRef: 'Catalogue!$P$7:$Z$8',
    notes: 'Grouping derating for ISc-sized cable'
  },
  {
    id: 35,
    columnName: 'GROUND TEMPERATURE (D1) - ISc path',
    group: 'Derating Factors',
    excelFormula: 'IF(AZ7="AIR","NA",VLOOKUP(AZ7,Catalogue!$P$7:$Z$8,5,FALSE))',
    implementation: 'Same as formula #7 but for ISc path',
    catalogueRef: 'Catalogue!$P$7:$Z$8',
    notes: 'Ground temp derating for ISc-sized cable'
  },
  {
    id: 36,
    columnName: 'DEPTH OF LAYING (D2/D3) - ISc path',
    group: 'Derating Factors',
    excelFormula: 'IF(BA7="1C",VLOOKUP(AZ7,Catalogue!$P$7:$Z$8,6,FALSE),VLOOKUP(AZ7,Catalogue!$P$7:$Z$8,7,FALSE))',
    implementation: 'Same as formula #8 but for ISc path',
    catalogueRef: 'Catalogue!$P$7:$Z$8',
    notes: 'Depth derating for ISc-sized cable'
  },
  {
    id: 37,
    columnName: 'THERMAL RESISTIVITY OF GROUND (D4/D5) - ISc path',
    group: 'Derating Factors',
    excelFormula: 'IF(AZ7="AIR","NA",IF(BA7="1C",(VLOOKUP(BB7,Catalogue!$W$8:$X$14,2)),(VLOOKUP(BB7,Catalogue!$Y$8:$Z$25,2))))',
    implementation: 'Same as formula #9 but for ISc path',
    catalogueRef: 'Catalogue!$W$8:$X$14 and $Y$8:$Z$25',
    notes: 'Thermal resistivity for ISc-sized cable'
  },
  {
    id: 38,
    columnName: 'Derating factor - Overall derating factor (ISc path)',
    group: 'Derating Factors',
    excelFormula: '=IF(AZ7="air",BG7*BH7,BH7*BI7*BJ7*BK7)',
    implementation: 'Same as formula #10 but for ISc-sized cable',
    catalogueRef: 'N/A',
    notes: 'Overall derating for ISc sizing path'
  },
  {
    id: 39,
    columnName: 'Derated current carrying capacity (ISc path)',
    group: 'Current Calculations',
    excelFormula: '=BM7*BC7',
    implementation: 'Derated_cap_isc = overall_derating_isc * cable_rating_isc',
    catalogueRef: 'N/A',
    notes: 'Derated capacity of ISc-sized cable'
  },
  {
    id: 40,
    columnName: 'No.of runs (ISc path)',
    group: 'Cable Configuration',
    excelFormula: 'ROUNDUP(((O7)/BN7),0)',
    implementation: 'Runs_isc = ROUNDUP(FLC / derated_cap_isc, 0)',
    catalogueRef: 'N/A',
    notes: 'Number of runs if sized by ISc'
  },
  {
    id: 41,
    columnName: 'DERATED CURRENT > RATED CURRENT (ISc path)',
    group: 'Validation',
    excelFormula: '=IF(BN7*BO7>=O7,"yes","no")',
    implementation: 'Check: derated_cap_isc * runs_isc >= FLC',
    catalogueRef: 'N/A',
    notes: 'Ampacity check for ISc-sized cable'
  },
  {
    id: 42,
    columnName: 'Selected  Cable Size (final choice)',
    group: 'Cable Selection',
    excelFormula: 'CB7',
    implementation: 'Choose best cable size from the three sizing paths (ampacity, V-drop, ISc)',
    catalogueRef: 'N/A',
    notes: 'Final selection logic'
  },
  {
    id: 43,
    columnName: 'Route Length (Meters)',
    group: 'Route Specification',
    excelFormula: '=AQ7',
    implementation: 'Direct reference to input cable length',
    catalogueRef: 'N/A',
    notes: 'Same as formula #32 (redundant for final path)'
  },
  {
    id: 44,
    columnName: 'Cable resistance at  90°C (Ohm / Ph / km) - final path',
    group: 'Cable Properties',
    excelFormula: 'IF(V7="1C",VLOOKUP(CONCATENATE(V7," X ",W7),Catalogue!$I$7:$N$82,5,FALSE),VLOOKUP(CONCATENATE(V7," X ",W7),Catalogue!$B$7:$G$82,5,FALSE))',
    implementation: 'Get resistance of selected cable size',
    catalogueRef: 'Catalogue!$B$7:$G$82 and $I$7:$N$82',
    notes: 'Uses final selected cable size'
  },
  {
    id: 45,
    columnName: 'Cable reactance at  50Hz (Ohm / Ph / km)',
    group: 'Cable Properties',
    excelFormula: '=IF(V7="1C",VLOOKUP(CONCATENATE(V7," X ",W7),Catalogue!$I$7:$N$82,6,FALSE),VLOOKUP(CONCATENATE(V7," X ",W7),Catalogue!$B$7:$G$82,6,FALSE))',
    implementation: 'VLOOKUP selected cable, get column 6 (reactance)',
    catalogueRef: 'Catalogue!$B$7:$G$82 and $I$7:$N$82',
    notes: 'Needed for V-drop calculation with power factor correction'
  },
  {
    id: 46,
    columnName: 'Voltage Drop in Running Condition ∆U (final path)',
    group: 'Voltage Drop',
    excelFormula: '=IF(K7=0.415,IF(H7="M",(SQRT(3)*O7*(BF7/1000)*((BD7/BO7)*L7+(BE7/BO7)*SIN(ACOS(L7)))),(SQRT(3)*O7*(BF7/1000)*((BD7/BO7)*L7+(BE7/BO7)*SIN(ACOS(L7))))),2*O7*(BF7/1000)*((BD7/BO7)*L7+(BE7/BO7)*SIN(ACOS(L7))))',
    implementation: 'Same V-drop formula as #13 but using final cable size',
    catalogueRef: 'N/A',
    notes: 'Final path voltage drop (3-phase or 1-phase)'
  },
  {
    id: 47,
    columnName: 'Voltage Drop (%) - final path',
    group: 'Voltage Drop',
    excelFormula: '=(BV7/(K7*1000))*100',
    implementation: 'Same as formula #14',
    catalogueRef: 'N/A',
    notes: 'Percentage voltage drop for final selection'
  },
  {
    id: 48,
    columnName: 'Allowable (final path)',
    group: 'Voltage Drop',
    excelFormula: '=IF(H7="I",IF(BW7<=1,"YES","NO"),IF(H7="T",IF(BW7<=1,"YES","NO"),IF(BW7<=2,"YES","NO")))',
    implementation: `
      Final check on running V-drop limits:
      Incomer/Transformer: ≤1%
      Other loads: ≤2%  (Note: different from formula #15 which used ≤3%)
    `,
    catalogueRef: 'N/A',
    notes: 'Final validation threshold (stricter)'
  },
  {
    id: 49,
    columnName: 'Starting Voltage Drop (Motor) - final path',
    group: 'Motor Starting',
    excelFormula: '=IF(H7="M",(SQRT(3)*T7*(AQ7/1000)*((BT7/BO7)*U7+(BU7/BO7)*SIN(ACOS(U7)))),"NA")',
    implementation: 'Same as formula #16 but using final cable length (AQ7 vs BS7)',
    catalogueRef: 'N/A',
    notes: 'Final path starting V-drop'
  },
  {
    id: 50,
    columnName: 'Motor Starting V-drop (%) - final path',
    group: 'Motor Starting',
    excelFormula: '=IF(H7="M",(BY7/(K7*1000))*100,"NA")',
    implementation: 'Same as formula #17',
    catalogueRef: 'N/A',
    notes: 'Final path starting V-drop %'
  },
  {
    id: 51,
    columnName: 'Motor Starting Allowable (final path)',
    group: 'Motor Starting',
    excelFormula: '=IF(H7="M",IF(BZ7<=15,"YES","NO"),"NA")',
    implementation: 'Same as formula #18',
    catalogueRef: 'N/A',
    notes: 'Final path starting V-drop check ≤15%'
  },
  {
    id: 52,
    columnName: 'Selected phase cable size (final)',
    group: 'Cable Selection',
    excelFormula: '=IF(H7="M",IF(AND(BB7>=CE7,BP7="YES",BX7="YES",CA7="YES"),CONCATENATE(BO7,"R X ",BA7," X ",BB7,IF(BA7="1C"," Sqmm Per Phase"," Sqmm")),"Cable size is not correct"),IF(AND(BB7>=CE7,BP7="YES",BX7="YES",CA7="NA"),CONCATENATE(BO7,"R X ",BA7," X ",BB7,IF(BA7="1C"," Sqmm Per Phase"," Sqmm")),"Cable size is not correct"))',
    implementation: 'Final cable size selection with all constraint checks',
    catalogueRef: 'N/A',
    notes: 'Motors: all checks must pass. Feeders: starting is NA'
  }
];

/**
 * FORMULA DISPLAY INFO - For showing in Results table
 * Maps column keys to their formula display text
 */
export const FORMULA_DISPLAY_MAP: Record<string, string> = {
  'ratedCurrent': 'IT = P*1000/(√3*V*cosφ*η) [3Ø] or P*1000/(V*cosφ*η) [1Ø]',
  'motorStartingCurrent': 'Istart = 6*IT (Motors only)',
  'motorStartingPF': 'PF_start = 0.2 (Motors) or 0 (Others)',
  'cableRating': 'VLOOKUP(cores X size, Catalogue, rating_col)',
  'deratingAmbientTemp': 'VLOOKUP(installation, Catalogue!$P$7:$Z$8, 2)',
  'deratingGroupingFactor': 'IF(1C, col3, col4) from Catalogue',
  'deratingGroundTemp': 'VLOOKUP(installation, Catalogue, col5) if NOT AIR',
  'deratingDepth': 'IF(1C, col6, col7) from Catalogue',
  'deratingThermalResistivity': 'VLOOKUP(material, Catalogue, col2)',
  'deratingFactor': 'IF(AIR, Kt*Kg, Kg*Kd*Ks*Kth)',
  'deratedCurrent': 'Kderated = K_total * I_cable',
  'deredCurrentCheck': 'IF(Kderated * N >= IT, YES, NO)',
  'voltageDrop_running': 'ΔU = √3*I*(R*cosφ + X*sinφ)*L/1000',
  'voltageDrop_running_percent': '(ΔU / (V*1000)) * 100',
  'vdropRunningAllowable': 'Incomer/Transformer ≤1%, Other ≤2-3%',
  'voltageDrop_starting': 'ΔU_start = √3*Istart*(R*cosφ_start + X*sinφ_start)*L/1000',
  'voltageDrop_starting_percent': '(ΔU_start / (V*1000)) * 100',
  'vdropStartingAllowable': 'Motor: ≤15%',
  'numberOfRuns': 'N = ROUNDUP(IT / K_derated, 0)',
  'currentPerRun': 'Ir = IT / N',
};

/**
 * Helper to get formula text for a specific column
 */
export const getFormulaForColumn = (columnName: string): string => {
  return FORMULA_DISPLAY_MAP[columnName] || 'N/A';
};

/**
 * Get all formulas for a specific group
 */
export const getFormulasByGroup = (group: string): FormulaReference[] => {
  return EXCEL_FORMULA_MAPPINGS.filter(f => f.group === group);
};

/**
 * Get unique groups
 */
export const getUniqueFormulaGroups = (): string[] => {
  return Array.from(new Set(EXCEL_FORMULA_MAPPINGS.map(f => f.group)));
};

export default EXCEL_FORMULA_MAPPINGS;
