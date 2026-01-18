import { useState, useEffect } from 'react'
import GameBoard from './components/GameBoard'
import SettingsModal from './components/SettingsModal'
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
  const [showSettings, setShowSettings] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  
  const difficulty = levelToDifficulty[level]
  const newGame = useGameStore(state => state.newGame)
  const resetGame = useGameStore(state => state.resetGame)
  const isGameOver = useGameStore(state => state.isGameOver)
  const mode = useGameStore(state => state.mode)
  const currentRupees = useGameStore(state => state.currentRupees)
  const boardTotal = useGameStore(state => state.boardTotal)
  const showComputationWarning = useGameStore(state => state.showComputationWarning)

  useEffect(() => {
    newGame(difficulty, gameMode)
  }, [newGame, difficulty, gameMode])

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

  const handleInfoOpen = () => setShowInfo(true)
  const handleSettingsOpen = () => setShowSettings(true)
  const handleInfoClose = () => setShowInfo(false)
  const handleSettingsClose = () => setShowSettings(false)

  return (
    <div className="game-container">
      <header className="game-header">
        <h1>Thrill Digger</h1>
        <HamburgerMenu
          onNewGame={handleReset}
          onInfo={handleInfoOpen}
          onSettings={handleSettingsOpen}
        />
      </header>
      
      <main>
        <div className="board-area">
          <GameBoard />
        </div>
        <HazardStats boardTotal={gameMode === GameMode.Play ? currentRupees : boardTotal} />
      </main>

      <footer className="app-footer">
        <p>Reskinned version of the original <a href="https://www.joshscotland.com/thrill-digger-assistant/" target="_blank" rel="noopener noreferrer">Thrill Digger Assistant</a> by Josh Scotland</p>
      </footer>

      <SettingsModal
        isOpen={showSettings}
        onClose={handleSettingsClose}
        level={level}
        setLevel={handleDifficultyChange}
        gameMode={gameMode}
        setGameMode={handleGameModeChange}
      />

      <InfoModal
        isOpen={showInfo}
        onClose={handleInfoClose}
      />

      <ComputationWarningModal
        isOpen={showComputationWarning}
      />

      <GameOverModal
        isOpen={isGameOver && mode === GameMode.Play}
        totalRupees={currentRupees}
        onPlayAgain={handleReset}
      />
    </div>
  )
}

export default App
