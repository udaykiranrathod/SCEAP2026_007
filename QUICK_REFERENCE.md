# ⚡ Quick Reference Guide

## 🚀 What's Running Now

### Backend
- **URL**: `http://localhost:5000`
- **Status**: ✅ Running (.NET 8 API)
- **Port**: 5000

### Frontend
- **URL**: `http://localhost:5174`
- **Status**: ✅ Running (React 18 + Vite)
- **Port**: 5174 (or 5175 if 5174 taken)

---

## 📁 Key Files

### Core Service (Most Important)
```
src/utils/pathDiscoveryService.ts (408 lines)
├─ normalizeFeeders()              ← Excel → Standard format
├─ analyzeAllPaths()               ← Main entry point
├─ discoverPathsToTransformer()    ← BFS algorithm
├─ calculateSegmentVoltageDrop()   ← V-drop math
└─ validateBusStructure()          ← IEC compliance
```

### State Management
```
src/context/PathContext.tsx (44 lines)
├─ PathProvider                    ← Wraps App
├─ usePathContext()                ← Hook for any component
└─ pathAnalysis state              ← Shared data
```

### UI Components
```
src/components/
├─ SizingTab.tsx                   ← Upload Excel, show summary
├─ OptimizationTab.tsx             ← Display paths, select cables
├─ BusHierarchyView.tsx            ← (Optional visualization)
└─ LoadingOverlay.tsx              ← Professional loading UI
```

### Configuration
```
src/App.tsx                        ← Wrapped with <PathProvider>
```

---

## 🔄 How to Use

### For Users
1. **Go to Sizing Tab**
   - Click "Download Template"
   - Fill with your feeder data
   - Upload file

2. **Go to Optimization Tab**
   - See all discovered paths
   - Review voltage drop status
   - Select cable sizes (next phase)

### For Developers

#### Run Locally
```bash
# Terminal 1: Backend
cd sceap-backend
dotnet run

# Terminal 2: Frontend
cd sceap-frontend
npm run dev
```

#### Test Path Discovery
```typescript
import { analyzeAllPaths, normalizeFeeders } from '@/utils/pathDiscoveryService';

// Load your Excel feeders
const feeders = [...];

// Normalize column names
const normalized = normalizeFeeders(feeders);

// Discover paths
const result = analyzeAllPaths(normalized);
console.log(result);
// {
//   totalPaths: 10,
//   validPaths: 8,
//   invalidPaths: 2,
//   paths: [...],
//   averageVoltageDrop: 3.2
// }
```

#### Use Path Context
```typescript
import { usePathContext } from '@/context/PathContext';

const MyComponent = () => {
  const { pathAnalysis, setPathAnalysis } = usePathContext();
  
  return (
    <div>
      <p>Found {pathAnalysis?.totalPaths || 0} paths</p>
    </div>
  );
};
```

---

## 📊 Data Structures

### CableSegment
```typescript
{
  serialNo: number;
  cableNumber: string;
  fromBus: string;
  toBus: string;
  voltage: number;
  loadKW: number;
  length: number;
  deratingFactor: number;
  // ... (optional fields)
}
```

### CablePath
```typescript
{
  pathId: string;
  startEquipment: string;
  endTransformer: string;
  cables: CableSegment[];
  totalDistance: number;
  totalVoltage: number;
  cumulativeLoad: number;
  voltageDrop: number;
  voltageDropPercent: number;
  isValid: boolean;  // ≤ 5%
  validationMessage: string;
}
```

### PathAnalysisResult
```typescript
{
  totalPaths: number;
  validPaths: number;
  invalidPaths: number;
  paths: CablePath[];
  averageVoltageDrop: number;
  criticalPaths: CablePath[];
}
```

---

## 🔍 Troubleshooting

### Paths Not Discovered
```
❓ Problem: Upload Excel but no paths appear
✅ Check:
   1. Excel has "From Bus" and "To Bus" columns
   2. Bus names are consistent (MOTOR-1, not motor1)
   3. At least one bus contains "TRF" or "TRANSFORMER"
   4. No special characters in bus names
```

### Voltage Drop Incorrect
```
❓ Problem: V-drop calculation doesn't match manual calc
✅ Check:
   1. Verify Load KW values (0 for panels is OK)
   2. Verify Length (m) values in Excel
   3. Verify Voltage (V) values match system
   4. Check Derating Factor values
   5. Ensure cable resistance values in system
```

### Frontend Not Loading
```
❓ Problem: White screen when opening http://localhost:5174
✅ Fix:
   1. Check npm process: ps aux | grep npm
   2. Check port: lsof -i :5174
   3. Rebuild: cd sceap-frontend && npm run build
   4. Check errors: npm run dev (look at terminal)
```

### Backend Not Responding
```
❓ Problem: API calls fail
✅ Fix:
   1. Check dotnet process: ps aux | grep dotnet
   2. Check port: netstat -tlnp | grep 5000
   3. Restart: pkill dotnet, then dotnet run
   4. Check logs for errors
```

---

## 📈 Performance

### Typical Numbers
```
Excel rows          | Processing time | Paths found
──────────────────────────────────────────────────
10-50 feeders       | <100ms          | 5-20 paths
100-500 feeders     | 100-500ms       | 20-100 paths
1000+ feeders       | 500ms-2s        | 100+ paths
```

### Optimization Tips
```
✓ Keep Excel clean (no merged cells)
✓ Use consistent column names
✓ Remove completely empty rows
✓ Keep cable numbers unique
✓ Use systematic bus naming
```

