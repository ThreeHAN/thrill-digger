/**
 * Pure game logic functions
 */

export type BoardCell = number // -3=bomb, -2=rupoor, -1=undug, 0+=rupee value or probability

export interface GameConfig {
  difficulty: 1 | 2 | 3 // 1=Beginner, 2=Intermediate, 3=Expert
  width: number
  height: number
  houseFee: number
  bombCount: number
  rupoorCount: number
}

const DIFFICULTY_CONFIGS: Record<1 | 2 | 3, GameConfig> = {
  1: { difficulty: 1, width: 5, height: 4, houseFee: 30, bombCount: 4, rupoorCount: 0 },
  2: { difficulty: 2, width: 6, height: 5, houseFee: 50, bombCount: 4, rupoorCount: 4 },
  3: { difficulty: 3, width: 8, height: 5, houseFee: 70, bombCount: 8, rupoorCount: 8 },
}

export function getGameConfig(difficulty: 1 | 2 | 3): GameConfig {
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
  let placed = { bombs: 0, rupoors: 0 }

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
    case -3:
      return 'Bomb'
    case -10:
      return 'Rupoor'
    case -1:
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
