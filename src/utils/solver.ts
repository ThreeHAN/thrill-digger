/**
 * Constraint satisfaction solver for Thrill Digger
 * Calculates bomb probability for each unrevealed cell
 */

import type { BoardCell } from './gameLogic'

export type SolvedBoard = number[] // Probabilities or special values like -2 (unknown)

/**
 * In Solve mode, values on the board are bomb counts (1,2,4,6,8)
 * These represent the expected bomb count for constraint satisfaction
 * Green=1, Blue=2, Red=4, Silver=6, Gold=8
 */

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
  const boardLength = flat1D.length
  let solvedBoard = flat1D.slice(0)
  
  // Combined first pass: convert empty cells to unknown and process greens/rupoors
  for (let i = 0; i < boardLength; i++) {
    if (solvedBoard[i] === 0) {
      solvedBoard[i] = -1
    }
  }

  // Second pass: clear neighbors of greens/rupoors
  // (Must be separate pass to avoid processing cells we just modified)
  for (let i = 0; i < boardLength; i++) {
    if (solvedBoard[i] === 1 || solvedBoard[i] === -10) {
      forEachNeighbor(i, width, height, (neighborIdx) => {
        if (solvedBoard[neighborIdx] === -1) {
          solvedBoard[neighborIdx] = 0
        }
      })
    }
  }

  // Track already-known hazards so remaining counts reflect placed rupoors
  let knownRupoorCount = 0
  let safeCount = 0
  for (let i = 0; i < boardLength; i++) {
    const cell = solvedBoard[i]
    if (cell === -10 || cell === -2) {
      knownRupoorCount++
    }
    if (cell === -1) {
      safeCount++
    }
  }
  const constraints: number[][] = []
  const unknownSet = new Set<number>() // Use Set for O(1) membership testing
  
  // Build constraints from numbered cells (bomb count values)
  // console.log('Building constraints from board...')
  for (let i = 0; i < solvedBoard.length; i++) {
    const cell = solvedBoard[i]
    // Vanilla parity: only treat values > 1 as constraint sources (greens are skipped)
    if (cell > 1) {
      const unknownNeighbors: number[] = []
      let expectedBombs = cell  // Value is already the bomb count
      // console.log(`Cell at [${rowIndex},${colIndex}] value=${cell} expects ${expectedBombs} bombs`)
      
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
        // console.log(`  -> Constraint: ${unknownNeighbors.length} unknowns, expecting ${expectedBombs} bombs`)
        unknownNeighbors.push(expectedBombs)
        constraints.push(unknownNeighbors)
      } else {
        // console.log(`  -> No unknown neighbors, constraint skipped`)
      }
    }
  }
  // console.log(`Total constraints: ${constraints.length}`)

  // Convert Set to array and create index map for O(1) lookup
  const unknownIndices = Array.from(unknownSet)
  const unknownIndexMap = new Map<number, number>()
  for (let i = 0; i < unknownIndices.length; i++) {
    unknownIndexMap.set(unknownIndices[i], i)
  }

  // Pre-process constraints: convert cell indices to placement positions
  // This avoids Map lookups in the hot loop
  const processedConstraints: { positions: number[], expectedValue: number }[] = []
  const constraintsLength = constraints.length
  
  for (let c = 0; c < constraintsLength; c++) {
    const constraint = constraints[c]
    const constraintLength = constraint.length
    const positions: number[] = []
    
    for (let pos = 0; pos < constraintLength - 1; pos++) {
      const unknownCellIdx = constraint[pos]
      const posInPlacement = unknownIndexMap.get(unknownCellIdx)!
      positions.push(posInPlacement)
    }
    
    processedConstraints.push({
      positions,
      expectedValue: constraint[constraintLength - 1]
    })
  }

  // Adjust safeCount: subtract unknown cells from total

  safeCount -= unknownIndices.length
  const validSolutions: number[][] = []
  let computationLimitReached = false
  const unknownCount = unknownIndices.length
  const totalCombinations = Math.round(Math.pow(2, unknownCount))
  const remainingHazards = Math.max(0, bombCount + rupoorCount - knownRupoorCount)

  // Reuse placement array to avoid allocations
  const placement: number[] = new Array(unknownCount)
  // Vanilla parity: bombs placed must be in range [remainingHazards - safeCount, remainingHazards]
  const maxBombsNeeded = remainingHazards
  const minBombsNeeded = Math.max(0, remainingHazards - safeCount)

  // Test all possible bomb placements
  for (let combo = 0; combo < totalCombinations; ++combo) {
    if (combo > 4e8) {
      computationLimitReached = true
      break
    }

    // Use bitwise operations for faster bit extraction
    // First, count bits using Brian Kernighan's algorithm
    let bombsPlaced = 0
    let temp = combo
    while (temp) {
      temp &= temp - 1
      bombsPlaced++
    }

    // Early termination: check bomb count bounds first before constraint checking
    if (bombsPlaced > maxBombsNeeded || bombsPlaced < minBombsNeeded) {
      continue
    }

    // Now extract the actual placement
    for (let bit = 0; bit < unknownCount; ++bit) {
      placement[bit] = (combo >> bit) & 1
    }

    let constraintsSatisfied = 0

    for (let c = 0; c < constraintsLength; c++) {
      const processed = processedConstraints[c]
      const positions = processed.positions
      const expectedValue = processed.expectedValue
      const positionsLength = positions.length
      let bombsNearCell = 0

      for (let pos = 0; pos < positionsLength; pos++) {
        bombsNearCell += placement[positions[pos]]
      }

      // Vanilla parity: allow exact value or one less
      if (bombsNearCell === expectedValue || (bombsNearCell === expectedValue - 1 && expectedValue > 0)) {
        constraintsSatisfied++
      }
    }

    if (constraintsSatisfied === constraintsLength) {
      validSolutions.push([...placement])
    }
  }

  if (computationLimitReached) {
    // Computation limit reached at 100 million combinations
  }

  // Validate board
  // console.log('=== Validation Results ===')
  // console.log('Constraints:', constraints.length, 'Unknown indices:', unknownIndices.length)
  // console.log('Valid solutions found:', validSolutions.length)
  // console.log('Total combinations tested:', totalCombinations)
  // console.log('remainingHazards:', remainingHazards, 'knownRupoorCount:', knownRupoorCount)
  // console.log('minBombsNeeded:', minBombsNeeded, 'maxBombsNeeded:', maxBombsNeeded)
  
  if (constraints.length > 0 && validSolutions.length === 0) {
    // console.log('❌ BOARD INVALID: No valid solutions found for constraints')
    // console.log('Constraints were:', constraints)
    // console.log('Board state:', solvedBoard)
    // console.log('unknownIndices:', unknownIndices)
    return null
  }

  let remainingExpected = remainingHazards
  const validSolutionsCount = validSolutions.length

  // Calculate probability for each unknown cell
  for (let unknownPos = 0; unknownPos < unknownIndices.length; unknownPos++) {
    let bombOccurrences = 0

    for (let solutionIdx = 0; solutionIdx < validSolutionsCount; solutionIdx++) {
      bombOccurrences += validSolutions[solutionIdx][unknownPos]
    }

    if (computationLimitReached && bombOccurrences === 0) {
      solvedBoard[unknownIndices[unknownPos]] = -2 // Unknown
    } else {
      const probability = bombOccurrences / validSolutionsCount
      remainingExpected -= probability
      solvedBoard[unknownIndices[unknownPos]] = probability
    }
  }

  if (Math.round(remainingExpected * 100) < 0) {
   // console.log('❌ BOARD INVALID: Remaining expected bombs is negative:', remainingExpected)
   return null
  }

  const defaultProbability = remainingExpected / safeCount

  for (let cellIdx = 0; cellIdx < solvedBoard.length; cellIdx++) {
    // Only set default probability for truly unknown cells
    if (solvedBoard[cellIdx] === -1) {
      solvedBoard[cellIdx] = defaultProbability
    }
  }

  return solvedBoard
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
