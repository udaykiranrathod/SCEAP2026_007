# SCEAP Platform Architecture - Path Discovery & Cable Sizing Strategy

## ✅ ARCHITECTURE DECISION

The platform now uses a **Shared Service Model** where paths are discovered once and shared across all pages via React Context.

### Core Components:

#### 1. **Path Discovery Service** (`pathDiscoveryService.ts`)
- **Location**: `src/utils/pathDiscoveryService.ts`
- **Purpose**: Core engine for discovering cable paths from Excel hierarchical structure
- **NOT** tied to any UI component
- **Key Functions**:
  - `normalizeFeeders()` - Maps Excel columns to standard data structure
  - `analyzeAllPaths()` - Discovers all paths and calculates voltage drops
  - `discoverPathsToTransformer()` - BFS algorithm to find paths
  - `calculateSegmentVoltageDrop()` - Voltage drop calculation per cable

**Why it's essential**: This is the BRAIN of the system. It handles:
- Path discovery (transformer → panels → loads chain)
- Voltage drop calculations (critical for compliance with IEC 60364 ≤5%)
- Path validation and status reporting

#### 2. **Path Context** (`PathContext.tsx`)
- **Location**: `src/context/PathContext.tsx`
- **Purpose**: Share discovered paths between Sizing and Optimization pages
- **Data**: `pathAnalysis` object containing all paths and statistics

**Why it's essential**: Prevents duplicate path discovery and ensures both pages work with the same data.

#### 3. **Sizing Tab Component**
- **Responsibility**: 
  - ✅ Upload Excel file
  - ✅ Call path discovery service
  - ✅ Display summary statistics
  - ✅ Share results with context
  - ✅ Show user-friendly feedback

- **What it does NOT do**:
  - ❌ Does NOT visualize all path details (that's Optimization's job)
  - ❌ Does NOT calculate cable sizes (future)

#### 4. **Optimization Tab Component**
- **Responsibility**: 
  - ✅ Display all discovered paths with full details
  - ✅ Show voltage drop status per path
  - ✅ Allow cable size selection for optimization
  - ✅ Calculate final sizing results

- **Data source**: Reads from PathContext (paths already discovered in Sizing)

---

## 📊 DATA FLOW

```
┌─────────────────────────────────────────────────────────────┐
│ User Uploads Excel File (Sizing Tab)                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ SizingTab Component                                          │
│ - Reads Excel                                                │
│ - Normalizes column names                                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ pathDiscoveryService.analyzeAllPaths()                      │
│ - Discover all paths: TRANSFORMER → PANELS → LOADS          │
│ - Calculate voltage drop per path                           │
│ - Validate against IEC 60364 (≤5% limit)                    │
│ - Return: PathAnalysisResult                                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ PathContext (Shared State)                                   │
│ - Stores: pathAnalysis object                               │
│ - Available to: ALL pages via usePathContext()              │
└──────────┬──────────────────────────────┬────────────────────┘
           │                              │
           ▼                              ▼
    ┌─────────────┐              ┌──────────────────┐
    │ Sizing Tab  │              │ Optimization Tab │
    │             │              │                  │
    │ Shows:      │              │ Shows:           │
    │ - Summary   │              │ - All paths      │
    │ - Stats     │              │ - Full details   │
    │ - Warnings  │              │ - V-drop status  │
    └─────────────┘              │ - Cable select   │
                                 └──────────────────┘
```

---

## 🔧 WHAT'S ESSENTIAL VS NICE-TO-HAVE

### ✅ ESSENTIAL (Required for Cable Sizing)

1. **pathDiscoveryService.ts**
   - Core path discovery algorithm
   - Voltage drop calculations
   - Path validation

2. **PathContext.tsx**
   - Share paths between pages
   - Prevent duplicate calculations

3. **Data Structures**
   - `CableSegment` - Individual cable data
   - `CablePath` - Complete path from equipment to transformer
   - `PathAnalysisResult` - All paths + statistics

### ❌ NOT NEEDED (Can be removed)

1. **BusHierarchyView.tsx** component
   - This was a visualization of bus hierarchy
   - **Decision**: Not required for sizing calculations
   - **Keep** if you want a visual representation (nice-to-have)
   - **Remove** if focusing purely on cable sizing

