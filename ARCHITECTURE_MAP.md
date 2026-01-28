# SCEAP Platform - Complete Architecture Map

## 🎯 Best Strategy Decision Made

You asked: **"How is sizing page implementation helpful for optimization page? Which is required and which is not?"**

### Answer: **Unified Service Model**

Instead of implementing path discovery in UI components, we built:

1. **Core Service** (`pathDiscoveryService.ts`) - Business logic, NO UI dependency
2. **Shared Context** (`PathContext.tsx`) - State management across pages
3. **Loose Coupling** - Both pages read from same source of truth

This is **BETTER** than:
- ❌ Duplicate path discovery in each page
- ❌ Passing paths through props
- ❌ UI components doing calculations

---

## 📊 Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         SCEAP PLATFORM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               APPLICATION LAYER (React)                  │  │
│  │  ┌────────────────┐                ┌─────────────────┐  │  │
│  │  │ SIZING TAB     │                │ OPTIMIZATION    │  │  │
│  │  │ ───────────    │                │ TAB             │  │  │
│  │  │ • Upload Excel │ ◄─────────┐    │ ───────────     │  │  │
│  │  │ • Show Summary │           │    │ • Display Paths │  │  │
│  │  │ • Start Paths  │           │    │ • Show V-drops  │  │  │
│  │  └────────────────┘           │    │ • Select Cable  │  │  │
│  │          │                    │    │   Sizes         │  │  │
│  │          │                    │    └─────────────────┘  │  │
│  │          ▼                    │            ▲            │  │
│  │  ┌──────────────────────────┐ │    ┌─────────────────┐  │  │
│  │  │   usePathContext()       │ │    │ usePathContext()│  │  │
│  │  │                          │ │    │                 │  │  │
│  │  │  setPathAnalysis()       │─┼───▶│  pathAnalysis   │  │  │
│  │  └──────────────────────────┘ │    │                 │  │  │
│  │                               │    └─────────────────┘  │  │
│  └───────────────────┬──────────────────────────────┬──────┘  │
│                      │                              │          │
│  ┌───────────────────▼──────────────────────────────▼────────┐ │
│  │              PATHCONTEXT (Global State)                   │ │
│  │  ┌──────────────────────────────────────────────────┐   │ │
│  │  │ pathAnalysis: {                                 │   │ │
│  │  │   totalPaths: 10,                              │   │ │
│  │  │   validPaths: 8,                               │   │ │
│  │  │   paths: [CablePath[], ...],                   │   │ │
│  │  │   averageVoltageDrop: 3.2%                     │   │ │
│  │  │ }                                               │   │ │
│  │  └──────────────────────────────────────────────────┘   │ │
│  │                                                            │ │
│  │  Access: usePathContext() from ANY component             │ │
│  └────────────────────────────────────────────────────────────┘
│                         ▲
└─────────────────────────┼──────────────────────────────────────┘
                          │ Wrapped with <PathProvider>
                          │
┌─────────────────────────┼──────────────────────────────────────┐
│                         │  SERVICE LAYER                       │
│  ┌──────────────────────▼───────────────────────────────────┐  │
│  │         pathDiscoveryService.ts                          │  │
│  │         ─────────────────────────                        │  │
│  │                                                           │  │
│  │  Core Functions:                                         │  │
│  │  ├─ normalizeFeeders()                                   │  │
│  │  │  └─ Excel columns → Standard format                  │  │
│  │  │                                                        │  │
│  │  ├─ analyzeAllPaths()                                    │  │
│  │  │  ├─ Call discoverPathsToTransformer()               │  │
│  │  │  ├─ Calculate voltage drops                          │  │
│  │  │  └─ Return: PathAnalysisResult                       │  │
│  │  │                                                        │  │
│  │  ├─ discoverPathsToTransformer()                         │  │
│  │  │  └─ BFS algorithm for path discovery                 │  │
│  │  │                                                        │  │
│  │  └─ calculateSegmentVoltageDrop()                        │  │
│  │     └─ Voltage drop math per IEC 60364                  │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘
│                         ▲
│                         │ Uses
└─────────────────────────┼──────────────────────────────────────┘
                          │
