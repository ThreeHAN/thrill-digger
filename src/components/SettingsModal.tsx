import React from 'react'
import { createPortal } from 'react-dom'
import type { Level } from '../constants/levels'
import { LEVELS } from '../constants/levels'
import type { GameMode } from '../hooks/useGameBoard'

type SettingsModalProps = {
  isOpen: boolean
  onClose: () => void
  level: Level
  setLevel: (l: Level) => void
  gameMode: GameMode
  setGameMode: (mode: GameMode) => void
}

export default function SettingsModal({ isOpen, onClose, level, setLevel, gameMode, setGameMode }: SettingsModalProps) {
  if (!isOpen) return null

  const handleLevelChange = (l: Level) => {
    setLevel(l)
  }

  const handleModeChange = (mode: GameMode) => {
    setGameMode(mode)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose()
  }

  return createPortal(
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="modal-close" onClick={handleCloseClick}>×</button>
        </div>
        <div>
          <h3 style={{ color: '#f3e5ab', marginBottom: '12px', fontSize: '1.2rem' }}>Game Mode</h3>
          <div className="difficulty-grid">
            <button
              className={`difficulty-option ${gameMode === 2 ? 'selected' : ''}`}
              onClick={() => handleModeChange(2)}
            >
              Solve Mode
            </button>
            <button
              className={`difficulty-option ${gameMode === 1 ? 'selected' : ''}`}
              onClick={() => handleModeChange(1)}
            >
              Play Mode
            </button>
          </div>
        </div>
        <div>
          <h3 style={{ color: '#f3e5ab', marginBottom: '12px', fontSize: '1.2rem' }}>Difficulty</h3>
          <div className="difficulty-grid">
          {LEVELS.map((l) => (
            <button
              key={l}
              className={`difficulty-option ${level === l ? 'selected' : ''}`}
              onClick={() => {
                handleLevelChange(l)
                onClose()
              }}
            >
              {l[0].toUpperCase() + l.slice(1)}
            </button>
          ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
