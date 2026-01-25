import { createPortal } from 'react-dom'
import {
  IntroSection,
  PlayModeSection,
  SolveModeSection,
  DifficultyLevelsSection,
  RupeeValuesSection,
} from './InfoSections'

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
      <div className="info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="info-modal-frame">
          <div className="info-modal-header">
            <h2>How to Play</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>

          <div className="info-modal-content">
          <IntroSection />
          <PlayModeSection />
          <SolveModeSection />
          <DifficultyLevelsSection />
          <RupeeValuesSection />
        </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