2. **busPathAnalyzer.ts** (old utility)
   - Superseded by `pathDiscoveryService.ts`
   - **Can be deleted** - all functionality moved to new service

---

## 🎯 HOW IT WORKS FOR CABLE SIZING

### Step 1: Excel Input Structure
User uploads Excel with hierarchical feeders:
```
Serial No | Cable Number | From Bus | To Bus | Voltage | Load KW | Length
    1     | CBL-001      | TRF-415V | MAIN   | 415     | 0       | 5.0
    2     | CBL-002      | MAIN     | PMCC-1 | 415     | 125.5   | 25.5
    3     | CBL-003      | PMCC-1   | MCC-1  | 415     | 95.8    | 18.2
    4     | CBL-004      | MCC-1    | MOTOR  | 415     | 75.0    | 35.8
```

### Step 2: Path Discovery
System traces: **MOTOR ← MCC-1 ← PMCC-1 ← MAIN ← TRANSFORMER**

### Step 3: Voltage Drop Calculation
For each path:
- Current: I = (P × 1000) / (√3 × V × PF × Eff)
- V-drop = (√3 × I × R × L) / 1000
- V-drop %: (V-drop / Voltage) × 100

### Step 4: Validation
- ✅ Valid if V-drop ≤ 5% (IEC 60364 limit)
- ⚠️ Warning if V-drop > 3% (consider larger cable)
- ❌ Invalid if V-drop > 5% (MUST use larger cable)

### Step 5: Optimization Page
Shows all paths with their status, allowing engineers to:
1. Identify which paths violate voltage drop limits
2. Select larger cable sizes for problematic paths
3. Recalculate until all paths are valid

---

## 📋 CURRENT STATUS

### ✅ Completed
- Path discovery algorithm (BFS from load to transformer)
- Excel data normalization (handles various column names)
- Voltage drop calculation
- Context-based data sharing
- Sizing Tab: Path analysis summary
- Optimization Tab: Full path visualization

### 🔄 Ready for Next Phase
- Cable size selection and recommendation
- Final sizing calculations
- Results export

### Future Enhancements
- Multi-voltage system support
- Temperature-dependent resistance
- Cable cost optimization
- Load flow analysis

---

## 💡 DESIGN PRINCIPLES

1. **Separation of Concerns**
   - Service = Business logic (pathDiscoveryService)
   - Context = State management (PathContext)
   - Components = UI only (SizingTab, OptimizationTab)

2. **Shared Data**
   - Path discovery happens ONCE (in Sizing tab)
   - Both tabs read from same PathContext
   - Prevents inconsistency

3. **Reusability**
   - `pathDiscoveryService` can be used by ANY page
   - Not tied to any specific UI
   - Can be exported to backend if needed

4. **Scalability**
   - Easy to add cable size recommendation logic
   - Easy to add multi-phase calculations
   - Easy to add temperature effects
   - Easy to integrate with backend API

---

## 🚀 RECOMMENDED NEXT STEPS

1. **Immediate** (for MVP):
   - Test path discovery with your actual Excel templates
   - Verify voltage drop calculations match your manual calculations
   - Add cable size selection UI in Optimization tab

2. **Short-term** (1-2 sprints):
   - Implement cable size recommendation algorithm
   - Add cost analysis
   - Export results to Excel

3. **Medium-term** (next phase):
   - Move path discovery to backend (for large projects)
   - Add database storage of paths and sizing results
   - Implement user project management

---

## 📁 File Structure

```
src/
├── utils/
│   └── pathDiscoveryService.ts    ← Core cable path discovery engine
├── context/
│   └── PathContext.tsx            ← Share paths between pages
├── components/
│   ├── SizingTab.tsx              ← Excel upload + path discovery
│   ├── OptimizationTab.tsx        ← Detailed path visualization
│   └── BusHierarchyView.tsx       ← (Optional visualization)
└── App.tsx                         ← Wrapped with PathProvider
```

---

## ✨ Summary

**BEST STRATEGY FOR YOUR PLATFORM**:
- Use **pathDiscoveryService.ts** as the core engine (no UI dependency)
- Share results via **PathContext** (no prop drilling)
- Sizing Tab: Show summary & redirect to Optimization
- Optimization Tab: Show all paths, select cable sizes, calculate final results

This keeps your code clean, testable, and scalable! 🎯