┌─────────────────────────┼──────────────────────────────────────┐
│                         │  DATA LAYER                          │
│  ┌──────────────────────▼───────────────────────────────────┐  │
│  │  Data Structures (TypeScript Interfaces)                │  │
│  │  ─────────────────────────────────────────────────────   │  │
│  │                                                           │  │
│  │  CableSegment {                                          │  │
│  │    serialNo: number                                      │  │
│  │    cableNumber: string                                   │  │
│  │    fromBus, toBus: string                                │  │
│  │    voltage, loadKW, length: number                       │  │
│  │    deratingFactor: number                                │  │
│  │  }                                                        │  │
│  │                                                           │  │
│  │  CablePath {                                             │  │
│  │    pathId: string                                        │  │
│  │    startEquipment, endTransformer: string                │  │
│  │    cables: CableSegment[]                                │  │
│  │    voltageDrop, voltageDropPercent: number               │  │
│  │    isValid: boolean                                      │  │
│  │  }                                                        │  │
│  │                                                           │  │
│  │  PathAnalysisResult {                                    │  │
│  │    totalPaths, validPaths, invalidPaths: number         │  │
│  │    paths: CablePath[]                                    │  │
│  │    averageVoltageDrop: number                            │  │
│  │    criticalPaths: CablePath[]                            │  │
│  │  }                                                        │  │
│  └───────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagram

```
STEP 1: INPUT
┌──────────────────┐
│  Excel File      │
│  Upload          │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ SizingTab.tsx                            │
│ • Read Excel                             │
│ • Parse sheet_to_json                    │
│ • Extract feeders array                  │
└────────┬─────────────────────────────────┘
         │
         ▼
STEP 2: NORMALIZATION
┌──────────────────────────────────────────┐
│ normalizeFeeders(rawFeeders)             │
│ • Map "From Bus" → fromBus               │
│ • Map "To Bus" → toBus                   │
│ • Map "Load KW" → loadKW                 │
│ • Convert to numbers, handle nulls       │
│ Output: CableSegment[]                   │
└────────┬─────────────────────────────────┘
         │
         ▼
STEP 3: DISCOVERY
┌──────────────────────────────────────────┐
│ analyzeAllPaths(segments)                │
│                                          │
│ For each equipment/load:                │
│   ├─ Find bus it's on                   │
│   ├─ Trace path to transformer          │
│   │  └─ Use BFS algorithm               │
│   ├─ Collect all cables in path         │
│   └─ Calculate voltage drop             │
│                                          │
│ Output: CablePath[]                      │
└────────┬─────────────────────────────────┘
         │
         ▼
STEP 4: VOLTAGE DROP CALCULATION
┌──────────────────────────────────────────┐
│ calculateSegmentVoltageDrop()            │
│                                          │
│ For each cable:                          │
│   I = (P × 1000) / (√3 × V × PF × η)   │
│   V-drop = (√3 × I × R × L) / 1000     │
│   V-drop% = (V-drop / Voltage) × 100   │
│                                          │
│ Validate: ≤ 5% per IEC 60364           │
└────────┬─────────────────────────────────┘
         │
         ▼
STEP 5: STORAGE & SHARING
┌──────────────────────────────────────────┐
│ PathContext.setPathAnalysis()            │
│ • Store PathAnalysisResult               │
│ • Available to all pages                 │
│ • No re-discovery needed                 │
└────────┬──────────────┬───────────────────┘
         │              │
         ▼              ▼
STEP 6: DISPLAY
┌──────────────────┐    ┌──────────────────────┐
│ Sizing Tab       │    │ Optimization Tab     │
│ • Show summary   │    │ • Show all paths     │
│ • Stats          │    │ • Voltage drops      │
│ • Warnings       │    │ • Cable details      │
└──────────────────┘    │ • Status badges      │
                        └──────────────────────┘
```

---

## ✅ What's ESSENTIAL vs OPTIONAL

### ✅ MUST HAVE (Core Cable Sizing)

```
┌──────────────────────────────────┐
│ pathDiscoveryService.ts          │
│ • Path discovery algorithm       │
│ • Voltage drop calculation       │
│ • IEC validation logic           │
│ └─ This is the BRAIN             │
└──────────────────────────────────┘
```

**Why**: Without this, you can't determine:
- What cables connect to what
- How much voltage drops in each path
- Whether cables are compliant

### ✅ SHOULD HAVE (Linking Pages)

```
┌──────────────────────────────────┐
│ PathContext.tsx                  │
│ • Global state management        │
│ • No prop drilling               │
│ • Single source of truth         │
│ └─ This is the BRIDGE            │
└──────────────────────────────────┘
```

**Why**: Without this:
- Each page must discover paths independently (wasteful)
- Paths might differ between pages (bugs)
- Complex prop passing (hard to maintain)

### ✅ SHOULD HAVE (User Interface)

```
┌──────────────────────────────────┐
│ SizingTab + OptimizationTab      │
│ • User-friendly workflow         │
│ • Visual feedback                │
│ • Data entry and review          │
│ └─ This is the USER INTERFACE    │
└──────────────────────────────────┘
```

### ❌ OPTIONAL (Nice-to-have)

```
┌──────────────────────────────────┐
│ BusHierarchyView.tsx             │
│ • Visualize bus connections      │
│ • Tree-like hierarchy display    │
│ └─ Pretty but not required       │
└──────────────────────────────────┘
```

