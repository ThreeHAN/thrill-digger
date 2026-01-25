import { solveBoardProbabilities } from '../src/utils/solver.ts'
import type { BoardCell } from '../src/utils/gameLogic.ts'
import { solverFixtures } from '../src/test-data/solverFixtures.ts'

interface SolverFixture {
  name: string
  width: number
  height: number
  bombCount: number
  rupoorCount: number
  board: BoardCell[][]
  solvedBoard: number[]
  solvedRows: number[][]
}

// Create sparse high-value constraint scenarios
// These have few constraints but they span large distances, creating complex
// interdependencies that challenge the solver's exhaustive search
const sparseHighValueFixtures: SolverFixture[] = [
  {
    name: 'sparse-corners-8x5',
    width: 8,
    height: 5,
    bombCount: 8,
    rupoorCount: 8,
    board: [
      [6, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 6],
    ],
  },
  {
    name: 'diagonal-constraints-8x5',
    width: 8,
    height: 5,
    bombCount: 8,
    rupoorCount: 8,
    board: [
      [4, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 4, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 4],
    ],
  },
  {
    name: 'edge-spans-8x5',
    width: 8,
    height: 5,
    bombCount: 8,
    rupoorCount: 8,
    board: [
      [6, 0, 0, 0, 0, 0, 0, 6],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [6, 0, 0, 0, 0, 0, 0, 6],
    ],
  },
  {
    name: 'center-star-8x5',
    width: 8,
    height: 5,
    bombCount: 8,
    rupoorCount: 8,
    board: [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 4, 0, 0, 4, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 4, 0, 0, 4, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },
  {
    name: 'columns-8x5',
    width: 8,
    height: 5,
    bombCount: 8,
    rupoorCount: 8,
    board: [
      [4, 0, 0, 0, 0, 0, 0, 4],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [4, 0, 0, 0, 0, 0, 0, 4],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [4, 0, 0, 0, 0, 0, 0, 4],
    ],
  },
  {
    name: 'asymmetric-spread-8x5',
    width: 8,
    height: 5,
    bombCount: 8,
    rupoorCount: 8,
    board: [
      [6, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 2, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 6],
    ],
  },
]

// Generate solutions
console.log('Generating sparse high-value fixture solutions...\n')

for (const fixture of sparseHighValueFixtures) {
  const solvedBoard = solveBoardProbabilities(
    fixture.board,
    fixture.width,
    fixture.height,
    fixture.bombCount,
    fixture.rupoorCount
  )

  if (!solvedBoard) {
    console.error(`Failed to solve: ${fixture.name}`)
    continue
  }

  // Convert flat array back to 2D for display
  const solvedRows: number[][] = []
  for (let r = 0; r < fixture.height; r++) {
    const row: number[] = []
    for (let c = 0; c < fixture.width; c++) {
      row.push(solvedBoard[r * fixture.width + c])
    }
    solvedRows.push(row)
  }

  console.log(`✓ ${fixture.name} (${fixture.width}×${fixture.height})`)
  console.log(`  Solved in ms: check benchmark`)
}

console.log('\nNewly generated fixtures (add to solverFixtures.ts):')
console.log(JSON.stringify(
  sparseHighValueFixtures.map((f, idx) => {
    const solvedBoard = solveBoardProbabilities(
      f.board,
      f.width,
      f.height,
      f.bombCount,
      f.rupoorCount
    )
    if (!solvedBoard) return null

    const solvedRows: number[][] = []
    for (let r = 0; r < f.height; r++) {
      const row: number[] = []
      for (let c = 0; c < f.width; c++) {
        row.push(solvedBoard[r * f.width + c])
      }
      solvedRows.push(row)
    }

    return {
      name: f.name,
      width: f.width,
      height: f.height,
      bombCount: f.bombCount,
      rupoorCount: f.rupoorCount,
      board: f.board,
      solvedBoard,
      solvedRows,
    }
  }).filter(Boolean),
  null,
  2
))
