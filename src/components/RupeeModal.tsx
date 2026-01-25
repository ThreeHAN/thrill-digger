import React from 'react'
import { createPortal } from 'react-dom'
import { getImageForItem } from '../utils/imageMap'
import { getItemName, Difficulty } from '../utils/gameLogic'

type RupeeOption = {
  value: number
  label: string
}

// Show rupee values in UI like vanilla - they get converted to bomb counts on storage
const rupeeOptions: RupeeOption[] = [
  { value: 0, label: 'Undug' },
  { value: 1, label: 'Green rupee' },
  { value: 5, label: 'Blue rupee' },
  { value: 20, label: 'Red rupee' },
  { value: 100, label: 'Silver rupee' },
  { value: 300, label: 'Gold rupee' },
  { value: -10, label: 'Rupoor' },
]

type RupeeModalProps = {
  isOpen: boolean
  onClose: () => void
  onSelect: (value: number) => void
  currentValue: number
  container?: React.RefObject<HTMLDivElement | null>
  difficulty: Difficulty
}

export default function RupeeModal({ isOpen, onClose, onSelect, currentValue, container, difficulty }: RupeeModalProps) {
  if (!isOpen) return null

  // Filter options based on difficulty - beginner mode excludes rupoors, gold, and silver
  const filteredOptions = difficulty === Difficulty.Beginner
    ? rupeeOptions.filter(option => option.value !== -10 && option.value !== 100 && option.value !== 300)
    : rupeeOptions

  const handleSelect = (value: number, e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(value)
    onClose()
  }

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

  const portal = (
    <div className="modal-backdrop rupee-backdrop" onClick={handleBackdropClick}>
      <div className="circular-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="rupee-wheel">
          <button className="wheel-cancel" onClick={handleCloseClick}>
            Cancel
          </button>
          {filteredOptions.map((option, index) => {
            const angle = (index / filteredOptions.length) * 360
            return (
              <button
                key={option.value}
                className={`rupee-option-circular ${currentValue === option.value && currentValue !== 0 ? 'selected' : ''}`}
                onClick={(e) => handleSelect(option.value, e)}
                style={
                  { '--angle': `${angle}deg` } as React.CSSProperties & { '--angle': string }
                }
              >
                <img 
                  src={getImageForItem(getItemName(option.value))} 
                  alt={option.label}
                  className="rupee-image"
                />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  // If a container ref is provided, use it; otherwise portal to body
  const targetContainer = container?.current || document.body
  return createPortal(portal, targetContainer)}