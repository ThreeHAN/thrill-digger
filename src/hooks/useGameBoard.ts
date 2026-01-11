import { useState, useCallback, useEffect } from 'react'
import type { BoardCell, GameConfig } from '../utils/gameLogic'
import { getGameConfig, createEmptyBoard, generatePlayBoard } from '../utils/gameLogic'
import { solveBoardProbabilities, calculateUnknownIndicesCount } from '../utils/solver'

export type GameMode = 1 | 2 // 1=Play, 2=Solve
export type Difficulty = 1 | 2 | 3 // 1=Beginner, 2=Intermediate, 3=Expert

export type GameBoardActions = {
  revealCell: (row: number, col: number) => void
  updateCell: (row: number, col: number, value: number) => void
  setCurrentRupees: (rupees: number) => void
  setGameOver: (isGameOver: boolean) => void
  setRupoorCount: (count: number) => void
  addTotalRupees: (amount: number) => void
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
  solvedBoard?: number[] // Probabilities for solve mode
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
  }
}

export function useGameBoard(initialDifficulty: Difficulty = 1) {
  const [gameState, setGameState] = useState<GameState>(() => initialGameState(initialDifficulty))
  const [showComputationWarning, setShowComputationWarning] = useState(false)
  const [computationWarning, setComputationWarning] = useState({ time: 0, combinations: 0 })
  const [solvedBoard, setSolvedBoard] = useState<ReturnType<typeof solveBoardProbabilities>>(undefined)

  // Detect heavy computation and show warning first
  useEffect(() => {
    if (gameState.mode === 2) {
      const unknownIndicesCount = calculateUnknownIndicesCount(gameState.board, gameState.config.width, gameState.config.height)
      const totalCombinations = Math.round(Math.pow(2, unknownIndicesCount))
      
      // Show warning if computation will be heavy
      if (unknownIndicesCount >= 22) {
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
            gameState.config.rupoorCount
          )
          setSolvedBoard(result)
          // Close the modal after computation finishes
          setShowComputationWarning(false)
        }, 100)
        return () => clearTimeout(timer)
      } else {
        // No warning needed, compute immediately
        setShowComputationWarning(false)
        const result = solveBoardProbabilities(
          gameState.board,
          gameState.config.width,
          gameState.config.height,
          gameState.config.bombCount,
          gameState.config.rupoorCount
        )
        setSolvedBoard(result)
      }
    } else {
      setSolvedBoard(undefined)
    }
  }, [gameState.board, gameState.config, gameState.mode])

  const newGame = useCallback((difficulty: Difficulty, mode: GameMode) => {
    const config = getGameConfig(difficulty)
    const board = mode === 1 
      ? generatePlayBoard(config.width, config.height, config.bombCount, config.rupoorCount)
      : createEmptyBoard(config.width, config.height)
    
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
    })
  }, [gameState.totalRupeesAllTime])

  const revealCell = useCallback((row: number, col: number) => {
    setGameState(prev => {
      const newRevealed = prev.revealed.map(r => [...r])
      newRevealed[row][col] = true
      return { ...prev, revealed: newRevealed }
    })
  }, [])

  const updateCell = useCallback((row: number, col: number, value: BoardCell) => {
    setGameState(prev => {
      const newBoard = prev.board.map(r => [...r])
      newBoard[row][col] = value
      return { ...prev, board: newBoard }
    })
  }, [])

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
    setGameState(prev => ({ ...prev, totalRupeesAllTime: prev.totalRupeesAllTime + amount }))
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
    resetGame,
    showComputationWarning,
    setShowComputationWarning,
    computationWarning,
  }
}
