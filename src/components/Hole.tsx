import { useState } from 'react'
import { getItemName } from '../utils/gameLogic'
import { getImageForItem } from '../utils/imageMap'
import { getProbabilityColor } from '../utils/solver'
import { useGame } from '../context/GameContext'
import RupeeModal from './RupeeModal'

type HoleProps = {
  row: number
  col: number
  isLowestProbability?: boolean
}

export default function Hole({ 
  row, 
  col, 
  isLowestProbability
}: HoleProps) {
  const { gameState, gameActions } = useGame()
  const [showModal, setShowModal] = useState(false)
  const holeId = `hole_${col}_${row}`
  
  // Get cell data from game state
  const cellValue = gameState.board[row][col]
  const isRevealed = gameState.revealed[row][col]
  const gameMode = gameState.mode
  
  const itemName = getItemName(cellValue)
  
  // Get solver probability only in solve mode
  const solverProbability = gameMode === 2 && gameState.solvedBoard 
    ? gameState.solvedBoard[row * gameState.config.width + col]
    : undefined
  
  // Helper function to determine if we should display probability and return formatted value
  const canDisplayProbability = (
    cellVal: number,
    prob: number | undefined,
    mode: number
  ): number | undefined => {
    if (cellVal !== 0 || prob === undefined || prob === -2) {
      return undefined
    }
    if (mode === 2) {
      return Math.floor(prob * 100)
    }
    return undefined
  }
  
  const displayProbability = canDisplayProbability(cellValue, solverProbability, gameMode)

  const handleClick = () => {
    if (gameMode === 2) {
  
      // In solve mode, open the modal
      setShowModal(true)
    } else if (gameMode === 1) {
      if (isRevealed || gameState.isGameOver) return
      gameActions.revealCell(row, col)

      if (cellValue === -1) {
        // Bomb - game over
        console.log('Hit bomb!')
        gameActions.setGameOver(true)
        gameActions.addTotalRupees(gameState.currentRupees - gameState.config.houseFee)
      } else if (cellValue > 0) {
        // Safe dig - add rupees
        console.log('Found rupee:', cellValue)
        gameActions.setCurrentRupees(gameState.currentRupees + cellValue)
        gameActions.addTotalRupees(cellValue)
      }
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

  if (gameMode === 2) {
    // In solve mode, use getProbabilityColor for gradient coloring
    if (cellValue > 0) {
      // Known rupee - show as cream white
      tileClass += ' tile-rupee'
    } else if (solverProbability !== undefined && solverProbability !== -2) {
      // Unknown cell - color based on probability using getProbabilityColor
      tileClass += ' ' + getProbabilityColor(solverProbability)
    }
  } else if (gameMode === 1) {
    // In play mode, show as safe if revealed
    if (isRevealed && cellValue > 0) {
      tileClass += ' tile-safe'
    } else if (isRevealed && cellValue === -1) {
      tileClass += ' tile-bomb'
    }
  }

  if (isLowestProbability && gameMode === 2) {
    tileClass += ' lowest-hole-pulse'
  }

  return (
    <button 
      className={tileClass} 
      id={holeId}
      onClick={handleClick}
    >
      {gameMode === 1 ? (
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
