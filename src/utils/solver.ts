/**
 * Constraint satisfaction solver for Thrill Digger
 * Calculates bomb probability for each unrevealed cell
 */

import type { BoardCell } from './gameLogic'

export type SolvedBoard = number[] // Probabilities or special values like -2 (unknown)

/**
 * Map rupee value to expected bomb count constraint
 * Green=1→0 bombs, Blue=5→2 bombs, Red=20→4 bombs, Silver=100→6 bombs, Gold=300→8 bombs
 */
function getExpectedBombCount(rupeeValue: number): number {
  switch (rupeeValue) {
    case 1: return 0      // Green rupee
    case 5: return 2      // Blue rupee
    case 20: return 4     // Red rupee
    case 100: return 6    // Silver rupee
    case 300: return 8    // Gold rupee
    default: return 0
  }
}

/**
 * Helper to iterate over 8 neighbors of a cell
 */
function forEachNeighbor(cellIdx: number, width: number, height: number, callback: (neighborIdx: number) => void) {
  const colIndex = cellIdx % width
  const rowIndex = Math.floor(cellIdx / width)
  
  for (let colOffset = -1; colOffset <= 1; colOffset++) {
    for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
      if (colOffset !== 0 || rowOffset !== 0) {
        const ncol = colIndex + colOffset
        const nrow = rowIndex + rowOffset
        if (ncol >= 0 && ncol < width && nrow >= 0 && nrow < height) {
          callback(ncol + nrow * width)
        }
      }
    }
  }
}

/**
 * Solve the board and return probabilities
 */
function normalizeBoard(board: BoardCell[][]): BoardCell[] {
  const flat1D = board.flat()
  const solvedBoard = flat1D.slice(0)
  // Convert empty cells (0) to unknown (-1) for solving
  for (let i = 0; i < solvedBoard.length; i++) {
    if (solvedBoard[i] === 0) {
      solvedBoard[i] = -1
    }
  }

  return solvedBoard
}

function buildNeighborsByCell(totalCells: number, width: number, height: number): number[][] {
  const neighborsByCell: number[][] = new Array(totalCells)
  for (let i = 0; i < totalCells; i++) {
    const neighbors: number[] = []
    forEachNeighbor(i, width, height, (neighborIdx) => {
      neighbors.push(neighborIdx)
    })
    neighborsByCell[i] = neighbors
  }

  return neighborsByCell
}

function applyVanillaParity(solvedBoard: BoardCell[], neighborsByCell: number[][]): void {
  for (let i = 0; i < solvedBoard.length; i++) {
    if (solvedBoard[i] === 1 || solvedBoard[i] === -2) {
      const neighbors = neighborsByCell[i]
      for (let n = 0; n < neighbors.length; n++) {
        const neighborIdx = neighbors[n]
        if (solvedBoard[neighborIdx] === -1) {
          solvedBoard[neighborIdx] = 0
        }
      }
    }
  }
}

function buildConstraints(
  solvedBoard: BoardCell[],
  neighborsByCell: number[][],
  width: number,
  debug: boolean
): { constraints: number[][]; unknownIndices: number[] } {
  const constraints: number[][] = []
  const unknownSet = new Set<number>()

  if (debug) console.log('Building constraints from board...')
  for (let i = 0; i < solvedBoard.length; i++) {
    const cell = solvedBoard[i]
    if (cell > 1) {
      const unknownNeighbors: number[] = []
      let expectedBombs = getExpectedBombCount(cell)
      if (debug) {
        const colIndex = i % width
        const rowIndex = Math.floor(i / width)
        console.log(`Cell at [${rowIndex},${colIndex}] value=${cell} expects ${expectedBombs} bombs`)
      }

      const neighbors = neighborsByCell[i]
      for (let n = 0; n < neighbors.length; n++) {
        const neighborIdx = neighbors[n]
        const neighborCell = solvedBoard[neighborIdx]

        if (neighborCell === -1) {
          unknownNeighbors.push(neighborIdx)
          unknownSet.add(neighborIdx)
        } else if (neighborCell === -10 || neighborCell === -2) {
          expectedBombs--
        }
      }

      if (unknownNeighbors.length > 0) {
        if (debug) console.log(`  -> Constraint: ${unknownNeighbors.length} unknowns, expecting ${expectedBombs} bombs`)
        unknownNeighbors.push(expectedBombs)
        constraints.push(unknownNeighbors)
      } else {
        if (debug) console.log('  -> No unknown neighbors, constraint skipped')
      }
    }
  }
  if (debug) console.log(`Total constraints: ${constraints.length}`)

  return { constraints, unknownIndices: Array.from(unknownSet) }
}

function buildIndexByCell(totalCells: number, unknownIndices: number[]): Int32Array {
  const indexByCell = new Int32Array(totalCells)
  indexByCell.fill(-1)
  for (let i = 0; i < unknownIndices.length; i++) {
    indexByCell[unknownIndices[i]] = i
  }

  return indexByCell
}

