import { useState, useEffect } from 'react'
import GameBoard from './components/GameBoard'
import InfoModal from './components/InfoModal'
import HamburgerMenu from './components/HamburgerMenu'
import ComputationWarningModal from './components/ComputationWarningModal'
import GameOverModal from './components/GameOverModal'
import HazardStats from './components/HazardStats'
import type { Level } from './constants/levels'
import { Difficulty } from './utils/gameLogic'
import { GameMode, useGameStore } from './stores/gameStore'

const levelToDifficulty: Record<Level, Difficulty> = {
  beginner: Difficulty.Beginner,
  intermediate: Difficulty.Intermediate,
  expert: Difficulty.Expert,
}

function App() {
  const [level, setLevel] = useState<Level>('beginner')
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.Solve)
  const [showInfo, setShowInfo] = useState(false)
  const [showGameOverModal, setShowGameOverModal] = useState(false)
  
  const difficulty = levelToDifficulty[level]
  const newGame = useGameStore(state => state.newGame)
  const resetGame = useGameStore(state => state.resetGame)
  const isGameOver = useGameStore(state => state.isGameOver)
  const mode = useGameStore(state => state.mode)
  const currentRupees = useGameStore(state => state.currentRupees)
  const boardTotal = useGameStore(state => state.boardTotal)
  const showComputationWarning = useGameStore(state => state.showComputationWarning)
  const computationWarning = useGameStore(state => state.computationWarning)
  const requiresConfirmation = useGameStore(state => state.requiresConfirmation)
  const confirmComputation = useGameStore(state => state.confirmComputation)
  const cancelComputation = useGameStore(state => state.cancelComputation)
  const revealAllCells = useGameStore(state => state.revealAllCells)

  useEffect(() => {
    newGame(difficulty, gameMode)
  }, [newGame, difficulty, gameMode])

  // Update CSS var with dynamic VisualViewport bottom inset (URL bar / browser chrome)
  useEffect(() => {
    const updateViewportInset = () => {
      const vv = window.visualViewport
      if (!vv) {
        document.documentElement.style.setProperty('--vv-bottom-inset', '0px')
        return
      }
      const topInset = vv.offsetTop || 0
      const bottomInset = Math.max(0, window.innerHeight - vv.height - topInset)
      document.documentElement.style.setProperty('--vv-bottom-inset', `${bottomInset}px`)
    }

    updateViewportInset()
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportInset)
      window.visualViewport.addEventListener('scroll', updateViewportInset)
    }
    window.addEventListener('resize', updateViewportInset)

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportInset)
        window.visualViewport.removeEventListener('scroll', updateViewportInset)
      }
      window.removeEventListener('resize', updateViewportInset)
    }
  }, [])

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

      <ComputationWarningModal
        isOpen={showComputationWarning}
        estimatedTime={computationWarning.time}
        combinations={computationWarning.combinations}
        requiresConfirmation={requiresConfirmation}
        onConfirm={confirmComputation}
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
