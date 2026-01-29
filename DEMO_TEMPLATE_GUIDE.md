# SCEAP Demo Template - Complete Guide

## 📋 What You'll Get

The template file `SCEAP_Demo_Template.xlsx` contains a **working, tested sample** of cable data that demonstrates the platform's full functionality. When you upload this template, the system will:

1. **Discover 7 Cable Paths** automatically from the data
2. **Display them in the Optimization tab** for cable sizing
3. **Calculate voltage drops** for each path (with IEC 60364 validation)
4. **Show status indicators** (green ✓ for valid, red ✗ for exceeds limit)

## 🏗️ System Architecture in the Template

```
                    TRF-MAIN (Transformer 415V)
                         │
                    MAIN-PANEL
                    /        \
                   /          \
              PMCC-1        PMCC-2
             /      \       /      \
         MOTOR-M1  MOTOR-M2  PUMP-P1  LIGHT-L1
         (50kW)    (30kW)    (25kW)   (15kW)
```

## 📊 Cable Paths That Will Be Discovered

The system automatically finds these 4 **main equipment paths**:

| Path | Route | Load | Distance | Status |
|------|-------|------|----------|--------|
| PATH-004 | MOTOR-M1 ← PMCC-1 ← MAIN-PANEL ← TRF-MAIN | 50 kW | 55 m | Should be ✓ Valid |
| PATH-005 | MOTOR-M2 ← PMCC-1 ← MAIN-PANEL ← TRF-MAIN | 30 kW | 50 m | Should be ✓ Valid |
| PATH-006 | PUMP-P1 ← PMCC-2 ← MAIN-PANEL ← TRF-MAIN | 25 kW | 48 m | Should be ✓ Valid |
| PATH-007 | LIGHT-L1 ← PMCC-2 ← MAIN-PANEL ← TRF-MAIN | 15 kW | 42 m | Should be ✓ Valid |

*(Plus 3 intermediate paths for the panels - these are normal)*

## 🔑 Critical Column Meanings

### From Bus
- **Meaning**: WHERE THE LOAD/EQUIPMENT IS
- **Example**: If a motor is installed at location "MOTOR-M1", From Bus = "MOTOR-M1"
- **This is the CHILD/DESTINATION** in the hierarchy

### To Bus
- **Meaning**: WHERE POWER COMES FROM (upstream)
- **Example**: If the motor gets power from panel "PMCC-1", To Bus = "PMCC-1"
- **This is the PARENT/SOURCE** in the hierarchy

### Why It Matters
The algorithm reads each row as: **"Cable goes FROM the load TO the panel/source"**

```
Example Row:
From Bus: MOTOR-M1
To Bus: PMCC-1

Interpretation: This cable connects MOTOR-M1 to PMCC-1
               Power flows: PMCC-1 → MOTOR-M1
               Signal goes: MOTOR-M1 ← PMCC-1
```

## 📥 How to Use the Template

### Step 1: Download Template
Click "Download Template" button on Sizing tab → Gets `SCEAP_Demo_Template.xlsx`

### Step 2: Upload Template
- Click "Upload Feeders" drop zone
- Select the downloaded template Excel file
- Wait for "Path analysis complete!" message

### Step 3: View Results
Go to **Optimization tab** → You'll see:
- 📊 **Total Paths**: 7 discovered automatically
- ✓ **Valid Paths**: Number passing voltage drop test
- 📈 **Average V-Drop**: Overall voltage drop percentage
- 📋 **Path Details Table**: Each path with cable info and sizing options

### Step 4: Size Cables
For each path, select appropriate cable size from dropdown based on:
- Current requirement
- Voltage drop limits
- Installation method

## ✅ Validation Rules

The system automatically checks each path against **IEC 60364** standards:

- **✓ GREEN**: Voltage drop ≤ 5% (Safe, acceptable)
- **⚠️ YELLOW**: Voltage drop 3-5% (Caution, monitor)
- **✗ RED**: Voltage drop > 5% (Unsafe, requires larger cable)

## 🔧 Template Data Specifications

