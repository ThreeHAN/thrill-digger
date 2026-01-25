import { useState } from 'react'
import type { Level } from '../../constants/levels'
import { LEVELS } from '../../constants/levels'
import type { GameMode } from '../../stores/gameStore'
import { useGameStore } from '../../stores/gameStore'

type HamburgerMenuProps = {
  onNewGame: () => void
  onInfo: () => void
  level: Level
  setLevel: (l: Level) => void
  gameMode: GameMode
  setGameMode: (mode: GameMode) => void
}

export default function HamburgerMenu({ onNewGame, onInfo, level, setLevel, gameMode, setGameMode }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerCloseRupeeModals = useGameStore(state => state.triggerCloseRupeeModals)

  const handleMenuClick = (callback: () => void) => {
    callback()
    setIsOpen(false)
  }

  const handleOptionClick = (callback: () => void) => {
    callback()
    setTimeout(() => setIsOpen(false), 500)
  }

  return (
    <div className="hamburger-menu">
      <button
        className={`hamburger-btn ${isOpen ? 'active' : ''}`}
        onClick={() => {
          if (!isOpen) {
            triggerCloseRupeeModals()
          }
          setIsOpen(!isOpen)
        }}
        aria-label="Settings"
      >
        ⚙️
      </button>

      {isOpen && (
        <div className="modal-backdrop" onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          setIsOpen(false)
        }}>
          <div className="hamburger-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsOpen(false)} aria-label="Close menu">×</button>
            
            <h2 className="hamburger-modal-title">Settings</h2>
        
            <div className="hamburger-menu-section">
              <h3 className="hamburger-menu-label">Game Mode</h3>
              <button
                className={`hamburger-menu-subitem ${gameMode === 2 ? 'active' : ''}`}
                onClick={() => {
                  setGameMode(2)
                  handleOptionClick(() => {})
                }}
              >
                Solve
              </button>
              <button
                className={`hamburger-menu-subitem ${gameMode === 1 ? 'active' : ''}`}
                onClick={() => {
                  setGameMode(1)
                  handleOptionClick(() => {})
                }}
              >
                Play
              </button>
            </div>

            <div className="hamburger-menu-section">
              <h3 className="hamburger-menu-label">Difficulty</h3>
              {LEVELS.map((l) => (
                <button
                  key={l}
                  className={`hamburger-menu-subitem ${level === l ? 'active' : ''}`}
                  onClick={() => {
                    setLevel(l)
                    handleOptionClick(() => {})
                  }}
                >
                  {l[0].toUpperCase() + l.slice(1)}
                </button>
              ))}
            </div>

            <div className="hamburger-menu-actions">
              <button className="hamburger-menu-action-btn new-game" onClick={() => handleMenuClick(onNewGame)}>
                Restart
              </button>
              <button className="hamburger-menu-action-btn info" onClick={() => handleMenuClick(onInfo)}>
                How to Play
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
