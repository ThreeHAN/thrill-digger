import { useState, useEffect } from 'react'
import './App.css'
import GameBoard from './components/GameBoard'
import SettingsModal from './components/SettingsModal'
import ComputationWarningModal from './components/ComputationWarningModal'
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
  const { gameState, newGame, revealCell, updateCell, setCurrentRupees, setGameOver, setRupoorCount, addTotalRupees, setGameConfig, resetGame, showComputationWarning, setShowComputationWarning, boardTotal, showInvalidBoardError, setShowInvalidBoardError } = useGameBoard(levelToDifficulty[level])

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
          <button className="wood-btn" onClick={handleReset}>New Game</button>
          <h1>Thrill Digger</h1>
            <div className="header-right">
              <button className="wood-btn" onClick={() => setShowSettings(true)}>Settings</button>
            </div>
        </header>
        
        <main>
            <HazardStats boardTotal={gameMode === 1 ? gameState.currentRupees : boardTotal} />
          <div className="board-area">
            <GameBoard />
          </div>
        </main>

        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          level={level}
          setLevel={handleDifficultyChange}
          gameMode={gameMode}
          setGameMode={handleGameModeChange}
        />

        <ComputationWarningModal
          isOpen={showComputationWarning}
          onClose={() => setShowComputationWarning(false)}
        />
      </div>
    </GameProvider>
  )
}

export default App
