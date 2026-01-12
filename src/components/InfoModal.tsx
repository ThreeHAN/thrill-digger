import { createPortal } from 'react-dom'

type InfoModalProps = {
  isOpen: boolean
  onClose: () => void
}

export default function InfoModal({ isOpen, onClose }: InfoModalProps) {
  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return createPortal(
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>How to Play</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="info-modal-content">
          <div className="info-section">
            <h3 className="info-section-title">Difficulty Levels</h3>
            <div className="info-cards-grid">
              <div className="info-card">
                <p className="info-card-title">Beginner</p>
                <p className="info-card-detail">House Fee: -30 rupees</p>
                <p className="info-card-detail-secondary">Hazards: 4 bombs, 0 rupoors</p>
              </div>
              <div className="info-card">
                <p className="info-card-title">Intermediate</p>
                <p className="info-card-detail">House Fee: -50 rupees</p>
                <p className="info-card-detail-secondary">Hazards: 4 bombs, 4 rupoors</p>
              </div>
              <div className="info-card">
                <p className="info-card-title">Expert</p>
                <p className="info-card-detail">House Fee: -70 rupees</p>
                <p className="info-card-detail-secondary">Hazards: 8 bombs, 8 rupoors</p>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h3 className="info-section-title">Rupee Values</h3>
            <p className="info-description">
              The rupee you dig up tells you how many bombs or rupoors are in the 8 adjacent squares:
            </p>
            <div className="info-cards-grid">
              <div className="info-card">
                <p className="info-card-title" style={{ color: '#90EE90' }}>Green Rupee</p>
                <p className="info-card-detail">Value: +1 rupee</p>
                <p className="info-card-detail-secondary">Nearby hazards: 0</p>
              </div>
              <div className="info-card">
                <p className="info-card-title" style={{ color: '#4169E1' }}>Blue Rupee</p>
                <p className="info-card-detail">Value: +5 rupees</p>
                <p className="info-card-detail-secondary">Nearby hazards: 1-2</p>
              </div>
              <div className="info-card">
                <p className="info-card-title" style={{ color: '#DC143C' }}>Red Rupee</p>
                <p className="info-card-detail">Value: +20 rupees</p>
                <p className="info-card-detail-secondary">Nearby hazards: 3-4</p>
              </div>
              <div className="info-card">
                <p className="info-card-title" style={{ color: '#C0C0C0' }}>Silver Rupee</p>
                <p className="info-card-detail">Value: +100 rupees</p>
                <p className="info-card-detail-secondary">Nearby hazards: 5-6</p>
              </div>
              <div className="info-card">
                <p className="info-card-title" style={{ color: '#FFD700' }}>Gold Rupee</p>
                <p className="info-card-detail">Value: +300 rupees</p>
                <p className="info-card-detail-secondary">Nearby hazards: 7-8</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
