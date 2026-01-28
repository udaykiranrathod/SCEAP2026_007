# Implementation Guide: Path Discovery & Cable Sizing

## 🎯 What You Now Have

Your SCEAP platform now has a **complete architecture** for path discovery and cable sizing:

### Core Components:

1. **pathDiscoveryService.ts** - The engine
   - Discovers cable paths from Excel hierarchical structure
   - Calculates voltage drops
   - Validates against IEC standards

2. **PathContext.tsx** - The bridge
   - Shares discovered paths between Sizing and Optimization tabs
   - Prevents duplicate calculations
   - Single source of truth

3. **SizingTab.tsx** - The input
   - Upload Excel file with hierarchical feeders
   - Automatically discovers paths
   - Shows summary statistics

4. **OptimizationTab.tsx** - The output
   - Displays all discovered paths
   - Shows voltage drop status
   - Ready for cable size selection

---

## 📝 How to Use

### Step 1: Download Template
- Go to **Sizing Tab**
- Click "Download Template"
- Fill in your feeder data following the hierarchical structure

### Step 2: Upload Excel
- Drag & drop your Excel file into the Sizing Tab
- System automatically discovers paths
- You'll see summary statistics

### Step 3: View Detailed Paths
- Go to **Optimization Tab**
- See all discovered cable paths with voltage drop status
- Red ✗ = Exceeds voltage drop limit (needs larger cable)
- Green ✓ = Within safe limits

### Step 4: Optimize (Coming Next)
- Select optimal cable sizes
- System will recalculate voltage drops
- Ensure all paths are valid before proceeding

---

## 📊 Excel Template Structure

Your Excel should have this hierarchical structure:

```
Cable Number | From Bus      | To Bus        | Voltage | Load KW | Length
─────────────────────────────────────────────────────────────────────────
  CBL-001    | TRF-415V      | MAIN-BUS      | 415     | 0       | 5.0      ← Main transformer
  CBL-002    | MAIN-BUS      | PMCC-1        | 415     | 125.5   | 25.5     ← Level 1 panel
  CBL-003    | PMCC-1        | MCC-1         | 415     | 95.8    | 18.2     ← Level 2 panel
  CBL-004    | MCC-1         | MOTOR-1       | 415     | 75.0    | 35.8     ← Load/Equipment
  CBL-005    | PMCC-1        | LIGHTING-1    | 415     | 25.3    | 12.5     ← Another load

```

**Key Rules**:
- `From Bus` = Source (where cable originates) - should be child bus
- `To Bus` = Destination (where cable goes) - should be parent bus
- Include "TRF" or "TRANSFORMER" in transformer bus name
- Each row represents ONE cable between two buses

---

## 🔍 Understanding Path Discovery

The system discovers paths like this:

```
Input Excel Data:
CBL-001: TRF-415V  → MAIN-BUS   (Transformer to main panel)
CBL-002: MAIN-BUS  → PMCC-1     (Main to distribution panel)
CBL-003: PMCC-1    → MCC-1      (Distribution to motor control center)
CBL-004: MCC-1     → MOTOR-1    (Motor control center to motor)

Discovered Paths:
PATH-001: MOTOR-1 ← MCC-1 ← PMCC-1 ← MAIN-BUS ← TRF-415V
          (4 cables in this path)
```

**Why it matters**:
- Voltage drops **accumulate** through all cables in the path
- Thicker cables needed if cumulative drop exceeds 5%
- System automatically identifies these critical paths

---

## ⚡ Voltage Drop Calculation

For each path, the system calculates:

```
Current (I) = (Power × 1000) / (√3 × Voltage × Power Factor × Efficiency)
V-drop = (√3 × I × Resistance × Length) / 1000
V-drop % = (V-drop / System Voltage) × 100

IEC Limit: Must be ≤ 5% for main supply circuits
Recommended: Keep ≤ 3% to be safe
```

**Red flags in Optimization tab**:
- 🔴 Red ✗ = V-drop > 5% (Non-compliant, select larger cable)
- 🟡 Orange = V-drop 3-5% (Acceptable but marginal)
- 🟢 Green ✓ = V-drop < 3% (Optimal)

---

## 🛠️ Next Steps for Your Team

### Immediate (Test the system)
1. Download the template from Sizing Tab
2. Fill with your actual project data
3. Upload and check if paths are discovered correctly
4. Compare voltage drop calculations with your manual calculations
5. Verify the paths make sense for your system

### Short-term (Add cable sizing)
1. In Optimization Tab, add cable size selector
2. Link to cable catalogue
3. Recalculate voltage drops with new sizes
4. Export results to Excel

### Medium-term (Backend integration)
1. Move pathDiscoveryService to backend API
2. Store discovered paths in database
3. Build project history/comparison features
4. Add load flow analysis

---

## 🎓 Key Concepts to Remember

### Path Discovery
- Used to find ALL cable chains from loads back to transformer
- Essential for understanding system topology
- No SLD diagrams needed - Excel structure is enough

### Voltage Drop
- Voltage decreases as current travels through cables
- Longer cables + smaller sizes = more voltage drop
- Must stay ≤ 5% per IEC 60364-5-52

### Cable Sizing
- Larger cables = Lower resistance = Lower voltage drop
- But also = Higher cost and weight
- Optimization = Find smallest cable that meets voltage drop limit

### Hierarchical Structure
- Transformer (top level) supplies...
- Main panels (level 1) which supply...
- Distribution panels (level 2) which supply...
- Motors/Loads (end points)

---

## 📞 Troubleshooting

### Paths Not Discovered
- Check "From Bus" and "To Bus" column names (case-sensitive)
- Ensure at least one bus name contains "TRF" or "TRANSFORMER"
- Verify no empty rows break the chain

### Voltage Drop Incorrect
- Check `Length (m)` values
- Check `Load KW` values (0 for panel headers is OK)
- Verify `Voltage (V)` values match system

### Optimization Tab Empty
- First upload Excel in Sizing Tab
- Wait for path discovery to complete
- Then switch to Optimization Tab

---

## 💾 File Locations

```
sceap-frontend/
├── src/
│   ├── utils/
│   │   └── pathDiscoveryService.ts     ← Core engine
│   ├── context/
│   │   └── PathContext.tsx             ← State management
│   ├── components/
│   │   ├── SizingTab.tsx               ← Input
│   │   └── OptimizationTab.tsx         ← Output
│   └── App.tsx                         ← Wrapped with PathProvider
└── ARCHITECTURE_DECISIONS.md           ← Detailed architecture
```

---

## ✨ What Makes This Solution Powerful

1. **No SLD Diagrams Needed**
   - Extracts system topology from hierarchical Excel
   - Much faster than manual SLD creation

2. **Automatic Path Discovery**
   - Finds every possible load path automatically
   - BFS algorithm ensures shortest logical path

3. **Voltage Drop Compliance**
   - Immediately identifies non-compliant cables
   - IEC 60364 validation built-in

4. **Scalable Architecture**
   - Service-based (can move to backend)
   - Context-based (can add more pages)
   - No UI dependencies (reusable)

5. **Ready for Optimization**
   - Foundation for cable size selection
   - Foundation for cost analysis
   - Foundation for load flow studies

---

**You now have a solid foundation for intelligent cable engineering! 🚀**
