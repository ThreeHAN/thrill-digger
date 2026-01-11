import React from 'react'
import { createPortal } from 'react-dom'
import type { Level } from '../constants/levels'
import { LEVELS } from '../constants/levels'

type SettingsModalProps = {
  isOpen: boolean
  onClose: () => void
  level: Level
  setLevel: (l: Level) => void
}

export default function SettingsModal({ isOpen, onClose, level, setLevel }: SettingsModalProps) {
  if (!isOpen) return null

  const handleLevelChange = (l: Level) => {
    setLevel(l)
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
          <h2>Difficulty</h2>
          <button className="modal-close" onClick={handleCloseClick}>×</button>
        </div>
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
    </div>,
    document.body
  )
}
