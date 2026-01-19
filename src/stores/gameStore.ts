import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { BoardCell, GameConfig } from '../utils/gameLogic'
import { getGameConfig, createEmptyBoard, generatePlayBoard, Difficulty } from '../utils/gameLogic'
import { solveBoardProbabilities, calculateUnknownIndicesCount } from '../utils/solver'
import type { SolvedBoard } from '../utils/solver'

export const GameMode = {
  Play: 1,
  Solve: 2,
} as const

export type GameMode = typeof GameMode[keyof typeof GameMode]
export type { Difficulty }

export interface GameState {
  mode: GameMode
  difficulty: Difficulty
  config: GameConfig
  board: BoardCell[][]
  revealed: boolean[][]
  autoRevealed: boolean[][]
  currentRupees: number
  totalRupeesAllTime: number
  isGameOver: boolean
  isWon: boolean
  rupoorCount: number
  solvedBoard: SolvedBoard | null
  lastChangedIndex?: number
  showComputationWarning: boolean
  computationWarning: { time: number; combinations: number }
  boardTotal: number
  showInvalidBoardError: boolean
  requiresConfirmation: boolean
  closeRupeeModals: number
}

interface GameActions {
  newGame: (difficulty: Difficulty, mode: GameMode) => void
  revealCell: (row: number, col: number) => void
  updateCell: (row: number, col: number, value: BoardCell) => void
  setCurrentRupees: (rupees: number) => void
  setGameOver: (isGameOver: boolean) => void
  setIsWon: (isWon: boolean) => void
  setRupoorCount: (count: number) => void
  addTotalRupees: (amount: number) => void
  setGameConfig: (config: GameConfig) => void
  resetGame: (difficulty: Difficulty, mode: GameMode) => void
  setShowInvalidBoardError: (show: boolean) => void
  solveBoardInternal: () => void
  digCell: (row: number, col: number) => void
  confirmComputation: () => void
  cancelComputation: () => void
  triggerCloseRupeeModals: () => void
  revealAllCells: () => void
}

type GameStore = GameState & GameActions