**Can keep or remove** depending on:
- Do users need to see bus hierarchy visually?
- Or is the path list in Optimization Tab enough?

---

## 🧮 Example: Complete Workflow

### Input Excel:
```
Cable No | From Bus  | To Bus     | Voltage | Load KW | Length
CBL-001  | TRF-415V  | MAIN-BUS   | 415     | 0       | 5.0
CBL-002  | MAIN-BUS  | PMCC-1     | 415     | 125.5   | 25.5
CBL-003  | PMCC-1    | MCC-1      | 415     | 95.8    | 18.2
CBL-004  | MCC-1     | MOTOR-1    | 415     | 75.0    | 35.8
```

### Normalized (Internal):
```javascript
[
  { serialNo: 1, fromBus: "TRF-415V", toBus: "MAIN-BUS", loadKW: 0, length: 5.0, ... },
  { serialNo: 2, fromBus: "MAIN-BUS", toBus: "PMCC-1", loadKW: 125.5, length: 25.5, ... },
  { serialNo: 3, fromBus: "PMCC-1", toBus: "MCC-1", loadKW: 95.8, length: 18.2, ... },
  { serialNo: 4, fromBus: "MCC-1", toBus: "MOTOR-1", loadKW: 75.0, length: 35.8, ... }
]
```

### Discovered Paths:
```javascript
[
  {
    pathId: "PATH-001",
    startEquipment: "MOTOR-1",
    endTransformer: "TRF-415V",
    cables: [CBL-004, CBL-003, CBL-002, CBL-001],  // Reversed (from load to transformer)
    totalDistance: 84.5,  // 35.8 + 18.2 + 25.5 + 5.0
    cumulativeLoad: 75.0,
    voltageDropPercent: 3.2,
    isValid: true,  // ✓ Within 5% limit
    validationMessage: "V-drop: 3.2% (Valid)"
  }
]
```

### Sizing Tab Shows:
```
┌─────────────────────────────────┐
│ Cable Path Analysis             │
├─────────────────────────────────┤
│ Total Paths:      1             │
│ Valid Paths:      1             │
│ Invalid Paths:    0             │
│ Avg V-Drop:       3.2%          │
│                                 │
│ ✓ Paths discovered & ready for  │
│   optimization                  │
└─────────────────────────────────┘
```

### Optimization Tab Shows:
```
┌──────────────────────────────────────────────┐
│ PATH-001                                     │
│ MOTOR-1 → MCC-1 → PMCC-1 → MAIN → TRF-415V  │
│                                              │
│ ✓ VALID (V-drop: 3.2%)                      │
│ 4 cables | 84.5m | 75.0 kW | 415V           │
│                                              │
│ [Details expanded]                           │
│ CBL-004: MOTOR-1 ← MCC-1, 35.8m, 75.0 kW   │
│ CBL-003: MCC-1 ← PMCC-1, 18.2m, 95.8 kW    │
│ CBL-002: PMCC-1 ← MAIN, 25.5m, 125.5 kW    │
│ CBL-001: MAIN ← TRF-415V, 5.0m, 0 kW        │
└──────────────────────────────────────────────┘
```

---

## 🎓 Why This Architecture is Best for Your Platform

### ✅ Advantages

1. **Reusable Service** - Can move to backend without changing UI
2. **Shared State** - No duplicate calculations, single source of truth
3. **Clean Code** - Business logic separate from UI
4. **Scalable** - Easy to add cable sizing, cost analysis, load flow
5. **Testable** - Service can be unit tested independently
6. **Maintainable** - Clear responsibility separation

### ❌ Why NOT other approaches

1. ❌ **Duplicate path discovery**: Wasteful, might diverge
2. ❌ **Prop drilling**: Hard to maintain as app grows
3. ❌ **UI-bound service**: Can't reuse in backend/other projects
4. ❌ **No state management**: Hard to share between pages

---

## 🚀 Next Phase: Cable Sizing

With this foundation, you can easily add:

```javascript
// Step 1: Recommend cable sizes
const recommendCableSize = (path: CablePath, catalogue: CableCatalogue[]) => {
  // Find smallest cable that keeps V-drop ≤ 5%
  for (let cable of catalogue) {
    const newVdrop = calculateVdropWithCableSize(path, cable);
    if (newVdrop ≤ 5%) return cable;
  }
};

// Step 2: Optimize by cost
const optimizeForCost = (paths: CablePath[], catalogue: CableCatalogue[]) => {
  // Select cable sizes that minimize total cost while meeting constraints
};

// Step 3: Final validation
const validateSizing = (paths: CablePath[], recommendations: SizingResult[]) => {
  // Ensure all paths compliant, within budget, etc.
};
```

All built on top of `pathDiscoveryService` + `PathContext`!

---

**✨ Your platform now has a solid, professional foundation for intelligent cable engineering! 🎉**
