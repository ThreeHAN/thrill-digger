import { createPortal } from 'react-dom'

type ComputationWarningModalProps = {
  isOpen: boolean
  estimatedTime?: number
  combinations?: number
  combinationsRemaining?: number
  requiresConfirmation?: boolean
  onConfirm?: () => void
  onCancel?: () => void
}

export default function ComputationWarningModal({ 
  isOpen,
  estimatedTime,
  combinations,
  combinationsRemaining,
  requiresConfirmation = false,
  onConfirm,
  onCancel
}: ComputationWarningModalProps) {
  if (!isOpen) return null

  return createPortal(
    <div className="modal-backdrop" onClick={requiresConfirmation ? onCancel : undefined}>
      <div className={`modal-content computation-modal ${requiresConfirmation ? 'warning-modal' : ''}`} onClick={(e) => e.stopPropagation()}>
        <h2>{requiresConfirmation ? '⚠️ Heavy Computation Warning' : '🎵 One moment, hero...'}</h2>
        <p>{requiresConfirmation 
          ? 'This computation will take a significant amount of time.' 
          : 'Computing treasure locations...'
        }</p>
        {estimatedTime !== undefined && combinations !== undefined && (
          <div className="computation-details">
            <p className="small-text">ESTIMATED TIME: <span className="monospace">{estimatedTime} seconds</span></p>
            <p className="small-text">{requiresConfirmation 
              ? <>COMBINATIONS TO ANALYZE: <span className="monospace">{combinations.toLocaleString()}</span></>
              : <>COMBINATIONS REMAINING: <span className="monospace">{(combinationsRemaining ?? combinations).toLocaleString()}</span></>
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
