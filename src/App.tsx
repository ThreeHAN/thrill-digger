import { useState, useEffect } from 'react'
import './App.css'
import GameBoard from './components/GameBoard'
import SettingsModal from './components/SettingsModal'
import InfoModal from './components/InfoModal'
import HamburgerMenu from './components/HamburgerMenu'
import ComputationWarningModal from './components/ComputationWarningModal'
import GameOverModal from './components/GameOverModal'
import HazardStats from './components/HazardStats'
import type { Level } from './constants/levels'
import { useGameBoard } from './hooks/useGameBoard'
import type { Difficulty, GameMode } from './hooks/useGameBoard'
import { GameProvider } from './context/GameContext'

const levelToDifficulty: Record<Level, Difficulty> = {
  beginner: 1,
  intermediate: 2,
  expert: 3,
}

function App() {
  const [level, setLevel] = useState<Level>('beginner')
  const [gameMode, setGameMode] = useState<GameMode>(2)
  const [showSettings, setShowSettings] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const { gameState, newGame, revealCell, updateCell, setCurrentRupees, setGameOver, setRupoorCount, addTotalRupees, setGameConfig, resetGame, showComputationWarning, boardTotal, showInvalidBoardError, setShowInvalidBoardError } = useGameBoard(levelToDifficulty[level])

  useEffect(() => {
    newGame(levelToDifficulty[level], gameMode)
  }, [newGame, level, gameMode])

  const handleDifficultyChange = (newLevel: Level) => {
    setLevel(newLevel)
    newGame(levelToDifficulty[newLevel], gameMode)
  }

  const handleGameModeChange = (mode: GameMode) => {
    setGameMode(mode)
    newGame(levelToDifficulty[level], mode)
  }

  const handleReset = () => {
    resetGame(levelToDifficulty[level], gameMode)
  }

  const gameActions = {
    revealCell,
    updateCell,
    setCurrentRupees,
    setGameOver,
    setRupoorCount,
    addTotalRupees,
    setGameConfig,
    showInvalidBoardError,
    setShowInvalidBoardError,
  }

  return (
    <GameProvider gameState={gameState} gameActions={gameActions}>
      <div className="game-container">
        <header className="game-header">
          <h1>Thrill Digger</h1>
          <HamburgerMenu
            onNewGame={handleReset}
            onInfo={() => setShowInfo(true)}
            onSettings={() => setShowSettings(true)}
          />
        </header>
        
        <main>
          <div className="board-area">
            <GameBoard />
          </div>
          <HazardStats boardTotal={gameMode === 1 ? gameState.currentRupees : boardTotal} />
        </main>

        <footer className="app-footer">
          <p>Reskinned version of the original <a href="https://www.joshscotland.com/thrill-digger-assistant/" target="_blank" rel="noopener noreferrer">Thrill Digger Assistant</a> by Josh Scotland</p>
        </footer>

        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          level={level}
          setLevel={handleDifficultyChange}
          gameMode={gameMode}
          setGameMode={handleGameModeChange}
        />

        <InfoModal
          isOpen={showInfo}
          onClose={() => setShowInfo(false)}
        />

        <ComputationWarningModal
          isOpen={showComputationWarning}
        />

        <GameOverModal
          isOpen={gameState.isGameOver && gameState.mode === 1}
          totalRupees={gameState.currentRupees}
          onPlayAgain={handleReset}
        />
      </div>
    </GameProvider>
  )
}

export default App
