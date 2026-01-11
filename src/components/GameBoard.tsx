import Hole from './Hole'
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

  // Find safest holes (undug cells with minimum bomb probability)
  let safestHoles = new Set<number>()
  if (gameState.mode === 2 && gameState.solvedBoard) {
    const flatBoard = board.flat()
    let minProbability = Infinity
    
    // First pass: find minimum probability
    for (let i = 0; i < gameState.solvedBoard.length; i++) {
      const boardCell = flatBoard[i]
      const prob = gameState.solvedBoard[i]
      if (boardCell === 0 && typeof prob === 'number' && prob >= 0 && prob < Infinity) {
        minProbability = Math.min(minProbability, prob)
      }
    }

    console.log(`Minimum probability found: ${minProbability}`)
    
    // Second pass: mark all cells with minimum probability
    for (let i = 0; i < gameState.solvedBoard.length; i++) {
      const boardCell = flatBoard[i]
      const prob = gameState.solvedBoard[i]
      if (boardCell === 0 && typeof prob === 'number' && Math.abs(prob - minProbability) < 0.0001) {
        safestHoles.add(i)
      }
    }
    console.log(`Safest holes identified at indices: ${[...safestHoles].join(', ')}`)
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
          cellValue={board[row][col]}
          isRevealed={gameState.revealed[row][col]}
          gameMode={gameState.mode}
          gameActions={gameActions}
          isSafest={safestHoles.has(index)}
        />
      )
    }
  }

  const gridColsClass = `grid-cols-${config.width}`

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
    </div>
  )
}
