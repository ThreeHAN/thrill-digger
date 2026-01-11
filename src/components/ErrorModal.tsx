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

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose()
  }

  return createPortal(
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content error-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Invalid Board</h2>
          <button className="modal-close" onClick={handleCloseClick}>×</button>
        </div>
        <div className="error-message">
          <p>{message}</p>
        </div>
        <div className="error-actions">
          <button className="wood-btn" onClick={handleCloseClick}>OK</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