const createEmptyRevealedBoard = (width: number, height: number): boolean[][] => {
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

const initialGameState = (difficulty: Difficulty): GameState => {
  const config = getGameConfig(difficulty)
  return {
    mode: 2,
    difficulty,
    config,
    board: createEmptyBoard(config.width, config.height),
    revealed: createEmptyRevealedBoard(config.width, config.height),
    autoRevealed: createEmptyRevealedBoard(config.width, config.height),
    currentRupees: 0,
    totalRupeesAllTime: 0,
    isGameOver: false,
    isWon: false,
    rupoorCount: config.rupoorCount,
    solvedBoard: null,
    lastChangedIndex: undefined,
    showComputationWarning: false,
    computationWarning: { time: 0, combinations: 0 },
    boardTotal: 0,
    showInvalidBoardError: false,
    requiresConfirmation: false,
    closeRupeeModals: 0,
  }
}

export const useGameStore = create<GameStore>()(
  devtools(
    (set, get) => ({
      ...initialGameState(Difficulty.Beginner),

      newGame: (difficulty: Difficulty, mode: GameMode) => {
    const config = getGameConfig(difficulty)
    const board = mode === GameMode.Play 
      ? generatePlayBoard(config.width, config.height, config.bombCount, config.rupoorCount)
      : createEmptyBoard(config.width, config.height)

    // Calculate total rupees on the board
    const totalRupees = board.flat().reduce((sum, cell) => sum + (cell > 0 ? cell : 0), 0)
    
    set({
      mode,
      difficulty,
      config,
      board,
      revealed: createEmptyRevealedBoard(config.width, config.height),
      autoRevealed: createEmptyRevealedBoard(config.width, config.height),
      currentRupees: 0,
      isGameOver: false,
      isWon: false,
      rupoorCount: config.rupoorCount,
      solvedBoard: null,
      lastChangedIndex: undefined,
      boardTotal: totalRupees,
      showInvalidBoardError: false,
    })

    // Trigger solver if in solve mode
    if (mode === GameMode.Solve) {
      get().solveBoardInternal()
    }
  },

  revealCell: (row: number, col: number) => {
    const state = get()
    const newRevealed = state.revealed.map(r => [...r])
    newRevealed[row][col] = true
    const idx = row * state.config.width + col
    set({ revealed: newRevealed, lastChangedIndex: idx })
  },

  updateCell: (row: number, col: number, value: BoardCell) => {
    const state = get()
    const prevValue = state.board[row][col]
    if (prevValue === value) {
      return
    }

    const newBoard = state.board.map(r => [...r])
    newBoard[row][col] = value
    const idx = row * state.config.width + col
    
    set({
      board: newBoard,
      lastChangedIndex: idx,
      boardTotal: Math.max(0, state.boardTotal - prevValue + value),
    })

    // Trigger solver if in solve mode
    if (state.mode === GameMode.Solve) {
      get().solveBoardInternal()
    }
  },

  setCurrentRupees: (rupees: number) => {
    set({ currentRupees: rupees })
  },

  setGameOver: (isGameOver: boolean) => {
    set({ isGameOver })
  },

  setIsWon: (isWon: boolean) => {
    set({ isWon })
  },

  setRupoorCount: (count: number) => {
    set({ rupoorCount: count })
  },

  addTotalRupees: (amount: number) => {
    const state = get()
    const newTotal = state.totalRupeesAllTime + amount
    console.log('Adding', amount, 'rupees. New total:', newTotal)
    set({ totalRupeesAllTime: newTotal })
  },

  setGameConfig: (config: GameConfig) => {
    set({ config })
  },

  resetGame: (difficulty: Difficulty, mode: GameMode) => {
    get().newGame(difficulty, mode)
  },

  setShowInvalidBoardError: (show: boolean) => {
    set({ showInvalidBoardError: show })
  },

  solveBoardInternal: () => {
    const state = get()
    if (state.mode !== GameMode.Solve) return

    const unknownIndicesCount = calculateUnknownIndicesCount(
      state.board,
      state.config.width,
      state.config.height
    )
    const totalCombinations = Math.round(Math.pow(2, unknownIndicesCount))

    // Show warning if computation will be heavy
    if (unknownIndicesCount >= 22) {
      const estimatedTime = Math.floor(totalCombinations / 1111111)
      
      // If time > 30 seconds, require confirmation
      if (estimatedTime > 30) {
        set({
          showComputationWarning: true,
          computationWarning: { time: estimatedTime, combinations: totalCombinations },
          requiresConfirmation: true,
        })
      } else {
        // Show warning but auto-proceed
        set({
          showComputationWarning: true,
          computationWarning: { time: estimatedTime, combinations: totalCombinations },
          requiresConfirmation: false,
        })

        // Defer computation to allow UI to update
        setTimeout(() => {
          const state = get()
          const result = solveBoardProbabilities(
            state.board,
            state.config.width,
            state.config.height,
            state.config.bombCount,
            state.rupoorCount
          )
          set({
            solvedBoard: result,
            showComputationWarning: false,
            showInvalidBoardError: result === null,
          })
        }, 100)
      }
    } else {
      // Compute immediately
      const result = solveBoardProbabilities(
        state.board,
        state.config.width,
        state.config.height,
        state.config.bombCount,
        state.rupoorCount
      )
      set({
        solvedBoard: result,
        showInvalidBoardError: result === null,
      })
    }
  },

  confirmComputation: () => {
    set({ requiresConfirmation: false })
    
    // Start computation
    setTimeout(() => {
      const state = get()
      const result = solveBoardProbabilities(
        state.board,
        state.config.width,
        state.config.height,
        state.config.bombCount,
        state.rupoorCount
      )
      set({
        solvedBoard: result,
        showComputationWarning: false,
        showInvalidBoardError: result === null,
      })
    }, 100)
  },

  cancelComputation: () => {
    set({
      showComputationWarning: false,
      requiresConfirmation: false,
    })
  },

  triggerCloseRupeeModals: () => {
    const state = get()
    set({ closeRupeeModals: state.closeRupeeModals + 1 })
  },

  revealAllCells: () => {
    const state = get()
    const newRevealed = state.revealed.map(r => [...r])
    const newAutoRevealed = state.autoRevealed.map(r => [...r])
    
    // Reveal all cells and mark which ones were auto-revealed
    for (let row = 0; row < state.config.height; row++) {
      for (let col = 0; col < state.config.width; col++) {
        if (!newRevealed[row][col]) {
          newRevealed[row][col] = true
          newAutoRevealed[row][col] = true
        }
      }
    }
    
    set({ revealed: newRevealed, autoRevealed: newAutoRevealed })
  },
  
  digCell: (row: number, col: number) => {
    const state = get()
    if (state.mode !== GameMode.Play || state.isGameOver || state.isWon) return
    if (state.revealed[row][col]) return

    const cellValue = state.board[row][col]

    // Reveal the cell
    const newRevealed = state.revealed.map(r => [...r])
    newRevealed[row][col] = true
    const idx = row * state.config.width + col

    // Handle outcomes
    if (cellValue === -1) {
      // Bomb: game over and settle house fee
      const settleAmount = Math.max(0, state.currentRupees - state.config.houseFee)
      set({ revealed: newRevealed, lastChangedIndex: idx, isGameOver: true })
      // Update total after game ends
      const newTotal = state.totalRupeesAllTime + settleAmount
      set({ totalRupeesAllTime: newTotal })
      return
    }

    let updatedRupoorCount = state.rupoorCount

    if (cellValue > 0) {
      // Rupee found
      const newCurrent = state.currentRupees + cellValue
      const newTotal = state.totalRupeesAllTime + cellValue
      set({ revealed: newRevealed, lastChangedIndex: idx, currentRupees: newCurrent, totalRupeesAllTime: newTotal })
    } else if (cellValue === -10) {
      // Rupoor found - decrement remaining rupoor count
      const newCurrent = Math.max(0, state.currentRupees - 10)
      updatedRupoorCount = Math.max(0, state.rupoorCount - 1)
      set({ revealed: newRevealed, lastChangedIndex: idx, currentRupees: newCurrent, rupoorCount: updatedRupoorCount })
    } else {
      // Empty/other values just reveal
      set({ revealed: newRevealed, lastChangedIndex: idx })
    }

    // Check win: all non-hazard cells revealed
    // Victory when unrevealed cells = bomb count + remaining rupoor count (only hazards remain)
    const checkState = get()
    let unreveledCount = 0
    for (let r = 0; r < checkState.config.height; r++) {
      for (let c = 0; c < checkState.config.width; c++) {
        if (!newRevealed[r][c]) {
          unreveledCount++
        }
      }
    }

    const hazardCount = checkState.config.bombCount + updatedRupoorCount
    if (unreveledCount === hazardCount) {
      set({ isWon: true })
    }
  },
    }),
    { name: 'thrill-digger' }
  )
)
