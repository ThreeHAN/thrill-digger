import { createPortal } from 'react-dom'
import { greenrupee } from '../assets/images'

type GameOverModalProps = {
  isOpen: boolean
  totalRupees: number
  onPlayAgain: () => void
}

export default function GameOverModal({ isOpen, totalRupees, onPlayAgain }: GameOverModalProps) {
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
        <div className="modal-header" style={{ display: 'block', textAlign: 'center' }}>
          <h2 style={{ fontSize: '4rem', margin: 0 }}>Game Over!</h2>
        </div>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: '20px',
          padding: '20px 0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#ffd700'
          }}>
            <img 
              src={greenrupee} 
              alt="Rupee"
              style={{ width: '60px', height: '60px', objectFit: 'contain' }}
            />
            <span>{totalRupees}</span>
          </div>
        </div>
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'center',
          paddingTop: '20px'
        }}>
          <button 
            className="wood-btn"
            onClick={handlePlayAgain}
            style={{ padding: '10px 20px' }}
          >
            Play Again
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
