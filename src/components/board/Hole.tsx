import { useMemo, useCallback, useState, useEffect } from 'react'
import { getItemName, getBombCountDisplayName } from '../../utils/gameLogic'
import { getImageForItem } from '../../utils/imageMap'
import { useGameStore } from '../../stores/gameStore'
import RupeeModal from '../modals/RupeeModal'
import Starburst from '../shared/Starburst'
import React from 'react'
import { GameMode } from '../../stores/gameStore'
import { computeTileClass, getDisplayProbability, formatHoleId } from '../../utils/tileUtils'

const DEBUG_MODE = true;

const MemoizedRupeeModal = React.memo(RupeeModal)

type HoleProps = {
  row: number
  col: number
  isLowestProbability?: boolean
  modalContainer?: React.RefObject<HTMLDivElement | null>
}

export default React.memo(function Hole({ 
  row, 
  col, 
  isLowestProbability,
  modalContainer
}: HoleProps) {
  const cellValue = useGameStore(state => state.board[row][col])
  const isRevealed = useGameStore(state => state.revealed[row][col])
  const isAutoRevealed = useGameStore(state => state.autoRevealed[row][col])
  const mode = useGameStore(state => state.mode)
  const showProbabilitiesInPlayMode = useGameStore(state => state.showProbabilitiesInPlayMode)
  const gridWidth = useGameStore(state => state.config.width)
  const invalidSourceIndex = useGameStore(state => state.invalidSourceIndex)
  const solverProbability = useGameStore(state => {
    // Show probabilities in Solve Mode OR in Play Mode when enabled
    if (state.mode === GameMode.Solve && state.solvedBoard) {
      return state.solvedBoard[row * state.config.width + col]
    }
    if (state.mode === GameMode.Play && state.showProbabilitiesInPlayMode && state.solvedBoard) {
      return state.solvedBoard[row * state.config.width + col]
    }
    return undefined
  })
  const isGameOver = useGameStore(state => state.isGameOver)
  const isWon = useGameStore(state => state.isWon)
  const updateCell = useGameStore(state => state.updateCell)
  const difficulty = useGameStore(state => state.difficulty)
  const digCell = useGameStore(state => state.digCell)
  const closeRupeeModals = useGameStore(state => state.closeRupeeModals)
  
  const [showModal, setShowModal] = useState(false)
  const [isExploding, setIsExploding] = useState(false)

  // Reset explosion visual when a new game starts or the underlying cell changes
  useEffect(() => {
    if (!isGameOver) {
      setIsExploding(false)
    }
  }, [isGameOver])

  useEffect(() => {
    setIsExploding(false)
  }, [cellValue])
  
  // Close modal when global close signal is triggered
  useEffect(() => {
    if (closeRupeeModals > 0) {
      setShowModal(false)
    }
  }, [closeRupeeModals])
  
  const holeId = formatHoleId(row, col)
    const holeIndex = row * gridWidth + col
    const showInvalidOverlay = invalidSourceIndex === holeIndex
  
  const itemName = useMemo(() => getItemName(cellValue), [cellValue])
  
  // Helper function to determine if we should display probability and return formatted value
  const displayProbability = useMemo(() => (
    getDisplayProbability(cellValue, solverProbability, mode as GameMode)
  ), [cellValue, solverProbability, mode])

  const handleClick = useCallback(() => {
    // Don't allow clicks if game is over or won
    if (isGameOver || isWon) return
    
    if (mode === GameMode.Solve) {
  
      // In solve mode, open the modal
      setShowModal(true)
    } else if (mode === GameMode.Play) {
      if (isRevealed) return
      
      if (cellValue === -1) {
        // Bomb - set game over IMMEDIATELY to prevent other clicks
        console.log('Hit bomb!')
        setIsExploding(true)
      }
      // Delegate the rest of the play logic to the store
      digCell(row, col)
    }
  }, [isGameOver, isWon, mode, isRevealed, cellValue, digCell, row, col])

  const handleModalSelect = useCallback((value: number) => {
    if (mode !== 2) return
    
    updateCell(row, col, value)
    setShowModal(false)
  }, [mode, row, col, updateCell])

  // Determine tile styling based on game mode and cell state
  const tileClass = useMemo(() => (
    computeTileClass(mode as GameMode, cellValue, isRevealed, solverProbability, isLowestProbability, isAutoRevealed)
      + (showInvalidOverlay ? ' tile-invalid-source' : '')
  ), [mode, cellValue, isRevealed, solverProbability, isLowestProbability, isAutoRevealed, showInvalidOverlay])

  return (
    <button 
      className={tileClass} 
      id={holeId}
      onClick={handleClick}
    >
      {isExploding && mode === GameMode.Play && <Starburst />}
      {mode === GameMode.Play ? (
        <>
          {isRevealed && (
            <img 
              className="solverimg" 
              alt={itemName} 
              src={getImageForItem(itemName)} 
            />
          )}
          {!isRevealed && showProbabilitiesInPlayMode && displayProbability !== undefined && (
            <p className="probability-text">{displayProbability}%</p>
          )}
          {!isRevealed && DEBUG_MODE && (
            <p style={{ fontSize: '0.7em', color: 'rgba(255,255,255,1)', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>{itemName}</p>
          )}
        </>
      ) : (
        <>
          {cellValue === 0 && displayProbability !== undefined && (
            <p className="probability-text">{displayProbability}%</p>
          )}
          {cellValue !== 0 && (
            <img 
              className="solverimg" 
              alt={itemName} 
              src={getImageForItem(cellValue === -3 || cellValue === -10 ? itemName : getBombCountDisplayName(cellValue))} 
            />
          )}
          {DEBUG_MODE && (
            <p style={{ fontSize: '0.6em', color: 'rgba(255,255,255,1)', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>{itemName} ({cellValue})</p>
          )}
          <MemoizedRupeeModal 
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            onSelect={handleModalSelect}
            currentValue={cellValue}
            container={modalContainer}
            difficulty={difficulty}
          />
        </>
      )}
      {showInvalidOverlay && <span className="invalid-mark" aria-hidden="true" />}
    </button>
  )
})
