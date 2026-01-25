import React from 'react'
import type { Level } from '../../constants/levels'
import { LEVELS } from '../../constants/levels'
import type { GameMode } from '../../stores/gameStore'

type ControlsProps = {
  level: Level
  setLevel: (l: Level) => void
  gameMode: GameMode
  setGameMode: (mode: GameMode) => void
  onReset?: () => void
}

export default function Controls({ level, setLevel, gameMode, setGameMode, onReset }: ControlsProps) {
  const handleLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLevel(e.target.value as Level)
  }

  const handleGameModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGameMode(parseInt(e.target.value) as GameMode)
  }

  return (
    <div className="controls center">
      <div className="controls-row">
        <button id="resetbutton" className="btn" onClick={onReset}>New Game</button>
        <div className="radios">
          <label>
            <input 
              type="radio" 
              name="gametype" 
              value="1"
              checked={gameMode === 1}
              onChange={handleGameModeChange}
            />{' '}
            Play
          </label>
          <label>
            <input 
              type="radio" 
              name="gametype" 
              value="2"
              checked={gameMode === 2}
              onChange={handleGameModeChange}
            />{' '}
            Solve
          </label>
        </div>
        <div className="radios">
          {LEVELS.map((l) => (
            <label key={l}>
              <input
                type="radio"
                name="diggerlevel"
                value={l}
                checked={level === l}
                onChange={handleLevelChange}
              />{' '}
              {l[0].toUpperCase() + l.slice(1)}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
