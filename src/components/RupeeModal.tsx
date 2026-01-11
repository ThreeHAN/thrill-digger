import React from 'react'
import { createPortal } from 'react-dom'
import { getImageForItem } from '../utils/imageMap'
import { getItemName } from '../utils/gameLogic'

type RupeeOption = {
  value: number
  label: string
}

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
}

export default function RupeeModal({ isOpen, onClose, onSelect, currentValue }: RupeeModalProps) {
  if (!isOpen) return null

  const handleSelect = (value: number, e: React.MouseEvent) => {
    e.stopPropagation()
    console.log(`Selected value: ${value} (${getItemName(value)})`)
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

  return createPortal(
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="circular-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="rupee-wheel">
          <button className="wheel-cancel" onClick={handleCloseClick}>
            Cancel
          </button>
          {rupeeOptions.map((option, index) => {
            const angle = (index / rupeeOptions.length) * 360
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
    </div>,
    document.body
  )
}
