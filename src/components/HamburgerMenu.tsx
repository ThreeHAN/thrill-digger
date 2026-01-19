import { useState } from 'react'
import type { Level } from '../constants/levels'
import { LEVELS } from '../constants/levels'
import type { GameMode } from '../stores/gameStore'
import { useGameStore } from '../stores/gameStore'

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
        aria-label="Menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {isOpen && (
        <div className="hamburger-backdrop" onClick={() => setIsOpen(false)}>
          <div className="hamburger-menu-content" onClick={(e) => e.stopPropagation()}>
            <button className="hamburger-menu-item" onClick={() => handleMenuClick(onNewGame)}>
              New Game
            </button>
            <button className="hamburger-menu-item" onClick={() => handleMenuClick(onInfo)}>
              Info
            </button>
            
            <div className="hamburger-menu-section">
              <h3 className="hamburger-menu-label">Game Mode</h3>
              <button
                className={`hamburger-menu-subitem ${gameMode === 2 ? 'active' : ''}`}
                onClick={() => {
                  setGameMode(2)
                  setIsOpen(false)
                }}
              >
                Solve
              </button>
              <button
                className={`hamburger-menu-subitem ${gameMode === 1 ? 'active' : ''}`}
                onClick={() => {
                  setGameMode(1)
                  setIsOpen(false)
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
                    setIsOpen(false)
                  }}
                >
                  {l[0].toUpperCase() + l.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
