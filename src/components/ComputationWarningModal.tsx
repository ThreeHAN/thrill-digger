import { createPortal } from 'react-dom'

type ComputationWarningModalProps = {
  isOpen: boolean
  estimatedTime?: number
  combinations?: number
  requiresConfirmation?: boolean
  onConfirm?: () => void
  onCancel?: () => void
}

export default function ComputationWarningModal({ 
  isOpen,
  estimatedTime,
  combinations,
  requiresConfirmation = false,
  onConfirm,
  onCancel
}: ComputationWarningModalProps) {
  if (!isOpen) return null

  return createPortal(
    <div className="modal-backdrop" onClick={requiresConfirmation ? onCancel : undefined}>
      <div className={`modal-content computation-modal ${requiresConfirmation ? 'warning-modal' : ''}`} onClick={(e) => e.stopPropagation()}>
        {!requiresConfirmation && <div className="spinner"></div>}
        <h2>{requiresConfirmation ? '⚠️ Heavy Computation Warning' : '🎵 One moment, hero...'}</h2>
        <p>{requiresConfirmation 
          ? 'This computation will take a significant amount of time.' 
          : 'Computing treasure locations...'
        }</p>
        {estimatedTime !== undefined && combinations !== undefined && (
          <div className="computation-details">
            <p className="small-text">Estimated time: {estimatedTime} seconds</p>
            <p className="small-text">{requiresConfirmation 
              ? `${combinations.toLocaleString()} combinations to analyze`
              : `Analyzing ${combinations.toLocaleString()} combinations...`
            }</p>
            {requiresConfirmation && (
              <p className="warning-text">This will take a while. Continue?</p>
            )}
          </div>
        )}
        {requiresConfirmation && (
          <div className="computation-actions">
            <button className="wood-btn" onClick={onCancel}>
              Cancel
            </button>
            <button className="wood-btn" onClick={onConfirm}>
              Continue
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
