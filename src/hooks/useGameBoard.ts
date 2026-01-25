import { useCallback } from 'react'
import type { BoardCell, GameConfig, Difficulty } from '../utils/gameLogic'
import type { SolvedBoard } from '../utils/solver'
import type { GameMode } from '../stores/gameStore'
import { useGameStore } from '../stores/gameStore'

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
export function useGameBoard() {
  const gameState = useGameStore(state => ({
    mode: state.mode,
    difficulty: state.difficulty,
    config: state.config,
    board: state.board,
    revealed: state.revealed,
    currentRupees: state.currentRupees,
    totalRupeesAllTime: state.totalRupeesAllTime,
    isGameOver: state.isGameOver,
    rupoorCount: state.rupoorCount,
    solvedBoard: state.solvedBoard,
    lastChangedIndex: state.lastChangedIndex,
  }))

  const boardTotal = useGameStore(state => state.boardTotal)
  const showComputationWarning = useGameStore(state => state.showComputationWarning)
  const computationWarning = useGameStore(state => state.computationWarning)
  const showInvalidBoardError = useGameStore(state => state.showInvalidBoardError)

  const newGame = useGameStore(state => state.newGame)
  const revealCell = useGameStore(state => state.revealCell)
  const updateCell = useGameStore(state => state.updateCell)
  const setCurrentRupees = useGameStore(state => state.setCurrentRupees)
  const setGameOver = useGameStore(state => state.setGameOver)
  const setRupoorCount = useGameStore(state => state.setRupoorCount)
  const addTotalRupees = useGameStore(state => state.addTotalRupees)
  const setGameConfig = useGameStore(state => state.setGameConfig)
  const resetGame = useGameStore(state => state.resetGame)
  const setShowInvalidBoardError = useGameStore(state => state.setShowInvalidBoardError)
  const handleComputationConfirm = useGameStore(state => state.confirmComputation)
  const handleComputationCancel = useGameStore(state => state.cancelComputation)

  // Small shim to keep previous API parity
  const setShowComputationWarning = useCallback((show: boolean) => {
    useGameStore.setState({ showComputationWarning: show })
  }, [])

  return {
    gameState,
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
    handleComputationConfirm,
    handleComputationCancel,
  }
}
