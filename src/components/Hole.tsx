import { useState, useEffect, useRef } from 'react'
import { getItemName } from '../utils/gameLogic'
import { getImageForItem } from '../utils/imageMap'
import { getProbabilityColor } from '../utils/solver'
import { useGame } from '../context/GameContext'
import type { GameMode } from '../hooks/useGameBoard'
import RupeeModal from './RupeeModal'

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
  const holeId = `hole_${col}_${row}`
  
  const itemName = getItemName(cellValue)
  
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
        console.log('Hit bomb!')
        gameActions.setGameOver(true)
        gameActions.addTotalRupees(gameState.currentRupees - gameState.config.houseFee)
      } else if (cellValue > 0) {
        // Safe dig - add rupees and fade out text after delay
        console.log('Found rupee:', cellValue)
        setTimeout(() => setFadeOut(true), 500)
        gameActions.setCurrentRupees(gameState.currentRupees + cellValue)
        gameActions.addTotalRupees(cellValue)
      }
    } else if (gameMode === 2) {
      // In solve mode, open the modal
      setShowModal(true)
    }
  }

  const handleModalSelect = (value: number) => {
    if (gameMode !== 2) return
    
    console.log('Solve mode: placing', value, 'at', row, col)
    // Mark this cell as the one that just changed
    // Update previousValue to current before changing
    gameActions.updateCell(row, col, value)
  }

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
          />
        </>
      )}
    </button>
  )
}
