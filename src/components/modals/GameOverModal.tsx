import { createPortal } from 'react-dom'
import { greenrupee } from '../../assets/images'
import '../../styles/_game-over-modal.scss'

type GameOverModalProps = {
  isOpen: boolean
  totalRupees: number
  onPlayAgain: () => void
  onRevealBoard: () => void
}

export default function GameOverModal({ isOpen, totalRupees, onPlayAgain, onRevealBoard }: GameOverModalProps) {
  if (!isOpen) return null

  const handlePlayAgain = () => {
    onPlayAgain()
  }

  const handleRevealBoard = () => {
    onRevealBoard()
  }

  return createPortal(
    <div className="modal-backdrop" onClick={(e) => {
      if (e.target === e.currentTarget) {
        handlePlayAgain()
      }
    }}>
      <div className="modal-content game-over-modal" onClick={(e) => e.stopPropagation()}>
        <div className="game-over-frame">
          <div className="game-over-title">Game Over!</div>

          <div className="game-over-stats">
            <div className="game-over-stat">
              <div className="game-over-label">Total Rupees</div>
              <div className="game-over-value">
                <img 
                  src={greenrupee} 
                  alt="Rupee"
                  className="game-over-rupee-icon"
                />
                <span>{totalRupees}</span>
              </div>
            </div>
          </div>

          <div className="game-over-actions">
            <button 
              className="probability-pill reveal-btn"
              onClick={handleRevealBoard}
            >
              <span className="pill-label">Reveal Board</span>
            </button>
            <button 
              className="probability-pill play-again-btn"
              onClick={handlePlayAgain}
            >
              <span className="pill-label">Play Again</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