function buildCompactConstraints(
  constraints: number[][],
  indexByCell: Int32Array
): { cells: number[]; expected: number }[] {
  const compact: { cells: number[]; expected: number }[] = []
  for (let c = 0; c < constraints.length; c++) {
    const constraint = constraints[c]
    const expectedValue = constraint[constraint.length - 1]
    const cellPositions: number[] = []
    for (let pos = 0; pos < constraint.length - 1; pos++) {
      const idx = indexByCell[constraint[pos]]
      if (idx !== -1) {
        cellPositions.push(idx)
      }
    }
    if (cellPositions.length > 0) {
      compact.push({ cells: cellPositions, expected: expectedValue })
    }
  }

  return compact
}

function countSafeCells(solvedBoard: BoardCell[], unknownIndices: number[]): number {
  // Count unknown cells (-1) that are NOT part of the constraint system
  // These are "free" cells where we distribute remaining probability
  let safeCount = solvedBoard.length
  for (let i = 0; i < solvedBoard.length; i++) {
    if (solvedBoard[i] !== -1) {
      safeCount--
    }
  }
  safeCount -= unknownIndices.length
  return safeCount
}

export function solveBoardProbabilities(board: BoardCell[][], width: number, height: number, bombCount: number, rupoorCount: number): SolvedBoard | null {
  const DEBUG = false
  
  const solvedBoard = normalizeBoard(board)
  const neighborsByCell = buildNeighborsByCell(solvedBoard.length, width, height)
  applyVanillaParity(solvedBoard, neighborsByCell)

  // Track already-known hazards so remaining counts reflect placed rupoors
  const knownRupoorCount = solvedBoard.reduce((count, cell) => (
    cell === -10 || cell === -2 ? count + 1 : count
  ), 0)

  const { constraints, unknownIndices } = buildConstraints(solvedBoard, neighborsByCell, width, DEBUG)
  const unknownCount = unknownIndices.length
  const indexByCell = buildIndexByCell(solvedBoard.length, unknownIndices)
  const compactConstraints = buildCompactConstraints(constraints, indexByCell)
  const safeCount = countSafeCells(solvedBoard, unknownIndices)
  let computationLimitReached = false
  const totalCombinations = unknownCount <= 30 ? (1 << unknownCount) : Math.round(Math.pow(2, unknownCount))
  const remainingHazards = Math.max(0, bombCount + rupoorCount - knownRupoorCount)

  // Reuse placement array to avoid allocations
  const placement: number[] = new Array(unknownCount)
  const bombOccurrencesPerUnknown: number[] = new Array(unknownCount).fill(0)
  let validSolutionCount = 0
  const maxBombsNeeded = remainingHazards + safeCount
  const minBombsNeeded = Math.max(0, remainingHazards - safeCount)

  // Test all possible bomb placements
  for (let combo = 0; combo < totalCombinations; ++combo) {
    if (combo > 1e8) {
      computationLimitReached = true
      break
    }

    // Use bitwise operations for faster bit extraction
    let bombsPlaced = 0
    for (let bit = 0; bit < unknownCount; ++bit) {
      const isBomb = (combo >> bit) & 1
      placement[bit] = isBomb
      bombsPlaced += isBomb
    }

    // Early termination: check bomb count bounds first before constraint checking
    if (bombsPlaced > maxBombsNeeded || bombsPlaced < minBombsNeeded) {
      continue
    }

    let constraintsSatisfied = 0

    for (let c = 0; c < compactConstraints.length; c++) {
      const { cells, expected } = compactConstraints[c]
      let bombsNearCell = 0

      for (let pos = 0; pos < cells.length; pos++) {
        bombsNearCell += placement[cells[pos]]

        if (bombsNearCell > expected) {
          break
        }

        const remaining = cells.length - pos - 1
        if (bombsNearCell + remaining < expected - 1) {
          break
        }
      }

      if (bombsNearCell === expected || bombsNearCell === expected - 1) {
        constraintsSatisfied++
      }
    }

    if (constraintsSatisfied === compactConstraints.length) {
      validSolutionCount++
      for (let i = 0; i < unknownCount; i++) {
        bombOccurrencesPerUnknown[i] += placement[i]
      }
    }
  }

  if (computationLimitReached) {
    // Computation limit reached at 100 million combinations
  }

  // Validate board
  if (DEBUG) {
    console.log('=== Validation Results ===')
    console.log('Constraints:', compactConstraints.length, 'Unknown indices:', unknownIndices.length)
    console.log('Valid solutions found:', validSolutionCount)
    console.log('Total combinations tested:', totalCombinations)
  }
  
  if (compactConstraints.length > 0 && validSolutionCount === 0) {
    console.log('❌ BOARD INVALID: No valid solutions found for constraints')
    console.log('Constraints were:', constraints)
    return null
  }

  let remainingExpected = remainingHazards

  if (DEBUG) {
    console.log('=== Probability Calculation ===')
    console.log('Starting remainingHazards:', remainingHazards)
    console.log('safeCount:', safeCount)
    console.log('unknownIndices:', unknownIndices.length)
  }

  // Calculate probability for each unknown cell
  for (let unknownPos = 0; unknownPos < unknownIndices.length; unknownPos++) {
    let bombOccurrences = 0

    bombOccurrences = bombOccurrencesPerUnknown[unknownPos]

    if (computationLimitReached && bombOccurrences === 0) {
      solvedBoard[unknownIndices[unknownPos]] = -2 // Unknown
    } else {
      const probability = bombOccurrences / validSolutionCount
      remainingExpected -= probability
      solvedBoard[unknownIndices[unknownPos]] = probability
      if (DEBUG) {
        const cellIdx = unknownIndices[unknownPos]
        const row = Math.floor(cellIdx / width)
        const col = cellIdx % width
        console.log(`  Cell [${row},${col}]: ${bombOccurrences}/${validSolutionCount} = ${probability.toFixed(3)}, remaining: ${remainingExpected.toFixed(3)}`)
      }
    }
  }

  if (DEBUG) {
    console.log('Final remainingExpected:', remainingExpected)
  }

  // Handle remaining probability distribution to unconstrained cells
  // Negative remainingExpected means constraints are underconstrained (incomplete board)
  // Just clamp to 0 instead of treating as invalid
  const clampedRemaining = Math.max(0, remainingExpected)
  const defaultProbability = safeCount > 0 ? clampedRemaining / safeCount : 0

  if (DEBUG && remainingExpected < 0) {
    console.log('⚠️ Underconstrained: probabilities exceed bomb count by', Math.abs(remainingExpected))
    console.log('   Setting default probability to 0 for unconstrained cells')
  }

  for (let cellIdx = 0; cellIdx < solvedBoard.length; cellIdx++) {
    // Only set default probability for truly unknown cells
    if (solvedBoard[cellIdx] === -1) {
      solvedBoard[cellIdx] = defaultProbability
    }
  }

  // Convert back: keep probabilities but mark known cells appropriately for display
  const result: SolvedBoard = []
  for (let i = 0; i < solvedBoard.length; i++) {
    const cell = solvedBoard[i]
    // If it's a known rupee value, keep it as-is
    if (cell > 0) {
      result[i] = cell
    } else {
      // Otherwise it's a probability (0-1 range)
      result[i] = cell
    }
  }

  return result
}

