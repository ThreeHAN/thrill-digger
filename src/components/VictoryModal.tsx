import { createPortal } from 'react-dom'
import { greenrupee } from '../assets/images'

type VictoryModalProps = {
  isOpen: boolean
  totalRupees: number
  onPlayAgain: () => void
}

export default function VictoryModal({ isOpen, totalRupees, onPlayAgain }: VictoryModalProps) {
  if (!isOpen) return null

  const handlePlayAgain = () => {
    onPlayAgain()
  }

  return createPortal(
    <div className="modal-backdrop" onClick={(e) => {
      if (e.target === e.currentTarget) {
        handlePlayAgain()
      }
    }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header victory-modal-header">
          <h2 className="victory-modal-title">Congrats Hero!</h2>
          <p className="victory-modal-subtitle">
            You avoided all the bombs!
          </p>
        </div>
        <div className="victory-modal-body">
          <div className="victory-rupee-display">
            <img 
              src={greenrupee} 
              alt="Rupee"
              className="victory-rupee-icon"
            />
            <span>{totalRupees}</span>
          </div>
        </div>
        <div className="victory-modal-footer">
          <button 
            className="wood-btn victory-play-again-btn"
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
