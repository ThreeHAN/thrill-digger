import React from 'react'
import { createPortal } from 'react-dom'

type ErrorModalProps = {
  isOpen: boolean
  onClose: () => void
  message: string
}

export default function ErrorModal({ isOpen, onClose, message }: ErrorModalProps) {
  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return createPortal(
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="info-modal-frame">
          <div className="info-modal-header">
            <h2>Invalid Board</h2>
        
          </div>
          <div className="info-modal-content">
            <div className="error-message">
              <p>{message}</p>
            </div>
          </div>

                      <button
              className="probability-pill computation-btn"
              onClick={onClose}
            >
              <span className="pill-label">OK</span>
            </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
