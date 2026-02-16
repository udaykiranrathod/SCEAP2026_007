# CHANGELOG - Session: Cores by Voltage, Path Discovery Improvements, Parallel-Run Logic

## [2026-02-16] Fix: Voltage Parsing, Cores by Voltage, Path Discovery

### Added
- **Automated Verification Scripts**:
  - `sceap-frontend/scripts/verify_sizing.ts`: Verifies voltage parsing, cores determination by voltage standard, path discovery, and load type mapping
  - `sceap-frontend/scripts/upload_check.ts`: Simulates Excel upload workflow (normalize + discover paths)
- **Enhanced Documentation**:
  - `CORES_VOLTAGE_BASED_DETERMINATION.md`: Comprehensive guide on why cores must be voltage-derived (IEC 60502 / IS 732)
  - This changelog

### Fixed
1. **Voltage Parsing** (`pathDiscoveryService.ts`)
   - Robust numeric extraction from strings like "11 kV", "6.6kV", "415V"
   - Handles both unit formats: "kV" trigger auto-conversion to V
   - Fallback heuristic for plain numeric values: if <100 and >0, assume kV
   - **Impact**: LV/MV voltages no longer incorrectly default to 415V

2. **Cores Determination** (Results Tab)
   - Removed user-specified cores reliance; cores now ALWAYS from voltage standard
   - Rule: `voltage >= 1000V` → 1C (MV per IEC 60502); else 3C (LV per IS 732)
   - Warning logged if user Excel had cores column (ignored during sizing)
   - **Impact**: All outputs standards-compliant; no physically impossible combinations

3. **Load Type Mapping** (`ResultsTab.tsx`)
   - Before: Forced all non-Transformer rows to Motor ('M')
   - After: Maps Transformer/Feeder → 'F'; Motor/Pump/Fan/Compressor/Heater → 'M'
   - **Impact**: Results table accurately reflects feeder load types

4. **Path Discovery** (`pathDiscoveryService.ts`)
   - Before: Required a single transformer (top-level bus); failed if none identified
   - After: Treats dead-ends (no parent cable) as roots; each path independently traced
   - Enables discovery of all hierarchical paths (e.g., MAIN-DISTRIBUTION → TRF-MAIN)
   - Updated `endTransformer` to be path-derived (last cable's toBus) instead of global assumption
   - **Impact**: Optimization view now shows all equipment paths without requiring explicit transformer node

5. **Parallel-Run Logic** (`CableSizingEngine_V2.ts`)
   - Before: Ad-hoc >300mm² → split into 2 runs
   - After: Standard CEILING(selectedSize / 240) → numberOfRuns; ensures per-run size valid in catalog
   - Attempts up to 4 runs if catalog lookup fails; falls back safely
   - **Impact**: Correct parallel-run selection per integration spec; Results and Optimization show consistent runs

### Changed
- **Frontend Build**: Rebuilt successfully (`2580 modules transformed`)
- **Integration Test**: Passes all checks (build, capabilities, test scenarios ready)
- **Test Dataset**: `TEST_150_FEEDERS_DIVERSE.xlsx` created and verified (5 sample feeders, ready for upload)

### Verified
- ✓ Voltage parsing works for "11 kV", "6600", "415V" formats
- ✓ Cores correctly determined by voltage standard (sample: 6.6kV→1C, 415V→3C)
- ✓ Paths discovered correctly (5 feeders → 5 paths traced to leaves, no transformer assumption)
- ✓ Load types mapped correctly (Motor, Pump, Fan, Compressor, Heater → 'M'; Feeder, Transformer → 'F')
- ✓ Parallel-run logic uses CEILING(size/240) and validates catalog entries

### Testing
Run verification:
```bash
cd sceap-frontend
npx ts-node scripts/verify_sizing.ts
```

Simulate upload:
```bash
cd sceap-frontend
npx ts-node scripts/upload_check.ts
```

Manual testing at `http://localhost:4173/`:
1. Upload `TEST_150_FEEDERS_DIVERSE.xlsx` via UI
2. Check Results tab: verify cores by voltage, load types, number of runs
3. Check Optimization tab: verify all paths discovered (including MAIN-BUS → TR-1)
4. Export results to Excel and confirm designations

### Next Steps
- Merge PR #1 (fix/cores-runs-paths) to main after manual UI verification
- Update user documentation with new voltage-based cores rule
- Consider extended test suite (150+ feeders) for performance validation
