import React, { useState } from 'react'
import { undug } from '../assets/images'
import { getItemName } from '../utils/gameLogic'
import { getImageForItem } from '../utils/imageMap'
import { getProbabilityColor } from '../utils/solver'
import { useGame } from '../context/GameContext'
import type { GameMode } from '../hooks/useGameBoard'

type HoleProps = {
  row: number
  col: number
  cellValue: number
  isRevealed: boolean
  gameMode: GameMode
  gameActions: any
}

export default function Hole({ 
  row, 
  col, 
  cellValue, 
  isRevealed, 
  gameMode, 
  gameActions
}: HoleProps) {
  const { gameState } = useGame()
  const [fadeOut, setFadeOut] = useState(false)
  const holeId = `hole_${col}_${row}`
  
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
    if (isRevealed || gameState.isGameOver || gameMode !== 1) return

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
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (gameMode !== 2) return
    
    const value = parseInt(e.target.value, 10)
    gameActions.updateCell(row, col, value)
  }

  const displayValue = isUndug ? (displayProbability !== undefined ? `${displayProbability}% Bad` : '?% Bad') : getItemName(cellValue)
  
  // Determine background color for solve mode
  let bgColor = undefined
  if (gameMode === 2 && solverProbability !== undefined && solverProbability !== -2) {
    bgColor = getProbabilityColor(solverProbability)
  }

  return (
    <div 
      className={`hole ${isRevealed ? 'dug' : 'undug'}`} 
      id={holeId}
      onClick={handleClick}
      style={{ backgroundColor: bgColor }}
    >
      {gameMode === 1 ? (
        <>
          <p style={{ display: fadeOut ? 'none' : 'block', opacity: fadeOut ? 0 : 1 }}>
            {displayValue}
          </p>
          <img 
            className="solverimg" 
            style={{ 
              opacity: fadeOut ? 0 : 1,
              transition: 'opacity 0.5s ease-out'
            }} 
            alt={itemName} 
            src={isRevealed ? getImageForItem(itemName) : undug} 
          />
        </>
      ) : (
        <>
          <p>{displayValue}</p>
          <img 
            className="solverimg" 
            alt={itemName} 
            src={cellValue !== 0 ? getImageForItem(itemName) : undug} 
          />
          <select className="solverselect" onChange={handleSelectChange} value={cellValue}>
            <option value="0">Undug</option>
            <option value="1">Green rupee</option>
            <option value="5">Blue rupee</option>
            <option value="20">Red rupee</option>
            <option value="100">Silver rupee</option>
            <option value="300">Gold rupee</option>
            <option value="-10">Rupoor</option>
            <option value="-3">Bomb</option>
          </select>
        </>
      )}
    </div>
  )
}
