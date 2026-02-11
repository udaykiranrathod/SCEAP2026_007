import { useState, useEffect } from 'react';
import { Download, AlertCircle, Edit2, RotateCcw, Eye, EyeOff } from 'lucide-react';
import * as XLSX from 'xlsx';
import { usePathContext } from '../context/PathContext';
import { CableSegment } from '../utils/pathDiscoveryService';
import CableSizingEngine_V2, { CableSizingInput } from '../utils/CableSizingEngine_V2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface EditableCellProps {
  value: number | string;
  type: 'number' | 'text' | 'select';
  editable: boolean;
  onChange: (value: any) => void;
  className?: string;
  options?: { label: string; value: string | number }[];
  precision?: number;
}

const EditableCell = ({ value, type, editable, onChange, className = '', options = [], precision }: EditableCellProps) => {
  if (!editable) {
    if (type === 'number' && precision !== undefined) {
      return <span className={className}>{Number(value).toFixed(precision)}</span>;
    }
    return <span className={className}>{value || '-'}</span>;
  }

  const handleChange = (e: any) => {
    const newValue = e.target.value;
    if (type === 'number') {
      onChange(Number(newValue) || value);
    } else {
      onChange(newValue);
    }
  };

  const baseClassName = `w-full px-1 py-0.5 bg-blue-900/40 border border-blue-500 text-slate-100 text-xs rounded focus:outline-none focus:ring-2 focus:ring-blue-400`;

  if (type === 'select' && options.length > 0) {
    return (
      <select value={String(value)} onChange={handleChange} className={`${baseClassName} cursor-pointer`}>
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={type}
      value={value}
      onChange={handleChange}
      className={baseClassName}
      step={type === 'number' ? '0.01' : undefined}
    />
  );
};

interface ExcelResultRow {
  slNo: number;
  fromBus: string;
  toBus: string;
  cableNumber: string;
  description: string;
  feederType: 'M' | 'F';
  ratedPowerKW: number;
  ratedVoltageKV: number;
  powerFactor: number;
  efficiency: number;
  flc_A: number;
  motorStartingCurrent_A: number;
  numberOfCores: '1C' | '2C' | '3C' | '4C' | 'any';
  cableSize_sqmm: number;
  cableCurrentRating_A: number;
  numberOfRuns: number;
  derated_currentCarryingCapacity_A: number;
  capacityCheck: 'YES' | 'NO';
  cableLength_m: number;
  runningVoltageDrop_percent: number;
  runningVoltageDropCheck: 'YES' | 'NO';
  startingVoltageDip_percent: number;
  startingVoltageDropCheck: 'YES' | 'NO' | 'NA';
  cableDesignation: string;
  remarks: string;
  status: 'APPROVED' | 'WARNING' | 'FAILED';
}

interface ColumnVisibility {
  [key: string]: boolean;
}

const CORE_OPTIONS = [
  { label: '1C', value: '1C' },
  { label: '2C', value: '2C' },
  { label: '3C', value: '3C' },
  { label: '4C', value: '4C' },
];

const FEEDER_TYPE_OPTIONS = [
  { label: 'Motor (M)', value: 'M' },
  { label: 'Feeder (F)', value: 'F' },
];

const calculateExcelFormulas = (cable: CableSegment, _idx: number, feederType: 'M' | 'F', userCatalogue?: any): Partial<ExcelResultRow> => {
  try {
    const pf = cable.powerFactor ?? 0.85;
    const eff = cable.efficiency ?? 0.95;
    const flc_A = (cable.loadKW) / (1.732 * (cable.voltage / 1000) * pf * eff);
    
    const motorStartingCurrent_A = feederType === 'M' ? 7.2 * flc_A : 0;

    const engine = new CableSizingEngine_V2(userCatalogue);
    const engineInput: CableSizingInput = {
      loadType: feederType === 'M' ? 'Motor' : 'Feeder',
      ratedPowerKW: cable.loadKW,
      voltage: cable.voltage,
      phase: '3Ø',
      efficiency: cable.efficiency || 0.95,
      powerFactor: cable.powerFactor || 0.85,
      conductorMaterial: 'Cu',
      insulation: 'XLPE',
      numberOfCores: cable.numberOfCores as '1C' | '2C' | '3C' | '4C',
      installationMethod: (cable.installationMethod || 'Air') as 'Air' | 'Trench' | 'Duct',
      cableLength: cable.length || 0,
      ambientTemp: 40,
      numberOfLoadedCircuits: 1,
    };

    const engineResult = engine.sizeCable(engineInput);
    const derated_currentCapacity = (engineResult.catalogRatingPerRun || 387) * (engineResult.deratingFactor || 0.876);
    const numberOfRuns = engineResult.numberOfRuns || 1;
    const capacityCheck = derated_currentCapacity >= flc_A ? 'YES' : 'NO';

    const runningVoltageDrop_percent = (engineResult.voltageDropRunning_percent || 0) * 100;
    const runningVoltageDropCheck = runningVoltageDrop_percent <= 3 ? 'YES' : 'NO';

    const startingVoltageDrop_percent = feederType === 'M' ? (engineResult.voltageDropStarting_percent || 0) * 100 : 0;
    const startingVoltageDropCheck = feederType === 'M' ? (startingVoltageDrop_percent <= 10 ? 'YES' : 'NO') : 'NA';

    const cableDesignation = `${numberOfRuns}R X ${cable.voltage/1000}kV X ${cable.numberOfCores} X ${engineResult.selectedConductorArea} Sqmm`;

    let status: 'APPROVED' | 'WARNING' | 'FAILED' = 'APPROVED';
    if (capacityCheck === 'NO' || runningVoltageDropCheck === 'NO' || (feederType === 'M' && startingVoltageDropCheck === 'NO')) {
      status = 'FAILED';
    }

    return {
      flc_A,
      motorStartingCurrent_A,
      numberOfCores: cable.numberOfCores as '1C' | '2C' | '3C' | '4C',
      cableSize_sqmm: engineResult.selectedConductorArea || 240,
      cableCurrentRating_A: engineResult.catalogRatingPerRun || 387,
      numberOfRuns,
      derated_currentCarryingCapacity_A: derated_currentCapacity,
      capacityCheck,
      runningVoltageDrop_percent,
      runningVoltageDropCheck,
      startingVoltageDip_percent: startingVoltageDrop_percent,
      startingVoltageDropCheck,
      cableDesignation,
      status,
    };
  } catch (error) {
    console.error('Formula calculation error', error);
    return { status: 'FAILED' };
  }
};

const ResultsTabV2 = () => {
  const { normalizedFeeders, catalogueData, updateFeeder } = usePathContext();
  const [results, setResults] = useState<ExcelResultRow[]>([]);
  const [globalEditMode, setGlobalEditMode] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    fromBus: true,
    toBus: true,
    cableNumber: true,
    feederType: true,
    cores: true,
    cableSize: true,
    runs: true,
    voltage: true,
    power: true,
    pf: true,
    cableLength: true,
    vdrop: true,
    status: true,
    remarks: true,
  });

  useEffect(() => {
    if (normalizedFeeders && normalizedFeeders.length > 0) {
      const generated = normalizedFeeders.map((cable, idx) => {
        const feederType = cable.loadType === 'Transformer' ? 'F' : 'M';
        const formulas = calculateExcelFormulas(cable, idx, feederType as 'M' | 'F', catalogueData);
        return {
          slNo: idx + 1,
          fromBus: cable.fromBus || 'MAIN',
          toBus: cable.toBus || 'LOAD',
          cableNumber: cable.cableNumber || `C${idx + 1}`,
          description: cable.feederDescription || cable.cableNumber,
          feederType,
          ratedPowerKW: cable.loadKW,
          ratedVoltageKV: cable.voltage / 1000,
          powerFactor: cable.powerFactor,
          efficiency: cable.efficiency,
          cableLength_m: cable.length,
          remarks: (cable as any).remarks || '',
          ...formulas,
        } as ExcelResultRow;
      });
      setResults(generated);
    }
  }, [normalizedFeeders, catalogueData]);

  const handleCellChange = (rowIdx: number, field: 'feederType' | 'numberOfCores' | 'numberOfRuns' | 'cableLength_m' | 'powerFactor' | 'efficiency' | 'loadKW' | 'remarks', value: any) => {
    if (!normalizedFeeders) return;

    const cable = normalizedFeeders[rowIdx];
    let updateData: any = {};

    if (field === 'feederType') {
      updateData.loadType = value === 'M' ? 'Motor' : 'Feeder';
    } else if (field === 'numberOfCores') {
      updateData.numberOfCores = value;
    } else if (field === 'numberOfRuns') {
      updateData.numberOfRuns = value;
    } else if (field === 'cableLength_m') {
      updateData.length = Number(value);
    } else if (field === 'powerFactor') {
      updateData.powerFactor = Number(value);
    } else if (field === 'efficiency') {
      updateData.efficiency = Number(value);
    } else if (field === 'loadKW') {
      updateData.loadKW = Number(value);
    } else if (field === 'remarks') {
      updateData.remarks = value;
    }

    updateFeeder(cable.cableNumber, updateData);

    const updatedCable: CableSegment = { ...cable, ...updateData };
    const newFeederType = updateData.feederType === 'Motor' ? 'M' : (updateData.feederType === 'Feeder' ? 'F' : results[rowIdx].feederType);
    const recalc = calculateExcelFormulas(updatedCable, rowIdx, newFeederType, catalogueData);

    const updated = [...results];
    updated[rowIdx] = {
      ...updated[rowIdx],
      ...(field === 'loadKW' && { ratedPowerKW: Number(value) }),
      ...(field === 'cableLength_m' && { cableLength_m: Number(value) }),
      ...(field === 'powerFactor' && { powerFactor: Number(value) }),
      ...(field === 'efficiency' && { efficiency: Number(value) }),
      ...(field === 'feederType' && { feederType: value }),
      ...(field === 'numberOfCores' && { numberOfCores: value }),
      ...(field === 'numberOfRuns' && { numberOfRuns: Number(value) }),
      ...(field === 'remarks' && { remarks: value }),
      ...(recalc as any),
    };

    setResults(updated);
  };

  const handleExportExcel = () => {
    const exportData = results.map((r) => ({
      'Sl': r.slNo,
      'From': r.fromBus,
      'To': r.toBus,
      'Cable#': r.cableNumber,
      'Description': r.description,
      'Type': r.feederType,
      'Power(kW)': r.ratedPowerKW.toFixed(2),
      'Cores': r.numberOfCores,
      'Size(mm²)': r.cableSize_sqmm,
      'Runs': r.numberOfRuns,
      'Rating(A)': r.cableCurrentRating_A.toFixed(1),
      'Length(m)': r.cableLength_m.toFixed(1),
      'V-Drop%': r.runningVoltageDrop_percent.toFixed(2),
      'Designation': r.cableDesignation,
      'Remarks': r.remarks,
      'Status': r.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
    XLSX.writeFile(workbook, `cable_sizing_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(16);
    doc.text('Cable Sizing Results', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 25);

    const columns = ['Sl', 'From', 'To', 'Cable#', 'Type', 'kW', 'Cores', 'Size', 'Runs', 'V-Drop%', 'Status'];
    const data = results.map(r => [
      r.slNo,
      r.fromBus,
      r.toBus,
      r.cableNumber,
      r.feederType,
      r.ratedPowerKW.toFixed(2),
      r.numberOfCores,
      r.cableSize_sqmm,
      r.numberOfRuns,
      r.runningVoltageDrop_percent.toFixed(2),
      r.status,
    ]);

    (doc as any).autoTable({
      columns: columns.map(c => ({ header: c, width: pageWidth / columns.length })),
      body: data,
      startY: 35,
      styles: { fontSize: 8, cellPadding: 2 },
    });

    doc.save(`cable_sizing_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const toggleBOQSection = () => {
    const sections = document.getElementById('boq-section');
    if (sections) {
      sections.classList.toggle('hidden');
    }
  };

  const getBOQSummary = () => {
    const summary: { [key: string]: { count: number; totalLength: number } } = {};
    results.forEach((r) => {
      const key = `${r.numberOfRuns}R×${r.numberOfCores}×${r.cableSize_sqmm}`;
      if (!summary[key]) {
        summary[key] = { count: 0, totalLength: 0 };
      }
      summary[key].count += 1;
      summary[key].totalLength += r.cableLength_m;
    });
    return summary;
  };

  if (results.length === 0) {
    return (
      <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-8 text-center">
        <AlertCircle className="mx-auto mb-4 text-yellow-500" size={32} />
        <h3 className="text-yellow-200 font-semibold mb-2">No Results Yet</h3>
        <p className="text-yellow-300 text-sm">Load demo or upload feeder data to generate results</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 space-y-3">
        <div className="flex gap-3 items-center flex-wrap">
          <button
            onClick={() => setGlobalEditMode(!globalEditMode)}
            className={`${globalEditMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-slate-600 hover:bg-slate-500'} text-white px-4 py-2 rounded flex items-center gap-2 transition`}
          >
            <Edit2 size={16} />
            {globalEditMode ? 'Editing ON' : 'Edit Mode'}
          </button>

          {globalEditMode && (
            <button
              onClick={() => window.location.reload()}
              className="bg-slate-500 hover:bg-slate-400 text-white px-4 py-2 rounded flex items-center gap-2 transition"
            >
              <RotateCcw size={16} />
              Discard
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded flex items-center gap-2 transition"
          >
            <Download size={16} />
            Excel
          </button>

          <button
            onClick={handleExportPDF}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded flex items-center gap-2 transition"
          >
            <Download size={16} />
            PDF
          </button>

          <button
            onClick={toggleBOQSection}
            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded transition text-sm"
          >
            BOQ Summary
          </button>

          <div className="flex-1" />
          <div className="text-sm text-slate-300">
            <span className="font-semibold">{results.length}</span> cables |
            <span className="text-green-400 ml-2 font-semibold">
              {results.filter(r => r.status === 'APPROVED').length}
            </span>
            ✓
          </div>
        </div>

        {/* Column Visibility Toggle */}
        <div className="flex gap-2 flex-wrap text-xs bg-slate-700/50 p-2 rounded border border-slate-600">
          <span className="text-slate-300 font-semibold">Columns:</span>
          {Object.keys(columnVisibility).map((col) => (
            <button
              key={col}
              onClick={() => setColumnVisibility(prev => ({ ...prev, [col]: !prev[col] }))}
              className={`px-2 py-1 rounded flex items-center gap-1 transition ${columnVisibility[col] ? 'bg-blue-600 text-white' : 'bg-slate-600 text-slate-300'}`}
            >
              {columnVisibility[col] ? <Eye size={12} /> : <EyeOff size={12} />}
              {col}
            </button>
          ))}
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-slate-900 rounded-lg border-2 border-slate-600 overflow-x-auto" style={{ maxHeight: '600px', overflowY: 'auto' }}>
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 z-20 bg-slate-800">
            <tr>
              {columnVisibility.fromBus && <th className="border border-slate-600 px-2 py-1 bg-slate-700 text-slate-200">From</th>}
              {columnVisibility.toBus && <th className="border border-slate-600 px-2 py-1 bg-slate-700 text-slate-200">To</th>}
              {columnVisibility.cableNumber && <th className="border border-slate-600 px-2 py-1 bg-slate-700 text-slate-200">Cable#</th>}
              <th className="border border-slate-600 px-2 py-1 bg-blue-800 text-blue-200">Sl</th>
              <th className="border border-slate-600 px-2 py-1 bg-blue-800 text-blue-200">Desc</th>
              {columnVisibility.feederType && (
                <th className="border border-slate-600 px-2 py-1 bg-cyan-800 text-cyan-200">Type</th>
              )}
              {columnVisibility.power && (
                <th className="border border-slate-600 px-2 py-1 bg-cyan-800 text-cyan-200">kW</th>
              )}
              {columnVisibility.pf && (
                <th className="border border-slate-600 px-2 py-1 bg-cyan-800 text-cyan-200">PF</th>
              )}
              {columnVisibility.voltage && (
                <th className="border border-slate-600 px-2 py-1 bg-cyan-800 text-cyan-200">kV</th>
              )}
              <th className="border border-slate-600 px-2 py-1 bg-orange-800 text-orange-200">FLC(A)</th>
              {columnVisibility.cores && (
                <th className="border border-slate-600 px-2 py-1 bg-purple-800 text-purple-200">Cores</th>
              )}
              {columnVisibility.cableSize && (
                <th className="border border-slate-600 px-2 py-1 bg-purple-800 text-purple-200">Size(mm²)</th>
              )}
              {columnVisibility.runs && (
                <th className="border border-slate-600 px-2 py-1 bg-green-800 text-green-200">Runs</th>
              )}
              <th className="border border-slate-600 px-2 py-1 bg-green-800 text-green-200">I_derated(A)</th>
              <th className="border border-slate-600 px-2 py-1 bg-green-800 text-green-200">OK</th>
              {columnVisibility.cableLength && (
                <th className="border border-slate-600 px-2 py-1 bg-red-800 text-red-200">L(m)</th>
              )}
              {columnVisibility.vdrop && (
                <th className="border border-slate-600 px-2 py-1 bg-red-800 text-red-200">V-Drop%</th>
              )}
              <th className="border border-slate-600 px-2 py-1 bg-red-800 text-red-200">OK</th>
              <th className="border border-slate-600 px-2 py-1 bg-slate-700 text-slate-200">Designation</th>
              {columnVisibility.remarks && (
                <th className="border border-slate-600 px-2 py-1 bg-slate-700 text-slate-200">Remarks</th>
              )}
              {columnVisibility.status && (
                <th className="border border-slate-600 px-2 py-1 bg-slate-700 text-slate-200">Status</th>
              )}
            </tr>
          </thead>
          <tbody>
            {results.map((r, idx) => (
              <tr
                key={idx}
                className={`${idx % 2 === 0 ? 'bg-slate-800' : 'bg-slate-750'} hover:bg-slate-700/60 transition ${
                  r.status === 'FAILED' ? 'border-l-4 border-red-600' :
                  r.status === 'WARNING' ? 'border-l-4 border-yellow-600' :
                  'border-l-4 border-green-600'
                }`}
              >
                {columnVisibility.fromBus && <td className="border border-slate-600 px-2 py-0.5 text-slate-200">{r.fromBus}</td>}
                {columnVisibility.toBus && <td className="border border-slate-600 px-2 py-0.5 text-slate-200">{r.toBus}</td>}
                {columnVisibility.cableNumber && <td className="border border-slate-600 px-2 py-0.5 text-slate-200 font-mono">{r.cableNumber}</td>}
                <td className="border border-slate-600 px-2 py-0.5 text-center text-slate-200 font-semibold bg-blue-950/30">{r.slNo}</td>
                <td className="border border-slate-600 px-2 py-0.5 text-slate-200 truncate max-w-xs">{r.description}</td>
                {columnVisibility.feederType && (
                  <td className="border border-slate-600 px-2 py-0.5 bg-cyan-950/20">
                    {globalEditMode ? (
                      <EditableCell
                        value={r.feederType}
                        type="select"
                        editable={true}
                        onChange={(val) => handleCellChange(idx, 'feederType', val)}
                        options={FEEDER_TYPE_OPTIONS}
                      />
                    ) : (
                      <span className="text-slate-200">{r.feederType}</span>
                    )}
                  </td>
                )}
                {columnVisibility.power && (
                  <td className="border border-slate-600 px-2 py-0.5 bg-cyan-950/20 text-slate-200">
                    {globalEditMode ? (
                      <EditableCell value={r.ratedPowerKW} type="number" editable={true} onChange={(val) => handleCellChange(idx, 'loadKW', val)} precision={2} />
                    ) : (
                      <span className="font-mono">{r.ratedPowerKW.toFixed(2)}</span>
                    )}
                  </td>
                )}
                {columnVisibility.pf && (
                  <td className="border border-slate-600 px-2 py-0.5 bg-cyan-950/20 text-slate-200">
                    {globalEditMode ? (
                      <EditableCell value={r.powerFactor} type="number" editable={true} onChange={(val) => handleCellChange(idx, 'powerFactor', val)} precision={2} />
                    ) : (
                      <span className="font-mono">{r.powerFactor.toFixed(2)}</span>
                    )}
                  </td>
                )}
                {columnVisibility.voltage && (
                  <td className="border border-slate-600 px-2 py-0.5 bg-cyan-950/20 text-slate-200 font-mono">{r.ratedVoltageKV.toFixed(2)}</td>
                )}
                <td className="border border-slate-600 px-2 py-0.5 bg-orange-950/20 text-orange-300 font-bold">{r.flc_A.toFixed(2)}</td>
                {columnVisibility.cores && (
                  <td className="border border-slate-600 px-2 py-0.5 bg-purple-950/20 text-slate-200">
                    {globalEditMode ? (
                      <EditableCell
                        value={r.numberOfCores}
                        type="select"
                        editable={true}
                        onChange={(val) => handleCellChange(idx, 'numberOfCores', val)}
                        options={CORE_OPTIONS}
                      />
                    ) : (
                      <span>{r.numberOfCores}</span>
                    )}
                  </td>
                )}
                {columnVisibility.cableSize && (
                  <td className="border border-slate-600 px-2 py-0.5 bg-purple-950/40 text-yellow-300 font-bold text-center">{r.cableSize_sqmm}</td>
                )}
                {columnVisibility.runs && (
                  <td className="border border-slate-600 px-2 py-0.5 bg-green-950/20 text-slate-200 text-center">
                    {globalEditMode ? (
                      <EditableCell value={r.numberOfRuns} type="number" editable={true} onChange={(val) => handleCellChange(idx, 'numberOfRuns', val)} precision={0} />
                    ) : (
                      <span className="font-mono">{r.numberOfRuns}</span>
                    )}
                  </td>
                )}
                <td className="border border-slate-600 px-2 py-0.5 bg-green-950/20 text-cyan-300 font-bold">{r.derated_currentCarryingCapacity_A.toFixed(1)}</td>
                <td className={`border border-slate-600 px-2 py-0.5 font-bold text-center ${r.capacityCheck === 'YES' ? 'text-green-300 bg-green-950/40' : 'text-red-300 bg-red-950/40'}`}>{r.capacityCheck}</td>
                {columnVisibility.cableLength && (
                  <td className="border border-slate-600 px-2 py-0.5 bg-red-950/20 text-slate-200">
                    {globalEditMode ? (
                      <EditableCell value={r.cableLength_m} type="number" editable={true} onChange={(val) => handleCellChange(idx, 'cableLength_m', val)} precision={1} />
                    ) : (
                      <span className="font-mono">{r.cableLength_m.toFixed(1)}</span>
                    )}
                  </td>
                )}
                {columnVisibility.vdrop && (
                  <td className={`border border-slate-600 px-2 py-0.5 font-bold text-center ${r.runningVoltageDrop_percent <= 3 ? 'text-green-300 bg-green-950/40' : 'text-yellow-300 bg-yellow-950/40'}`}>
                    {r.runningVoltageDrop_percent.toFixed(2)}
                  </td>
                )}
                <td className={`border border-slate-600 px-2 py-0.5 font-bold text-center ${r.runningVoltageDropCheck === 'YES' ? 'text-green-300' : 'text-red-300'}`}>{r.runningVoltageDropCheck}</td>
                <td className="border border-slate-600 px-2 py-0.5 text-slate-300 text-xs truncate">{r.cableDesignation}</td>
                {columnVisibility.remarks && (
                  <td className="border border-slate-600 px-2 py-0.5 text-slate-200 max-w-xs">
                    {globalEditMode ? (
                      <EditableCell value={r.remarks} type="text" editable={true} onChange={(val) => handleCellChange(idx, 'remarks', val)} />
                    ) : (
                      <span className="text-xs truncate">{r.remarks || '-'}</span>
                    )}
                  </td>
                )}
                {columnVisibility.status && (
                  <td className={`border border-slate-600 px-2 py-0.5 text-center font-bold text-xs ${
                    r.status === 'APPROVED' ? 'bg-green-600/30 text-green-300' :
                    r.status === 'WARNING' ? 'bg-yellow-600/30 text-yellow-300' :
                    'bg-red-600/30 text-red-300'
                  }`}>
                    {r.status === 'APPROVED' ? '✓' : r.status === 'WARNING' ? '⚠' : '✗'} {r.status}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BOQ Summary Section */}
      <div id="boq-section" className="hidden space-y-4">
        <div className="bg-slate-900 rounded-lg border-2 border-slate-600 p-4">
          <h3 className="text-slate-200 font-bold mb-4">📦 Bill of Quantities (BOQ) Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800">
                  <th className="border border-slate-600 px-3 py-2 text-left text-slate-200">Cable Specification</th>
                  <th className="border border-slate-600 px-3 py-2 text-center text-slate-200">Quantity (No.)</th>
                  <th className="border border-slate-600 px-3 py-2 text-center text-slate-200">Total Length (m)</th>
                  <th className="border border-slate-600 px-3 py-2 text-center text-slate-200">Unit Length (m)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(getBOQSummary()).map(([spec, data], idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-800' : 'bg-slate-750'}>
                    <td className="border border-slate-600 px-3 py-2 text-slate-200 font-mono">{spec}</td>
                    <td className="border border-slate-600 px-3 py-2 text-center text-slate-200 font-bold">{data.count}</td>
                    <td className="border border-slate-600 px-3 py-2 text-center text-cyan-300 font-bold">{data.totalLength.toFixed(1)}</td>
                    <td className="border border-slate-600 px-3 py-2 text-center text-slate-200">{(data.totalLength / Math.max(data.count, 1)).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-green-950/30 border border-green-600 rounded p-3">
            <p className="text-green-400 text-xs font-semibold">Total Cables</p>
            <p className="text-green-300 text-xl font-bold">{results.length}</p>
          </div>
          <div className="bg-blue-950/30 border border-blue-600 rounded p-3">
            <p className="text-blue-400 text-xs font-semibold">Total Length</p>
            <p className="text-blue-300 text-xl font-bold">{results.reduce((sum, r) => sum + r.cableLength_m, 0).toFixed(0)}m</p>
          </div>
          <div className="bg-cyan-950/30 border border-cyan-600 rounded p-3">
            <p className="text-cyan-400 text-xs font-semibold">Total Power</p>
            <p className="text-cyan-300 text-xl font-bold">{results.reduce((sum, r) => sum + r.ratedPowerKW, 0).toFixed(0)}kW</p>
          </div>
          <div className="bg-purple-950/30 border border-purple-600 rounded p-3">
            <p className="text-purple-400 text-xs font-semibold">Avg V-Drop</p>
            <p className="text-purple-300 text-xl font-bold">{(results.reduce((sum, r) => sum + r.runningVoltageDrop_percent, 0) / results.length).toFixed(2)}%</p>
          </div>
        </div>
      </div>

      {/* Status Legend */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-900/30 border border-green-600 rounded p-3">
          <p className="text-green-300 font-semibold">✓ APPROVED</p>
          <p className="text-green-400 text-xs">All checks pass</p>
        </div>
        <div className="bg-yellow-900/30 border border-yellow-600 rounded p-3">
          <p className="text-yellow-300 font-semibold">⚠ WARNING</p>
          <p className="text-yellow-400 text-xs">At limit, review</p>
        </div>
        <div className="bg-red-900/30 border border-red-600 rounded p-3">
          <p className="text-red-300 font-semibold">✗ FAILED</p>
          <p className="text-red-400 text-xs">Redesign needed</p>
        </div>
      </div>
    </div>
  );
};

export default ResultsTabV2;
