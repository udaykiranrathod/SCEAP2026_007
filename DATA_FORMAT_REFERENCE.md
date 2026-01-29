# Data Format & Excel Structure Reference

## 🎯 TL;DR - The One Rule That Matters

```
From Bus = Equipment Location (MOTOR-1, PUMP-1, etc.)
To Bus   = Source Panel (PMCC-1, MAIN-PANEL, etc.)
```

**The system reads backwards through cables from load to transformer.**

---

## 📊 Required Excel Columns (in this exact order)

| # | Column Name | Data Type | Example | Required? | Notes |
|---|-------------|-----------|---------|-----------|-------|
| 1 | Serial No | Number | 1, 2, 3... | ✅ Yes | Row number, just for reference |
| 2 | Cable Number | Text | CBL-001 | ✅ Yes | Unique identifier for each cable |
| 3 | Feeder Description | Text | Motor-1 (50kW) | ✅ Yes | Human-readable description |
| 4 | From Bus | Text | MOTOR-1 | ✅ **CRITICAL** | Where the load/equipment is located |
| 5 | To Bus | Text | PMCC-1 | ✅ **CRITICAL** | Where power comes from (upstream) |
| 6 | Voltage (V) | Number | 415 | ✅ Yes | System voltage (usually 415V) |
| 7 | Power Factor | Decimal | 0.85 | ✅ Yes | 0.8-0.95 typical range |
| 8 | Efficiency (%) | Decimal | 89 | ✅ Yes | 85-98% typical |
| 9 | Derating Factor | Decimal | 0.90 | ✅ Yes | 0.85-1.0 range |
| 10 | Breaker Type | Text | MCCB | ✅ Yes | ISOLATOR, ACB, MCCB, MCB, etc. |
| 11 | Load KW | Number | 50.0 | ✅ Yes | Active power (0 for panels) |
| 12 | Load KVA | Number | 61.0 | ✅ Yes | Apparent power (KW ÷ PF) |
| 13 | Cable Type | Text | XLPE | ✅ Yes | XLPE, PVC, EPR, etc. |
| 14 | Installation Method | Text | Conduit | ✅ Yes | Conduit, Cable Tray, Direct Burial |
| 15 | Ambient Temp (°C) | Number | 35 | ✅ Yes | Environmental temperature |
| 16 | Ground Temp (°C) | Number | 25 | ✅ Yes | Ground/cable temperature |
| 17 | Length (m) | Number | 20.0 | ✅ Yes | Cable run distance in meters |

---

## 🏗️ Hierarchy Rules

### What is a Hierarchy?

A hierarchy is the **power flow chain** from source to loads:

```
Transformer (Top)
    ↓
Main Panel
    ↓ (splits into multiple branches)
    ├─ PMCC-1 (Distribution Panel)
    │   ├─ Motor-1 (Load)
    │   └─ Motor-2 (Load)
    └─ PMCC-2 (Distribution Panel)
        ├─ Pump-1 (Load)
        └─ Light-1 (Load)
```

### How Bus Naming Creates Hierarchy

Each cable row creates a link in the chain:

| From Bus | To Bus | Meaning |
|----------|--------|---------|
| MOTOR-1 | PMCC-1 | Motor 1 connects to PMCC-1 panel |
| PMCC-1 | MAIN-PANEL | PMCC-1 panel connects to main panel |
| MAIN-PANEL | TRF-MAIN | Main panel connects to transformer |

**Result Path:** MOTOR-1 ← PMCC-1 ← MAIN-PANEL ← TRF-MAIN

---

## 🔍 From Bus vs To Bus - Critical Distinction

### From Bus = **WHERE THE LOAD IS**

This is the **child** node in the hierarchy.

**Examples:**
- MOTOR-1 (the motor is at this location)
- PUMP-2 (the pump is at this location)
- LIGHT-3 (the light panel is at this location)
- PMCC-1 (this distribution panel is at this location)

**Rule:** Put the equipment name in From Bus

### To Bus = **WHERE POWER COMES FROM**

This is the **parent** node - upstream source.

**Examples:**
- PMCC-1 (the motor gets power from PMCC-1 panel)
- MAIN-PANEL (the PMCC gets power from main panel)
- TRF-MAIN (the main panel gets power from transformer)

**Rule:** Put the source/panel name in To Bus

---

## 📋 Sample Valid Structure

