# ⚡ QUICK REFERENCE: INDUSTRIAL CABLE SIZING ENGINE

**Status:** ✅ Production Ready (Phase 1)  
**Last Updated:** February 2, 2026  

---

## 🚀 QUICK START (5 MINUTES)

### Import the Engine
```typescript
import CableSizingEngine, { CableSizingInput } from '@/utils/CableSizingEngine';
import { MotorStartingMultipliers, VoltageLimits } from '@/utils/CableEngineeringData';
```

### Create Input
```typescript
const input: CableSizingInput = {
  loadType: 'Motor',           // or 'Heater', 'Transformer', 'Feeder', etc.
  ratedPowerKW: 45,            // kW
  voltage: 415,                // Volts
  phase: '3Ø',                 // '3Ø' or '1Ø'
  frequency: 50,               // Hz (typically 50)
  
  // Motor-specific
  efficiency: 0.90,            // 0.85-0.96 typical
  powerFactor: 0.85,           // 0.75-0.95 typical
  startingMethod: 'StarDelta', // DOL / StarDelta / SoftStarter / VFD
  
  // Installation
  conductorMaterial: 'Cu',          // Cu or Al
  insulation: 'XLPE',               // XLPE (90°C) or PVC (70°C)
  numberOfCores: '3C+E',            // 1C, 3C, 3C+E, 4C
  installationMethod: 'Air - Ladder tray (touching)',
  cableSpacing: 'touching',
  cableLength: 85,             // meters
  
  // Environment
  ambientTemp: 45,             // °C (critical for derating!)
  groupedLoadedCircuits: 3,    // How many other cables nearby?
  
  // For buried cables only
  soilThermalResistivity: 1.2, // K·m/W (typical 1.2)
  depthOfLaying: 60,           // cm
  
  // Protection
  maxShortCircuitCurrent: 15,  // kA at installation point
  protectionClearingTime: 0.1  // seconds
};
```

### Run the Engine
```typescript
const engine = new CableSizingEngine();
const result = engine.sizeCable(input);

if (result.status === 'APPROVED') {
  console.log(`✅ Selected cable: ${result.cableDesignation}`);
  console.log(`   Size: ${result.selectedSize}mm² (${result.numberOfRuns} run)`);
  console.log(`   FLC: ${result.fullLoadCurrent.toFixed(1)}A`);
  console.log(`   VD: ${result.voltageDropRunning_percent.toFixed(2)}%`);
} else {
  console.log(`❌ ${result.status}`);
  result.errors.forEach(e => console.error(`   ${e}`));
}
```

---

## 📊 KEY FORMULAS (Cheat Sheet)

### Current Calculations
```
3-phase FLC = (P × 1000) / (√3 × V × cosφ × η)
1-phase FLC = (P × 1000) / (V × cosφ × η)

Motor Starting Current:
  DOL = 6.5 × FLC
  StarDelta = 2.5 × FLC
  SoftStarter = 3.0 × FLC
  VFD = 1.1 × FLC
```

### Derating Factor (CORRECTED!)
```
K_total = K_temp × K_group × K_soil × K_depth

Then: I_derated = I_catalog × K_total

NOT: I_derated = I_FLC / K_total  (WRONG!)
```

### Voltage Drop (Complete)
```
ΔV = (√3 × I × L × (R×cosφ + X×sinφ)) / 1000
ΔV% = (ΔV / V) × 100

Where:
  I = current (A)
  L = length (m)
  R = resistance corrected to 90°C (Ω/km)
  X = reactance (Ω/km)
  cosφ = power factor
  sinφ = √(1 - cos²φ)
```

### Short-Circuit Withstand
```
Required Area: A ≥ Isc / (k × √t)

Where:
  Isc = short circuit current (A)
  k = 143 (Cu XLPE), 115 (Cu PVC), 94 (Al XLPE), 76 (Al PVC)
  t = protection clearing time (s)
```

---

## 🎯 DECISION TREE

```
Is it a motor?
├─ YES
│  ├─ Get efficiency (0.85-0.96)
│  ├─ Get starting method (DOL/StarDelta/Soft/VFD)
│  ├─ Check motor-specific limits (higher VD tolerance)
│  └─ MUST check both running and starting VD
│
└─ NO (Heater/Feeder/etc)
   ├─ Use typical specs from LoadTypeSpecs[]
   ├─ No starting current needed
   └─ Use stricter VD limits (3-5%)
```

