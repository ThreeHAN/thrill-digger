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
    const CONTAINER_PADDING = 0 // body/container padding (we use 0 now)
    const MAX_TILE = 120 // cap tile size to avoid oversized tiles on small boards

    const computeSize = () => {
      const vw = window.innerWidth
      const vh = window.visualViewport?.height ?? window.innerHeight
      const isPortrait = vh > vw

      const headerEl = document.querySelector('.game-header') as HTMLElement | null
      const footerEl = document.querySelector('.app-footer') as HTMLElement | null
      const mainEl = document.querySelector('main') as HTMLElement | null
      const hazardStatsEl = document.querySelector('.hazard-stats') as HTMLElement | null
      const gridEl = document.querySelector('.grid-board') as HTMLElement | null
      const headerH = headerEl?.offsetHeight ?? 0
      const footerH = footerEl?.offsetHeight ?? 0
      const mainStyles = mainEl ? window.getComputedStyle(mainEl) : null
      const mainMarginTop = mainStyles ? parseFloat(mainStyles.marginTop || '0') : 0

      // Keep a small extra buffer. Include main's margin-top to avoid overflow.
      const extra = isPortrait ? 18 : 12
      const reservedH = headerH + footerH + mainMarginTop + extra

      // In landscape, subtract the hazard stats column and the gap between flex items
      const mainComputed = mainEl ? window.getComputedStyle(mainEl) : null
      const flexGap = mainComputed ? parseFloat(mainComputed.gap || '0') : 0
      const hazardW = !isPortrait ? (hazardStatsEl?.offsetWidth ?? 0) : 0

      // Read actual grid gap and padding so math matches responsive CSS
      const gridStyles = gridEl ? window.getComputedStyle(gridEl) : null
      const gridGap = gridStyles
        ? parseFloat(gridStyles.gap || gridStyles.rowGap || '10')
        : 10
      const padL = gridStyles ? parseFloat(gridStyles.paddingLeft || '0') : 0
      const padR = gridStyles ? parseFloat(gridStyles.paddingRight || '0') : 0
      const padT = gridStyles ? parseFloat(gridStyles.paddingTop || '0') : 0
      const padB = gridStyles ? parseFloat(gridStyles.paddingBottom || '0') : 0
      const boardPadX = padL + padR
      const boardPadY = padT + padB

      const availW = vw - hazardW - (!isPortrait ? flexGap : 0) - CONTAINER_PADDING * 2 - boardPadX - gridGap * (config.width - 1)
      const availH = vh - reservedH - boardPadY - gridGap * (config.height - 1)

      const sizeW = Math.floor(availW / config.width)
      const sizeH = Math.floor(availH / config.height)

      // Always respect the smaller of width/height to prevent overflow.
      let size = Math.min(sizeW, sizeH)

      // Add a slight safety reduction in landscape to account for borders/shadows.
      if (!isPortrait) {
        size = Math.floor(size * 0.985)
      }

      // On small portrait screens, nudge down slightly to ensure fit
      if (isPortrait && vw < 600) {
        size = Math.max(20, Math.floor(size * 0.92))
      }

      size = Math.max(20, Math.min(MAX_TILE, size))
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