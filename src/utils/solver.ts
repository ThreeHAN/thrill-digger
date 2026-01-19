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
export function solveBoardProbabilities(board: BoardCell[][], width: number, height: number, bombCount: number, rupoorCount: number): SolvedBoard | null {
  
  
  const flat1D = board.flat()
  let solvedBoard = flat1D.slice(0)
  // Convert empty cells (0) to unknown (-1) for solving
  for (let i = 0; i < solvedBoard.length; i++) {
    if (solvedBoard[i] === 0) {
      solvedBoard[i] = -1
    }
  }

  // Vanilla parity: if a revealed green (1) or rupoor (-2) is on the board, clear nearby unknowns
  // (vanilla marks adjacent -1 to 0 for green cells, effectively removing those
  // neighbors from constraint consideration).
  for (let i = 0; i < solvedBoard.length; i++) {
    if (solvedBoard[i] === 1 || solvedBoard[i] === -2) {
      forEachNeighbor(i, width, height, (neighborIdx) => {
        if (solvedBoard[neighborIdx] === -1) {
          solvedBoard[neighborIdx] = 0
        }
      })
    }
  }

  // Track already-known hazards so remaining counts reflect placed rupoors
  const knownRupoorCount = solvedBoard.reduce((count, cell) => (
    cell === -10 || cell === -2 ? count + 1 : count
  ), 0)

  let safeCount = solvedBoard.length
  const constraints: number[][] = []
  const unknownSet = new Set<number>() // Use Set for O(1) membership testing
  
  // Build constraints from numbered cells (rupee values)
  console.log('Building constraints from board...')
  for (let i = 0; i < solvedBoard.length; i++) {
    const cell = solvedBoard[i]
    // Vanilla parity: only treat values > 1 as constraint sources (greens are skipped)
    if (cell > 1) {
      const unknownNeighbors: number[] = []
      let expectedBombs = getExpectedBombCount(cell)
      const colIndex = i % width
      const rowIndex = Math.floor(i / width)
      console.log(`Cell at [${rowIndex},${colIndex}] value=${cell} expects ${expectedBombs} bombs`)
      
      // Count adjacent bombs and rupoors
      forEachNeighbor(i, width, height, (neighborIdx) => {
        const neighborCell = solvedBoard[neighborIdx]
        
        if (neighborCell === -1) {
          unknownNeighbors.push(neighborIdx)
          unknownSet.add(neighborIdx)
        } else if (neighborCell === -10 || neighborCell === -2) {
          // Rupoors decrement expected bombs (vanilla uses -2 as rupoor marker)
          expectedBombs--
        }
      })
      
      // Only add constraint if there are unknown neighbors
      if (unknownNeighbors.length > 0) {
        console.log(`  -> Constraint: ${unknownNeighbors.length} unknowns, expecting ${expectedBombs} bombs`)
        unknownNeighbors.push(expectedBombs)
        constraints.push(unknownNeighbors)
      } else {
        console.log(`  -> No unknown neighbors, constraint skipped`)
      }
    }
  }
  console.log(`Total constraints: ${constraints.length}`)

  // Convert Set to array and create index map for O(1) lookup
  const unknownIndices = Array.from(unknownSet)
  const unknownIndexMap = new Map<number, number>()
  for (let i = 0; i < unknownIndices.length; i++) {
    unknownIndexMap.set(unknownIndices[i], i)
  }

  // Count safeCount (cells that are not already known)
  for (let i = 0; i < solvedBoard.length; i++) {
    if (solvedBoard[i] !== -1) {
      safeCount--
    }
  }

  safeCount -= unknownIndices.length
  const validSolutions: number[][] = []
  let computationLimitReached = false
  const unknownCount = unknownIndices.length
  const totalCombinations = Math.round(Math.pow(2, unknownCount))
  const remainingHazards = Math.max(0, bombCount + rupoorCount - knownRupoorCount)

  // Reuse placement array to avoid allocations
  const placement: number[] = new Array(unknownCount)
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

    for (let c = 0; c < constraints.length; c++) {
      const constraint = constraints[c]
      let bombsNearCell = 0

      for (let pos = 0; pos < constraint.length - 1; pos++) {
        const unknownCellIdx = constraint[pos]
        const posInPlacement = unknownIndexMap.get(unknownCellIdx)
        if (posInPlacement !== undefined) {
          bombsNearCell += placement[posInPlacement]
        }
      }

      const expectedValue = constraint[constraint.length - 1]
      if (bombsNearCell === expectedValue || bombsNearCell === expectedValue - 1) {
        constraintsSatisfied++
      }
    }

    if (constraintsSatisfied === constraints.length) {
      validSolutions.push([...placement])
    }
  }

  if (computationLimitReached) {
    // Computation limit reached at 100 million combinations
  }

  // Validate board
  console.log('=== Validation Results ===')
  console.log('Constraints:', constraints.length, 'Unknown indices:', unknownIndices.length)
  console.log('Valid solutions found:', validSolutions.length)
  console.log('Total combinations tested:', totalCombinations)
  
  if (constraints.length > 0 && validSolutions.length === 0) {
    console.log('❌ BOARD INVALID: No valid solutions found for constraints')
    console.log('Constraints were:', constraints)
    return null
  }

  let remainingExpected = remainingHazards

  // Calculate probability for each unknown cell
  for (let unknownPos = 0; unknownPos < unknownIndices.length; unknownPos++) {
    let bombOccurrences = 0

    for (let solutionIdx = 0; solutionIdx < validSolutions.length; solutionIdx++) {
      bombOccurrences += validSolutions[solutionIdx][unknownPos]
    }

    if (computationLimitReached && bombOccurrences === 0) {
      solvedBoard[unknownIndices[unknownPos]] = -2 // Unknown
    } else {
      const probability = bombOccurrences / validSolutions.length
      remainingExpected -= probability
      solvedBoard[unknownIndices[unknownPos]] = probability
    }
  }

  if (Math.round(remainingExpected * 100) < 0) {
   console.log('❌ BOARD INVALID: Remaining expected bombs is negative:', remainingExpected)
   return null
  }

  const defaultProbability = remainingExpected / safeCount

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