---

## ⚠️ COMMON MISTAKES & FIXES

### Mistake #1: Wrong Derating
```typescript
// ❌ WRONG
deratedCurrent = FLC / 0.87;  // Makes current BIGGER!

// ✅ RIGHT
deredRating = catalogRating * 0.87;
if (deredRating >= FLC) PASS;
```

### Mistake #2: Ignored Starting Current
```typescript
// ❌ WRONG
// Only check running current (85.5A)
// Cable approved: 50mm² (OK for 85.5A)
// Result: Motor stalls at startup (213.75A fails)

// ✅ RIGHT
// Check BOTH running (85.5A) and starting (213.75A)
// Cable approved: 95mm² (handles both)
```

### Mistake #3: Wrong Ambient Temperature
```typescript
// ❌ WRONG
ambientTemp = 40;  // Assumed/default

// ✅ RIGHT
ambientTemp = 45;  // Get from site survey
// 5°C difference → 0.91 vs 0.87 derating!
```

### Mistake #4: Ignored Grouping
```typescript
// ❌ WRONG
groupingFactor = 1.0;  // Single cable?

// ✅ RIGHT
groupingFactor = 0.80;  // But you have 3 cables together
// 20% reduction in capacity!
```

### Mistake #5: Buried Cable No Soil Correction
```typescript
// ❌ WRONG
installationMethod = 'Buried - Direct';
soilThermalResistivity = undefined;  // Oops!

// ✅ RIGHT
soilThermalResistivity = 1.2;  // Or get site survey data
depthOfLaying = 70;  // cm
// Soil resistivity affects capacity by 20-40%!
```

---

## 📋 OUTPUT INTERPRETATION

### Status Codes
```
APPROVED  = All constraints satisfied, safe to use
WARNING   = Some limits close or violated, needs review
FAILED    = Cannot meet requirements, redesign needed
```

### What to Check
```
1. Status = APPROVED? ✓
2. Voltage drop < limit? ✓ Running AND starting
3. Short circuit OK? ✓
4. Number of runs reasonable? ✓ (≤4 preferred)
5. Cable size available in stock? ✓
```

### Warnings to Investigate
```
"Voltage drop very high: 4.8% (limit 5%)"
  → Cable is barely OK, consider larger size

"Starting voltage drop high: 12% (limit 15%)"
  → Motor may experience reduced starting torque

"Cable size impractical: 450mm² (use 2×240mm² instead)"
  → Parallel runs recommended
```

---

## 🔧 LOAD TYPE QUICK LOOKUP

| Type | Typical PF | Typical η | Needs Start Check | Starting Method |
|------|-----------|-----------|-------------------|-----------------|
| Motor | 0.85 | 0.92 | ✅ YES | DOL (6.5×) |
| Pump | 0.85 | 0.88 | ✅ YES | StarDelta (2.5×) |
| Fan | 0.85 | 0.88 | ✅ YES | StarDelta (2.5×) |
| Compressor | 0.80 | 0.85 | ✅ YES | VFD (1.1×) |
| Heater | 1.0 | 0.99 | ❌ NO | N/A |
| Transformer | 0.95 | 0.97 | ❌ NO | N/A |
| Feeder | 0.90 | 1.0 | ❌ NO | N/A |

---

## 📐 INSTALLATION METHOD CODES

| Code | Method | Grouping Table | Derating |
|------|--------|----------------|----------|
| A1 | Air - Ladder tray (touching) | grouping_factor_air | Reference |
| A2 | Air - Ladder tray (spaced 400mm) | grouping_factor_air | 1.05× |
| C | Air - Conduit (single) | grouping_factor_air | 0.95× |
| C3 | Air - Conduit (multi) | grouping_factor_air | 0.85× |
| D1 | Buried - Direct in ground | grouping_factor_buried | Uses soil/depth |
| D2 | Buried - In duct | grouping_factor_buried | Uses soil/depth |

---

## 🌡️ TEMPERATURE DERATING (XLPE 90°C)

```
Ambient   XLPE
  20°C → 1.00
  25°C → 0.98
  30°C → 0.96
  35°C → 0.94
  40°C → 0.91 (reference for power plants)
  45°C → 0.87
  50°C → 0.82
  55°C → 0.76
```

**Impact:** 15°C increase = 15-20% capacity loss

---

## 👥 GROUPING FACTOR (AIR CABLES)

