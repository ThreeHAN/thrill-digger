import { createPortal } from 'react-dom'
import { greenrupee } from '../assets/images'
import '../styles/_game-over-modal.scss'

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
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="game-over-header">
          <h2>Game Over!</h2>
        </div>
        <div className="game-over-content">
          <div className="game-over-rupees">
            <img 
              src={greenrupee} 
              alt="Rupee"
              className="game-over-rupee-image"
            />
            <span>{totalRupees}</span>
          </div>
        </div>
        <div className="game-over-actions">
          <button 
            className="wood-btn game-over-button"
            onClick={handleRevealBoard}
          >
            Reveal Board
          </button>
          <button 
            className="wood-btn game-over-button"
            onClick={handlePlayAgain}
          >
            Play Again
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
