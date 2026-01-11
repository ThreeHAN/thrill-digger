import React from 'react'
import { createPortal } from 'react-dom'

type ComputationWarningModalProps = {
  isOpen: boolean
  onClose: () => void
  message: string
  estimatedTime: number
  totalCombinations: number
}

export default function ComputationWarningModal({ 
  isOpen, 
  onClose, 
  message,
  estimatedTime,
  totalCombinations
}: ComputationWarningModalProps) {
  if (!isOpen) return null

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
      <div className="modal-content warning-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚠️ Heavy Computation</h2>
          <button className="modal-close" onClick={handleCloseClick}>×</button>
        </div>
        <div className="warning-message">
          <p>{message}</p>
          <div className="warning-details">
            <p><strong>Estimated compute time:</strong> {estimatedTime} seconds</p>
            <p><strong>Total computations:</strong> {totalCombinations.toLocaleString()}</p>
            <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#d4a574' }}>
              Your browser will be unresponsive during calculation.
            </p>
          </div>
        </div>
        <div className="warning-actions">
          <button className="wood-btn" onClick={handleCloseClick}>Proceed</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
