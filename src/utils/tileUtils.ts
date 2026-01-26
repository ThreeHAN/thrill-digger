import type { BoardCell } from './gameLogic'
import { getProbabilityColor } from './solver'
import { GameMode } from '../stores/gameStore'

/**
 * Returns a percentage to display for a probability cell.
 * - Only for empty cells (`cellVal === 0`) in Solve mode or unrevealed cells in Play mode
 * - Hides when probability is undefined or sentinel (-2)
 * - Returns percentage with 2 decimal places, rounded down
 */
export function getDisplayProbability(
  cellVal: BoardCell,
  prob: number | undefined,
  gameMode: GameMode
): number | undefined {

    if (prob === 0.6) {
    debugger;
  }

  if (prob === undefined || prob === -2) {
    return undefined
  }
  // In Solve mode, only show on empty cells (cellVal === 0)
  // In Play mode, show on any unrevealed cell (cellVal will be -1 for undug)
  if (gameMode === GameMode.Solve && cellVal !== 0) {
    return undefined
  }
  const percent = prob * 100


  // Handle floating point errors - treat extremely small values as 0
  if (percent < 0.001) {
    return 0
  }
  
  // Round up small non-zero probabilities to 1%
  if (percent > 0 && percent < 1) {
    return 1
  }

  // Round down for all other values
  return Math.floor(percent)
}

/**
 * Compute the tile class based on mode and cell state.
 */
export function computeTileClass(
  gameMode: GameMode,
  cellValue: BoardCell,
  isRevealed: boolean,
  solverProbability: number | undefined,
  isLowestProbability?: boolean,
  isAutoRevealed?: boolean
): string {
  let tileClass = 'tile undug'

  if (gameMode === GameMode.Solve) {
    if (cellValue > 0) {
      tileClass += ' tile-rupee'
    } else if (solverProbability !== undefined && solverProbability !== -2) {
      tileClass += ' ' + getProbabilityColor(solverProbability)
    }
  } else if (gameMode === GameMode.Play) {
    if (isRevealed && cellValue > 0) {
      tileClass += ' tile-safe'
    } else if (isRevealed && cellValue === -1) {
      tileClass += ' tile-bomb'
    }
    // Show probability colors on unrevealed tiles when probabilities are shown
    if (!isRevealed && solverProbability !== undefined && solverProbability !== -2) {
      tileClass += ' ' + getProbabilityColor(solverProbability)
    }
    // Add yellow background for auto-revealed tiles
    if (isAutoRevealed) {
      tileClass += ' tile-auto-revealed'
    }
  }

  if (isLowestProbability && gameMode === GameMode.Solve) {
    tileClass += ' lowest-hole-pulse'
  }

  return tileClass
}

/**
 * Stable id formatting for a hole cell.
 */
export function formatHoleId(row: number, col: number): string {
  return `hole_${col}_${row}`
}
