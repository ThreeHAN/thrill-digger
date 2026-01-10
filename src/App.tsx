import { useState } from 'react'
import './App.css'
import GameBoard from './components/GameBoard'
import Controls from './components/Controls'
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
  const [gameMode, setGameMode] = useState<GameMode>(1)
  const { gameState, newGame, revealCell, updateCell, setCurrentRupees, setGameOver, setRupoorCount, addTotalRupees, resetGame } = useGameBoard(levelToDifficulty[level])

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
  }

  return (
    <GameProvider gameState={gameState} gameActions={gameActions}>
      <div className="app-root">
        <main>
          <div className="header center">
            <div className="title-block">
              <h1>Thrill Digger Assistant</h1>
              <h2>Overview</h2>
              <p className="lead">A solver and simulator for the Thrill Digger minigame from Zelda: Skyward Sword!</p>
            </div>
          </div>

          <div className="board-area">
            <GameBoard />
          </div>

          <Controls 
            level={level} 
            setLevel={handleDifficultyChange}
            gameMode={gameMode}
            setGameMode={handleGameModeChange}
            onReset={handleReset} 
          />

        </main>
        <footer className="footer center"><small>© 2021 Josh Scotland — Converted to React</small></footer>
      </div>
    </GameProvider>
  )
}

export default App
