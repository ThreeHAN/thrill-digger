import React, { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getImageForItem } from '../../utils/imageMap'
import { getItemName, Difficulty } from '../../utils/gameLogic'

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
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const rupeeButtonsRef = useRef<Map<number, HTMLButtonElement>>(new Map())
  const svgRef = useRef<SVGSVGElement>(null)

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

  const handleRupeeHover = (index: number) => {
    setHoveredIndex(index)
    updateLine(index)
  }

  const handleRupeeLeave = () => {
    setHoveredIndex(null)
    clearLine()
  }

  const updateLine = (index: number) => {
    const svg = svgRef.current
    const cancelButton = cancelButtonRef.current
    const rupeeButton = rupeeButtonsRef.current.get(index)

    if (!svg || !cancelButton || !rupeeButton) return

    const cancelRect = cancelButton.getBoundingClientRect()
    const rupeeRect = rupeeButton.getBoundingClientRect()
    const svgRect = svg.getBoundingClientRect()

    // Calculate positions relative to the SVG
    const cancelX = cancelRect.left - svgRect.left + cancelRect.width / 2
    const cancelY = cancelRect.top - svgRect.top + cancelRect.height / 2
    const rupeeX = rupeeRect.left - svgRect.left + rupeeRect.width / 2
    const rupeeY = rupeeRect.top - svgRect.top + rupeeRect.height / 2

    const line = svg.querySelector('line')
    if (line) {
      line.setAttribute('x1', cancelX.toString())
      line.setAttribute('y1', cancelY.toString())
      line.setAttribute('x2', rupeeX.toString())
      line.setAttribute('y2', rupeeY.toString())
      line.style.opacity = '1'
    }
  }

  const clearLine = () => {
    const svg = svgRef.current
    const line = svg?.querySelector('line')
    if (line) {
      line.style.opacity = '0'
    }
  }

  const portal = (
    <div className="modal-backdrop rupee-backdrop" onClick={handleBackdropClick}>
      <div className="circular-modal-content" onClick={(e) => e.stopPropagation()}>
        <svg
          ref={svgRef}
          className="rupee-wheel-svg"
          width="100%"
          height="100%"
        >
          <line x1="0" y1="0" x2="0" y2="0" className="rupee-hover-line" />
        </svg>
        <div className="rupee-wheel">
          <button 
            ref={cancelButtonRef}
            className="wheel-cancel" 
            onClick={handleCloseClick}
          >
            Cancel
          </button>
          {filteredOptions.map((option, index) => {
            const angle = (index / filteredOptions.length) * 360
            return (
              <button
                key={option.value}
                ref={(el) => {
                  if (el) rupeeButtonsRef.current.set(index, el)
                }}
                className={`rupee-option-circular ${currentValue === option.value && currentValue !== 0 ? 'selected' : ''}`}
                onClick={(e) => handleSelect(option.value, e)}
                onMouseEnter={() => handleRupeeHover(index)}
                onMouseLeave={handleRupeeLeave}
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
  return createPortal(portal, targetContainer)
}