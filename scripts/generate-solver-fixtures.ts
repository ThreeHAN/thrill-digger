import { solveBoardProbabilities } from '../src/utils/solver.ts'
import type { BoardCell } from '../src/utils/gameLogic.ts'

interface SolverFixtureInput {
  name: string
  width: number
  height: number
  bombCount: number
  rupoorCount: number
  board: BoardCell[][]
}

// Helper to generate random board layouts
function generateRandomBoard(
  width: number,
  height: number,
  bombCount: number,
  rupoorCount: number,
  constraintCount: number,
  seed: number
): BoardCell[][] {
  const board: BoardCell[][] = Array(height)
    .fill(null)
    .map(() => Array(width).fill(0))

  // Simple seeded random for reproducibility
  let random = seed
  const next = () => {
    random = (random * 9301 + 49297) % 233280
    return random / 233280
  }

  // Possible constraint values (bomb counts)
  const constraintValues = [1, 2, 4, 6, 8]

  // Place random constraints
  const placed = new Set<string>()
  let attempts = 0
  while (placed.size < constraintCount && attempts < 100) {
    const row = Math.floor(next() * height)
    const col = Math.floor(next() * width)
    const key = `${row},${col}`
    
    if (!placed.has(key)) {
      const value = constraintValues[Math.floor(next() * constraintValues.length)]
      board[row][col] = value
      placed.add(key)
    }
    attempts++
  }

  // Randomly place rupoors
  let rupoorPlaced = 0
  attempts = 0
  while (rupoorPlaced < rupoorCount && attempts < 100) {
    const row = Math.floor(next() * height)
    const col = Math.floor(next() * width)
    const key = `${row},${col}`
    
    if (!placed.has(key) && board[row][col] === 0) {
      board[row][col] = -10
      placed.add(key)
      rupoorPlaced++
    }
    attempts++
  }

  return board
}

