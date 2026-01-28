/**
 * Bus Path Analyzer - Hierarchical SLD Path Discovery
 * Converts hierarchical Excel structure into parent-child relationships
 */

export interface BusConnection {
  serialNo: number;
  cableNumber: string;
  description: string;
  fromBus: string; // Child bus (load side)
  toBus: string;   // Parent bus (source side)
  voltage: number;
  powerFactor: number;
  efficiency: number;
  deratingFactor: number;
  breakerType: string;
  loadKW: number;
  loadKVA: number;
  cableType?: string;
  installationMethod?: string;
  ambientTemp?: number;
  groundTemp?: number;
  length: number;
  isPanel?: boolean; // True if this is a panel/bus itself
  panelName?: string; // Name of the panel
  parentPanel?: string; // Panel this feeder belongs to
  hierarchyLevel?: number; // 0 = transformer, increases downward
}

export interface PathChain {
  chainId: string;
  startLoad: string; // Equipment/Motor name
  startPanel: string;
  endTransformer: string; // Main transformer
  cables: BusConnection[]; // Cables in the chain from start to transformer
  totalDistance: number;
  totalVoltage: number;
  cumulativeLoad: number;
  status: 'valid' | 'incomplete' | 'error';
  validationMessage: string;
}

export interface BusHierarchy {
  [busName: string]: {
    name: string;
    level: number; // 0 = transformer (top), increases downward
    parentBus?: string;
    childBuses: string[];
    feeders: BusConnection[];
    isTransformer: boolean;
    isPanelMain: boolean;
  };
}

/**
 * Parse hierarchical Excel structure
 * Structure:
 * PANEL NAME (bold marker or "Panel:" prefix)
 * Equipment/Feeder 1
 * Equipment/Feeder 2
 * [Empty row or gap]
 * PANEL NAME 2
 * Equipment/Feeder A
 * ...
 */
export const parseHierarchicalFeederList = (
  rawData: any[]
): BusConnection[] => {
  const processed: BusConnection[] = [];
  let currentPanel = 'MAIN';
  let panelSequence: string[] = ['MAIN'];

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];

    // Skip empty rows
    if (!row || !Object.values(row).some(v => v !== null && v !== undefined && v !== '')) {
      continue;
    }

    // Check if this is a panel header
    const isPanelHeader = isPanelNameRow(row);

    if (isPanelHeader) {
      currentPanel = extractPanelName(row);
      panelSequence.push(currentPanel);
    } else {
      // This is a feeder/equipment under current panel
      const feeder = row as BusConnection;

      if (feeder.fromBus && feeder.toBus) {
        feeder.parentPanel = currentPanel;
        feeder.panelName = currentPanel;

        // Infer hierarchy based on position
        feeder.hierarchyLevel = panelSequence.indexOf(currentPanel);

        processed.push(feeder);
      }
    }
  }

  return processed;
};

/**
 * Detect if a row is a panel header
 * Indicators: "Panel:", all caps, bold marker, or just panel name
 */
const isPanelNameRow = (row: any): boolean => {
  const description = row['Feeder Description'] || row['Description'] || row['Panel'];
  if (!description) return false;

  const str = String(description).trim();

  // Check for panel markers
  if (str.toUpperCase().includes('PANEL') || 
      str.startsWith('**') || 
      str.endsWith('**') ||
      str.includes('PMCC') ||
      str.includes('MCC') ||
      str.includes('Main Switchgear') ||
      str.includes('Transformer')) {
    return true;
  }

  // If row has description but no load values, likely a panel header
  const hasLoads = row['Load KW'] || row['Load KVA'];
  return !hasLoads && str.length < 100;
};

/**
 * Extract panel name from row
 */
const extractPanelName = (row: any): string => {
  let panelName = row['Feeder Description'] || row['Description'] || row['Panel'];
  panelName = String(panelName).trim().replace(/\*\*/g, '').replace('Panel:', '').trim();
  return panelName || 'UNKNOWN_PANEL';
};

/**
 * Build hierarchical bus structure from feeder list
 */
export const buildBusHierarchy = (feeders: BusConnection[]): BusHierarchy => {
  const hierarchy: BusHierarchy = {};

  // Initialize all buses mentioned
  const allBuses = new Set<string>();
  feeders.forEach(f => {
    allBuses.add(f.fromBus);
    allBuses.add(f.toBus);
  });

  // Create hierarchy entries
  allBuses.forEach(bus => {
    if (!hierarchy[bus]) {
      hierarchy[bus] = {
        name: bus,
        level: 0,
        childBuses: [],
        feeders: [],
        isTransformer: bus.toUpperCase().includes('TRF') || bus.toUpperCase().includes('TRANSFORMER'),
        isPanelMain: bus.toUpperCase().includes('PMCC') || bus.toUpperCase().includes('MCC')
      };
    }
  });

  // Connect feeders to buses
  feeders.forEach(feeder => {
    if (hierarchy[feeder.fromBus]) {
      hierarchy[feeder.fromBus].feeders.push(feeder);
    }
    if (hierarchy[feeder.toBus]) {
      hierarchy[feeder.toBus].childBuses.push(feeder.fromBus);
    }
  });

  // Calculate hierarchy levels (bottom-up)
  calculateHierarchyLevels(hierarchy);

  return hierarchy;
};

/**
 * Calculate hierarchy levels using breadth-first approach
 */
