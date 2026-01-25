import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { BoardCell, GameConfig } from '../utils/gameLogic'
import { getGameConfig, createEmptyBoard, generatePlayBoard, Difficulty } from '../utils/gameLogic'
import { solveBoardProbabilities, calculateUnknownIndicesCount } from '../utils/solver'
import type { SolvedBoard } from '../utils/solver'
import type { SolverWorkerInput, SolverWorkerOutput } from '../workers/solver.worker'

// Initialize worker lazily
let solverWorker: Worker | null = null
const getSolverWorker = (): Worker => {
  if (!solverWorker) {
    solverWorker = new Worker(new URL('../workers/solver.worker.ts', import.meta.url), {
      type: 'module'
    })
  }
  return solverWorker
}

export const GameMode = {
  Play: 1,
  Solve: 2,
} as const

export type GameMode = typeof GameMode[keyof typeof GameMode]
export type { Difficulty }

/**
 * Convert rupee value to bomb count for storage in Solve mode
 * Matches vanilla version's mapping
 */
function convertRupeeValueToBombCount(value: number): number {
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
  console.log(`Converting rupee value ${value} to bomb count ${converted}`)
  return converted
}

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
  showProbabilitiesInPlayMode: boolean
  invalidSourceIndex?: number
  isComputingInWorker: boolean
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
  // Clears invalid source highlight when needed
  solveBoardInternal: () => void
  digCell: (row: number, col: number) => void
  confirmComputation: () => void
  cancelComputation: () => void
  triggerCloseRupeeModals: () => void
  revealAllCells: () => void
  toggleProbabilitiesInPlayMode: () => void
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
    showProbabilitiesInPlayMode: false,
    invalidSourceIndex: undefined,
    isComputingInWorker: false,
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
      showProbabilitiesInPlayMode: false,
      invalidSourceIndex: undefined,
      isComputingInWorker: false,
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

    // Convert rupee values to bomb counts in Solve mode (matching vanilla)
    let storedValue = value
    if (state.mode === GameMode.Solve && value > 0) {
      storedValue = convertRupeeValueToBombCount(value)
    }

    // If already converted (e.g., called internally with bomb counts), check if conversion matches
    const prevDisplayValue = state.board[row][col]
    if (prevDisplayValue === storedValue) {
      return
    }

    const newBoard = state.board.map(r => [...r])
    newBoard[row][col] = storedValue
    const idx = row * state.config.width + col
    
    set({
      board: newBoard,
      lastChangedIndex: idx,
      boardTotal: Math.max(0, state.boardTotal - prevValue + storedValue),
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

        // Use worker for computation >= 22 unknowns to keep UI responsive
        setTimeout(() => {
          const state = get()
          set({ isComputingInWorker: true })
          
          const worker = getSolverWorker()
          const input: SolverWorkerInput = {
            board: state.board,
            width: state.config.width,
            height: state.config.height,
            bombCount: state.config.bombCount,
            rupoorCount: state.rupoorCount
          }
          
          worker.onmessage = (e: MessageEvent<SolverWorkerOutput>) => {
            const { result, error } = e.data
            if (error) {
              console.error('Worker error:', error)
            }
            set({
              solvedBoard: result,
              showComputationWarning: false,
              showInvalidBoardError: result === null,
              invalidSourceIndex: result === null ? state.lastChangedIndex : undefined,
              isComputingInWorker: false,
            })
          }
          
          worker.postMessage(input)
        }, 100)
      }
    } else {
      // Compute immediately for small boards (< 22 unknowns)
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
        invalidSourceIndex: result === null ? state.lastChangedIndex : undefined,
      })
    }
  },

  confirmComputation: () => {
    set({ requiresConfirmation: false })
    
    // Start computation
    setTimeout(() => {
      const state = get()
      
      let solverBoard = state.board
      
      // If in Play Mode, convert the board format for solving
      if (state.mode === GameMode.Play) {
        solverBoard = state.board.map((row, rowIdx) => 
          row.map((cell, colIdx) => {
            if (!state.revealed[rowIdx][colIdx]) {
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
                if (nr >= 0 && nr < state.config.height && nc >= 0 && nc < state.config.width) {
                  const neighborCell = state.board[nr][nc]
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
      
      // Use worker for heavy computation
      set({ isComputingInWorker: true })
      
      const worker = getSolverWorker()
      const input: SolverWorkerInput = {
        board: solverBoard,
        width: state.config.width,
        height: state.config.height,
        bombCount: state.config.bombCount,
        rupoorCount: state.rupoorCount
      }
      
      worker.onmessage = (e: MessageEvent<SolverWorkerOutput>) => {
        const { result, error } = e.data
        if (error) {
          console.error('Worker error:', error)
        }
        set({
          solvedBoard: result,
          showComputationWarning: false,
          showInvalidBoardError: result === null,
          invalidSourceIndex: result === null ? state.lastChangedIndex : undefined,
          isComputingInWorker: false,
          showProbabilitiesInPlayMode: state.mode === GameMode.Play ? true : state.showProbabilitiesInPlayMode,
        })
      }
      
      worker.postMessage(input)
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

  toggleProbabilitiesInPlayMode: () => {
    const state = get()
    if (state.mode !== GameMode.Play) return
    
    const newShowProbabilities = !state.showProbabilitiesInPlayMode
    
    if (newShowProbabilities) {
      // Create a solver board where unrevealed cells are 0 (unknown)
      // Convert Play Mode format to Solve Mode format:
      // Play: -1=bomb, -10=rupoor, 1/5/20/100/300=rupee values
      // Solve: -2=bomb/rupoor, -1=unknown, 1/2/4/6/8=bomb counts
      const solverBoard = state.board.map((row, rowIdx) => 
        row.map((cell, colIdx) => {
          if (!state.revealed[rowIdx][colIdx]) {
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
              if (nr >= 0 && nr < state.config.height && nc >= 0 && nc < state.config.width) {
                const neighborCell = state.board[nr][nc]
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
      
      // Calculate unknown indices count for warning
      const unknownIndicesCount = calculateUnknownIndicesCount(
        solverBoard,
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
              solverBoard,
              state.config.width,
              state.config.height,
              state.config.bombCount,
              state.rupoorCount
            )
            set({
              showProbabilitiesInPlayMode: true,
              solvedBoard: result,
              showComputationWarning: false,
              invalidSourceIndex: result === null ? state.lastChangedIndex : undefined,
            })
          }, 100)
        }
      } else {
        // Compute immediately
        const result = solveBoardProbabilities(
          solverBoard,
          state.config.width,
          state.config.height,
          state.config.bombCount,
          state.rupoorCount
        )
        
        set({ 
          showProbabilitiesInPlayMode: true,
          solvedBoard: result,
          invalidSourceIndex: result === null ? state.lastChangedIndex : undefined,
        })
      }
    } else {
      // Hide probabilities
      set({ 
        showProbabilitiesInPlayMode: false,
        solvedBoard: null,
        invalidSourceIndex: undefined,
      })
    }
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

    // Recalculate probabilities if they are being shown in Play Mode
    if (checkState.showProbabilitiesInPlayMode && !checkState.isWon) {
      // Create solver board: revealed cells show actual bomb counts, unrevealed cells are 0
      const solverBoard = checkState.board.map((row, rowIdx) => 
        row.map((cell, colIdx) => {
          if (!newRevealed[rowIdx][colIdx]) {
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
              if (nr >= 0 && nr < checkState.config.height && nc >= 0 && nc < checkState.config.width) {
                const neighborCell = checkState.board[nr][nc]
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
      
      // Calculate unknown indices count for warning
      const unknownIndicesCount = calculateUnknownIndicesCount(
        solverBoard,
        checkState.config.width,
        checkState.config.height
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
              solverBoard,
              state.config.width,
              state.config.height,
              state.config.bombCount,
              updatedRupoorCount
            )
            set({
              solvedBoard: result,
              showComputationWarning: false,
            })
          }, 100)
        }
      } else {
        // Compute immediately
        const result = solveBoardProbabilities(
          solverBoard,
          checkState.config.width,
          checkState.config.height,
          checkState.config.bombCount,
          updatedRupoorCount
        )
        set({ solvedBoard: result })
      }
    }
  },
    }),
    { name: 'thrill-digger' }
  )
)
