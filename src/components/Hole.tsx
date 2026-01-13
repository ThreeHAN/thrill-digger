import { useState } from 'react'
import { getItemName } from '../utils/gameLogic'
import { getImageForItem } from '../utils/imageMap'
import { getProbabilityColor } from '../utils/solver'
import { useGameStore } from '../stores/gameStore'
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
  const board = useGameStore(state => state.board)
  const revealed = useGameStore(state => state.revealed)
  const mode = useGameStore(state => state.mode)
  const solvedBoard = useGameStore(state => state.solvedBoard)
  const config = useGameStore(state => state.config)
  const isGameOver = useGameStore(state => state.isGameOver)
  const currentRupees = useGameStore(state => state.currentRupees)
  const revealCell = useGameStore(state => state.revealCell)
  const setGameOver = useGameStore(state => state.setGameOver)
  const addTotalRupees = useGameStore(state => state.addTotalRupees)
  const setCurrentRupees = useGameStore(state => state.setCurrentRupees)
  const updateCell = useGameStore(state => state.updateCell)
  
  const [showModal, setShowModal] = useState(false)
  const holeId = `hole_${col}_${row}`
  
  // Get cell data from game state
  const cellValue = board[row][col]
  const isRevealed = revealed[row][col]
  
  const itemName = getItemName(cellValue)
  
  // Get solver probability only in solve mode
  const solverProbability = mode === 2 && solvedBoard 
    ? solvedBoard[row * config.width + col]
    : undefined
  
  // Helper function to determine if we should display probability and return formatted value
  const canDisplayProbability = (
    cellVal: number,
    prob: number | undefined,
    gameMode: number
  ): number | undefined => {
    if (cellVal !== 0 || prob === undefined || prob === -2) {
      return undefined
    }
    if (gameMode === 2) {
      return Math.floor(prob * 100)
    }
    return undefined
  }
  
  const displayProbability = canDisplayProbability(cellValue, solverProbability, mode)

  const handleClick = () => {
    if (mode === 2) {
  
      // In solve mode, open the modal
      setShowModal(true)
    } else if (mode === 1) {
      if (isRevealed || isGameOver) return
      revealCell(row, col)

      if (cellValue === -1) {
        // Bomb - game over
        console.log('Hit bomb!')
        setGameOver(true)
        addTotalRupees(currentRupees - config.houseFee)
      } else if (cellValue > 0) {
        // Safe dig - add rupees
        console.log('Found rupee:', cellValue)
        setCurrentRupees(currentRupees + cellValue)
        addTotalRupees(cellValue)
      }
    }
  }

  const handleModalSelect = (value: number) => {
    if (mode !== 2) return
    
    console.log('Solve mode: placing', value, 'at', row, col)

    updateCell(row, col, value)
  }

  // Determine tile styling based on game mode and cell state
  let tileClass = 'tile undug'

  if (mode === 2) {
    // In solve mode, use getProbabilityColor for gradient coloring
    if (cellValue > 0) {
      // Known rupee - show as cream white
      tileClass += ' tile-rupee'
    } else if (solverProbability !== undefined && solverProbability !== -2) {
      // Unknown cell - color based on probability using getProbabilityColor
      tileClass += ' ' + getProbabilityColor(solverProbability)
    }
  } else if (mode === 1) {
    // In play mode, show as safe if revealed
    if (isRevealed && cellValue > 0) {
      tileClass += ' tile-safe'
    } else if (isRevealed && cellValue === -1) {
      tileClass += ' tile-bomb'
    }
  }

  if (isLowestProbability && mode === 2) {
    tileClass += ' lowest-hole-pulse'
  }

  return (
    <button 
      className={tileClass} 
      id={holeId}
      onClick={handleClick}
    >
      {mode === 1 ? (
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
