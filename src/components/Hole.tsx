import { useState, useEffect, useRef } from 'react'
import { getItemName } from '../utils/gameLogic'
import { getImageForItem } from '../utils/imageMap'
import { getProbabilityColor, getValidRupeeOptions } from '../utils/solver'
import { useGame } from '../context/GameContext'
import type { GameMode } from '../hooks/useGameBoard'
import RupeeModal from './RupeeModal'
import ErrorModal from './ErrorModal'

type HoleProps = {
  row: number
  col: number
  cellValue: number
  isRevealed: boolean
  gameMode: GameMode
  gameActions: any
  isSafest: boolean
}

export default function Hole({ 
  row, 
  col, 
  cellValue, 
  isRevealed, 
  gameMode, 
  gameActions,
  isSafest
}: HoleProps) {
  const { gameState } = useGame()
  const [fadeOut, setFadeOut] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showError, setShowError] = useState(false)
  const [previousValue, setPreviousValue] = useState(cellValue)
  const alreadyRestoredRef = useRef(false)
  const holeId = `hole_${col}_${row}`
  
  // Update previousValue when board becomes valid (successful move)
  useEffect(() => {
    if (gameState.solvedBoard !== null) {
      setPreviousValue(cellValue)
      alreadyRestoredRef.current = false
    }
  }, [cellValue, gameState.solvedBoard])
  
  // Check if solver returned null (invalid board)
  useEffect(() => {
    if (gameMode === 2 && gameState.solvedBoard === null && cellValue !== 0 && !alreadyRestoredRef.current) {
      // Invalid board detected - restore this cell to previous value
      alreadyRestoredRef.current = true
      setShowError(true)
      gameActions.updateCell(row, col, previousValue)
    }
  }, [gameState.solvedBoard, gameMode, cellValue, previousValue, row, col, gameActions])
  
  const getShortLabel = (value: number): string => {
    switch (value) {
      case -3: return 'Bomb'
      case -10: return 'Rupoor'
      case -1: return 'Undug'
      case 1: return 'Green'
      case 5: return 'Blue'
      case 20: return 'Red'
      case 100: return 'Silver'
      case 300: return 'Gold'
      default: return 'Error'
    }
  }

  const itemName = getItemName(cellValue)
  const isUndug = cellValue === 0 || (gameMode === 1 && !isRevealed)
  
  // Get solver probability if in solve mode
  const solverProbability = gameState.solvedBoard 
    ? gameState.solvedBoard[row * gameState.config.width + col]
    : undefined
  
  // Only display probability if it's actually a probability (0-1 range or -2 for unknown)
  // If cellValue > 0, it's a known rupee so don't show probability
  const displayProbability = cellValue === 0 && solverProbability !== undefined && solverProbability !== -2
    ? Math.floor(solverProbability * 100)
    : undefined

  const handleClick = () => {
    if (gameMode === 1) {
      if (isRevealed || gameState.isGameOver) return

      gameActions.revealCell(row, col)
      
      if (cellValue === -1) {
        // Bomb - game over
        gameActions.setGameOver(true)
        gameActions.addTotalRupees(gameState.currentRupees - gameState.config.houseFee)
      } else if (cellValue > 0) {
        // Safe dig - add rupees and fade out text after delay
        setTimeout(() => setFadeOut(true), 500)
        gameActions.setCurrentRupees(gameState.currentRupees + cellValue)
      }
    } else if (gameMode === 2) {
      // In solve mode, open the modal
      setShowModal(true)
    }
  }

  const handleModalSelect = (value: number) => {
    if (gameMode !== 2) return
    
    gameActions.updateCell(row, col, value)
  }

  // Compute valid rupee options for this cell
  const validRupeeOptions = getValidRupeeOptions(gameState.board, row, col, gameState.config.width, gameState.config.height)
  
  // Determine tile styling based on game mode and cell state
  let tileClass = 'tile undug'
  let backgroundColor: string | undefined

  if (gameMode === 2) {
    // In solve mode, use getProbabilityColor for gradient coloring
    if (cellValue > 0) {
      // Known rupee - show as cream white
      backgroundColor = '#f5f5dc'
    } else if (solverProbability !== undefined && solverProbability !== -2) {
      // Unknown cell - color based on probability using getProbabilityColor
      backgroundColor = getProbabilityColor(solverProbability)
    }
  } else if (gameMode === 1) {
    // In play mode, show as safe if revealed
    if (isRevealed && cellValue > 0) {
      backgroundColor = '#4e7d5b'
    } else if (isRevealed && cellValue === -1) {
      backgroundColor = '#a84432'
    }
  }

  return (
    <button 
      className={tileClass} 
      id={holeId}
      onClick={handleClick}
      style={{ 
        width: 'var(--tile-size)',
        ...(backgroundColor && { backgroundColor })
      }}
    >
      {gameMode === 1 ? (
        <>
          {isRevealed && (
            <img 
              className="solverimg" 
              style={{ 
                opacity: fadeOut ? 0 : 1,
                transition: 'opacity 0.5s ease-out'
              }} 
              alt={itemName} 
              src={getImageForItem(itemName)} 
            />
          )}
        </>
      ) : (
        <>
          {cellValue === 0 && displayProbability !== undefined && (
            <p>{displayProbability}%</p>
          )}
          {cellValue !== 0 && (
            <img 
              className="solverimg" 
              alt={itemName} 
              src={getImageForItem(itemName)} 
            />
          )}
          <RupeeModal 
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            onSelect={handleModalSelect}
            currentValue={cellValue}
            validOptions={validRupeeOptions}
          />
          <ErrorModal
            isOpen={showError}
            onClose={() => setShowError(false)}
            message="This placement creates an invalid board. The cell has been reset."
          />
        </>
      )}
    </button>
  )
}
