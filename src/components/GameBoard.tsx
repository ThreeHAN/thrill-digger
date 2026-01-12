import Hole from './Hole'
import ErrorModal from './ErrorModal'
import { useGame } from '../context/GameContext'
import React, { useEffect, useState } from 'react'

export default function GameBoard() {
  const { gameState, gameActions } = useGame()
  const { config, board } = gameState
  const [tileSize, setTileSize] = useState<number>(64)

  useEffect(() => {
    const GAP = 10 // matches .grid-board gap in CSS
    const CONTAINER_PADDING = 20 // body/container padding from CSS
    const MAX_TILE = 120 // cap tile size to avoid oversized tiles on small boards

    const computeSize = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight

      const headerEl = document.querySelector('.game-header') as HTMLElement | null
      const controlsEl = document.querySelector('.controls') as HTMLElement | null
      const headerH = headerEl?.offsetHeight ?? 0
      const controlsH = controlsEl?.offsetHeight ?? 0

      const availW = vw - CONTAINER_PADDING * 2 - GAP * (config.width - 1)
      const availH = vh - headerH - controlsH - CONTAINER_PADDING * 2 - GAP * (config.height - 1)

      const sizeW = Math.floor(availW / config.width)
      const sizeH = Math.floor(availH / config.height)
      const size = Math.max(24, Math.min(MAX_TILE, Math.min(sizeW, sizeH)))
      setTileSize(size)
    }

    computeSize()
    window.addEventListener('resize', computeSize)
    return () => window.removeEventListener('resize', computeSize)
  }, [config.width, config.height])

  // Find lowest probability hole for highlighting
  let lowestProbabilityIndex = -1
  if (gameState.mode === 2 && gameState.solvedBoard) {
    const flatBoard = board.flat()
    let minProbability = Infinity
    let maxProbability = -Infinity
    
    // First pass: find minimum and maximum probability
    for (let i = 0; i < gameState.solvedBoard.length; i++) {
      const boardCell = flatBoard[i]
      const prob = gameState.solvedBoard[i]
      if (boardCell === 0 && typeof prob === 'number' && prob >= 0 && prob < Infinity) {
        minProbability = Math.min(minProbability, prob)
        maxProbability = Math.max(maxProbability, prob)
      }
    }
    
    // Only show highlight if there's a difference in probabilities
    if (minProbability < maxProbability) {
      // Collect all candidate indices with the minimum probability
      const candidates: number[] = []
      for (let i = 0; i < gameState.solvedBoard.length; i++) {
        const boardCell = flatBoard[i]
        const prob = gameState.solvedBoard[i]
        if (boardCell === 0 && typeof prob === 'number' && Math.abs(prob - minProbability) < 0.0001) {
          candidates.push(i)
        }
      }

      if (candidates.length > 0) {
        // If we know the last changed index, pick the nearest candidate
        const lastIdx = gameState.lastChangedIndex
        if (typeof lastIdx === 'number') {
          const w = config.width
          const lastRow = Math.floor(lastIdx / w)
          const lastCol = lastIdx % w
          let bestIdx = candidates[0]
          let bestDist = Infinity
          for (const i of candidates) {
            const r = Math.floor(i / w)
            const c = i % w
            const dist = Math.abs(r - lastRow) + Math.abs(c - lastCol)
            if (dist < bestDist) {
              bestDist = dist
              bestIdx = i
            }
          }
          lowestProbabilityIndex = bestIdx
        } else {
          // Fallback: first candidate
          lowestProbabilityIndex = candidates[0]
        }
      }
    }
  }

  const holes: React.ReactNode[] = []
  for (let row = 0; row < config.height; row++) {
    for (let col = 0; col < config.width; col++) {
      const index = row * config.width + col

      holes.push(
        <Hole 
          key={`${col}-${row}`} 
          row={row} 
          col={col} 
          isLowestProbability={index === lowestProbabilityIndex}
        />
      )
    }
  }

  return (
    <div id="gamearea" className="m-auto">
      <div id="diggerarea" className="diggerarea">
        <div 
          className="grid-board" 
          style={{ 
            gridTemplateColumns: `repeat(${config.width}, var(--tile-size))`,
            // expose CSS var for tiles
            ['--tile-size' as any]: `${tileSize}px`
          }}
        >
          {holes}
        </div>
      </div>
      <ErrorModal
        isOpen={gameActions.showInvalidBoardError}
        onClose={() => gameActions.setShowInvalidBoardError(false)}
        message="Not a valid board!"
      />
    </div>
  )
}