const fixtures: SolverFixtureInput[] = [
  {
    name: 'uniform-unknowns-3x3',
    width: 3,
    height: 3,
    bombCount: 3,
    rupoorCount: 0,
    board: [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ],
  },
  {
    name: 'center-two-constraint',
    width: 3,
    height: 3,
    bombCount: 2,
    rupoorCount: 0,
    board: [
      [0, 0, 0],
      [0, 2, 0],
      [0, 0, 0],
    ],
  },
  {
    name: 'green-clears-neighbors',
    width: 3,
    height: 3,
    bombCount: 1,
    rupoorCount: 0,
    board: [
      [1, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ],
  },
  {
    name: 'rupoor-reduces-constraint',
    width: 3,
    height: 3,
    bombCount: 1,
    rupoorCount: 1,
    board: [
      [0, 0, 0],
      [0, 2, -10],
      [0, 0, 0],
    ],
  },
  {
    name: 'dual-constraints-4x3',
    width: 4,
    height: 3,
    bombCount: 3,
    rupoorCount: 0,
    board: [
      [0, 0, 0, 0],
      [0, 2, 2, 0],
      [0, 0, 0, 0],
    ],
  },
  {
    name: 'edge-constraint-weighted',
    width: 5,
    height: 4,
    bombCount: 4,
    rupoorCount: 0,
    board: [
      [0, 0, 0, 0, 0],
      [2, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ],
  },
  {
    name: 'beginner-partial-open',
    width: 5,
    height: 4,
    bombCount: 4,
    rupoorCount: 0,
    board: [
      [0, 0, 0, 0, 0],
      [0, 2, 0, 0, 0],
      [0, 0, 4, 0, 0],
      [0, 0, 0, 0, 0],
    ],
  },
  {
    name: 'intermediate-rupoor-pressure',
    width: 6,
    height: 5,
    bombCount: 4,
    rupoorCount: 4,
    board: [
      [0, 0, 0, 0, 0, 0],
      [-10, 0, 0, 0, 0, 0],
      [0, 4, 0, 0, 0, 0],
      [0, 0, 0, 2, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ],
  },
  {
    name: 'edge-tension-6x4',
    width: 6,
    height: 4,
    bombCount: 3,
    rupoorCount: 1,
    board: [
      [0, 0, 0, 0, 0, 0],
      [0, 2, 0, 0, 0, 0],
      [0, 0, 0, 0, 2, 0],
      [0, -10, 0, 0, 0, 0],
    ],
  },
  {
    name: 'checker-split-5x5',
    width: 5,
    height: 5,
    bombCount: 5,
    rupoorCount: 0,
    board: [
      [0, 0, 2, 0, 0],
      [0, 2, 0, 2, 0],
      [2, 0, 0, 0, 2],
      [0, 2, 0, 2, 0],
      [0, 0, 2, 0, 0],
    ],
  },
  {
    name: 'sparse-high-values-8x5-no-warning',
    width: 8,
    height: 5,
    bombCount: 8,
    rupoorCount: 8,
    board: [
      [0, 0, 0, 2, 0, 0, 0, 0],
      [0, 6, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 6, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },
  {
    name: 'sparse-high-values-8x5-warning',
    width: 8,
    height: 5,
    bombCount: 8,
    rupoorCount: 8,
    board: [
      [0, 0, 0, 2, 0, 0, 0, 0],
      [0, 6, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 2, 0, 6, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },
  {
    name: 'near-solved-corners-4x4',
    width: 4,
    height: 4,
    bombCount: 2,
    rupoorCount: 0,
    board: [
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 2, 0],
      [0, 0, 0, 0],
    ],
  },
]

// Generate random fixtures for game board sizes
const randomFixtures: SolverFixtureInput[] = []

// Beginner boards (5×4, 4 bombs, 0 rupoors)
for (let i = 0; i < 15; i++) {
  randomFixtures.push({
    name: `beginner-random-${i + 1}`,
    width: 5,
    height: 4,
    bombCount: 4,
    rupoorCount: 0,
    board: generateRandomBoard(5, 4, 4, 0, Math.floor(Math.random() * 3) + 1, 1000 + i),
  })
}

// Intermediate boards (6×5, 4 bombs, 4 rupoors)
for (let i = 0; i < 20; i++) {
  randomFixtures.push({
    name: `intermediate-random-${i + 1}`,
    width: 6,
    height: 5,
    bombCount: 4,
    rupoorCount: 4,
    board: generateRandomBoard(6, 5, 4, 4, Math.floor(Math.random() * 4) + 1, 2000 + i),
  })
}

// Expert boards (8×5, 8 bombs, 8 rupoors)
for (let i = 0; i < 20; i++) {
  randomFixtures.push({
    name: `expert-random-${i + 1}`,
    width: 8,
    height: 5,
    bombCount: 8,
    rupoorCount: 8,
    board: generateRandomBoard(8, 5, 8, 8, Math.floor(Math.random() * 5) + 1, 3000 + i),
  })
}

fixtures.push(...randomFixtures)

function toRows(values: number[] | null, width: number, height: number): number[][] | null {
  if (!values) return null
  const rows: number[][] = []
  for (let r = 0; r < height; r++) {
    rows.push(values.slice(r * width, (r + 1) * width))
  }
  return rows
}

const solved = fixtures.map((fixture) => {
  const solvedBoard = solveBoardProbabilities(
    fixture.board,
    fixture.width,
    fixture.height,
    fixture.bombCount,
    fixture.rupoorCount,
  )

  return {
    name: fixture.name,
    width: fixture.width,
    height: fixture.height,
    bombCount: fixture.bombCount,
    rupoorCount: fixture.rupoorCount,
    board: fixture.board,
    solvedBoard,
    solvedRows: toRows(solvedBoard, fixture.width, fixture.height),
  }
})

console.log(JSON.stringify(solved, null, 2))