const calculateHierarchyLevels = (hierarchy: BusHierarchy): void => {
  // Find transformers (level 0)
  const transformers = Object.values(hierarchy).filter(h => h.isTransformer);

  if (transformers.length === 0) {
    // If no explicit transformer, use the topmost bus
    const busesWithNoParent = Object.values(hierarchy).filter(
      h => !Object.values(hierarchy).some(other => other.childBuses.includes(h.name))
    );
    busesWithNoParent.forEach((h, i) => {
      h.level = 0;
      h.isTransformer = i === 0;
    });
  } else {
    transformers.forEach(t => (t.level = 0));
  }

  // BFS to assign levels to all other buses
  const queue: string[] = transformers.map(t => t.name);
  const visited = new Set<string>(queue);

  while (queue.length > 0) {
    const currentBus = queue.shift()!;
    const currentLevel = hierarchy[currentBus].level;

    // Find all buses that feed from this bus
    Object.values(hierarchy).forEach(h => {
      if (
        h.childBuses.includes(currentBus) &&
        !visited.has(h.name)
      ) {
        h.level = currentLevel + 1;
        visited.add(h.name);
        queue.push(h.name);
      }
    });
  }
};

/**
 * Discover complete path from any equipment to transformer
 */
export const discoverPathToTransformer = (
  startBus: string,
  hierarchy: BusHierarchy
): BusConnection[] => {
  const path: BusConnection[] = [];
  let currentBus = startBus;
  const visited = new Set<string>();
  const maxIterations = 50; // Prevent infinite loops
  let iterations = 0;

  while (iterations < maxIterations && currentBus) {
    // Prevent revisiting
    if (visited.has(currentBus)) break;
    visited.add(currentBus);

    const busInfo = hierarchy[currentBus];
    if (!busInfo) break;

    // Find feeder that connects this bus to parent
    const feeders = Object.values(hierarchy)
      .flatMap(b => b.feeders)
      .filter(f => f.fromBus === currentBus);

    if (feeders.length > 0) {
      path.push(feeders[0]); // Take first feeder if multiple
      currentBus = feeders[0].toBus;
    } else {
      break; // No more feeders, reached top
    }

    iterations++;
  }

  return path;
};

/**
 * Discover all complete chains from end equipment to transformer
 */
export const discoverAllPathChains = (
  feeders: BusConnection[]
): PathChain[] => {
  const hierarchy = buildBusHierarchy(feeders);
  const chains: PathChain[] = [];
  const processedBuses = new Set<string>();

  // Identify all end loads (buses with no child feeders)
  Object.entries(hierarchy).forEach(([busName, busInfo]) => {
    if (busInfo.childBuses.length === 0 && !busInfo.isTransformer && !processedBuses.has(busName)) {
      // This is an end load/equipment
      const path = discoverPathToTransformer(busName, hierarchy);

      if (path.length > 0) {
        const chainId = `CHAIN_${chains.length + 1}`;
        const totalDistance = path.reduce((sum, c) => sum + (c.length || 0), 0);
        const totalVoltage = path[0]?.voltage || 415;
        const cumulativeLoad = path[0]?.loadKW || 0;

        const isComplete = path[path.length - 1]?.toBus?.toUpperCase().includes('TRF');

        chains.push({
          chainId,
          startLoad: busName,
          startPanel: path[0]?.parentPanel || 'UNKNOWN',
          endTransformer: path[path.length - 1]?.toBus || 'TRF',
          cables: path,
          totalDistance,
          totalVoltage,
          cumulativeLoad,
          status: isComplete ? 'valid' : 'incomplete',
          validationMessage: isComplete
            ? `Valid chain from ${busName} to transformer`
            : `Incomplete chain - path broken at ${path[path.length - 1]?.toBus}`
        });

        processedBuses.add(busName);
      }
    }
  });

  return chains;
};

/**
 * Validate bus structure and identify issues
 */
export const validateBusStructure = (
  feeders: BusConnection[]
): { isValid: boolean; issues: string[] } => {
  const issues: string[] = [];
  const buses = new Set<string>();
  const feedersFromBus = new Map<string, number>();

  feeders.forEach(f => {
    buses.add(f.fromBus);
    buses.add(f.toBus);
    feedersFromBus.set(f.fromBus, (feedersFromBus.get(f.fromBus) || 0) + 1);
  });

  // Check for cycles
  const hasCycle = detectCycles(feeders);
  if (hasCycle) {
    issues.push('⚠️ Circular bus references detected - may cause infinite loops in path discovery');
  }

  // Check for isolated buses
  const connectedBuses = new Set<string>();
  feeders.forEach(f => {
    connectedBuses.add(f.fromBus);
    connectedBuses.add(f.toBus);
  });

  buses.forEach(bus => {
    if (!connectedBuses.has(bus)) {
      issues.push(`⚠️ Isolated bus: ${bus} - not connected to any feeder`);
    }
  });

  // Check for transformer
  const hasTransformer = Array.from(buses).some(b => b.toUpperCase().includes('TRF'));
  if (!hasTransformer) {
    issues.push('⚠️ No transformer found - ensure at least one bus contains "TRF" or "TRANSFORMER"');
  }

  return {
    isValid: issues.length === 0,
    issues
  };
};

/**
 * Detect cycles in bus structure
 */
const detectCycles = (feeders: BusConnection[]): boolean => {
  const graph = new Map<string, string[]>();

  feeders.forEach(f => {
    if (!graph.has(f.fromBus)) {
      graph.set(f.fromBus, []);
    }
    graph.get(f.fromBus)!.push(f.toBus);
  });

  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const hasCycleDFS = (node: string): boolean => {
    visited.add(node);
    recursionStack.add(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycleDFS(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(node);
    return false;
  };

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      if (hasCycleDFS(node)) return true;
    }
  }

  return false;
};

export default {
  parseHierarchicalFeederList,
  buildBusHierarchy,
  discoverPathToTransformer,
  discoverAllPathChains,
  validateBusStructure
};
