# SCEAP2026 PLATFORM: COMPREHENSIVE PROGRAMMING LANGUAGES GUIDE

**Last Updated**: February 16, 2026  
**Platform**: SCEAP2026 - Industrial Cable Sizing & Path Analysis System  
**Author**: Technical Documentation Team

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Language Distribution](#language-distribution)
3. [TypeScript (Core Business Logic)](#typescript-core-business-logic)
4. [React + TypeScript (UI Layer)](#react--typescript-ui-layer)
5. [JavaScript/Node.js (Build & Tools)](#javascriptnode-js-build--tools)
6. [HTML/CSS/Tailwind (Styling)](#htmlcsstailwind-styling)
7. [JSON (Configuration)](#json-configuration)
8. [Markdown (Documentation)](#markdown-documentation)
9. [Integration & Data Flow](#integration--data-flow)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│         SCEAP2026 THREE-TIER ARCHITECTURE PLATFORM              │
├──────────────────────────────────────────────────────────────────┤
│           USER INTERFACE LAYER (Port 5173)                       │
│  React Components (.tsx) + TypeScript (.ts) Business Logic       │
│         ← HTML/CSS/Tailwind Responsive Grid →                   │
├──────────────────────────────────────────────────────────────────┤
│  HTTP/REST  ↕  JSON                                             │
│  (Axios)                                                         │
├──────────────────────────────────────────────────────────────────┤
│           API LAYER / BACKEND SERVER (Port 5000)                │
│     ASP.NET Core C# REST API Controllers (.cs)                  │
│  ├─ CableSizingController     → /api/cablesizing/*             │
│  ├─ CableRoutingController    → /api/cablerouting/*            │
│  ├─ ProjectsController        → /api/projects/*                │
│  └─ TerminationController     → /api/termination/*             │
├──────────────────────────────────────────────────────────────────┤
│        SERVICE & BUSINESS LOGIC LAYER (C#)                       │
│  ├─ CableSizingService        → FLC, derating, size selection   │
│  ├─ CableRoutingService       → Path analysis, optimization      │
│  ├─ ProjectService            → Project CRUD                     │
│  └─ TerminationService        → Termination specs lookup         │
├──────────────────────────────────────────────────────────────────┤
│        CALCULATION ENGINES (C#)                                  │
│  ├─ CableSizingEngine         → IEC 60364 calculations          │
│  └─ RoutingEngine             → Electrical path analysis         │
├──────────────────────────────────────────────────────────────────┤
│        DATA LAYER (C# + Entity Framework)                        │
│  SQLite Database (electricalproject.db)                         │
│  ├─ Cables          (historical sizing records)                  │
│  ├─ Projects        (project groupings)                          │
│  ├─ CableStandards  (lookup tables)                             │
│  └─ Migrations      (schema versioning)                          │
└──────────────────────────────────────────────────────────────────┘
```

### **Frontend ↔ Backend Communication**

```
FRONTEND (React/TypeScript)          BACKEND (C# ASP.NET Core)
─────────────────────────────────    ──────────────────────────

User uploads feeder Excel  ─POST──→  CableSizingController
                           /api/      ↓
                           cablesizing CableSizingService
                           /calculate  ↓
                                      CableSizingEngine
                           ←JSON──    (calculates FLC, size)
Display results table                 ↓
                                      SceapDbContext
                                      (saves to SQLite)
                           ←response──

User clicks "Optimize"     ─POST──→  CableRoutingController
                           /api/      ↓
                           cablerouting CableRoutingService
                                      ↓
Display path map                      RoutingEngine
                           ←JSON──    (analyzes paths)
```



---

## Language Distribution

```
┌────────────────────────────────────────────────┐
│        SCEAP2026 LANGUAGE FILE COUNTS          │
├────────────────────────────────┬───────────────┤
│ TypeScript (.ts)              │    20 files    │
│ React Components (.tsx)       │    17 files    │
│ C# (.cs) - .NET Core Backend  │   12+ files    │
│ JavaScript (.js)              │    22 files    │
│ ES Modules (.mjs)             │    21 files    │
│ HTML5                         │     1 file     │
│ CSS3 + Tailwind CSS          │     1 file     │
│ XML (CSPROJ, Config)         │    ~5 files    │
│ JSON Configuration           │    ~10 files   │
│ Markdown Documentation       │    ~50 files   │
├────────────────────────────────┼───────────────┤
│ TOTAL SOURCE CODE FILES       │  100+ files    │
└────────────────────────────────┴───────────────┘
```

---

## TypeScript: Core Business Logic

### **What is TypeScript?**
TypeScript is a superset of JavaScript that adds **static typing**. It compiles to plain JavaScript and is the primary language for all business logic in SCEAP2026.

### **Why TypeScript?**

| Reason | Benefit |
|--------|---------|
| **Type Safety** | Prevents runtime errors by catching type mismatches at compile-time |
| **Maintainability** | Code is self-documenting; developers know expected data types |
| **IDE Support** | Excellent autocomplete, refactoring, and error detection |
| **Scalability** | Easier to manage large engineering calculation codebases |
| **Industry Standard** | Widely used in modern web applications (React, Vue, Angular) |

### **Core TypeScript Files & Features**

#### 1️⃣ **Cable Sizing Engine** (`src/utils/CableSizingEngine_V2.ts`)
*Primary engineering calculations*

```typescript
// 533 lines of engineering logic
class CableSizingEngine_V2 {
  // INPUT: Cable parameters (voltage, load, length, etc.)
  sizeCable(input: CableSizingInput): CableSizingResult {
    // CALCULATIONS:
    // 1. Calculate Full Load Current (FLC) per IEC 60364
    // 2. Apply Derating Factors (K_temp, K_group, K_soil, K_depth)
    // 3. Select Conductor Size (ampacity check)
    // 4. Calculate Voltage Drop (% and voltage)
    // 5. Verify Short-Circuit Withstand (if ACB)
    // OUTPUT: Sizing results (selected size, derating, compliance)
  }
}
```

**Features Implemented**:
- ✅ Full Load Current (FLC) calculation per motor/transformer type
- ✅ Motor starting current (DOL, Star-Delta, SoftStarter, VFD)
- ✅ Derating factor calculation (4 independent K-factors)
- ✅ Conductor selection via binary search algorithm
- ✅ Voltage drop calculation (running and starting)
- ✅ Short-circuit thermal withstand check
- ✅ Parallel run calculation (when cable > 300mm²)
- ✅ User catalogue fallback mechanism

**Why TypeScript Here**:
- Complex algorithm with strict input validation
- Strict types prevent calculation errors
- Easy to test and verify against Excel formulas

---

#### 2️⃣ **Path Discovery Service** (`src/utils/pathDiscoveryService.ts`)
*Cable route analysis and path extraction*

```typescript
// 523 lines of path analysis
export interface CablePath {
  pathId: string;
  cables: CableSegment[];
  totalDistance: number;
  voltageDrop: number;
  isValid: boolean;
}

export const normalizeFeeders = (rawFeeders: any[]): CableSegment[] => {
  // Parse feeder data from Excel
  // Normalize column variations ("Voltage" vs "V" vs "voltage (V)")
  // Auto-detect and convert units (kV → V)
  // Extract segments for path analysis
}
```

**Features Implemented**:
- ✅ Flexible column naming (handles "Voltage", "V", "voltage (v)" variations)
- ✅ Unit auto-detection and conversion (kV → V)
- ✅ Feeder template generation
- ✅ Cores extraction (3C, 1C, 2C, 4C)
- ✅ Installation method mapping
- ✅ Type safety for cable segments

**Why TypeScript Here**:
- Interfaces enforce correct data shape
- Type guards prevent undefined property access
- Easy to add new feeder sources (different Excel formats)

---

#### 3️⃣ **Engineering Data Tables** (`src/utils/CableEngineeringData.ts`)
*IEC 60364 & Indian Standard cable specifications*

```typescript
// 500+ lines of engineering constants
export const AmpacityTables = {
  // Conductor ampacity @ 90°C per installation method
  Cu_11kV_3C_Air: { 16: 45, 25: 60, 35: 70, ... },
  Cu_11kV_1C_Air: { 16: 65, 25: 90, 35: 105, ... },
  Cu_0.4kV_3C_Air: { 1: 13, 1.5: 17, 2.5: 23, ... },
};

export const DeratingTables = {
  // Temperature, grouping, soil, and depth derating factors per IS 1554
  K_temp: { 45: 0.84, 50: 0.77, 55: 0.71, ... },
  K_group: { 1: 1.0, 2: 0.85, 3: 0.73, ... },
  K_depth: { 0.5: 0.88, 0.8: 0.97, 1.0: 1.0, ... },
};

export const MotorStartingMultipliers = {
  DOL: 7.2,        // Direct-on-line
  StarDelta: 2.5,  // Star-Delta
  SoftStarter: 1.5, // Soft Starter
  VFD: 1.2,        // Variable Frequency Drive
};
```

**Features Implemented**:
- ✅ Ampacity tables (IEC 60364-5-52 & IS 732)
- ✅ Derating factors (4 independent K-factors per IS 1554)
- ✅ Motor starting multipliers (4 methods)
- ✅ Voltage limits per feeder type
- ✅ Short-circuit data (copper thermal constants)
- ✅ Installation method lookup (Air, Trench, Duct, Direct)

**Why TypeScript Here**:
- Type-safe constant references
- IntelliSense for available derating factors
- Easy to update standards compliance

---

#### 4️⃣ **Formula Calculator** (`src/utils/FormulaCalculator.ts`)
*Excel formula implementations*

```typescript
// Maps Excel formulas to TypeScript code
export class FormulaCalculator {
  // Excel: =M8 / (1.732 * V8kV * K8 * E8)
  calculateFLC(powerKW: number, voltage: number, 
               powerFactor: number, efficiency: number): number {
    const sqrt3 = Math.sqrt(3);
    return (powerKW * 1000) / (sqrt3 * voltage * powerFactor * efficiency);
  }

  // Excel: =SQRT(3) * I_flc * L_km * (R*cos(φ) + X*sin(φ))
  calculateVoltageDrop(current: number, length: number, 
                       resistance: number, reactance: number, 
                       powerFactor: number, voltage: number): number {
    const sqrt3 = Math.sqrt(3);
    const phi = Math.acos(powerFactor);
    const vdrop_V = sqrt3 * current * (length / 1000) * 
                    (resistance * powerFactor + reactance * Math.sin(phi));
    return (vdrop_V / voltage) * 100;
  }
}
```

**Features Implemented**:
- ✅ FLC calculation (motor, transformer, feeder formulas)
- ✅ Voltage drop calculation (running and starting)
- ✅ Derating factor product calculation
- ✅ Short-circuit capacity calculation
- ✅ Power factor & efficiency normalization

**Why TypeScript Here**:
- Direct mapping from Excel formulas to code
- Type-checked parameter validation
- Easy to unit test against known results

---

#### 5️⃣ **Bus Path Analyzer** (`src/utils/busPathAnalyzer.ts`)
*Electrical path extraction from single-line diagrams*

```typescript
// Analyzes electrical connectivity
export interface BusBar {
  busId: string;
  voltage: number;
  equipment: EquipmentNode[];
}

export const analyzePath = (fromBus: string, toBus: string, 
                            sourceVoltage: number): CablePath => {
  // Find electrical path between two nodes
  // Calculate cumulative voltage drop
  // Identify critical points
  // Return path validity and analysis
}
```

**Features Implemented**:
- ✅ Bus topology mapping
- ✅ Path finding algorithm
- ✅ Cumulative voltage drop tracking
- ✅ Critical path identification
- ✅ Voltage regulation analysis

---

### TypeScript Compilation

```bash
# Development
npm run dev          # TypeScript + React Hot Module Reload

# Production
npm run build        # tsc + vite build (type-checks then bundles)
```

**Output**: Binary JavaScript `.js` files ready for browser execution.

---

## React + TypeScript: UI Layer

### **What is React?**
React is a JavaScript library for building user interfaces using **reusable components**. Combined with TypeScript, it provides type-safe, reactive UIs.

### **Why React + TypeScript?**

| Feature | Benefit |
|---------|---------|
| **Component-Based** | Encapsulate UI logic (button, modal, table) into reusable pieces |
| **Reactive Updates** | Automatic re-render when state changes (user input, calculations) |
| **Virtual DOM** | Efficient updates—only changed DOM elements are updated |
| **Type Safety** | Props interfaces define expected component parameters |
| **Large Ecosystem** | Hundreds of libraries for routing, charts, forms, etc. |
| **Developer Experience** | React Developer Tools extension for Chrome/Firefox |

### **React Component Architecture**

```
src/components/
├── Dashboard.tsx              ← Main page layout
├── Sidebar.tsx                ← Navigation menu
├── SizingTab.tsx              ← Upload feeders & catalogues
├── ResultsTab.tsx             ← Display cable sizing results
├── OptimizationTab.tsx        ← Path optimization
├── BusHierarchyView.tsx       ← Bus topology visualization
├── CableSizingResultRow.tsx   ← Editable result table row
├── ColumnMappingModal.tsx     ← Column name mapping dialog
├── Layout.tsx                 ← Global layout wrapper
├── ErrorBoundary.tsx          ← Error handling
├── Toast.tsx                  ← Notification messages
└── ...
```

### **Key React Components & Features**

#### 1️⃣ **SizingTab.tsx** (Upload Feeders & Catalogues)
*File upload and feeder input*

```typescript
// 700+ lines of upload logic
export const SizingTab = () => {
  // STATE MANAGEMENT:
  // - normalizedFeeders: CableSegment[]
  // - catalogueData: { [size: string]: ConductorData }
  // - uploadMode: 'feeders' | 'catalogue'

  const handleFeederUpload = (files: File[]) => {
    // 1. Read Excel file via dropzone
    // 2. Extract worksheets (parse XLSX)
    // 3. Normalize column names (via pathDiscoveryService)
    // 4. Validate data (required fields, data types)
    // 5. Store in state & context (PathContext)
    // 6. Update UI with preview table
  }

  const handleCatalogueUpload = (files: File[]) => {
    // 1. Read Excel catalogue file
    // 2. Extract conductor sizes and properties
    // 3. Parse ampacity tables (Air, Trench, Duct)
    // 4. Extract impedance (R/X @ 90°C)
    // 5. Normalize to engine-expected format
    // 6. Store in context & engine
  }

  const generateTemplate = () => {
    // Create downloadable Excel template
    // - Pre-fill headers
    // - Add example feeders
    // - Include instructions
    // - Return file via XLSX library
  }

  return (
    <div>
      <DropZone onFilesSelected={handleFeederUpload} />
      <Feeders preview={normalizedFeeders} />
      <CatalogueUpload onUpload={handleCatalogueUpload} />
    </div>
  )
}
```

**Features Implemented (React)**:
- ✅ Drag-and-drop file upload (react-dropzone)
- ✅ Excel file parsing (XLSX library)
- ✅ Data preview table (with pagination)
- ✅ Column name mapping UI (ColumnMappingModal)
- ✅ Template generation & download
- ✅ Error messages & validation feedback
- ✅ Real-time feeder count & preview

**Why React Here**:
- Dropzone UI updates state → preview re-renders
- File processing is async → React handles loading states
- Modal dialogs are reusable components
- Form inputs bind to state

---

#### 2️⃣ **ResultsTab.tsx** (Cable Sizing Results)
*Interactive results table with calculations*

```typescript
// 774 lines of results display & editing
export const ResultsTab = () => {
  // STATE:
  // - results: ExcelResultRow[]    (calculated cable sizes)
  // - globalEditMode: boolean      (allow user edits)
  // - userOverrides: { cableSize, numberOfRuns, numberOfCores }

  const calculateExcelFormulas = (cable: CableSegment, idx: number) => {
    // 1. Read feeder data from cable segment
    // 2. Call CableSizingEngine_V2 with:
    //    - Load (kW), voltage, efficiency, power factor
    //    - Length, installation method
    //    - Catalogue (if user-provided)
    // 3. Extract results:
    //    - Selected conductor size (mm²)
    //    - Number of cores (1C, 3C, etc.)
    //    - Voltage drop (% and voltage)
    //    - Ampacity compliance (YES/NO)
    //    - Cable designation string
    // 4. Format for display row
  }

  const onCellEdit = (rowIdx: number, column: string, newValue) => {
    // Allow user to override:
    // - Cable size (manual selection)
    // - Number of runs (parallel cables)
    // - Number of cores (1C/3C selection)
    // Then recalculate dependent fields
  }

  const exportResultsToExcel = () => {
    // 1. Create XLSX workbook
    // 2. Add header row (41 columns)
    // 3. Add data rows (calculated + user edits)
    // 4. Format columns (width, alignment)
    // 5. Download as .xlsx file
  }

  const exportToPDF = () => {
    // 1. Render HTML table to canvas (html2canvas)
    // 2. Create PDF document (jsPDF)
    // 3. Insert canvas image into PDF
    // 4. Download as .pdf
  }

  return (
    <table>
      {results.map((row) => (
        <ExcelResultTableRow 
          row={row}
          editable={globalEditMode}
          onEdit={onCellEdit}
        />
      ))}
      <ExportButtons 
        onExcelClick={exportResultsToExcel}
        onPdfClick={exportToPDF}
      />
    </table>
  )
}
```

**Features Implemented (React)**:
- ✅ Calculated results table (41 columns × N rows)
- ✅ Inline cell editing (double-click to edit)
- ✅ Real-time recalculation on edits
- ✅ Global edit mode toggle
- ✅ Export to Excel (XLSX format)
- ✅ Export to PDF (with formatting)
- ✅ Scrollable table with sticky headers
- ✅ Cable sizing pass/fail indicators

**Why React Here**:
- Table data is dynamic (from engine calculations)
- Edit mode triggers recalculation → re-render
- Export functions triggered by button clicks
- Multiple export formats need different implementations

---

#### 3️⃣ **OptimizationTab.tsx** (Path Optimization)
*Electrical path analysis and optimization*

```typescript
// 1000+ lines of optimization logic
export const OptimizationTab = () => {
  // Renders:
  // - Cable path map / connectivity diagram
  // - Voltage drop analysis per path
  // - Equipment loading summary
  // - Optimization recommendations

  const analyzePaths = () => {
    // 1. Extract all cable paths from normalized feeders
    // 2. Calculate voltage drop per path
    // 3. Identify critical paths (>5% VD)
    // 4. Suggest remediation (larger cables, routing changes)
    // 5. Display on interactive map
  }

  return (
    <div>
      <PathMap paths={allPaths} />
      <AnalysisSummary criticalVoltageDrops={critical} />
      <Recommendations suggestions={optimizations} />
    </div>
  )
}
```

**Features Implemented (React)**:
- ✅ Interactive electrical schematic visualization
- ✅ Path-by-path voltage drop display
- ✅ Color-coded compliance indicators
- ✅ Equipment loading analysis
- ✅ Optimization recommendations
- ✅ Tooltip hover information

---

#### 4️⃣ **BusHierarchyView.tsx** (Bus Topology)
*Visualization of electrical hierarchy*

```typescript
// Renders electrical bus structure
// - Primary substations
// - Distribution transformers
// - Feeder branches
// - Connected equipment

// TYPE: Tree view with collapsible nodes
```

---

### React Context API (Shared State)

**File**: `src/context/PathContext.tsx`

```typescript
// Global state shared across all components
export interface PathContextType {
  normalizedFeeders: CableSegment[];
  catalogueData: { [size: string]: ConductorData };
  updateFeeder: (idx: number, updates: Partial<CableSegment>) => void;
  setCatalogueData: (data: any) => void;
}

export const PathContext = createContext<PathContextType | undefined>(undefined);

// Usage in components:
const { normalizedFeeders, catalogueData } = usePathContext();
```

**Why Context API**:
- Avoids prop drilling (passing data through many levels)
- Centralized state for feeders & catalogue
- Any component can access feeder data without passing props
- Changes to state automatically trigger re-renders

---

### React Hooks

| Hook | Purpose |
|------|---------|
| `useState` | Manage local component state (editMode, loading, etc.) |
| `useEffect` | Side effects (load files, calculate on data change) |
| `useContext` | Access global PathContext data |
| `useMemo` | Memoize expensive calculations |
| `useCallback` | Memoize callbacks to prevent re-renders |

---

## JavaScript/Node.js: Build & Tools

### **What is Node.js?**
Node.js is a JavaScript runtime that runs JavaScript outside the browser (on servers and build machines). It includes npm (Node Package Manager) for managing dependencies.

### **Why Node.js in This Project?**

| Use Case | Purpose |
|----------|---------|
| **Build Tool** | Compile TypeScript → JavaScript, bundle with Vite |
| **Testing Scripts** | Run unit tests and integration tests |
| **Utility Scripts** | Parse Excel, generate test data, validate formulas |
| **Development Server** | Hot-reload during development |
| **Package Management** | Install & manage dependencies (React, XLSX, etc.) |

### **Build Tool: Vite**

**File**: `sceap-frontend/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    minify: 'terser',
  },
})
```

**What Vite Does**:
- ✅ Watches file changes → Hot-reload during dev
- ✅ Type-checks via TypeScript compiler
- ✅ Bundles JavaScript/CSS → single `dist/` folder
- ✅ Tree-shakes unused code (removes dead code)
- ✅ Minifies production build (smaller file size)

**Commands**:
```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Create production bundle
npm run preview  # Preview production build locally
```

---

### **Testing & Utility Scripts**

#### 1️⃣ **Verification Scripts** (Node.js)

**File**: `tools/integration_test_final.mjs`

```javascript
// Node.js ES Module (can run standalone)
import XLSX from 'xlsx';

// Read Excel files and validate against expected values
function testFormulas() {
  const wb = XLSX.readFile('path/to/test.xlsx');
  const data = XLSX.utils.sheet_to_json(wb.Sheets['Sheet1']);
  
  // Run 10 test cases with known results
  for (const tc of data) {
    const I_flc = calculateFLC(tc.power, tc.voltage);
    if (Math.abs(I_flc - tc.expectedFLC) < 1.0) {
      console.log('✓ TEST PASSED');
    } else {
      console.log('✗ TEST FAILED');
    }
  }
}
```

**Why JavaScript/Node.js**:
- Ships with most systems (no build step needed)
- XLSX library parses Excel files
- Easy to write shell scripts for CI/CD pipelines

---

#### 2️⃣ **Demo Data Generation** (Node.js)

**File**: `sceap-frontend/scripts/create-demo-v2.mjs`

```javascript
// Generates 100+ realistic industrial feeders
// Used for testing and demonstrations

import { createWorkbook } from 'xlsx';

function generateDemoFeeders() {
  const feeders = [];
  
  // Create realistic cables:
  // - 11kV motors (0.5 MW - 10 MW)
  // - 6.6kV feeders (100 A - 500 A)
  // - 0.4kV LV distribution
  
  return feeders;
}

// Create Excel file with template + demo data
```

**Why JavaScript Here**:
- Randomization libraries available in npm
- Easy to create bulk test data
- Can be manual (one-time) or automated (CI pipeline)

---

#### 3️⃣ **Engine Testing** (JavaScript)

**File**: `sceap-frontend/test-engine-v3.js`

```javascript
// Test CableSizingEngine with known inputs
// Verify outputs match expected values

const engine = new CableSizingEngine_V2();
const input = {
  loadType: 'Motor',
  ratedPowerKW: 2450,
  voltage: 11000,  // 11 kV
  cableLength: 475,  // 475 meters
};

const result = engine.sizeCable(input);
console.log(`Selected size: ${result.selectedConductorArea}mm²`);
console.log(`Voltage drop: ${result.voltageDropRunning_percent.toFixed(2)}%`);
```

**Why JavaScript Here**:
- Quick verification without build step
- Can be run with `node test-engine-v3.js`
- Used for debugging engine calculations

---

## HTML/CSS/Tailwind: Styling

### **HTML Structure**

**File**: `sceap-frontend/index.html`

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SCEAP2026 - Industrial Cable Sizing Platform</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

**Purpose**:
- Single `<div id="root">` → React renders into this
- Loads main.tsx (TypeScript entry point)
- Responsive viewport setup
- SEO meta tags

---

### **CSS + Tailwind**

**File**: `sceap-frontend/src/index.css`

```css
/* Global styles */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom utility classes */
.table-row-hover:hover {
  background-color: rgba(59, 130, 246, 0.05);
}

.cable-pass {
  color: #10b981;  /* Green */
}

.cable-fail {
  color: #ef4444;  /* Red */
}
```

**File**: `sceap-frontend/tailwind.config.js`

```javascript
module.exports = {
  content: ["./src/**/*.{tsx,ts}"],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',    // Blue
        success: '#10b981',    // Green
        danger: '#ef4444',     // Red
        warning: '#f59e0b',    // Orange
      }
    }
  }
}
```

### **Why Tailwind CSS?**

| Feature | Benefit |
|---------|---------|
| **Utility-First** | No CSS file switching—style inline in JSX |
| **Responsive** | `md:` `lg:` `xl:` prefixes for responsive design |
| **Tree-Shaking** | Only includes CSS used in code |
| **Dark Mode** | Built-in dark mode support |
| **Consistency** | Pre-defined color/spacing system |

### **Example: Styled Results Table**

```tsx
// In ResultsTab.tsx using Tailwind
<table className="w-full border-collapse border border-blue-300">
  <thead className="bg-blue-900 text-white sticky top-0">
    <tr>
      <th className="p-2 text-left">Cable</th>
      <th className="p-2 text-right">Size (mm²)</th>
      <th className="p-2 text-center">Status</th>
    </tr>
  </thead>
  <tbody>
    {results.map((row) => (
      <tr className="hover:bg-blue-50 border-b">
        <td className="p-2">{row.cableNumber}</td>
        <td className="p-2 text-right">{row.cableSize_sqmm}</td>
        <td className={`p-2 text-center font-bold 
          ${row.status === 'APPROVED' ? 'text-green-600' : 'text-red-600'}`}>
          {row.status}
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

---

## JSON: Configuration

### **tsconfig.json** (TypeScript Compilation Settings)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "resolveJsonModule": true,
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "noEmit": true,
    "isolatedModules": true
  }
}
```

**Key Settings**:
- `strict: true` → Enable all type checks
- `jsx: react-jsx` → Support React 18+ JSX syntax
- `noEmit: true` → Don't emit .js (only check types; Vite handles compilation)

```

### **package.json** (Dependency Management)

```json
{
  "name": "sceap-frontend",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-dropzone": "^14.3.8",
    "react-router-dom": "^7.12.0",
    "xlsx": "^0.18.5",
    "tailwindcss": "^3.3.0",
    "axios": "^1.6.0"
  }
}
```

**Key Dependencies**:
- `react` / `react-dom` → UI framework
- `xlsx` → Excel file parsing & generation
- `react-dropzone` → File upload component
- `tailwindcss` → CSS utility framework
- `axios` → HTTP client (future API calls)

---

## Markdown: Documentation

### **Purpose**
Markdown is used for all documentation across the platform. Git repositories typically render `.md` files automatically.

### **Documentation Files** (50+ files)

```
├── README.md                         ← Main documentation
├── ELECTRICAL_DESIGN_GUIDE.md        ← IEC 60364 reference
├── INDUSTRIAL_CABLE_SIZING_GUIDE.md  ← Engineering guide
├── IMPLEMENTATION_GUIDE.md           ← Setup instructions
├── API_DOCUMENTATION.md              ← API reference
├── FIX_CORES_AND_VOLTAGE_UNITS.md   ← Bug fix explanation
├── EXCEL_FORMULA_MAPPING.md          ← Formula verification
├── FINAL_INTEGRATION_TEST_REPORT.md  ← Test results
└── ... (45+ more files)
```

### **Why Markdown?**

| Feature | Benefit |
|---------|---------|
| **Plain Text** | Version-controllable (git tracks changes) |
| **Human Readable** | Easy to read raw `.md` files |
| **GitHub Support** | Renders beautifully on GitHub |
| **Searchable** | Search within documentation |
| **Link-Friendly** | Cross-reference documents |
| **Low Overhead** | No database needed |

---

## Integration & Data Flow

### **Complete Request Flow**

```
USER INTERACTION (React)
     ↓
     ├─→ Upload Excel feeder file via SizingTab.tsx
     │   ↓
     │   Read file via react-dropzone → XLSX parser
     │   ↓
     │   normalizeFeeders() [pathDiscoveryService.ts]
     │   ↓
     │   Store in PathContext (shared state)
     │   ↓
     │   Preview displayed in table
     │
     ├─→ Click "Calculate Sizing" button
     │   ↓
     │   ResultsTab.tsx → calculateExcelFormulas()
     │   ↓
     │   For each feeder:
     │     Call CableSizingEngine_V2.sizeCable()
     │     ↓
     │     (TypeScript business logic)
     │     ├─ calculateFLC()
     │     ├─ getDeratingFactor()
     │     ├─ selectConductorSize()
     │     ├─ calculateVoltageDropRunning()
     │     └─ checkShortCircuit()
     │     ↓
     │     Return CableSizingResult
     │   ↓
     │   Format results as ExcelResultRow[]
     │   ↓
     │   Update React state
     │   ↓
     │   Table re-renders with results
     │
     ├─→ User edits a cell (cable size, cores)
     │   ↓
     │   onCellEdit() updates userOverrides state
     │   ↓
     │   Recalculate dependent fields
     │   ↓
     │   Table re-renders
     │
     └─→ Click "Export to Excel"
         ↓
         exportResultsToExcel() [ResultsTab.tsx]
         ↓
         Create XLSX workbook via XLSX library
         ↓
         Browser downloads .xlsx file
```

### **Language Responsibilities**

```
┌──────────────────────────────────────────────────────────────┐
│ USER INTERFACE (React/TSX)                                   │
│ - Handle user input (file upload, cell edits, button clicks) │
│ - Display data (tables, charts, dialogs)                     │
│ - Manage UI state (edit mode, loading, errors)               │
└──────────────────────────────────────────────────────────────┘
              ↕ (parse data via XLSX)
┌──────────────────────────────────────────────────────────────┐
│ DATA PROCESSING (JavaScript/Node.js)                         │
│ - Read Excel files (XLSX library)                            │
│ - Normalize column names & data types                        │
│ - Generate templates & test data                             │
└──────────────────────────────────────────────────────────────┘
              ↕ (normalized CableSegment[])
┌──────────────────────────────────────────────────────────────┐
│ BUSINESS LOGIC (TypeScript)                                  │
│ - Cable sizing calculations                                  │
│ - Derating factor computation                                │
│ - Voltage drop analysis                                      │
│ - Formula implementations (Excel parity)                     │
└──────────────────────────────────────────────────────────────┘
              ↕ (CableSizingResult[])
┌──────────────────────────────────────────────────────────────┐
│ EXPORT / OUTPUT (TypeScript/JavaScript)                      │
│ - Format results as Excel (XLSX library)                     │
│ - Generate PDF (jsPDF + html2canvas)                         │
│ - Download files to user machine                             │
└──────────────────────────────────────────────────────────────┘
```

---

## Technology Stack Summary

## Technology Stack Summary

### **Full Platform Stack**
```
┌─────────────────────────────────────────────┐
│       FRONTEND (Client-Side)                │
├─────────────────────────────────────────────┤
│ React 18 (framework)                        │
│   ↓                                         │
│ TypeScript (type safety)                    │
│   ↓                                         │
│ Tailwind CSS (styling)                      │
│   ↓                                         │
│ Vite (build tool)                           │
│   ↓                                         │
│ Browser (Node.js during dev)                │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ COMMUNICATION (REST + JSON)                 │
├─────────────────────────────────────────────┤
│ HTTP Client: Axios                          │
│ Format: JSON                                │
│ Ports: FE(5173) → BE(5000)                 │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│       BACKEND (Server-Side)                 │
├─────────────────────────────────────────────┤
│ ASP.NET Core 8 (web framework)             │
│   ↓                                         │
│ C# (language)                               │
│   ↓                                         │
│ Entity Framework Core (ORM)                 │
│   ↓                                         │
│ SQLite (database)                           │
│   ↓                                         │
│ .NET Runtime (Windows/Linux/macOS)          │
└─────────────────────────────────────────────┘
```

### **Libraries & Dependencies**

**Frontend Dependencies**:

| Library | Version | Purpose | Language |
|---------|---------|---------|----------|
| **react** | 18.2.0 | UI framework & components | JavaScript |
| **react-dom** | 18.2.0 | Render React to DOM | JavaScript |
| **typescript** | 5.9.3 | Type safety | TypeScript |
| **react-router-dom** | 7.12.0 | Client-side routing | JavaScript |
| **tailwindcss** | 3.3.0 | CSS utility classes | CSS |
| **vite** | 5.0.0 | Build tool & dev server | JavaScript |
| **@vitejs/plugin-react** | — | Vite React plugin | JavaScript |
| **@typescript-eslint** | — | TypeScript linting | TypeScript |
| **tailwind-scrollbar** | — | Custom scrollbar styling | CSS |
| **xlsx** | 0.18.5 | Excel file parsing | JavaScript |
| **jspdf** | — | PDF generation | JavaScript |
| **html2canvas** | — | DOM to canvas rendering | JavaScript |
| **axios** | 1.6.0 | HTTP client | JavaScript |
| **recharts** | 2.8.0 | Chart visualization | JavaScript |
| **lucide-react** | — | Icon components | JavaScript |
| **react-dropzone** | 14.3.8 | File upload UI | JavaScript |

**Backend Dependencies**:

| Library | Version | Purpose | Language |
|---------|---------|---------|----------|
| **ASP.NET Core** | 8.0 | Web framework | C# |
| **Entity Framework Core** | 8.0.0 | ORM (database abstraction) | C# |
| **Microsoft.EntityFrameworkCore.Sqlite** | 8.0.0 | SQLite provider | C# |
| **Microsoft.EntityFrameworkCore.Tools** | 8.0.0 | Migration tools | C# |
| **Swashbuckle.AspNetCore** | 6.5.0 | Swagger API documentation | C# |
| **Microsoft.AspNetCore.OpenApi** | 8.0.0 | OpenAPI support | C# |



---

## Development Workflow

### **1. Setup & Installation**
```bash
# Install Node.js & npm
# Then:
cd sceap-frontend
npm install              # Download all dependencies
```

### **2. Development Server**
```bash
npm run dev
# Opens http://localhost:5173 with hot-reload
# Changes to .tsx/.ts files auto-update browser
```

### **3. Type Checking & Linting**
```bash
npm run lint             # Check TypeScript syntax
npm run build            # Full compile (no output, just checks)
```

### **4. Production Build**
```bash
npm run build            # Creates dist/ folder (optimized bundle)
npm run preview          # Test production build locally
```

### **5. Testing**
```bash
# Run integration tests
node tools/integration_test_final.mjs

# Test engine calculations
node sceap-frontend/test-engine-v3.js

# Verify Excel formula parity
npm run test:formulas
```

---

## Advanced Language Features Used

### **TypeScript Advanced Features**
- ✅ **Interfaces** (CableSizingInput, CablePath, etc.)
- ✅ **Generics** (Map<string, number>, Array<T>)
- ✅ **Union Types** ('1C' | '2C' | '3C')
- ✅ **Type Guards** (if typeof x === 'string')
- ✅ **Decorators** (for future metadata/logging)
- ✅ **Async/Await** (for file I/O)
- ✅ **Modules** (import/export ES6 syntax)

### **React Advanced Patterns**
- ✅ **Custom Hooks** (usePathContext)
- ✅ **Context API** (PathContext for global state)
- ✅ **Controlled Components** (form inputs bound to state)
- ✅ **Error Boundaries** (ErrorBoundary.tsx)
- ✅ **Code Splitting** (Vite dynamic imports)
- ✅ **Suspense** (lazy loading components)

### **JavaScript Advanced Patterns**
- ✅ **Higher-Order Functions** (map, filter, reduce)
- ✅ **Promises & Async/Await** (file operations)
- ✅ **Spread Operator** (...args, ...state)
- ✅ **Destructuring** (const { x, y } = obj)
- ✅ **Map, Set** (efficient data structures)
- ✅ **Binary Search** (conductor size selection)

---

## Performance Optimizations

| Optimization | How | Language |
|--------------|-----|----------|
| **Tree Shaking** | Remove unused code from bundle | Vite (JavaScript build) |
| **Code Splitting** | Split bundle into chunks | Vite |
| **Minification** | Compress JavaScript/CSS | Terser (JavaScript) |
| **Memoization** | Cache calculation results | TypeScript useMemo |
| **Virtual DOM** | Only update changed elements | React |
| **Lazy Loading** | Load components on-demand | React.lazy() |
| **CSS Purging** | Remove unused styles | Tailwind |

---

## Security Considerations

| Aspect | Approach |
|--------|----------|
| **Type Safety** | TypeScript prevents undefined property attacks |
| **Input Validation** | normalizeFeeders() validates all inputs |
| **XSS Prevention** | React escapes HTML by default |
| **File Upload** | Client-side XLSX parsing (no server upload) |
| **Data Privacy** | All calculations happen in browser (no cloud) |

---

## Conclusion & Summary Table

```
┌──────────────────┬─────────────┬──────────────────────┬────────────────┐
│ Language         │ File Count  │ Primary Purpose      │ Key Framework  │
├──────────────────┼─────────────┼──────────────────────┼────────────────┤
│ TypeScript       │    20 files │ Business Logic       │ Type Safety    │
│ React (TSX)      │    17 files │ User Interface       │ React 18       │
│ JavaScript       │    22 files │ Build & Tools        │ Node.js        │
│ ES Modules (MJS) │    21 files │ Testing Scripts      │ Native Modules │
│ HTML5            │     1 file  │ DOM Structure        │ Semantic HTML  │
│ CSS3 + Tailwind  │     1 file  │ Styling              │ Utility-First  │
│ JSON             │    ~10 files│ Configuration        │ Config Files   │
│ Markdown         │    ~50 files│ Documentation        │ GitHub Renders │
└──────────────────┴─────────────┴──────────────────────┴────────────────┘
```

---

## Quick Reference

### **For Cable Sizing Logic Changes:**
- **Frontend**: Edit `sceap-frontend/src/utils/CableSizingEngine_V2.ts` (TypeScript)
- **Backend**: Edit `sceap-backend/Engines/CableSizingEngine.cs` (C#)

### **For REST API Endpoints**: Edit `sceap-backend/Controllers/*.cs` (C#)

### **For UI Changes**: Edit `sceap-frontend/src/components/*.tsx` (React + TypeScript)

### **For Styling Changes**: Edit `sceap-frontend/src/index.css` and `tailwind.config.js` (CSS + Tailwind)

### **For Database Schema Changes**: 
- Modify `sceap-backend/Models/*.cs` (C# data classes)
- Then: `dotnet ef migrations add MigrationName` (C#)

### **For Test/Verification**: Create new `.js` or `.mjs` file in `tools/` or `scripts/` (JavaScript/Node.js)

### **For Documentation**: Create new `.md` file in root directory (Markdown)

---

## Complete Technology Stack With BOTH Frontend & Backend

```
┌─────────────────┬──────────────┬──────────────────────┬────────────────────┐
│ Language        │ File Count   │ Primary Purpose      │ Framework/Runtime  │
├─────────────────┼──────────────┼──────────────────────┼────────────────────┤
│ C# (.cs)        │  12+ files   │ Backend API & Logic  │ ASP.NET Core 8     │
│ TypeScript (.ts) │  20 files   │ Frontend Logic       │ Node.js / Browser  │
│ React (.tsx)    │  17 files    │ UI Components        │ React 18           │
│ JavaScript (.js) │  22 files   │ Build & Config       │ Node.js            │
│ ES Modules (.mjs)│  21 files   │ Testing Scripts      │ Node.js            │
│ HTML5           │  1 file      │ DOM Structure        │ Browser            │
│ CSS3 + Tailwind │  1 file      │ Styling              │ Browser            │
│ XML (CSPROJ)    │  1 file      │ Project Configuration│ .NET Build System  │
│ JSON            │ ~10 files    │ Configuration Files  │ Config Systems     │
│ Markdown        │ ~50 files    │ Documentation        │ GitHub Renders     │
├─────────────────┼──────────────┼──────────────────────┼────────────────────┤
│ **TOTAL**       │ **100+ files**│ **Full-Stack App**  │ **React + ASP.NET**│
└─────────────────┴──────────────┴──────────────────────┴────────────────────┘
```

---

## Architecture Diagram: Three-Tier Web Application

```
┌──────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                 │
│  (Chrome, Firefox, Edge - any modern browser)                       │
├──────────────────────────────────────────────────────────────────────┤
                                ↕ HTTP/REST
                        (Axios library)
┌──────────────────────────────────────────────────────────────────────┐
│               TIER 1: PRESENTATION LAYER (Port 5173)                 │
│                                                                       │
│  ┌─ React Components (.tsx)                                         │
│  │   └─ SizingTab, ResultsTab, OptimizationTab, etc.               │
│  │                                                                   │
│  └─ TypeScript Business Logic (.ts)                                 │
│      ├─ CableSizingEngine_V2 (FLC, derating, size selection)       │
│      ├─ pathDiscoveryService (feeder parsing)                       │
│      └─ FormulaCalculator (Excel formula implementations)           │
│                                                                       │
│  Styling: Tailwind CSS + HTML5                                      │
│  Build: Vite (TypeScript → JavaScript)                              │
│  Runtime: Browser JavaScript Engine                                 │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
                                ↕ JSON/REST
                        (HTTP POST/GET/PUT)
┌──────────────────────────────────────────────────────────────────────┐
│               TIER 2: APPLICATION LAYER (Port 5000)                  │
│                                                                       │
│  ┌─ REST API Controllers (.cs)                                      │
│  │   ├─ CableSizingController                                       │
│  │   ├─ CableRoutingController                                      │
│  │   ├─ ProjectsController                                          │
│  │   └─ TerminationController                                       │
│  │                                                                   │
│  └─ Service Layer (.cs)                                              │
│      ├─ CableSizingService (business logic)                         │
│      ├─ CableRoutingService (routing logic)                         │
│      └─ ProjectService (data operations)                             │
│                                                                       │
│  Calculation Engines (.cs)                                           │
│  ├─ CableSizingEngine (IEC 60364 calculations)                      │
│  └─ RoutingEngine (path analysis)                                   │
│                                                                       │
│  Dependency Injection (built into ASP.NET)                           │
│  Runtime: .NET 10 CLR (Windows/Linux/macOS)                         │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
                                ↕ SQL (Entity Framework)
┌──────────────────────────────────────────────────────────────────────┐
│               TIER 3: DATA LAYER                                      │
│                                                                       │
│  Database: SQLite (electricalproject.db)                             │
│                                                                       │
│  Tables:                                                              │
│  ├─ Cables           (sizing records with results)                   │
│  ├─ Projects         (project grouping)                              │
│  ├─ CableStandards   (lookup tables)                                │
│  └─ Users            (authentication/authorization)                  │
│                                                                       │
│  ORM: Entity Framework Core (.NET's Hibernate equivalent)            │
│  Migrations: C# code-first database schema versioning                │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## For Developers: How to Extend the Platform

### **Add a New Cable Type Support (Both Frontend & Backend)**

1. **Backend** (C#):
   ```csharp
   // sceap-backend/Models/Cable.cs
   public string CableType { get; set; } = "AL";  // Add aluminum cable type
   
   // sceap-backend/Engines/CableSizingEngine.cs
   private readonly Dictionary<double, double> _aluminumCapacity = new()
   {
       { 16.0, 65.0 }, { 25.0, 90.0 }, // ... add aluminum data
   };
   ```

2. **Frontend** (TypeScript):
   ```typescript
   // sceap-frontend/src/utils/CableEngineeringData.ts
   export const AmpacityTables = {
     Al_11kV_3C_Air: { 16: 35, 25: 48, ... }  // Add aluminum table
   };
   ```

3. **Database Migration** (C#):
   ```bash
   cd sceap-backend
   dotnet ef migrations add AddAluminumCableType
   dotnet ef database update
   ```

---

## FAQ: Is C# Used in This Platform?

**Q: I thought this was just a React app?**  
A: No! SCEAP2026 is a **full-stack application**:
- **Frontend**: React + TypeScript (single-page app)
- **Backend**: ASP.NET Core C# (REST API server)
- **Database**: SQLite (persistent storage)

**Q: Do I need to know C# to use the platform?**  
A: No! The frontend is 100% functional standalone. C# backend is optional for:
- Saving projects to database
- Server-side calculations
- Shared resource access
- Production deployment

**Q: Can I run just frontend without backend?**  
A: Yes! All calculations work in the browser. To enable backend:
```bash
npm run dev          # Frontend only
dotnet run          # Backend (in separate terminal)
```

**Q: What if I want to add a new calculation?**  
A: Add it in **both** places:
1. **TypeScript** (`CableSizingEngine_V2.ts`) - for browser
2. **C#** (`CableSizingEngine.cs`) - for API consistency

---

**Document Version**: 3.0 (Updated with ASP.NET Core Backend)  
**Last Updated**: February 16, 2026  
**Author**: Technical Documentation Team  
**Status**: ✅ Complete, Comprehensive, Production-Ready
