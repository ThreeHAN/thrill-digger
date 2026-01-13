import { useState } from 'react'

type HamburgerMenuProps = {
  onNewGame: () => void
  onInfo: () => void
  onSettings: () => void
}

export default function HamburgerMenu({ onNewGame, onInfo, onSettings }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleMenuClick = (callback: () => void) => {
    callback()
    setIsOpen(false)
  }

  return (
    <div className="hamburger-menu">
      <button
        className={`hamburger-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
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
            <button className="hamburger-menu-item" onClick={() => handleMenuClick(onSettings)}>
              Settings
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
