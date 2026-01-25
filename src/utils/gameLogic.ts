/**
 * Pure game logic functions
 */

export const Difficulty = {
  Beginner: 1,
  Intermediate: 2,
  Expert: 3,
} as const

export type Difficulty = typeof Difficulty[keyof typeof Difficulty]

export type BoardCell = number // -3=bomb, -10=rupoor, -1=undug, 0+=rupee value or probability

export interface GameConfig {
  difficulty: Difficulty
  width: number
  height: number
  houseFee: number
  bombCount: number
  rupoorCount: number
}

const DIFFICULTY_CONFIGS: Record<Difficulty, GameConfig> = {
  [Difficulty.Beginner]: { difficulty: Difficulty.Beginner, width: 5, height: 4, houseFee: 30, bombCount: 4, rupoorCount: 0 },
  [Difficulty.Intermediate]: { difficulty: Difficulty.Intermediate, width: 6, height: 5, houseFee: 50, bombCount: 4, rupoorCount: 4 },
  [Difficulty.Expert]: { difficulty: Difficulty.Expert, width: 8, height: 5, houseFee: 70, bombCount: 8, rupoorCount: 8 },
}

export function getGameConfig(difficulty: Difficulty): GameConfig {
  return { ...DIFFICULTY_CONFIGS[difficulty] }
}

export function createEmptyBoard(width: number, height: number): BoardCell[][] {
  return Array(height)
    .fill(null)
    .map(() => Array(width).fill(0))
}

export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Generate a play board with bombs, rupoors, and rupee values
 */
export function generatePlayBoard(width: number, height: number, bombCount: number, rupoorCount: number): BoardCell[][] {
  const board = createEmptyBoard(width, height)
  const totalCells = width * height
  const placed = { bombs: 0, rupoors: 0 }

  // Place bombs randomly
  while (placed.bombs < bombCount) {
    const idx = getRandomInt(0, totalCells - 1)
    const row = Math.floor(idx / width)
    const col = idx % width
    if (board[row][col] === 0) {
      board[row][col] = -1 // Bomb
      placed.bombs++
    }
  }

  // Place rupoors randomly
  while (placed.rupoors < rupoorCount) {
    const idx = getRandomInt(0, totalCells - 1)
    const row = Math.floor(idx / width)
    const col = idx % width
    if (board[row][col] === 0) {
      board[row][col] = -10 // Rupoor
      placed.rupoors++
    }
  }

  // Fill remaining with rupee values based on nearby bombs
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (board[row][col] === 0) {
        const nearbyBombs = countAdjacentBombs(board, row, col, width, height)
        board[row][col] = calculateRupeeValue(nearbyBombs)
      }
    }
  }

  return board
}

export function countAdjacentBombs(board: BoardCell[][], row: number, col: number, width: number, height: number): number {
  let count = 0
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const nr = row + dr
      const nc = col + dc
      if (nr >= 0 && nr < height && nc >= 0 && nc < width) {
        const cell = board[nr][nc]
        if (cell === -1 || cell === -10) count++
      }
    }
  }
  return count
}

export function calculateRupeeValue(nearbyBombs: number): number {
  if (nearbyBombs <= 0) return 1 // Green rupee
  if (nearbyBombs <= 2) return 5 // Blue rupee
  if (nearbyBombs <= 4) return 20 // Red rupee
  if (nearbyBombs <= 6) return 100 // Silver rupee
  return 300 // Gold rupee
}

export function getItemName(value: number): string {
  switch (value) {
    case -1:
      return 'Bomb'
    case -10:
      return 'Rupoor'
    case -2:
      return 'Rupoor'
    case 0:
      return 'Undug'
    case 1:
      return 'Green rupee'
    case 5:
      return 'Blue rupee'
    case 20:
      return 'Red rupee'
    case 100:
      return 'Silver rupee'
    case 300:
      return 'Gold rupee'
    default:
      return 'Error'
  }
}

export function getImageNameForItem(itemName: string): string {
  return itemName.toLowerCase().replace(/\s+/g, '')
}

/**
 * Convert bomb count value to display name for Solve mode
 * In Solve mode we store bomb counts (1,2,4,6,8) but need rupee names for images
 */
export function getBombCountDisplayName(bombCount: number): string {
  switch (bombCount) {
    case 1: return 'Green rupee'
    case 2: return 'Blue rupee'
    case 4: return 'Red rupee'
    case 6: return 'Silver rupee'
    case 8: return 'Gold rupee'
    default: return 'Error'
  }
}

/**
 * Create an empty boolean board for tracking revealed state
 */
export function createEmptyRevealedBoard(width: number, height: number): boolean[][] {
  const board: boolean[][] = []
  for (let i = 0; i < height; i++) {
    const row: boolean[] = []
    for (let j = 0; j < width; j++) {
      row.push(false)
    }
    board.push(row)
  }
  return board
}

/**
 * Convert rupee value to bomb count for storage in Solve mode
 * Matches vanilla version's mapping
 */
export function convertRupeeValueToBombCount(value: number): number {
  const converted = (() => {
    switch (value) {
      case 1: return 1      // Green rupee
      case 5: return 2      // Blue rupee
      case 20: return 4     // Red rupee
      case 100: return 6    // Silver rupee
      case 300: return 8    // Gold rupee
      default: return value // Return unchanged for special values (-1, -2, -10, etc.)
    }
  })()

  return converted
}

/**
 * Deep clone a 2D board array
 */
export function cloneBoard(board: BoardCell[][]): BoardCell[][] {
  return board.map(row => [...row])
}

/**
 * Convert a Play Mode board to Solve Mode format for the solver
 * - Unrevealed cells become 0 (unknown)
 * - Revealed bombs/rupoors become -2 (hazard markers)
 * - Revealed rupees become bomb counts (1/2/4/6/8) based on adjacent hazards
 */
export function convertPlayBoardToSolveBoard(
  board: BoardCell[][],
  revealed: boolean[][],
  width: number,
  height: number
): BoardCell[][] {
  return board.map((row, rowIdx) => 
    row.map((cell, colIdx) => {
      if (!revealed[rowIdx][colIdx]) {
        return 0 // Unrevealed -> unknown
      }
      // Convert revealed Play Mode values to Solve Mode format
      if (cell === -1) {
        return -2 // Bomb -> hazard marker
      }
      if (cell === -10) {
        return -2 // Rupoor -> hazard marker (marks adjacent cells as safe)
      }
      // In Play Mode, rupee values are rewards, not bomb counts
      // We need to count actual adjacent hazards for the solver
      let adjacentHazards = 0
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          const nr = rowIdx + dr
          const nc = colIdx + dc
          if (nr >= 0 && nr < height && nc >= 0 && nc < width) {
            const neighborCell = board[nr][nc]
            if (neighborCell === -1 || neighborCell === -10) {
              adjacentHazards++
            }
          }
        }
      }
      // Map to Solve mode values: Green=1 (0 bombs), Blue=2 (1-2), Red=4 (3-4), Silver=6 (5-6), Gold=8 (7-8)
      if (adjacentHazards <= 0) return 1
      if (adjacentHazards <= 2) return 2
      if (adjacentHazards <= 4) return 4
      if (adjacentHazards <= 6) return 6
      return 8
    })
  )
}
