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
    const CONTAINER_PADDING = 0
    const MAX_TILE = 100
    const LANDSCAPE_SAFETY_FACTOR = 0.97
    const PORTRAIT_SHRINK_FACTOR = 0.9
    const PORTRAIT_EXTRA_BUFFER = 6
    const LANDSCAPE_EXTRA_BUFFER = 0
    const MIN_TILE_SIZE = 20
    const SMALL_PORTRAIT_WIDTH = 600
    const DEBOUNCE_MS = 150

    // Cache element references to avoid repeated DOM queries
    let cachedElements = {
      header: null as HTMLElement | null,
      footer: null as HTMLElement | null,
      main: null as HTMLElement | null,
      hazardStats: null as HTMLElement | null,
      grid: null as HTMLElement | null,
    }

    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    const computeSize = () => {
      const vw = window.innerWidth
      const vv = window.visualViewport
      const vh = vv?.height ?? window.innerHeight
      const topInset = vv?.offsetTop ?? 0
      const bottomInset = vv ? Math.max(0, window.innerHeight - vh - topInset) : 0
      const isPortrait = vh > vw

      // Query elements on first run or cache miss
      cachedElements.header = cachedElements.header || document.querySelector('.game-header') as HTMLElement | null
      cachedElements.footer = cachedElements.footer || document.querySelector('.app-footer') as HTMLElement | null
      cachedElements.main = cachedElements.main || document.querySelector('main') as HTMLElement | null
      cachedElements.hazardStats = cachedElements.hazardStats || document.querySelector('.hazard-stats') as HTMLElement | null
      cachedElements.grid = cachedElements.grid || document.querySelector('.grid-board') as HTMLElement | null

      const headerH = cachedElements.header?.offsetHeight ?? 0
      const footerH = cachedElements.footer?.offsetHeight ?? 0

      // Get main's styles once for both margin-top and flex gap
      const mainStyles = cachedElements.main ? window.getComputedStyle(cachedElements.main) : null
      const mainMarginTop = mainStyles ? parseFloat(mainStyles.marginTop || '0') : 0
      const flexGap = mainStyles ? parseFloat(mainStyles.gap || '0') : 0
      const mainClientHeight = cachedElements.main?.clientHeight ?? 0

      const extra = isPortrait ? PORTRAIT_EXTRA_BUFFER : LANDSCAPE_EXTRA_BUFFER
      const reservedH = headerH + footerH + mainMarginTop

      const hazardW = !isPortrait ? (cachedElements.hazardStats?.offsetWidth ?? 0) : 0

      // Read actual grid gap and padding to match responsive CSS rules
      const gridStyles = cachedElements.grid ? window.getComputedStyle(cachedElements.grid) : null
      const gridGap = gridStyles
        ? parseFloat(gridStyles.gap || gridStyles.rowGap || '10')
        : 10
      const boardPadX = (gridStyles ? parseFloat(gridStyles.paddingLeft || '0') : 0) + 
                        (gridStyles ? parseFloat(gridStyles.paddingRight || '0') : 0)
      const boardPadY = (gridStyles ? parseFloat(gridStyles.paddingTop || '0') : 0) + 
                        (gridStyles ? parseFloat(gridStyles.paddingBottom || '0') : 0)

      const availW = vw - hazardW - (!isPortrait ? flexGap : 0) - CONTAINER_PADDING * 2 - boardPadX - gridGap * (config.width - 1)
      const viewportCap = vh - reservedH - bottomInset - extra
      const effectiveMainHeight = mainClientHeight > 0 ? Math.min(mainClientHeight, viewportCap) : viewportCap
      const availH = effectiveMainHeight - boardPadY - gridGap * (config.height - 1)

      const sizeW = Math.floor(availW / config.width)
      const sizeH = Math.floor(availH / config.height)

      let size = Math.min(sizeW, sizeH)

      // Safety reduction in landscape to account for borders/shadows
      if (!isPortrait) {
        size = Math.floor(size * LANDSCAPE_SAFETY_FACTOR)
      }

      // Shrink slightly on small portrait screens for better fit
      if (isPortrait && vw < SMALL_PORTRAIT_WIDTH) {
        size = Math.max(MIN_TILE_SIZE, Math.floor(size * PORTRAIT_SHRINK_FACTOR))
      }

      size = Math.max(MIN_TILE_SIZE, Math.min(MAX_TILE, size))
      setTileSize(size)
    }

    const handleResize = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(computeSize, DEBOUNCE_MS)
    }

    computeSize()
    window.addEventListener('resize', handleResize)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize)
      window.visualViewport.addEventListener('scroll', handleResize)
    }
    return () => {
      window.removeEventListener('resize', handleResize)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize)
        window.visualViewport.removeEventListener('scroll', handleResize)
      }
      if (debounceTimer) clearTimeout(debounceTimer)
    }
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