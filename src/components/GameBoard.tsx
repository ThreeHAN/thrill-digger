import Hole from './Hole'
import ErrorModal from './ErrorModal'
import VictoryModal from './VictoryModal'
import { useGameStore } from '../stores/gameStore'
import { useLowestProbabilityIndex } from '../hooks/useLowestProbabilityIndex'
import { useRef, useEffect, useState, useMemo, useCallback } from 'react'

export default function GameBoard() {
  const config = useGameStore(state => state.config)
  const mode = useGameStore(state => state.mode)
  const showInvalidBoardError = useGameStore(state => state.showInvalidBoardError)
  const setShowInvalidBoardError = useGameStore(state => state.setShowInvalidBoardError)
  const isWon = useGameStore(state => state.isWon)
  const currentRupees = useGameStore(state => state.currentRupees)
  const difficulty = useGameStore(state => state.difficulty)
  const newGame = useGameStore(state => state.newGame)
  
  const [tileSize, setTileSize] = useState<number>(64)
  const lowestProbabilityIndex = useLowestProbabilityIndex()

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

  const modalContainerRef = useRef<HTMLDivElement>(null)

  const holes = useMemo(() => {
    const result: React.ReactNode[] = []
    for (let row = 0; row < config.height; row++) {
      for (let col = 0; col < config.width; col++) {
        const index = row * config.width + col

        result.push(
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
    return result
  }, [config.width, config.height, lowestProbabilityIndex])

  const handleCloseError = useCallback(() => {
    setShowInvalidBoardError(false)
  }, [setShowInvalidBoardError])

  const handlePlayAgain = useCallback(() => {
    newGame(difficulty, mode)
  }, [newGame, difficulty, mode])

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
        onClose={handleCloseError}
        message="Not a valid board!"
      />
      <VictoryModal
        isOpen={isWon}
        totalRupees={currentRupees}
        onPlayAgain={handlePlayAgain}
      />
    </div>
  )
}