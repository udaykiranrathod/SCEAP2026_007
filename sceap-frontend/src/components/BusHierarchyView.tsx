import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import {
  buildBusHierarchy,
  discoverAllPathChains,
  validateBusStructure
} from '../utils/busPathAnalyzer';

interface BusHierarchyViewProps {
  feeders: any[];
}

export const BusHierarchyView = ({ feeders }: BusHierarchyViewProps) => {
  const [expandedBuses, setExpandedBuses] = useState<Set<string>>(new Set(['TRF-415V', 'MAIN-BUS']));
  const [showPaths, setShowPaths] = useState(false);

  if (feeders.length === 0) return null;

  try {
    // Normalize feeder data - map Excel columns to expected property names
    const normalizedFeeders = feeders
      .filter((f: any) => f['From Bus'] || f['fromBus'] || f['From bus'])
      .map((feeder: any) => ({
        serialNo: feeder['Serial No'] || feeder['serialNo'] || 0,
        cableNumber: feeder['Cable Number'] || feeder['cableNumber'] || '',
        description: feeder['Feeder Description'] || feeder['description'] || '',
        fromBus: feeder['From Bus'] || feeder['fromBus'] || '',
        toBus: feeder['To Bus'] || feeder['toBus'] || '',
        voltage: Number(feeder['Voltage (V)'] || feeder['voltage'] || 415),
        powerFactor: Number(feeder['Power Factor'] || feeder['powerFactor'] || 0.85),
        efficiency: Number(feeder['Efficiency (%)'] || feeder['efficiency'] || 95),
        deratingFactor: Number(feeder['Derating Factor'] || feeder['deratingFactor'] || 0.87),
        breakerType: feeder['Breaker Type'] || feeder['breakerType'] || '',
        loadKW: Number(feeder['Load KW'] || feeder['loadKW'] || 0),
        loadKVA: Number(feeder['Load KVA'] || feeder['loadKVA'] || 0),
        cableType: feeder['Cable Type'] || feeder['cableType'],
        installationMethod: feeder['Installation Method'] || feeder['installationMethod'],
        ambientTemp: Number(feeder['Ambient Temp (°C)'] || feeder['ambientTemp'] || 35),
        groundTemp: Number(feeder['Ground Temp (°C)'] || feeder['groundTemp'] || 25),
        length: Number(feeder['Length (m)'] || feeder['length'] || 0)
      }));

    if (normalizedFeeders.length === 0) {
      return (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
          <p className="text-yellow-300">
            No valid feeders found. Ensure your Excel file has columns: "From Bus" and "To Bus"
          </p>
        </div>
      );
    }

    // Build hierarchy and discover paths
    const hierarchy = buildBusHierarchy(normalizedFeeders);
    const pathChains = discoverAllPathChains(normalizedFeeders);
    const validation = validateBusStructure(normalizedFeeders);

  const toggleBus = (busName: string) => {
    const newExpanded = new Set(expandedBuses);
    if (newExpanded.has(busName)) {
      newExpanded.delete(busName);
    } else {
      newExpanded.add(busName);
    }
    setExpandedBuses(newExpanded);
  };

  const renderBusTree = (busName: string, level: number = 0) => {
    const busInfo = hierarchy[busName];
    if (!busInfo) return null;

    const isExpanded = expandedBuses.has(busName);
    const hasChildren = busInfo.childBuses.length > 0;

    return (
      <div key={busName}>
        <div
          className={`flex items-center py-2 px-3 rounded-lg cursor-pointer transition-colors ${
            busInfo.isTransformer
              ? 'bg-red-900/30 border-l-4 border-red-500'
              : busInfo.isPanelMain
              ? 'bg-blue-900/20 border-l-4 border-blue-500'
              : 'bg-slate-700/20 border-l-4 border-slate-500'
          } hover:bg-slate-700/40`}
          style={{ marginLeft: `${level * 24}px` }}
          onClick={() => hasChildren && toggleBus(busName)}
        >
          {hasChildren && (
            <button className="mr-2 p-1 hover:bg-slate-600/50 rounded">
              {isExpanded ? (
                <ChevronDown size={16} className="text-cyan-400" />
              ) : (
                <ChevronRight size={16} className="text-slate-400" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}

          {/* Bus icon based on type */}
          <div className="mr-3">
            {busInfo.isTransformer ? (
              <div className="w-3 h-3 rounded-full bg-red-500" />
            ) : busInfo.isPanelMain ? (
              <div className="w-3 h-3 rounded-full bg-blue-500" />
            ) : (
              <div className="w-3 h-3 rounded-full bg-cyan-400" />
            )}
          </div>

          {/* Bus name */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{busName}</p>
            <p className="text-xs text-slate-400">
              Level {busInfo.level} • {busInfo.childBuses.length} children
            </p>
          </div>

          {/* Load info */}
          {busInfo.feeders.length > 0 && (
            <div className="ml-2 px-2 py-1 bg-slate-700 rounded text-xs text-cyan-300">
              {busInfo.feeders[0]?.loadKW || 0} kW
            </div>
          )}
        </div>

        {/* Render child buses */}
        {isExpanded && hasChildren && (
          <div className="mt-1">
            {busInfo.childBuses.map(childBus => renderBusTree(childBus, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Find root buses (transformers or top-level buses)
  const rootBuses = Object.entries(hierarchy)
    .filter(([_, info]) => info.isTransformer || info.level === 0)
    .map(([name]) => name);

  return (
    <div className="space-y-6">
      {/* Validation Status */}
      {!validation.isValid && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1 min-w-0">
              <h4 className="text-yellow-200 font-medium mb-2">Structure Validation Issues:</h4>
              <ul className="text-sm text-yellow-300 space-y-1">
                {validation.issues.map((issue, i) => (
                  <li key={i}>• {issue}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {validation.isValid && (
        <div className="bg-green-900/30 border border-green-600 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
          <div>
            <p className="text-green-200 font-medium">✓ Valid Bus Structure</p>
            <p className="text-sm text-green-300">System can discover paths from all equipment to transformer</p>
          </div>
        </div>
      )}

      {/* Bus Hierarchy Tree */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap size={20} className="text-cyan-400" />
          Bus Hierarchy (SLD Structure)
        </h3>

        <div className="space-y-2">
          {rootBuses.map(bus => renderBusTree(bus))}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700 text-sm text-slate-400">
          <p>Level 0 (Red): Transformer • Level 1+ (Blue/Cyan): Panels & Equipment</p>
        </div>
      </div>

      {/* Path Chains Discovery */}
      {pathChains.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <button
            onClick={() => setShowPaths(!showPaths)}
            className="w-full text-left flex items-center justify-between p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <span className="font-semibold text-white flex items-center gap-2">
              <Zap size={18} className="text-cyan-400" />
              Discovered Cable Sizing Chains ({pathChains.length})
            </span>
            {showPaths ? (
              <ChevronDown className="text-cyan-400" />
            ) : (
              <ChevronRight className="text-slate-400" />
            )}
          </button>

          {showPaths && (
            <div className="mt-4 space-y-4">
              {pathChains.map(chain => (
                <div key={chain.chainId} className="border border-slate-700 rounded-lg p-4 bg-slate-900/50">
                  {/* Chain header */}
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-cyan-300">{chain.chainId}</h4>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        chain.status === 'valid'
                          ? 'bg-green-500/20 text-green-300'
                          : chain.status === 'incomplete'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {chain.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Chain path visualization */}
                  <div className="mb-3 p-3 bg-slate-800 rounded text-sm">
                    <p className="text-slate-300 mb-2">
                      <span className="text-cyan-400 font-semibold">{chain.startLoad}</span>
                      {' → '}
                      {chain.cables.map((c, i) => (
                        <span key={i}>
                          {c.toBus}
                          {i < chain.cables.length - 1 ? ' → ' : ''}
                        </span>
                      ))}
                    </p>
                  </div>

                  {/* Chain statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div className="bg-slate-700 p-2 rounded">
                      <p className="text-slate-400">Cables</p>
                      <p className="text-cyan-400 font-semibold">{chain.cables.length}</p>
                    </div>
                    <div className="bg-slate-700 p-2 rounded">
                      <p className="text-slate-400">Distance</p>
                      <p className="text-cyan-400 font-semibold">{chain.totalDistance.toFixed(1)}m</p>
                    </div>
                    <div className="bg-slate-700 p-2 rounded">
                      <p className="text-slate-400">Voltage</p>
                      <p className="text-cyan-400 font-semibold">{chain.totalVoltage}V</p>
                    </div>
                    <div className="bg-slate-700 p-2 rounded">
                      <p className="text-slate-400">Load</p>
                      <p className="text-cyan-400 font-semibold">{chain.cumulativeLoad.toFixed(1)}kW</p>
                    </div>
                  </div>

                  {/* Message */}
                  {chain.validationMessage && (
                    <p className="mt-2 text-xs text-slate-400">{chain.validationMessage}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary Info */}
      <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          <strong>How it works:</strong> The system analyzed your hierarchical Excel structure and automatically discovered the
          SLD-like bus connections. Each path chain represents a complete route from an equipment/load back to the
          transformer, used for calculating cable sizes considering cumulative loads and voltage drops.
        </p>
      </div>
    </div>
  );
  } catch (error) {
    console.error('Error analyzing bus hierarchy:', error);
    return (
      <div className="bg-red-900/30 border border-red-600 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1 min-w-0">
            <h4 className="text-red-200 font-medium mb-2">Error Analyzing Bus Hierarchy</h4>
            <p className="text-sm text-red-300">
              {error instanceof Error ? error.message : 'An unknown error occurred while analyzing the bus structure.'}
            </p>
            <p className="text-xs text-red-400 mt-2">
              Make sure your Excel file has the required columns: "From Bus", "To Bus", "Voltage (V)", "Load KW"
            </p>
          </div>
        </div>
      </div>
    );
  }
};

export default BusHierarchyView;
