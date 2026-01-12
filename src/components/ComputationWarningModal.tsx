import { createPortal } from 'react-dom'

type ComputationWarningModalProps = {
  isOpen: boolean
}

export default function ComputationWarningModal({ 
  isOpen
}: ComputationWarningModalProps) {
  if (!isOpen) return null

  return createPortal(
    <div className="modal-backdrop">
      <div className="modal-content computation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="spinner"></div>
        <h2>🎵 One moment, hero...</h2>
        <p>Computing treasure locations...</p>
      </div>
    </div>,
    document.body
  )
}
