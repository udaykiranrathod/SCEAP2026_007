# Quick Start Guide: Optimization & Results Features

## 🎯 Overview

The SCEAP Cable Sizing platform now features an intelligent **Optimization Tab** that discovers electrical paths and a **Results Tab** that automatically calculates cable sizing per IEC 60364 standards.

---

## 📊 Optimization Tab - Path Discovery

### What It Shows

1. **Path Summary Card**
   - Total paths discovered
   - Valid paths (voltage drop ≤ 5%)
   - Invalid paths (voltage drop > 5%)
   - Average voltage drop across all paths

2. **Individual Paths**
   - Equipment name and description
   - Complete path to transformer
   - Cable information at each step
   - Voltage drop validation

### How to Use

**Before Clicking:**
```
PATH-001
UPS-PANEL → TRF-MAIN
📋 Feeder to UPS-PANEL

Cables in Path: 2
Total Distance: 53m
Voltage: 415V
Load: 85kW

Voltage Drop: 0.94% ✓ VALID
(Exceeds 5% limit - cable size too small)
```

**After Clicking (Expanded View):**
```
Cable Details (Step by Step)
- Step 1: FDR-MAIN-002
  📋 Feeder to UPS-PANEL
  From Bus: UPS-PANEL → To Bus: MAIN-DISTRIBUTION
  Length: 45m | Load: 85kW | Voltage: 415V | Derating: 87%

- Step 2: INC-MAIN-001
  📋 MAIN DISTRIBUTION PANEL (MAIN SWITCHGEAR)
  From Bus: MAIN-DISTRIBUTION → To Bus: TRF-MAIN
  Length: 8m | Load: 0kW | Voltage: 415V | Derating: 100%
```

### Color Legend
- 🟢 **Green**: Starting equipment
- 🔵 **Blue**: Intermediate buses
- 🔴 **Red**: Ending transformer

---

## 🧮 Results Tab - Cable Sizing

### What It Shows

Automatic cable sizing calculations for **all cables** in all discovered paths:

```
Total Results: 43 cables
✓ Valid (V-drop ≤ 5%): 41 cables
✗ Invalid (V-drop > 5%): 2 cables
Total Load: 813.0 kW
Average Cable Size: 58 mm²
```

### Results Table Columns

| Column | Meaning | Example |
|--------|---------|---------|
| S.No | Serial number | 1, 2, 3, ... |
| Cable # | Cable identifier | FDR-MAIN-002 |
| Description | What this cable does | Feeder to UPS-PANEL |
| From/To Bus | Equipment connection | UPS-PANEL → MAIN-DISTRIBUTION |
| V (V) | Voltage | 415V |
| Load (kW) | Power requirement | 85.0 kW |
| L (m) | Cable length | 45 m |
| FLC (A) | Full Load Current | 146.45 A |
| Derated (A) | Current with derating | 168.33 A |
| R (Ω/km) | Cable resistance | 0.268 Ω/km |
| V-Drop (V) | Voltage drop amount | 3.53 V |
| V-Drop (%) | Voltage drop % | 0.85% ✓ Valid |
| Size-I (mm²) | Size by current method | 70 mm² |
| Size-V (mm²) | Size by voltage drop method | 70 mm² |
| Size-Isc (mm²) | Size by short circuit method | 25 mm² |
| **Final Size (mm²)** | **Recommended cable size** | **70 mm²** |
| Breaker | Protection device | 200A |
| Status | Validation result | ✓ VALID or ✗ INVALID |

### Analysis Cards

**Size Distribution**
- Shows how many cables need each size
- Helps with procurement planning

**Voltage Drop Analysis**
- ≤3%: Best performance
- 3-5%: Valid per IEC 60364
- >5%: Invalid, needs larger cable

**Load Distribution**
- Total system load
- Average load per cable
- Maximum single cable load

---

## 💾 Exporting Results

### Excel Export
Click **Excel** button → Downloads `cable_sizing_results_YYYY-MM-DD.xlsx`

**Includes:**
- All 43 cables with data
- Serial number and cable identifiers
- Full electrical calculations
- Recommended sizes and breakers
- Voltage drop percentages
- Status (VALID/INVALID)

**Use For:**
- Engineering documentation
- Procurement specification
- Bill of materials (BOM)
- Stakeholder reports

### PDF Export
Click **PDF** button → Downloads `cable_sizing_results_YYYY-MM-DD.pdf`

**Format:**
- Landscape A4 table
- 15 key columns (summary format)
- Professional presentation
- Suitable for printing
- Ready for reports

**Use For:**
- Engineering reports
- Client presentations
- Project documentation
- Compliance records

---

## 📐 Cable Sizing Formulas