---

## 🎯 Next Steps

### Immediate (This Sprint)
- [ ] Test with actual project data
- [ ] Verify voltage drop calculations
- [ ] Get user feedback on UI

### Short-term (Next Sprint)
- [ ] Cable size selection UI
- [ ] Recommendation algorithm
- [ ] Results export to Excel

### Medium-term (2-3 Sprints)
- [ ] Cost analysis
- [ ] Load balancing
- [ ] Project database
- [ ] Web-based project management

### Long-term (Roadmap)
- [ ] Backend integration
- [ ] Multi-user collaboration
- [ ] Load flow analysis
- [ ] Harmonics calculation
- [ ] Mobile app

---

## 📚 Documentation Map

| Document | Purpose | Audience |
|----------|---------|----------|
| `DECISION_SUMMARY.md` | Why this architecture | Decision makers |
| `ARCHITECTURE_MAP.md` | How the system works | Developers |
| `ARCHITECTURE_DECISIONS.md` | Design rationale | Architects |
| `IMPLEMENTATION_GUIDE.md` | How to use platform | Engineers |
| `IMPLEMENTATION_SUMMARY.md` | What was built | Team leads |
| `README.md` (main) | Project overview | Everyone |

---

## 💻 Command Reference

### Frontend
```bash
# Start dev server
cd sceap-frontend && npm run dev

# Build for production
npm run build

# Run tests (when added)
npm run test

# Check for errors
npm run lint
```

### Backend
```bash
# Run in debug
cd sceap-backend && dotnet run

# Run in release mode
dotnet run --configuration Release

# Run tests
dotnet test

# Build only
dotnet build
```

### Git
```bash
# View commit history
git log --oneline | head -20

# Check status
git status

# Stash changes
git stash

# Create new branch
git checkout -b feature/my-feature
```

---

## 🔑 Key Concepts

### Path Discovery
**What**: Finding all cable chains from loads back to transformer
**Why**: Understand system topology without SLD diagrams
**How**: BFS algorithm on feeder graph

### Voltage Drop
**What**: Voltage decrease through cables due to resistance
**Formula**: $V_{drop} = \frac{√3 × I × R × L}{1000}$
**Limit**: ≤ 5% per IEC 60364-5-52
**Impact**: Affects cable size selection

### Bus Hierarchy
**What**: Transformer → Panels → Loads structure
**Why**: Determines how paths are discovered
**Example**: TRF-415V → PMCC-1 → MCC-1 → MOTOR-1

### Cable Sizing
**What**: Selecting cable cross-section (mm²) for current capacity
**Why**: Too small = voltage drop too high / Too large = cost wasted
**Future**: Algorithm to find optimal size

---

## 🎓 Code Examples

### Discover Paths from Excel
```typescript
import { normalizeFeeders, analyzeAllPaths } from '@/utils/pathDiscoveryService';

// Your Excel data
const rawFeeders = [
  { 'From Bus': 'TRF-415V', 'To Bus': 'MAIN', 'Load KW': 0, ... },
  { 'From Bus': 'MAIN', 'To Bus': 'PMCC-1', 'Load KW': 125, ... },
  // ...
];

// Normalize and analyze
const normalized = normalizeFeeders(rawFeeders);
const result = analyzeAllPaths(normalized);

console.log(`Found ${result.validPaths}/${result.totalPaths} valid paths`);
result.paths.forEach(path => {
  console.log(`${path.pathId}: ${path.startEquipment} → ${path.endTransformer}`);
  console.log(`  V-drop: ${path.voltageDropPercent.toFixed(2)}%`);
});
```

### Use Path Context
```typescript
import { usePathContext } from '@/context/PathContext';

const Dashboard = () => {
  const { pathAnalysis } = usePathContext();
  
  if (!pathAnalysis) return <p>No paths discovered yet</p>;
  
  return (
    <div>
      <h2>Cable Analysis</h2>
      <p>Total paths: {pathAnalysis.totalPaths}</p>
      <p>Valid: {pathAnalysis.validPaths} / Invalid: {pathAnalysis.invalidPaths}</p>
      <p>Average V-drop: {pathAnalysis.averageVoltageDrop.toFixed(2)}%</p>
    </div>
  );
};
```

---

## 🏆 Success Criteria

✅ **Path Discovery**
- [ ] Discovers all loads correctly
- [ ] Traces paths correctly
- [ ] Handles multiple paths per load

✅ **Voltage Drop**
- [ ] Calculations match manual verification
- [ ] Within 5% tolerance
- [ ] Flags invalid paths

✅ **User Experience**
- [ ] Clear workflow
- [ ] Good feedback
- [ ] Mobile friendly

✅ **Code Quality**
- [ ] Well documented
- [ ] Testable
- [ ] Maintainable
- [ ] Scalable

✅ **Integration**
- [ ] Both pages access same data
- [ ] No data inconsistency
- [ ] Smooth user experience

---

## 📞 Support

### Issues?
1. Check troubleshooting section above
2. Review architecture documentation
3. Check code comments
4. Git log to see what changed

### Questions?
1. Read DECISION_SUMMARY.md
2. Read ARCHITECTURE_MAP.md
3. Review inline code comments
4. Check commit history

### Improvements?
1. Document your improvement
2. Create feature branch
3. Test thoroughly
4. Submit pull request

---

**You're all set! Start testing the platform with your actual project data! 🚀**
