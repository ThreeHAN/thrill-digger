type UndoButtonProps = {
  canUndo: boolean
  onUndo: () => void
  className?: string
}

export default function UndoButton({ canUndo, onUndo, className = 'undo-pill' }: UndoButtonProps) {
  return null;
  if (!canUndo) return null

  return (
    <button
      className={`probability-pill ${className} ${canUndo ? 'is-active' : ''}`}
      onClick={onUndo}
      disabled={!canUndo}
      aria-label="Undo last reveal"
      title={canUndo ? 'Undo last reveal' : 'No moves to undo'}
    >
      <span className="pill-label">Undo</span>
    </button>
  )
}