```
Row | From Bus   | To Bus      | Load KW | Length
─────────────────────────────────────────────────
 1  | MAIN-PANEL | TRF-MAIN    |   0     |  5.0    ← Transformer connection
 2  | PMCC-1     | MAIN-PANEL  |  80     | 30.0    ← Distribution panel feeder
 3  | PMCC-2     | MAIN-PANEL  |  60     | 25.0    ← Distribution panel feeder
 4  | MOTOR-1    | PMCC-1      |  50     | 20.0    ← Equipment/Load
 5  | MOTOR-2    | PMCC-1      |  30     | 15.0    ← Equipment/Load
 6  | PUMP-1     | PMCC-2      |  25     | 18.0    ← Equipment/Load
 7  | LIGHT-1    | PMCC-2      |  15     | 12.0    ← Equipment/Load
```

**Paths Discovered:**
1. MOTOR-1 → PMCC-1 → MAIN-PANEL → TRF-MAIN ✓
2. MOTOR-2 → PMCC-1 → MAIN-PANEL → TRF-MAIN ✓
3. PUMP-1 → PMCC-2 → MAIN-PANEL → TRF-MAIN ✓
4. LIGHT-1 → PMCC-2 → MAIN-PANEL → TRF-MAIN ✓

---

## ❌ Common Mistakes

### Mistake 1: Reversed From/To

```
❌ WRONG:
From Bus: PMCC-1
To Bus: MOTOR-1
Meaning: It would try to find Motor 1 as source (backward!)

✅ CORRECT:
From Bus: MOTOR-1
To Bus: PMCC-1
Meaning: Motor 1 connects to PMCC-1 panel
```

### Mistake 2: Missing Transformer

```
❌ WRONG:
No row with To Bus = "TRF-..." or "TRANSFORMER"
Result: No paths discovered (nowhere to connect to!)

✅ CORRECT:
At least one row has To Bus = "TRF-MAIN" or similar
Result: System can trace back to source
```

### Mistake 3: Inconsistent Bus Names

```
❌ WRONG:
Row 1: To Bus = "PMCC-1"
Row 2: To Bus = "PMCC 1"
Row 3: To Bus = "pmcc-1"
Result: Treated as 3 different panels (breaks path!)

✅ CORRECT:
All use: "PMCC-1" (exact match, case matters)
Result: All connect to same panel
```

### Mistake 4: Empty From Bus or To Bus

```
❌ WRONG:
From Bus: [empty]
To Bus: PMCC-1
Result: Row ignored, path breaks

✅ CORRECT:
From Bus: MOTOR-1
To Bus: PMCC-1
Result: Connection properly traced
```

### Mistake 5: Special Characters in Bus Names

```
❌ WRONG:
From Bus: "Motor #1"
From Bus: "Panel @ PMCC"
From Bus: "Load_Breaker.1"

✅ CORRECT:
From Bus: "MOTOR-1"
From Bus: "PMCC-A1"
From Bus: "LOAD-BRK-01"
(Use only: A-Z, 0-9, hyphens, underscores)
```

---

## 📐 Voltage Drop Calculations

The system validates each path using **IEC 60364-4-43**:

### Voltage Drop Formula
```
V-drop (%) = (√3 × I × R × L) / (1000 × V)

Where:
  I = Current (Amps) = (P × 1000) / (√3 × V × PF)
  R = Resistance (Ω/km)
  L = Length (m)
  V = Voltage (V)
```

### Acceptable Limits
- **0-3%**: ✅ Green (Excellent)
- **3-5%**: ⚠️ Yellow (Acceptable but high)
- **>5%**: ❌ Red (Unacceptable - needs larger cable)

### Load KW vs Load KVA

```
Load KVA = Load KW ÷ Power Factor

Examples:
  50 KW @ 0.82 PF = 50 ÷ 0.82 = 60.97 KVA
  30 KW @ 0.80 PF = 30 ÷ 0.80 = 37.50 KVA
  25 KW @ 0.85 PF = 25 ÷ 0.85 = 29.41 KVA
```

---

## 🎯 Creating Your Own Template

### Step 1: Define Your Hierarchy

Draw it out first:
```
                Transformer
                    |
              Main Distribution Panel
                 /        \
         PMCC-A         PMCC-B
         /  |  \        /  |
       M1  M2  M3      M4  M5
```

### Step 2: List All Connections

```
Connection 1: M1 → PMCC-A → Main Panel → Transformer
Connection 2: M2 → PMCC-A → Main Panel → Transformer
etc.
```

