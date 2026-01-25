import { createPortal } from 'react-dom'

type ComputationWarningModalProps = {
  isOpen: boolean
  estimatedTime?: number
  combinations?: number
  combinationsRemaining?: number
  onCancel?: () => void
}

export default function ComputationWarningModal({ 
  isOpen,
  estimatedTime,
  combinations,
  combinationsRemaining,
  onCancel
}: ComputationWarningModalProps) {
  if (!isOpen) return null

  return createPortal(
    <div className="modal-backdrop">
      <div className="modal-content computation-modal">
        <h2>One moment, hero...</h2>
        <p>Computing treasure locations...</p>
        {estimatedTime !== undefined && combinations !== undefined && (
          <div className="computation-details">
            <p className="small-text">ESTIMATED TIME: <span className="monospace">{estimatedTime >= 0 ? estimatedTime : '......'} {estimatedTime >= 0 ? 'seconds' : ''}</span></p>
            <p className="small-text">COMBINATIONS REMAINING: <span className="monospace">{(combinationsRemaining ?? combinations).toLocaleString()}</span></p>
          </div>
        )}
        <div className="computation-actions">
          <button className="wood-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
