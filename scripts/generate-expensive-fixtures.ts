import { solveBoardProbabilities } from '../src/utils/solver.ts'
import type { BoardCell } from '../src/utils/gameLogic.ts'

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

// Create more expensive challenge scenarios similar to center-star-8x5
// These should create complex interdependencies that strain the solver
const expensiveFixtures: SolverFixture[] = [
  {
    name: 'cross-pattern-8x5',
    width: 8,
    height: 5,
    bombCount: 8,
    rupoorCount: 8,
    board: [
      [0, 0, 4, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [4, 0, 4, 0, 4, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 4, 0, 0, 0, 0, 0],
    ],
  },
  {
    name: 'diamond-pattern-8x5',
    width: 8,
    height: 5,
    bombCount: 8,
    rupoorCount: 8,
    board: [
      [0, 0, 0, 4, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 4, 0, 0, 0, 4, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 4, 0, 0, 0, 0],
    ],
  },
  {
    name: 'nested-squares-8x5',
    width: 8,
    height: 5,
    bombCount: 8,
    rupoorCount: 8,
    board: [
      [4, 0, 0, 0, 0, 0, 0, 4],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 4, 0, 0, 4, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [4, 0, 0, 0, 0, 0, 0, 4],
    ],
  },
  {
    name: 'scattered-high-8x5',
    width: 8,
    height: 5,
    bombCount: 8,
    rupoorCount: 8,
    board: [
      [4, 0, 0, 0, 0, 0, 0, 4],
      [0, 0, 0, 4, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 4, 0, 0],
      [4, 0, 0, 0, 0, 0, 0, 4],
    ],
  },
  {
    name: 'ring-pattern-8x5',
    width: 8,
    height: 5,
    bombCount: 8,
    rupoorCount: 8,
    board: [
      [4, 0, 0, 0, 0, 0, 0, 4],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [4, 0, 0, 0, 0, 0, 0, 4],
    ],
  },
  {
    name: 'plus-pattern-8x5',
    width: 8,
    height: 5,
    bombCount: 8,
    rupoorCount: 8,
    board: [
      [0, 0, 0, 4, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [4, 0, 0, 4, 0, 0, 4, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 4, 0, 0, 0, 0],
    ],
  },
]

// Generate solutions
console.log('Generating expensive challenge fixture solutions...\n')

let successCount = 0
for (const fixture of expensiveFixtures) {
  console.log(`Solving ${fixture.name}...`)
  const solvedBoard = solveBoardProbabilities(
    fixture.board,
    fixture.width,
    fixture.height,
    fixture.bombCount,
    fixture.rupoorCount
  )

  if (!solvedBoard) {
    console.error(`  ✗ Failed to solve`)
    continue
  }

  successCount++
  console.log(`  ✓ Solved successfully`)
}

console.log(`\nSuccessfully generated ${successCount}/${expensiveFixtures.length} fixtures\n`)
console.log('Newly generated fixtures (add to solverFixtures.ts):')
console.log(JSON.stringify(
  expensiveFixtures.map((f) => {
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