### Step 3: Create Excel Rows

One row per cable segment:

```
From Bus: M1,           To Bus: PMCC-A,          Load KW: 30
From Bus: M2,           To Bus: PMCC-A,          Load KW: 25
From Bus: PMCC-A,       To Bus: Main Panel,      Load KW: 55
From Bus: Main Panel,   To Bus: TRF-MAIN,        Load KW: 0
```

### Step 4: Fill in Other Details

- Length: Actual cable run distance
- Voltage: 415V (or your system voltage)
- Cable Type: XLPE or PVC
- Installation: Conduit, Tray, or Direct Burial
- Power Factor: 0.85 typical
- Efficiency: 90% typical
- Derating: 0.90 typical

### Step 5: Validate

Check:
- ✅ All From Bus values are unique or repeated (equipment locations)
- ✅ All To Bus values reference other equipment or transformer
- ✅ No "dangling" connections (From Bus with no matching To Bus parent)
- ✅ At least one transformer (To Bus contains "TRF")

---

## 🧪 Validation Checklist

Before uploading, verify:

- [ ] File is .xlsx format
- [ ] Sheet 1 contains feeder data
- [ ] All 17 columns present in this exact order
- [ ] Column headers match exactly (case-sensitive):
  - "Serial No" (not "Serial #" or "SN")
  - "Cable Number" (not "Cable_Number")
  - "From Bus" (not "FromBus" or "From_Bus")
  - "To Bus" (not "ToBus" or "To_Bus")
  - etc.
- [ ] No empty From Bus cells
- [ ] No empty To Bus cells
- [ ] All numeric columns contain numbers (not text)
- [ ] All bus names use A-Z, 0-9, hyphens only
- [ ] All bus names are consistent (exact matches)
- [ ] At least one To Bus contains "TRF" or "TRANSFORMER"
- [ ] No duplicate Serial No values
- [ ] No special characters in bus names

---

## 📚 Examples

### Simple Single-Motor Setup

```
Row | From Bus    | To Bus      | Load KW | Length
────────────────────────────────────────────────
 1  | MAIN-PANEL  | TRF-MAIN    |   0     |  5.0
 2  | MOTOR-1     | MAIN-PANEL  |  50     | 20.0
```

**Path Discovered:** MOTOR-1 ← MAIN-PANEL ← TRF-MAIN

### Multi-Panel Industrial Setup

```
Row | From Bus    | To Bus      | Load KW | Length
────────────────────────────────────────────────
 1  | MAIN-PANEL  | TRF-MAIN    |   0     |  5.0
 2  | PMCC-A      | MAIN-PANEL  |  100    | 30.0
 3  | PMCC-B      | MAIN-PANEL  |  80     | 25.0
 4  | MOTOR-A1    | PMCC-A      |  50     | 20.0
 5  | MOTOR-A2    | PMCC-A      |  40     | 22.0
 6  | MOTOR-B1    | PMCC-B      |  35     | 18.0
 7  | PUMP-B1     | PMCC-B      |  45     | 25.0
```

**Paths Discovered:** 4 equipment paths (plus panel paths)

---

## 🔧 Data Entry Tips

### Use a Spreadsheet App
- Microsoft Excel
- Google Sheets
- LibreOffice Calc

### Copy & Paste Saves Time
If you have repeated values (like Voltage: 415V), enter once and copy down.

### Naming Conventions to Follow
```
Motors:   MOTOR-1, MOTOR-2, MOTOR-A, MOTOR-B, etc.
Pumps:    PUMP-1, PUMP-P1, PUMP-MAIN, etc.
Panels:   PMCC-1, PMCC-A, MCC-1, PANEL-1, etc.
Lighting: LIGHT-1, LIGHT-L1, LIGHTING-A, etc.
Main:     MAIN-PANEL, MAIN-BUS, MAIN-SWITCHGEAR
Transform: TRF-MAIN, TRF-415V, TRANSFORMER-1
```

### Load Estimation
```
Small Motor: 5-10 kW
Medium Motor: 15-50 kW
Large Motor: 50-100+ kW
Pump: 10-50 kW
Lighting Panel: 5-30 kW
Industrial Machine: 5-100+ kW
```

---

## ✨ You're Ready!

Follow this format and your Excel will work perfectly with SCEAP.

**The demo template shows all these rules in action.** Download it and study the From Bus/To Bus columns - they're the key!
