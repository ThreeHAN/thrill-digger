import { useMemo, useCallback, useState } from 'react'
import { getItemName } from '../utils/gameLogic'
import { getImageForItem } from '../utils/imageMap'
import { useGameStore } from '../stores/gameStore'
import RupeeModal from './RupeeModal'
import Starburst from './Starburst'
import React from 'react'
import { GameMode } from '../stores/gameStore'
import { computeTileClass, getDisplayProbability, formatHoleId } from '../utils/tileUtils'

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
  const mode = useGameStore(state => state.mode)
  const solverProbability = useGameStore(state => 
    state.mode === GameMode.Solve && state.solvedBoard
      ? state.solvedBoard[row * state.config.width + col]
      : undefined
  )
  const isGameOver = useGameStore(state => state.isGameOver)
  const isWon = useGameStore(state => state.isWon)
  const updateCell = useGameStore(state => state.updateCell)
  const difficulty = useGameStore(state => state.difficulty)
  const digCell = useGameStore(state => state.digCell)
  
  const [showModal, setShowModal] = useState(false)
  const [isExploding, setIsExploding] = useState(false)
  
  const holeId = formatHoleId(row, col)
  
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
    
    console.log('Solve mode: placing', value, 'at', row, col)

    updateCell(row, col, value)
    setShowModal(false)
  }, [mode, row, col, updateCell])

  // Determine tile styling based on game mode and cell state
  const tileClass = useMemo(() => (
    computeTileClass(mode as GameMode, cellValue, isRevealed, solverProbability, isLowestProbability)
  ), [mode, cellValue, isRevealed, solverProbability, isLowestProbability])

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
              src={getImageForItem(itemName)} 
            />
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
    </button>
  )
})
