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

  // Count manually placed bombs and rupoors
  let manualBombCount = 0
  let manualRupoorCount = 0
  
  for (let i = 0; i < solvedBoard.length; i++) {
    if (solvedBoard[i] === -3) manualBombCount++ // Manually placed bomb
    if (solvedBoard[i] === -10 || solvedBoard[i] === -2) manualRupoorCount++ // Manually placed rupoor
  }

  let safeCount = solvedBoard.length
  const constraints: number[][] = []
  const unknownIndices: number[] = []

  // Build constraints from numbered cells (rupee values)
  for (let i = 0; i < solvedBoard.length; i++) {
    const cell = solvedBoard[i]
    // Treat positive values as number constraints (they indicate nearby bombs)
    if (cell > 0) {
      const unknownNeighbors: number[] = []
      let expectedBombs = getExpectedBombCount(cell)
      
      // Count adjacent bombs and rupoors
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
                unknownNeighbors.push(neighborIdx)
                if (!unknownIndices.includes(neighborIdx)) {
                  unknownIndices.push(neighborIdx)
                }
              } else if (neighborCell === -3 || neighborCell === -10) {
                expectedBombs--
              }
            }
          }
        }
      }
      
      // Only add constraint if there are unknown neighbors
      if (unknownNeighbors.length > 0) {
        unknownNeighbors.push(expectedBombs)
        constraints.push(unknownNeighbors)
      }
    }
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

  // Test all possible bomb placements
  for (let combo = 0; combo < totalCombinations; ++combo) {
    if (combo > 1e8) {
      computationLimitReached = true
      break
    }

    const placement: number[] = []
    let bombsPlaced = 0

    for (let bit = 0, remaining = combo; bit < unknownCount; ++bit, remaining = Math.floor(remaining / 2)) {
      placement.push(remaining % 2)
      if (remaining % 2 === 1) {
        bombsPlaced++
      }
    }

    if (bombsPlaced <= bombCount + rupoorCount && bombsPlaced >= bombCount + rupoorCount - safeCount) {
      let constraintsSatisfied = 0

      for (let c = 0; c < constraints.length; c++) {
        const constraint = constraints[c]
        let bombsNearCell = 0

        for (let pos = 0; pos < constraint.length - 1; pos++) {
          const unknownIndex = unknownIndices.indexOf(constraint[pos])
          if (unknownIndex !== -1) {
            bombsNearCell += placement[unknownIndex]
          }
        }

        const expectedValue = constraint[constraint.length - 1]
        if (bombsNearCell === expectedValue || bombsNearCell === expectedValue - 1) {
          constraintsSatisfied++
        }
      }

      if (constraintsSatisfied === constraints.length) {
        validSolutions.push(placement)
      }
    }
  }

  if (computationLimitReached) {
    alert(
      `Wow, you've computed 100,000,000 boards! The solver is going to stop here.\n\n` +
      `The rest of the boards will not be computed, so the probabilities are not entirely accurate!`
    )
  }

  // Validate board
  if (constraints.length > 0 && validSolutions.length === 0) {
    return null
  }

  let remainingExpected = (bombCount - manualBombCount) + (rupoorCount - manualRupoorCount)

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
 * Get color for probability display with 10 granular levels
 */
export function getProbabilityColor(probability: number): string {
  const percent = probability * 100
  
  // 10 granular color levels from green (safe) to red (dangerous)
  if (percent <= 0) return '#3d5a3d'      // 0%: Dark green
  if (percent <= 10) return '#4e7d5b'     // 1-10%: Forest green
  if (percent <= 20) return '#6b9b6b'     // 11-20%: Light green
  if (percent <= 30) return '#8bb58b'     // 21-30%: Pale green
  if (percent <= 40) return '#b8b058'     // 31-40%: Yellow-green
  if (percent <= 50) return '#c9a84a'     // 41-50%: Sandy yellow
  if (percent <= 60) return '#d89847'     // 51-60%: Orange-yellow
  if (percent <= 70) return '#d47a4a'     // 61-70%: Burnt orange
  if (percent <= 80) return '#c55a3d'     // 71-80%: Red-orange
  if (percent <= 90) return '#a84535'     // 81-90%: Deep red
  return '#9e3a33'                         // 91-100%: Dark red
}

/**
 * Check if a rupee value is valid for a cell based on nearby bomb/rupoor count
 * Uses the same logic as calculateRupeeValue
 */
export function isValidRupeeForCell(
  board: number[][],
  row: number,
  col: number,
  rupeeValue: number,
  width: number,
  height: number
): boolean {
  // Undug, bombs, and rupoors are always valid
  if (rupeeValue === 0 || rupeeValue === -3 || rupeeValue === -10) return true

  // Count adjacent bombs and rupoors
  let nearbyBombs = 0
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const nr = row + dr
      const nc = col + dc
      if (nr >= 0 && nr < height && nc >= 0 && nc < width) {
        const cell = board[nr][nc]
        if (cell === -3 || cell === -10) nearbyBombs++
      }
    }
  }

  // Check if this rupee value matches the bomb count using game logic
  if (nearbyBombs <= 0 && rupeeValue === 1) return true      // Green
  if (nearbyBombs >= 1 && nearbyBombs <= 2 && rupeeValue === 5) return true    // Blue
  if (nearbyBombs >= 3 && nearbyBombs <= 4 && rupeeValue === 20) return true   // Red
  if (nearbyBombs >= 5 && nearbyBombs <= 6 && rupeeValue === 100) return true  // Silver
  if (nearbyBombs >= 7 && rupeeValue === 300) return true                      // Gold
  
  return false
}

/**
 * Get all valid rupee options for a cell
 * Returns all options without validation - solver will validate when computing
 */
export function getValidRupeeOptions(
  board: number[][],
  row: number,
  col: number,
  width: number,
  height: number
): number[] {
  // Return all options; solver validates on probability compute
  return [0, 1, 5, 20, 100, 300, -10, -3]
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
