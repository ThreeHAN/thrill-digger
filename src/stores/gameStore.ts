import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { BoardCell, GameConfig } from '../utils/gameLogic'
import { 
  getGameConfig, 
  createEmptyBoard, 
  generatePlayBoard, 
  Difficulty,
  createEmptyRevealedBoard,
  convertRupeeValueToBombCount,
  convertPlayBoardToSolveBoard
} from '../utils/gameLogic'
import { solveBoardProbabilities, calculateUnknownIndicesCount } from '../utils/solver'
import type { SolvedBoard } from '../utils/solver'
import type { SolverWorkerInput } from '../workers/solver.worker'
import { createWorkerMessageHandler, calculateSolverETA } from '../utils/workerHelpers'

// Initialize worker lazily
let solverWorker: Worker | null = null
let isWorkerTerminating = false
const getSolverWorker = (): Worker => {
  if (!solverWorker) {
    console.log('🚀 Creating solver Web Worker for heavy computations...')
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
  showLoadingSpinner: boolean
  computationWarning: { time: number; combinations: number; processed?: number }
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

const initialGameState = (difficulty: Difficulty): GameState => {
  const config = getGameConfig(difficulty)
  // Load showProbabilitiesInPlayMode from sessionStorage
  const savedShowProbabilities = sessionStorage.getItem('showProbabilitiesInPlayMode')
  const showProbabilitiesInPlayMode = savedShowProbabilities === 'true'
  
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
    showLoadingSpinner: false,
    computationWarning: { time: 0, combinations: 0 },
    boardTotal: 0,
    showInvalidBoardError: false,
    requiresConfirmation: false,
    closeRupeeModals: 0,
    showProbabilitiesInPlayMode,
    invalidSourceIndex: undefined,
    isComputingInWorker: false,
  }
}

export const useGameStore = create<GameStore>()(
  devtools(
    (set, get) => {
      // Unified helper for executing solver with worker management
      interface ExecuteSolverOptions {
        solverBoard: BoardCell[][]
        rupoorCount: number
        requireConfirmationCheck?: boolean
        enablePlayModeShowProbabilities?: boolean
      }

      const executeWorkerSolver = (options: ExecuteSolverOptions) => {
        const {
          solverBoard,
          rupoorCount,
          requireConfirmationCheck = false,
          enablePlayModeShowProbabilities = false,
        } = options
        const state = get()

        // Calculate unknown indices count for warning
        const unknownIndicesCount = calculateUnknownIndicesCount(
          solverBoard,
          state.config.width,
          state.config.height
        )
        const totalCombinations = Math.round(Math.pow(2, unknownIndicesCount))

        // Clear any lingering warnings/confirmation before recompute
        set({ showComputationWarning: false, requiresConfirmation: false })

        if (unknownIndicesCount >= 22) {
          const estimatedTime = Math.floor(totalCombinations / 1111111)

          // If time > 30 seconds and confirmation check is enabled, require confirmation (blocking modal)
          if (requireConfirmationCheck && estimatedTime > 30) {
            set({
              showComputationWarning: true,
              computationWarning: { time: estimatedTime, combinations: totalCombinations },
              requiresConfirmation: true,
            })
            return
          }

          // Use setTimeout to offload to worker with phased loading UI
          let phaseTransitionHandles: ReturnType<typeof setTimeout>[] = []
          const startTime = performance.now()

          // Phase 1→2 transition: Show spinner at 200ms
          phaseTransitionHandles.push(
            setTimeout(() => {
              set({
                showLoadingSpinner: true,
                showComputationWarning: false,
              })
            }, 200)
          )

          // Phase 2→3 transition: Show modal with ETA at 2 seconds
          phaseTransitionHandles.push(
            setTimeout(() => {
              set({
                showLoadingSpinner: false,
                showComputationWarning: true,
                computationWarning: {
                  time: -1, // Will be updated when worker sends first progress
                  combinations: totalCombinations,
                },
                requiresConfirmation: false,
              })
            }, 2000)
          )

          setTimeout(() => {
            // Check if cancellation was requested before we start
            if (isWorkerTerminating) {
              console.log('⚠️ Worker computation cancelled before start')
              return
            }

            const state = get()
            set({ isComputingInWorker: true })
            const worker = getSolverWorker()
            const input: SolverWorkerInput = {
              board: solverBoard,
              width: state.config.width,
              height: state.config.height,
              bombCount: state.config.bombCount,
              rupoorCount: rupoorCount,
            }

            worker.onmessage = null
            worker.onmessage = createWorkerMessageHandler(
              {
                onProgress: (processed, total, elapsedMs) => {
                  if (elapsedMs > 2000) {
                    const etaSeconds = calculateSolverETA(processed, total, elapsedMs)
                    set({
                      showLoadingSpinner: false,
                      showComputationWarning: true,
                      computationWarning: {
                        time: etaSeconds,
                        combinations: total,
                        processed,
                      },
                      requiresConfirmation: false,
                    })
                  }
                },
                onError: () => {
                  set({
                    solvedBoard: null,
                    showComputationWarning: false,
                    showLoadingSpinner: false,
                    showInvalidBoardError: true,
                    invalidSourceIndex: state.lastChangedIndex,
                    isComputingInWorker: false,
                  })
                },
                onComplete: (result) => {
                  const updates: Partial<GameState> = {
                    solvedBoard: result,
                    showComputationWarning: false,
                    showLoadingSpinner: false,
                    showInvalidBoardError: result === null,
                    invalidSourceIndex:
                      result === null ? state.lastChangedIndex : undefined,
                    isComputingInWorker: false,
                  }
                  if (enablePlayModeShowProbabilities) {
                    updates.showProbabilitiesInPlayMode = true
                  }
                  set(updates)
                },
                onFinalize: () => {
                  phaseTransitionHandles.forEach(handle => clearTimeout(handle))
                },
              },
              startTime
            )

            worker.postMessage(input)
          }, 100)
        } else {
          // Compute immediately for lighter boards
          const result = solveBoardProbabilities(
            solverBoard,
            state.config.width,
            state.config.height,
            state.config.bombCount,
            rupoorCount
          )

          const updates: Partial<GameState> = {
            solvedBoard: result,
            invalidSourceIndex:
              result === null ? state.lastChangedIndex : undefined,
          }
          if (enablePlayModeShowProbabilities) {
            updates.showProbabilitiesInPlayMode = true
          }
          set(updates)
        }
      }

      // Internal helper to compute solver for Play Mode
      const computeSolver = (
        solverBoard: BoardCell[][],
        currentRupoorCount: number,
        requireConfirmationCheck = false
      ) => {
        executeWorkerSolver({
          solverBoard,
          rupoorCount: currentRupoorCount,
          requireConfirmationCheck,
          enablePlayModeShowProbabilities: false,
        })
      }
      
      return {
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

    executeWorkerSolver({
      solverBoard: state.board,
      rupoorCount: state.rupoorCount,
    })
  },

  confirmComputation: () => {
    set({ requiresConfirmation: false })

    const state = get()

    let solverBoard = state.board

    // If in Play Mode, convert the board format for solving
    if (state.mode === GameMode.Play) {
      solverBoard = convertPlayBoardToSolveBoard(
        state.board,
        state.revealed,
        state.config.width,
        state.config.height
      )
    }

    // Use unified solver with Play Mode flag
    executeWorkerSolver({
      solverBoard,
      rupoorCount: state.rupoorCount,
      enablePlayModeShowProbabilities: state.mode === GameMode.Play,
    })
  },

  cancelComputation: () => {
    const state = get()
    
    // Mark worker as terminating to prevent pending messages
    isWorkerTerminating = true
    
    // Terminate the worker to stop computation
    if (state.isComputingInWorker && solverWorker) {
      console.log('🛑 Cancelling worker computation...')
      solverWorker.terminate()
      solverWorker = null
    }
    
    // Reset flag after a brief delay to allow pending messages to be ignored
    setTimeout(() => {
      isWorkerTerminating = false
    }, 200)
    
    // Revert the last changed cell if it exists
    if (state.lastChangedIndex !== undefined) {
      const row = Math.floor(state.lastChangedIndex / state.config.width)
      const col = state.lastChangedIndex % state.config.width
      const newBoard = state.board.map(r => [...r])
      const prevValue = newBoard[row][col]
      newBoard[row][col] = 0 // Clear to empty tile
      
      console.log(`🔄 Reverting cell at (${row}, ${col}) from ${prevValue} to 0`)
      
      set({
        board: newBoard,
        boardTotal: Math.max(0, state.boardTotal - (prevValue > 0 ? prevValue : 0)),
        lastChangedIndex: undefined,
        showComputationWarning: false,
        showLoadingSpinner: false,
        requiresConfirmation: false,
        isComputingInWorker: false,
      })
    } else {
      set({
        showComputationWarning: false,
        showLoadingSpinner: false,
        requiresConfirmation: false,
        isComputingInWorker: false,
      })
    }
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
    // Persist to sessionStorage
    sessionStorage.setItem('showProbabilitiesInPlayMode', String(newShowProbabilities))
    
    if (newShowProbabilities) {
      // Create a solver board where unrevealed cells are 0 (unknown)
      // Convert Play Mode format to Solve Mode format
      const solverBoard = convertPlayBoardToSolveBoard(
        state.board,
        state.revealed,
        state.config.width,
        state.config.height
      )
      
      // Set showProbabilitiesInPlayMode before computing
      set({ showProbabilitiesInPlayMode: true })
      
      // Use helper with confirmation check enabled
      computeSolver(solverBoard, state.rupoorCount, true)
    } else {
      // Hide probabilities
      set({ 
        showProbabilitiesInPlayMode: false,
        solvedBoard: null,
        invalidSourceIndex: undefined,
        showComputationWarning: false,
        requiresConfirmation: false,
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
      const solverBoard = convertPlayBoardToSolveBoard(
        checkState.board,
        newRevealed,
        checkState.config.width,
        checkState.config.height
      )
      
      // Use helper (no confirmation check needed during gameplay)
      computeSolver(solverBoard, updatedRupoorCount, false)
    }
  },
      }
    },
    { name: 'thrill-digger' }
  )
)
