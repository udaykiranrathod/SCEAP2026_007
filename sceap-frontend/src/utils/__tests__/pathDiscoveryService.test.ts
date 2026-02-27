import { describe, it, expect } from 'vitest';
import {
  autoDetectColumnMappings,
  normalizeFeeders,
  calculateSegmentVoltageDrop,
  discoverPathsToTransformer,
  CableSegment,
} from '../pathDiscoveryService';

// A helper to create a minimal feeder row
function makeRow(overrides: any = {}) {
  return {
    'From Bus': 'A',
    'To Bus': 'B',
    Voltage: '11 kV',
    'Load (kW)': 50,
    Length: 100,
    'Derating Factor': 0.9,
    ...overrides,
  };
}

describe('pathDiscoveryService utilities', () => {
  it('autoDetectColumnMappings recognizes common headers', () => {
    const headers = ['Cable Number', 'From Bus', 'To Bus', 'Voltage (V)', 'Load (kW)'];
    const map = autoDetectColumnMappings(headers);
    expect(map).toMatchObject({
      cableNumber: 'Cable Number',
      fromBus: 'From Bus',
      toBus: 'To Bus',
      voltage: 'Voltage (V)',
      loadKW: 'Load (kW)',
    });
  });

  it('normalizeFeeders parses row and applies defaults', () => {
    const feeders = normalizeFeeders([makeRow({ 'Cable Number': 'C1' })]);
    expect(feeders).toHaveLength(1);
    const f = feeders[0];
    expect(f.cableNumber).toBe('C1');
    expect(f.voltage).toBe(11000); // 11 kV -> 11000 V
    expect(f.loadKW).toBeGreaterThan(0);
    expect(f.length).toBe(100);
  });

  it('normalizeFeeders records unit and phase information', () => {
    const feeders = normalizeFeeders([
      makeRow({
        'Cable Number': 'C2',
        'UNIT': 'kVA',
        Phase: '1Ph'
      })
    ]);
    expect(feeders).toHaveLength(1);
    const f = feeders[0];
    expect(f.unit).toBe('kVA');
    expect(f.phase).toBe('1Ø');
  });

  it('calculateSegmentVoltageDrop returns zero when missing values', () => {
    const seg = {} as CableSegment;
    expect(calculateSegmentVoltageDrop(seg, 10)).toBe(0);
  });

  it('calculateSegmentVoltageDrop gives positive drop for realistic data', () => {
    const seg: CableSegment = {
      serialNo: 1,
      cableNumber: 'C1',
      feederDescription: '',
      fromBus: 'A',
      toBus: 'B',
      voltage: 11000,
      loadKW: 100,
      length: 50,
      deratingFactor: 0.87,
    };
    const drop = calculateSegmentVoltageDrop(seg, 0.5);
    expect(drop).toBeGreaterThan(0);
  });

  it('discoverPathsToTransformer groups parallel cables', () => {
    const cables: CableSegment[] = [
      { serialNo: 1, cableNumber: 'C1', feederDescription: '', fromBus: 'A', toBus: 'B', voltage: 400, loadKW: 10, length: 10, deratingFactor:0.9 },
      { serialNo: 2, cableNumber: 'C2', feederDescription: '', fromBus: 'A', toBus: 'B', voltage: 400, loadKW: 10, length: 10, deratingFactor:0.9 },
    ];
    const paths = discoverPathsToTransformer(cables);
    // Should collapse into 1 path with parallelCount 2
    expect(paths.length).toBeGreaterThan(0);
    const p = paths[0];
    const hasParallel = p.cables.some(c => c.parallelCount && c.parallelCount >= 2);
    expect(hasParallel).toBe(true);
  });
});
