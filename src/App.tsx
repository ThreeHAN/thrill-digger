import { useState, useEffect } from 'react'
import GameBoard from './components/board/GameBoard'
import InfoModal from './components/modals/InfoModal'
import HamburgerMenu from './components/ui/HamburgerMenu'
import ComputationWarningModal from './components/modals/ComputationWarningModal'
import LoadingSpinner from './components/ui/LoadingSpinner'
import GameOverModal from './components/modals/GameOverModal'
import HazardStats from './components/ui/HazardStats'
import type { Level } from './constants/levels'
import { Difficulty } from './utils/gameLogic'
import { GameMode, useGameStore } from './stores/gameStore'
import { loadStateFromUrl } from './utils/debugUtils'

const levelToDifficulty: Record<Level, Difficulty> = {
  beginner: Difficulty.Beginner,
  intermediate: Difficulty.Intermediate,
  expert: Difficulty.Expert,
}

const difficultyToLevel: Record<Difficulty, Level> = {
  [Difficulty.Beginner]: 'beginner',
  [Difficulty.Intermediate]: 'intermediate',
  [Difficulty.Expert]: 'expert',
}

function App() {
  const [level, setLevel] = useState<Level>('beginner')
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.Solve)
  const [showInfo, setShowInfo] = useState(false)
  const [showGameOverModal, setShowGameOverModal] = useState(false)
  const [stateLoaded, setStateLoaded] = useState(false)
  const [hasDebugState, setHasDebugState] = useState(false)
  
  const difficulty = levelToDifficulty[level]
  const newGame = useGameStore(state => state.newGame)
  const loadDebugState = useGameStore(state => state.loadDebugState)
  const resetGame = useGameStore(state => state.resetGame)
  const isGameOver = useGameStore(state => state.isGameOver)
  const mode = useGameStore(state => state.mode)
  const currentRupees = useGameStore(state => state.currentRupees)
  const boardTotal = useGameStore(state => state.boardTotal)
  const showComputationWarning = useGameStore(state => state.showComputationWarning)
  const showLoadingSpinner = useGameStore(state => state.showLoadingSpinner)
  const computationWarning = useGameStore(state => state.computationWarning)
  const cancelComputation = useGameStore(state => state.cancelComputation)
  const revealAllCells = useGameStore(state => state.revealAllCells)

  // Check for debug state in URL on initial mount
  useEffect(() => {
    const debugState = loadStateFromUrl()
    if (debugState) {
      loadDebugState(debugState)
      setLevel(difficultyToLevel[debugState.difficulty])
      setGameMode(debugState.mode)
      setHasDebugState(true)
      setStateLoaded(true)
    } else {
      setStateLoaded(true)
    }
  }, [loadDebugState])

  useEffect(() => {
    if (!stateLoaded || hasDebugState) return
    newGame(difficulty, gameMode)
  }, [newGame, difficulty, gameMode, stateLoaded, hasDebugState])

  // Show game over modal with 1 second delay
  useEffect(() => {
    if (isGameOver && mode === GameMode.Play) {
      const timer = setTimeout(() => {
        setShowGameOverModal(true)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      setShowGameOverModal(false)
    }
  }, [isGameOver, mode])

  const handleDifficultyChange = (newLevel: Level) => {
    setLevel(newLevel)
    newGame(levelToDifficulty[newLevel], gameMode)
  }

  const handleGameModeChange = (mode: GameMode) => {
    setGameMode(mode)
    newGame(difficulty, mode)
  }

  const handleReset = () => {
    resetGame(difficulty, gameMode)
  }

  const handleRevealBoard = () => {
    revealAllCells()
    setShowGameOverModal(false)
  }

  const handleInfoOpen = () => setShowInfo(true)
  const handleInfoClose = () => setShowInfo(false)

  return (
    <div className="game-container">
      <header className="game-header">
        <h1>Thrill Digger</h1>
        <HamburgerMenu
          onNewGame={handleReset}
          onInfo={handleInfoOpen}
          level={level}
          setLevel={handleDifficultyChange}
          gameMode={gameMode}
          setGameMode={handleGameModeChange}
        />
      </header>
      
      <main>
        <div className="board-area">
          <GameBoard />
          <HazardStats boardTotal={gameMode === GameMode.Play ? currentRupees : boardTotal} />
        </div>
      </main>

      <footer className="app-footer">
        <p>Reskinned version of the original <a href="https://www.joshscotland.com/thrill-digger-assistant/" target="_blank" rel="noopener noreferrer">Thrill Digger Assistant</a> by Josh Scotland</p>
      </footer>

      <InfoModal
        isOpen={showInfo}
        onClose={handleInfoClose}
      />

      <LoadingSpinner
        isOpen={showLoadingSpinner}
      />

      <ComputationWarningModal
        isOpen={showComputationWarning}
        estimatedTime={computationWarning.time}
        combinations={computationWarning.combinations}
        combinationsRemaining={computationWarning.combinations - (computationWarning.processed || 0)}
        onCancel={cancelComputation}
      />

      <GameOverModal
        isOpen={showGameOverModal}
        totalRupees={currentRupees}
        onPlayAgain={handleReset}
        onRevealBoard={handleRevealBoard}
      />
    </div>
  )
}

export default App
