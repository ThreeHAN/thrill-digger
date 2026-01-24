// Simplified solver test - just the core logic
const board = [
  [5, -1, 5, 1, 1],
  [-1, 5, 5, 5, 5],
  [5, 5, 5, -1, 5],
  [1, 5, -1, 5, 5]
];

const width = 5, height = 4;
const bombCount = 4, rupoorCount = 0;

// Flatten board
const flat = board.flat();

// Find unknowns
const unknowns = [];
for (let i = 0; i < flat.length; i++) {
  if (flat[i] === -1) {
    unknowns.push(i);
  }
}

console.log('Board size:', width, 'x', height);
console.log('Total cells:', flat.length);
console.log('Unknown cells:', unknowns.length, 'at indices:', unknowns);
console.log('Bombs needed:', bombCount);
console.log('Rupoors:', rupoorCount);

// With 4 unknowns and 4 bombs needed, all unknowns must be bombs
console.log('\nWith', unknowns.length, 'unknowns and', bombCount, 'bombs, there are', Math.pow(2, unknowns.length), 'possible combinations');
console.log('But only 1 valid configuration: all 4 unknowns are bombs');

// Check if that configuration satisfies all constraints
const testConfig = unknowns.map(() => 1); // all bombs

function getNeighbors(idx) {
  const neighbors = [];
  const col = idx % width;
  const row = Math.floor(idx / width);
  
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr, nc = col + dc;
      if (nr >= 0 && nr < height && nc >= 0 && nc < width) {
        neighbors.push(nc + nr * width);
      }
    }
  }
  return neighbors;
}

function getRupeeExpected(value) {
  switch (value) {
    case 1: return 0;
    case 5: return 2;
    case 20: return 4;
    case 100: return 6;
    case 300: return 8;
    default: return 0;
  }
}

console.log('\nChecking if all-bombs configuration satisfies constraints...');
let allSatisfied = true;

for (let i = 0; i < flat.length; i++) {
  const cell = flat[i];
  if (cell > 1) { // Rupee with constraint
    const neighbors = getNeighbors(i);
    const expected = getRupeeExpected(cell);
    let bombCount = 0;
    
    for (const nidx of neighbors) {
      if (unknowns.includes(nidx)) {
        bombCount++; // Assuming all unknowns are bombs
      }
    }
    
    const row = Math.floor(i / width);
    const col = i % width;
    const satisfied = (bombCount === expected) || (bombCount === expected - 1);
    console.log(`  Cell [${row},${col}] value=${cell}: expected ${expected}, got ${bombCount} bombs`, satisfied ? '✓' : '✗');
    
    if (!satisfied) {
      allSatisfied = false;
    }
  }
}

console.log('\nResult:', allSatisfied ? 'BOARD IS VALID ✓' : 'BOARD IS INVALID ✗');
