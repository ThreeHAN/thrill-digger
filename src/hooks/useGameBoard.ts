import { useState, useCallback, useEffect } from 'react'
import type { BoardCell, GameConfig } from '../utils/gameLogic'
import { getGameConfig, createEmptyBoard, generatePlayBoard, Difficulty } from '../utils/gameLogic'
import { solveBoardProbabilities, calculateUnknownIndicesCount } from '../utils/solver'
import type { SolvedBoard } from '../utils/solver'
import type { GameMode } from '../stores/gameStore'

export type GameBoardActions = {
  revealCell: (row: number, col: number) => void
  updateCell: (row: number, col: number, value: number) => void
  setCurrentRupees: (rupees: number) => void
  setGameOver: (isGameOver: boolean) => void
  setRupoorCount: (count: number) => void
  addTotalRupees: (amount: number) => void
  setGameConfig: (config: GameConfig) => void
  showInvalidBoardError: boolean
  setShowInvalidBoardError: (show: boolean) => void
}

export interface GameState {
  mode: GameMode
  difficulty: Difficulty
  config: GameConfig
  board: BoardCell[][]
  revealed: boolean[][]
  currentRupees: number
  totalRupeesAllTime: number
  isGameOver: boolean
  rupoorCount: number
  solvedBoard: SolvedBoard | null // Probabilities for solve mode
  lastChangedIndex?: number
}

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
    mode: 1,
    difficulty,
    config,
    board: createEmptyBoard(config.width, config.height),
    revealed: createEmptyRevealedBoard(config.width, config.height),
    currentRupees: 0,
    totalRupeesAllTime: 0,
    isGameOver: false,
    rupoorCount: config.rupoorCount,
    solvedBoard: null,
    lastChangedIndex: undefined,
  }
}

export function useGameBoard(initialDifficulty: Difficulty = Difficulty.Beginner) {
  const [gameState, setGameState] = useState<GameState>(() => initialGameState(initialDifficulty))
  const [showComputationWarning, setShowComputationWarning] = useState(false)
  const [computationWarning, setComputationWarning] = useState({ time: 0, combinations: 0 })
  const [solvedBoard, setSolvedBoard] = useState<SolvedBoard | null>(null)
  const [isComputing, setIsComputing] = useState(false)
  const [boardTotal, setBoardTotal] = useState(0)
  const [showInvalidBoardError, setShowInvalidBoardError] = useState(false)

  // Detect heavy computation and show warning first
  useEffect(() => {
    if (gameState.mode === 2 && !isComputing) {
      const unknownIndicesCount = calculateUnknownIndicesCount(gameState.board, gameState.config.width, gameState.config.height)
      const totalCombinations = Math.round(Math.pow(2, unknownIndicesCount))
      
      // Show warning if computation will be heavy
      if (unknownIndicesCount >= 22) {
        setIsComputing(true)
        const estimatedTime = Math.floor(totalCombinations / 1111111)
        setComputationWarning({ time: estimatedTime, combinations: totalCombinations })
        setShowComputationWarning(true)
        
        // Defer the actual computation so the modal shows first
        const timer = setTimeout(() => {
          const result = solveBoardProbabilities(
            gameState.board,
            gameState.config.width,
            gameState.config.height,
            gameState.config.bombCount,
            gameState.rupoorCount
          )
          setSolvedBoard(result)
          if (result === null) {
            setShowInvalidBoardError(true)
          }
          // Close the modal after computation finishes
          setShowComputationWarning(false)
          setIsComputing(false)
        }, 100)
        return () => clearTimeout(timer)
      } else {
        // No warning needed, compute immediately
        setIsComputing(true)
        setShowComputationWarning(false)
        const result = solveBoardProbabilities(
          gameState.board,
          gameState.config.width,
          gameState.config.height,
          gameState.config.bombCount,
          gameState.rupoorCount
        )
        setSolvedBoard(result)
        if (result === null) {
          setShowInvalidBoardError(true)
        }
        setIsComputing(false)
      }
    } else if (gameState.mode !== 2) {
      setSolvedBoard(null)
      setIsComputing(false)
    }
  }, [gameState.board, gameState.config, gameState.mode])

  const newGame = useCallback((difficulty: Difficulty, mode: GameMode) => {
    const config = getGameConfig(difficulty)
    const board = mode === 1 
      ? generatePlayBoard(config.width, config.height, config.bombCount, config.rupoorCount)
      : createEmptyBoard(config.width, config.height)

    // Calculate total rupees on the board (sum of all positive values)
    const totalRupees = board.flat().reduce((sum, cell) => sum + (cell > 0 ? cell : 0), 0)
    setBoardTotal(totalRupees)
    
    setGameState({
      mode,
      difficulty,
      config,
      board,
      revealed: createEmptyRevealedBoard(config.width, config.height),
      currentRupees: 0,
      totalRupeesAllTime: gameState.totalRupeesAllTime,
      isGameOver: false,
      rupoorCount: config.rupoorCount,
      solvedBoard: null,
      lastChangedIndex: undefined,
    })
  }, [])

  const revealCell = useCallback((row: number, col: number) => {
    setGameState(prev => {
      const newRevealed = prev.revealed.map(r => [...r])
      newRevealed[row][col] = true
      const idx = row * prev.config.width + col
      return { ...prev, revealed: newRevealed, lastChangedIndex: idx }
    })
  }, [])

  const updateCell = useCallback((row: number, col: number, value: BoardCell) => {
    // Read prevValue outside the state setter to avoid nested setters (Strict Mode double-invoke)
    const prevValue = gameState.board[row][col]
    if (prevValue === value) {
      return
    }

    setGameState(prev => {
      const newBoard = prev.board.map(r => [...r])
      newBoard[row][col] = value
      const idx = row * prev.config.width + col
      return { ...prev, board: newBoard, lastChangedIndex: idx }
    })

    // Update boardTotal using a single setter outside the other setter
    setBoardTotal(total => Math.max(0, total - prevValue + value))
  }, [gameState.board])

  const setCurrentRupees = useCallback((rupees: number) => {
    setGameState(prev => ({ ...prev, currentRupees: rupees }))
  }, [])

  const setGameOver = useCallback((isGameOver: boolean) => {
    setGameState(prev => ({ ...prev, isGameOver }))
  }, [])

  const setRupoorCount = useCallback((count: number) => {
    setGameState(prev => ({ ...prev, rupoorCount: count }))
  }, [])

  const addTotalRupees = useCallback((amount: number) => {
    setGameState(prev => {
      const updated = { ...prev, totalRupeesAllTime: prev.totalRupeesAllTime + amount }
      console.log('Adding', amount, 'rupees. New total:', updated.totalRupeesAllTime)
      return updated
    })
  }, [])

  const setGameConfig = useCallback((config: GameConfig) => {
    setGameState(prev => ({ ...prev, config }))
  }, [])

  const resetGame = useCallback((difficulty: Difficulty, mode: GameMode) => {
    newGame(difficulty, mode)
  }, [newGame])

  return {
    gameState: { ...gameState, solvedBoard },
    newGame,
    revealCell,
    updateCell,
    setCurrentRupees,
    setGameOver,
    setRupoorCount,
    addTotalRupees,
    setGameConfig,
    resetGame,
    showComputationWarning,
    setShowComputationWarning,
    computationWarning,
    boardTotal,
    showInvalidBoardError,
    setShowInvalidBoardError,
  }
}
