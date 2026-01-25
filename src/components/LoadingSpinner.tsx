import { createPortal } from 'react-dom'

type LoadingSpinnerProps = {
  isOpen: boolean
}

export default function LoadingSpinner({ isOpen }: LoadingSpinnerProps) {
  if (!isOpen) return null

  return createPortal(
    <div className="modal-backdrop loading-spinner-backdrop">
      <div className="loading-spinner-container">
        <div className="loading-spinner" />
        <p>Computing treasure locations...</p>
      </div>
    </div>,
    document.body
  )
}
