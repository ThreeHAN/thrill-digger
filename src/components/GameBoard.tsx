import Hole from './Hole'
import ErrorModal from './ErrorModal'
import VictoryModal from './VictoryModal'
import { useGameStore } from '../stores/gameStore'
import React, { useEffect, useState } from 'react'

export default function GameBoard() {
  const config = useGameStore(state => state.config)
  const board = useGameStore(state => state.board)
  const mode = useGameStore(state => state.mode)
  const solvedBoard = useGameStore(state => state.solvedBoard)
  const showInvalidBoardError = useGameStore(state => state.showInvalidBoardError)
  const setShowInvalidBoardError = useGameStore(state => state.setShowInvalidBoardError)
  const isWon = useGameStore(state => state.isWon)
  const currentRupees = useGameStore(state => state.currentRupees)
  const difficulty = useGameStore(state => state.difficulty)
  const newGame = useGameStore(state => state.newGame)
  
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
  if (mode === 2 && solvedBoard) {
    const flatBoard = board.flat()
    let minProbability = Infinity
    let maxProbability = -Infinity
    
    // First pass: find minimum and maximum probability
    for (let i = 0; i < solvedBoard.length; i++) {
      const boardCell = flatBoard[i]
      const prob = solvedBoard[i]
      if (boardCell === 0 && typeof prob === 'number' && prob >= 0 && prob < Infinity) {
        minProbability = Math.min(minProbability, prob)
        maxProbability = Math.max(maxProbability, prob)
      }
    }
    
    // Only show highlight if there's a difference in probabilities
    if (minProbability < maxProbability) {
      // Collect all candidate indices with the minimum probability
      const candidates: number[] = []
      for (let i = 0; i < solvedBoard.length; i++) {
        const boardCell = flatBoard[i]
        const prob = solvedBoard[i]
        if (boardCell === 0 && typeof prob === 'number' && Math.abs(prob - minProbability) < 0.0001) {
          candidates.push(i)
        }
      }

      const lastIdx = useGameStore.getState().lastChangedIndex
      if (typeof lastIdx === 'number' && candidates.length > 0) {
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

  const modalContainerRef = React.useRef<HTMLDivElement>(null)

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
          modalContainer={modalContainerRef}
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
            ['--tile-size' as any]: `${tileSize}px`
          }}
        >
          {holes}
        </div>
        <div ref={modalContainerRef} className="modal-container" />
      </div>
      <ErrorModal
        isOpen={showInvalidBoardError}
        onClose={() => setShowInvalidBoardError(false)}
        message="Not a valid board!"
      />
      <VictoryModal
        isOpen={isWon}
        totalRupees={currentRupees}
        onPlayAgain={() => newGame(difficulty, mode)}
      />
    </div>
  )
}