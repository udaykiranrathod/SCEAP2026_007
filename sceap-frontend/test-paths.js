/**
 * Quick test to verify path discovery logic works with demo data
 * Run with: node test-paths.js
 */

const demoData = [
  {
    'Serial No': 1,
    'Cable Number': 'CBL-001',
    'Feeder Description': 'Main Transformer',
    'From Bus': 'MAIN-PANEL',
    'To Bus': 'TRF-MAIN',
    'Voltage (V)': 415,
    'Power Factor': 0.95,
    'Load KW': 0,
    'Length (m)': 5.0
  },
  {
    'Serial No': 2,
    'Cable Number': 'CBL-002',
    'Feeder Description': 'To PMCC-1',
    'From Bus': 'PMCC-1',
    'To Bus': 'MAIN-PANEL',
    'Voltage (V)': 415,
    'Power Factor': 0.85,
    'Load KW': 80.0,
    'Length (m)': 30.0
  },
  {
    'Serial No': 3,
    'Cable Number': 'CBL-003',
    'Feeder Description': 'To PMCC-2',
    'From Bus': 'PMCC-2',
    'To Bus': 'MAIN-PANEL',
    'Voltage (V)': 415,
    'Power Factor': 0.86,
    'Load KW': 60.0,
    'Length (m)': 25.0
  },
  {
    'Serial No': 4,
    'Cable Number': 'CBL-004',
    'Feeder Description': 'Motor M1 (50kW)',
    'From Bus': 'MOTOR-M1',
    'To Bus': 'PMCC-1',
    'Voltage (V)': 415,
    'Power Factor': 0.82,
    'Load KW': 50.0,
    'Length (m)': 20.0
  },
  {
    'Serial No': 5,
    'Cable Number': 'CBL-005',
    'Feeder Description': 'Motor M2 (30kW)',
    'From Bus': 'MOTOR-M2',
    'To Bus': 'PMCC-1',
    'Voltage (V)': 415,
    'Power Factor': 0.82,
    'Load KW': 30.0,
    'Length (m)': 15.0
  },
  {
    'Serial No': 6,
    'Cable Number': 'CBL-006',
    'Feeder Description': 'Pump P1 (25kW)',
    'From Bus': 'PUMP-P1',
    'To Bus': 'PMCC-2',
    'Voltage (V)': 415,
    'Power Factor': 0.85,
    'Load KW': 25.0,
    'Length (m)': 18.0
  },
  {
    'Serial No': 7,
    'Cable Number': 'CBL-007',
    'Feeder Description': 'Lighting Panel L1 (15kW)',
    'From Bus': 'LIGHT-L1',
    'To Bus': 'PMCC-2',
    'Voltage (V)': 415,
    'Power Factor': 0.95,
    'Load KW': 15.0,
    'Length (m)': 12.0
  }
];

// Simulate the path discovery algorithm
console.log('\n=== PATH DISCOVERY TEST ===\n');

// Step 1: Find transformers
const transformerBuses = new Set();
demoData.forEach(c => {
  if (c['To Bus'].toUpperCase().includes('TRF')) {
    transformerBuses.add(c['To Bus']);
  }
});

console.log('Transformer Buses Found:', Array.from(transformerBuses));

// Step 2: Find equipment
const equipmentBuses = new Set();
demoData.forEach(c => {
  if (!transformerBuses.has(c['From Bus'])) {
    equipmentBuses.add(c['From Bus']);
  }
});

console.log('Equipment/Load Buses Found:', Array.from(equipmentBuses));
console.log();

// Step 3: Trace each equipment back to transformer
console.log('=== DISCOVERED PATHS ===\n');

let pathNum = 1;
for (const equipment of equipmentBuses) {
  const visited = new Set();
  const queue = [{ bus: equipment, path: [] }];
  
  let foundPath = null;
  
  while (queue.length > 0 && !foundPath) {
    const current = queue.shift();
    const currentBus = current.bus;
    
    if (visited.has(currentBus)) continue;
    visited.add(currentBus);
    
    // Find cable where From Bus = currentBus
    const connectingCable = demoData.find(c => c['From Bus'] === currentBus);
    
    if (!connectingCable) {
      console.log(`  └─ NO CABLE from ${currentBus}`);
      continue;
    }
    
    const newPath = [...current.path, connectingCable];
    
    // Check if we reached transformer
    if (transformerBuses.has(connectingCable['To Bus'])) {
      const pathStr = newPath
        .map(c => c['From Bus'])
        .concat(newPath[0]['To Bus'])
        .join(' ← ');
      
      const totalDistance = newPath.reduce((sum, c) => sum + c['Length (m)'], 0);
      const totalKW = newPath[0]['Load KW'];
      
      console.log(`PATH-${String(pathNum).padStart(3, '0')}: ${pathStr}`);
      console.log(`  Load: ${totalKW} kW, Distance: ${totalDistance} m`);
      console.log();
      
      pathNum++;
      foundPath = true;
    } else {
      // Continue searching
      queue.push({ bus: connectingCable['To Bus'], path: newPath });
    }
  }
}

console.log('=== SUMMARY ===');
console.log(`Total Equipment/Loads: ${equipmentBuses.size}`);
console.log(`Expected Paths: ${equipmentBuses.size}`);
console.log('\nIf this matches, path discovery will work! ✓');