### All Cables in Template
```
Cable Length: 5-30 meters
System Voltage: 415V three-phase (standard industrial)
Cable Types: XLPE, PVC (common commercial options)
Installation: Cable Tray, Conduit, Direct Burial
Ambient Temp: 35-38°C (tropical/desert conditions)
Load Range: 0 kW (panel headers) to 50 kW (motors)
Power Factor: 0.82-0.95 (typical industrial)
```

## 🛠️ If You Want to Modify the Template

### DO:
- ✅ Change Load KW values (up to 100kW)
- ✅ Change cable lengths (realistic distances)
- ✅ Add more loads to existing panels
- ✅ Change power factors (0.8-0.95 range)
- ✅ Modify descriptions for clarity

### DON'T:
- ❌ Change "From Bus" and "To Bus" names without understanding the hierarchy
- ❌ Delete the transformer connection (row with To Bus = "TRF-MAIN")
- ❌ Use special characters in bus names (stick to A-Z, 0-9, hyphens)
- ❌ Leave From Bus or To Bus empty (required fields)

## 🚀 After Cable Sizing

Once you've sized all cables:
1. Click "Proceed to Results" (Results tab will show final summary)
2. Platform validates all decisions
3. Export final design sheet for engineering documentation

## 🐛 Troubleshooting

### "No Paths Discovered Yet"
- **Cause**: Excel data wasn't processed correctly
- **Solution**: Try downloading and re-uploading the template
- **Check**: Console logs (F12 → Console tab) for error messages

### "Invalid path: V-drop exceeds 5%"
- **Cause**: Cable too small for the load
- **Solution**: Select larger cable from dropdown
- **Example**: For 50kW over 55m, you likely need 50-70 mm² cable

### Missing some motors/loads
- **Cause**: Bus name mismatch (typo in From Bus or To Bus)
- **Solution**: Verify bus names match exactly (case-sensitive)
- **Check**: Row with that motor's From Bus value

## 📚 Column Reference

| Column | Purpose | Example | Notes |
|--------|---------|---------|-------|
| Serial No | Row number | 1, 2, 3... | For reference |
| Cable Number | Unique ID | CBL-001 | For identification |
| Feeder Description | Name/description | "Motor M1" | Human readable |
| **From Bus** | Load location | "MOTOR-M1" | **CRITICAL** |
| **To Bus** | Source panel | "PMCC-1" | **CRITICAL** |
| Voltage (V) | System voltage | 415 | Keep consistent |
| Power Factor | PF rating | 0.85 | 0.8-0.95 typical |
| Efficiency (%) | Efficiency | 89 | 85-98 typical |
| Derating Factor | Cable derating | 0.90 | 0.85-1.0 range |
| Breaker Type | Protection device | "MCCB" | For documentation |
| Load KW | Active power | 50.0 | Your load value |
| Load KVA | Apparent power | 61.0 | ≈ KW/PF |
| Cable Type | Material | "XLPE" | XLPE or PVC |
| Installation Method | How it's installed | "Conduit" | Conduit, Tray, etc. |
| Ambient Temp (°C) | Environment | 35 | Local climate |
| Ground Temp (°C) | Ground temperature | 25 | Usually lower |
| Length (m) | Cable run distance | 20.0 | Actual meters |

## 🎯 What Happens Behind the Scenes

When you upload the template:

1. **Excel Parser** reads all rows and columns
2. **Data Normalizer** maps column names to standard fields
3. **Path Discovery** uses graph traversal to find all paths
4. **Voltage Calculator** computes V-drop for each path
5. **Validator** checks against IEC 60364 standards
6. **Context Store** saves results for display across pages
7. **Optimization Tab** displays all findings

---

## ❓ Questions?

- **Console Issues**: Open browser console (F12 → Console) to see detailed logs
- **Data Format**: Follow the template exactly - column names must match
- **Path Not Found**: Check bus names for typos (case-sensitive!)
- **Voltage Drop High**: Try larger cable sizes from dropdown

**The template is production-ready. Upload it as-is to see the system work!**
