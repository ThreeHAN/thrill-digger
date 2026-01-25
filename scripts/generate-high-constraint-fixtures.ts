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

// Create more high-constraint challenge scenarios (solvable patterns)
const highConstraintFixtures: SolverFixture[] = [
  {
    name: 'dense-2pattern-8x5',
    width: 8,
    height: 5,
    bombCount: 8,
    rupoorCount: 8,
    board: [
      [2, 0, 2, 0, 2, 0, 2, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [2, 0, 2, 0, 2, 0, 2, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [2, 0, 2, 0, 2, 0, 2, 0],
    ],
  },
  {
    name: 'clustered-top-8x5',
    width: 8,
    height: 5,
    bombCount: 8,
    rupoorCount: 8,
    board: [
      [2, 2, 2, 2, 0, 0, 0, 0],
      [2, 2, 2, 2, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },
  {
    name: 'line-row-8x5',
    width: 8,
    height: 5,
    bombCount: 8,
    rupoorCount: 8,
    board: [
      [2, 2, 2, 2, 2, 2, 2, 2],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [2, 2, 2, 2, 2, 2, 2, 2],
    ],
  },
  {
    name: 'mixed-spread-8x5',
    width: 8,
    height: 5,
    bombCount: 8,
    rupoorCount: 8,
    board: [
      [2, 0, 0, 0, 0, 0, 0, 4],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 2, 0, 0, 2, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [4, 0, 0, 0, 0, 0, 0, 2],
    ],
  },
]

// Generate solutions
console.log('Generating high-constraint fixture solutions...\n')

for (const fixture of highConstraintFixtures) {
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

  console.log(`✓ ${fixture.name} (${fixture.width}×${fixture.height})`)
}

console.log('\nNewly generated fixtures (add to solverFixtures.ts):')
console.log(JSON.stringify(
  highConstraintFixtures.map((f) => {
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