/**
 * Get CSS class name for probability display with 10 granular levels
 */
export function getProbabilityColor(probability: number): string {
  const percent = probability * 100
  
  // 10 granular color levels from green (safe) to red (dangerous)
  if (percent <= 0) return 'prob-0'      // 0%: Dark green
  if (percent <= 10) return 'prob-10'    // 1-10%: Forest green
  if (percent <= 20) return 'prob-20'    // 11-20%: Light green
  if (percent <= 30) return 'prob-30'    // 21-30%: Pale green
  if (percent <= 40) return 'prob-40'    // 31-40%: Yellow-green
  if (percent <= 50) return 'prob-50'    // 41-50%: Sandy yellow
  if (percent <= 60) return 'prob-60'    // 51-60%: Orange-yellow
  if (percent <= 70) return 'prob-70'    // 61-70%: Burnt orange
  if (percent <= 80) return 'prob-80'    // 71-80%: Red-orange
  if (percent <= 90) return 'prob-90'    // 81-90%: Deep red
  return 'prob-100'                       // 91-100%: Dark red
}

/**
 * Calculate the number of unknown indices that would need computation
 * Used to determine if a warning should be shown before heavy computation
 */
export function calculateUnknownIndicesCount(board: BoardCell[][], width: number, height: number): number {
  const flat1D = board.flat()
  let solvedBoard = flat1D.slice(0)

  // Convert empty cells (0) to unknown (-1) for solving
  for (let i = 0; i < solvedBoard.length; i++) {
    if (solvedBoard[i] === 0) {
      solvedBoard[i] = -1
    }
  }

  const unknownIndices: number[] = []

  // Build unknowns from numbered cells (rupee values)
  for (let i = 0; i < solvedBoard.length; i++) {
    const cell = solvedBoard[i]
    // Treat positive values as number constraints (they indicate nearby bombs)
    if (cell > 0) {
      const colIndex = i % width
      const rowIndex = Math.floor(i / width)
      
      for (let colOffset = -1; colOffset <= 1; colOffset++) {
        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
          if (colIndex + colOffset >= 0 && colIndex + colOffset < width &&
            rowIndex + rowOffset >= 0 && rowIndex + rowOffset < height) {
            if (colOffset !== 0 || rowOffset !== 0) {
              const neighborIdx = colIndex + colOffset + (rowIndex + rowOffset) * width
              const neighborCell = solvedBoard[neighborIdx]
              
              if (neighborCell === -1) {
                if (!unknownIndices.includes(neighborIdx)) {
                  unknownIndices.push(neighborIdx)
                }
              }
            }
          }
        }
      }
    }
  }

  return unknownIndices.length
}
