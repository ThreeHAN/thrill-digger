import { solveBoardProbabilities } from '../src/utils/solver'
import { solverFixtures } from '../src/test-data/solverFixtures'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Regenerates solvedRows for all fixtures based on current solver implementation
 */
async function regenerateFixtures() {
  console.log('🔄 Regenerating solver fixtures...')

  const updatedFixtures = solverFixtures.map((fixture) => {
    console.log(`  Processing: ${fixture.name}`)

    const result = solveBoardProbabilities(
      fixture.board,
      fixture.width,
      fixture.height,
      fixture.bombCount,
      fixture.rupoorCount
    )

    if (!result) {
      console.log(`    ✓ Solver returned null (valid result)`)
      return {
        ...fixture,
        solvedBoard: null,
        solvedRows: null,
      }
    }

    // Convert 1D solvedBoard to 2D solvedRows
    const solvedRows: number[][] = []
    for (let row = 0; row < fixture.height; row++) {
      const rowData: number[] = []
      for (let col = 0; col < fixture.width; col++) {
        const index = row * fixture.width + col
        rowData.push(result[index])
      }
      solvedRows.push(rowData)
    }

    return {
      ...fixture,
      solvedBoard: result,
      solvedRows,
    }
  })

  // Write the updated fixtures file
  const fixturesPath = path.join(
    __dirname,
    '../src/test-data/solverFixtures.ts'
  )

  const fileContent = `import type { BoardCell } from '../utils/gameLogic'

export interface SolverFixture {
  name: string
  width: number
  height: number
  bombCount: number
  rupoorCount: number
  board: BoardCell[][]
  solvedBoard: number[]
  solvedRows: number[][]
}

// Baseline probabilities produced by solveBoardProbabilities on ${new Date().toISOString().split('T')[0]}
// ${updatedFixtures.length} fixtures covering game board sizes: Beginner (5×4), Intermediate (6×5), Expert (8×5)
export const solverFixtures: SolverFixture[] = ${JSON.stringify(updatedFixtures, null, 2)}
`

  fs.writeFileSync(fixturesPath, fileContent)

  console.log(`\n✅ Successfully regenerated ${updatedFixtures.length} fixtures`)
  console.log(`📝 Updated: ${fixturesPath}`)
}

regenerateFixtures().catch((error) => {
  console.error('❌ Error regenerating fixtures:', error)
  process.exit(1)
})