### 1. Full Load Current (FLC)
```
FLC = (P × 1000) / (√3 × V × PF × Efficiency)

Example: 85 kW at 415V, PF=0.85, Eff=0.95
FLC = (85 × 1000) / (1.732 × 415 × 0.85 × 0.95)
FLC = 146.45 A
```

### 2. Derated Current
```
Derated = FLC / Derating Factor

Example: With derating factor 0.87
Derated = 146.45 / 0.87 = 168.33 A
```

### 3. Size by Current Requirement
```
Required = Derated × 1.25 (safety factor)
→ Find smallest cable that handles this current

Example: 210.4A required → Use 70mm² cable (capacity: 245A)
```

### 4. Voltage Drop
```
V-Drop = (√3 × I × R × L) / 1000

Example: With R=0.268 Ω/km, L=45m
V-Drop = (1.732 × 168.33 × 0.268 × 45) / 1000 = 3.53V
V-Drop% = (3.53 / 415) × 100 = 0.85% ✓ Valid
```

### 5. Voltage Drop Size Check
```
Find cable size where V-drop% ≤ 5% (IEC 60364 limit)

Example: If 70mm² gives 0.85%, then VALID ✓
```

### 6. Final Recommendation
```
Final Size = MAX(Size_by_Current, Size_by_VoltDrop, Size_by_Isc)
→ Conservative approach ensures adequacy
```

---

## 🔍 Understanding the Results

### Status Indicators

**✓ VALID** (Green)
- Voltage drop ≤ 5% per IEC 60364
- Cable size adequate for all conditions
- Safe to use as calculated

**✗ INVALID** (Red)
- Voltage drop > 5%
- Cable size too small
- **Action Required:** Use larger cable size

### Color Coding in Tables

| Color | Meaning |
|-------|---------|
| 🟢 Green | Voltage drop ≤ 5% - Acceptable |
| 🟡 Yellow | Voltage drop 3-5% - Good |
| 🔴 Red | Voltage drop > 5% - Unacceptable |

---

## ⚠️ Common Questions

### Q: What does "Derating Factor" mean?
**A:** Reduction in cable capacity due to:
- Temperature (ambient/ground)
- Installation method (tray, cable, conduit, etc.)
- Cable grouping (multiple cables in bundle)
- 0.87 means 13% reduction in current capacity

### Q: Why are there three cable sizes?
**A:** Different sizing criteria:
1. **Size by Current**: Handles the electrical load safely
2. **Size by Voltage Drop**: Limits voltage loss to ≤5%
3. **Size by Short Circuit**: Protects against fault conditions

The **Final Size** is the largest of the three to ensure safety.

### Q: When should I use the PDF vs Excel?
- **Excel**: For detailed analysis, calculations, modifications
- **PDF**: For reports, presentations, compliance documentation

### Q: Can I modify the results?
**A:** Currently read-only from calculations. For modifications:
1. Change cable lengths or loads in source feeder list
2. Re-upload and re-analyze
3. Results automatically recalculate

### Q: What if voltage drop is invalid?
**A:** The final cable size already includes proper sizing. Invalid status is informational. The recommended size (70mm² instead of 25mm²) resolves the issue.

---

## 🚀 Workflow Summary

```
1. Upload Feeder List (Excel)
   ↓
2. System Discovers Paths
   ↓
3. Optimization Tab Shows:
   - All paths discovered
   - Equipment and descriptions
   - Voltage drop for each path
   ↓
4. Results Tab Shows:
   - Automatic cable sizing
   - Three sizing methods
   - Final recommendations
   - Validation status
   ↓
5. Export Results:
   - Excel (for engineering work)
   - PDF (for reports)
```

---

## 📝 Example Output

### Sample Results Record

```
Cable: FDR-MAIN-003
Description: Feeder to HVAC-PANEL
From: HVAC-PANEL → To: MAIN-DISTRIBUTION
Voltage: 415V | Load: 120.0kW | Length: 55m

Calculations:
- FLC: 206.75A
- Derated Current: 234.94A (derating 0.88)
- Cable Resistance: 0.193 Ω/km (95mm²)
- Voltage Drop: 4.27V (1.04%)

Sizing:
- Size by Current: 95mm²
- Size by V-Drop: 95mm²  
- Size by Isc: 25mm²
- Final Recommendation: 95mm² ← USE THIS
- Breaker: 260A

Status: ✓ VALID (V-drop 1.04% ≤ 5% limit)
```

---

## 📞 Need Help?

Refer to the main documentation:
- [UPDATES_SUMMARY.md](UPDATES_SUMMARY.md) - Detailed technical changes
- [BEFORE_AFTER_COMPARISON.md](BEFORE_AFTER_COMPARISON.md) - Visual comparison
- [README.md](README.md) - Project overview

---

**Last Updated:** January 29, 2026  
**Status:** ✅ PRODUCTION READY