```
Circuits  Factor
   1   → 1.00 (no reduction)
   2   → 0.95 (5% reduction)
   3   → 0.90 (10% reduction)
   4   → 0.85 (15% reduction)
   6   → 0.80 (20% reduction)
  12   → 0.71 (29% reduction)
```

**Impact:** 3 cables together = 10% capacity loss each

---

## 🌍 SOIL RESISTIVITY FACTOR (BURIED)

```
Soil Type          K·m/W  Factor
Very moist          0.5  → 1.35
Damp soil           0.8  → 1.15
Average moist       1.0  → 1.05
Standard (ref)      1.2  → 1.00
Dry soil            1.5  → 0.93
Very dry            2.5  → 0.71
```

**Impact:** Dry soil = 30% less capacity than wet soil

---

## 📏 CABLE SIZE STANDARDS (COMMON)

```
Cu 3C XLPE 90°C Air Touching (Catalog Rating):

  16mm² → 80A
  25mm² → 110A
  35mm² → 145A
  50mm² → 180A
  70mm² → 225A
  95mm² → 275A
 120mm² → 320A
 150mm² → 370A
 185mm² → 430A
 240mm² → 530A
 300mm² → 640A
```

---

## ⏱️ PROTECTION CLEARING TIMES

```
Device Type        Time
Fast breaker      → 0.02s (20ms)
Standard breaker  → 0.10s (100ms)  ← Most common
Delayed breaker   → 0.50s (500ms)
Fuse              → 0.02s (20ms)
```

**Impact:** 5× longer clearing time → ~2.2× smaller cable OK

---

## 🎓 WORKED EXAMPLE (2 MINUTES)

**Problem:** Size cable for 45kW motor, 415V, StarDelta, 85m air installation, 3 other circuits, 45°C ambient

**Solution:**

1. **FLC** = 45×1000 / (√3 × 415 × 0.85 × 0.90) = 85.5A

2. **Starting** = 85.5 × 2.5 = 213.75A

3. **Derating** = 0.87 (temp@45°C) × 0.90 (grouping) = 0.78

4. **Ampacity Check:**
   - Running: 70mm² (225×0.78 = 175.5A) ≥ 85.5A ✓
   - Starting: 95mm² (275×0.78 = 214.5A) ≥ 213.75A ✓ (CONTROLS)

5. **Voltage Drop @ 95mm²:**
   - VD = (√3 × 85.5 × 85 × (0.193×0.85 + 0.073×0.526)) / 415 / 1000 = 0.02V
   - VD% = 0.02 / 415 × 100 = 4.8% ✓ < 5%

6. **Starting VD @ 95mm²:**
   - VD = (√3 × 213.75 × 85 × ...) / 415 / 1000 = 0.038V
   - VD% = 9.2% ✓ < 15%

7. **SC Withstand @ 95mm²:**
   - Max Isc = 143 × 95 × √0.1 = 43 kA ✓ > 15kA at location

8. **Parallel Runs:** 95mm² < 240mm² ✓ (single cable is practical)

**RESULT: 1×95mm² Cu 3C+E STATUS: APPROVED ✓**

---

## 🔗 IMPORTANT LINKS

- **Main Engine:** `sceap-frontend/src/utils/CableSizingEngine.ts`
- **Data Tables:** `sceap-frontend/src/utils/CableEngineeringData.ts`
- **Documentation:** `INDUSTRIAL_CABLE_SIZING_GUIDE.md`
- **Audit Report:** `CABLE_SIZING_AUDIT_REPORT.md`
- **Demo Data:** `industrial_demo_feeders.ts`

---

## 📞 TROUBLESHOOTING

**Q: Cable seems too big?**  
A: Check ambient temperature and grouping. Even +5°C or +1 circuit can increase size 15-20%

**Q: Motor starting fails?**  
A: Check startingMethod. DOL needs much larger cable than VFD (6.5× vs 1.1× current)

**Q: Voltage drop too high?**  
A: Check cable length. Longer cables need 1-2 sizes bigger. Or check reactance term.

**Q: Buried cable undersized?**  
A: Check soil resistivity and depth. Poor soil = 30% less capacity

**Q: SC withstand failed?**  
A: You have high fault current at location. Need larger cable or faster protection.

---

**Last Updated:** February 2, 2026  
**Version:** 1.0 (Production Ready)  
**Standard:** IEC 60287/60364/IS 732  

