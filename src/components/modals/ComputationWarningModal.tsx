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

  const hasCombinationData = combinations !== undefined || combinationsRemaining !== undefined
  const remaining = combinationsRemaining ?? combinations ?? 0
  const total = combinations ?? combinationsRemaining ?? 0
  const progress = total > 0 ? Math.max(0, Math.min(1, 1 - remaining / total)) : 0
  const formattedTime = estimatedTime !== undefined && estimatedTime >= 0 ? `${estimatedTime} seconds` : '...'
  const formattedRemaining = hasCombinationData ? remaining.toLocaleString() : '...'

  return createPortal(
    <div className="modal-backdrop">
      <div className="modal-content computation-modal computation-warning">
        <div className="computation-frame">
          <div className="computation-title">Computing Treasure Locations...</div>

          <div className="computation-stats">
            <div className="stat">
              <span className="stat-label">Estimated Time:</span>
              <span className="stat-value monospace">{formattedTime}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Combinations Remaining:</span>
              <span className="stat-value monospace">{formattedRemaining}</span>
            </div>
          </div>

          <div
            className="computation-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
          >
            <div className="progress-rail">
              <div className="progress-fill" style={{ width: `${(progress * 100).toFixed(1)}%` }} />
            </div>
          </div>

          <div className="computation-actions">
            <button
              className="probability-pill computation-btn"
              onClick={onCancel}
            >
              <span className="pill-label">Cancel</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
