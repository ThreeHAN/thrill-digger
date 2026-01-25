import { useMemo } from 'react'
import { useGameStore } from '../stores/gameStore'
import { getImageForItem } from '../utils/imageMap'
import bombImg from '../assets/minigame/bomb.png'

export default function HazardStats({ boardTotal }: { boardTotal: number }) {
  const board = useGameStore(state => state.board)
  const revealed = useGameStore(state => state.revealed)
  const autoRevealed = useGameStore(state => state.autoRevealed)
  const solvedBoard = useGameStore(state => state.solvedBoard)
  const difficulty = useGameStore(state => state.difficulty)
  const config = useGameStore(state => state.config)
  const mode = useGameStore(state => state.mode)
  const isGameOver = useGameStore(state => state.isGameOver)
  const showProbabilitiesInPlayMode = useGameStore(state => state.showProbabilitiesInPlayMode)
  const toggleProbabilitiesInPlayMode = useGameStore(state => state.toggleProbabilitiesInPlayMode)
  const resetGame = useGameStore(state => state.resetGame)

  const rupoorIcon = getImageForItem('rupoor')
  const greenIcon = getImageForItem('green rupee')

  const { remainingRupoors, remainingHazards } = useMemo(() => {
    const flat = board.flat()
    
    let rupoorsFound = 0
    let guaranteedHazardsFound = 0
    
    if (mode === 1) {
      // Play mode: count revealed rupoors
      for (let i = 0; i < flat.length; i++) {
        const row = Math.floor(i / config.width)
        const col = i % config.width
        if ((flat[i] === -10 || flat[i] === -2) && revealed[row][col]) {
          rupoorsFound++
        }
      }
    } else {
      // Solve mode: count placed rupoors
      rupoorsFound = flat.reduce((acc, cell) => (
        cell === -10 || cell === -2 ? acc + 1 : acc
      ), 0)
      
      // Count guaranteed hazards (100% probability squares)
      if (solvedBoard && solvedBoard.length === flat.length) {
        for (let i = 0; i < solvedBoard.length; i++) {
          if (flat[i] === 0 && solvedBoard[i] === 1) {
            guaranteedHazardsFound++
          }
        }
      }
    }

    // Remaining hazards = (total bombs + total rupoors) - rupoors found - 100% probability squares
    const totalPossibleHazards = config.bombCount + config.rupoorCount
    const remainingHazards = Math.max(0, totalPossibleHazards - rupoorsFound - guaranteedHazardsFound)
    const remainingRupoors = Math.max(0, config.rupoorCount - rupoorsFound)

    return { remainingRupoors, remainingHazards }
  }, [board, revealed, solvedBoard, config.bombCount, config.rupoorCount, config.width, mode])

  const showRupoors = difficulty !== 1
  const shouldShowProbabilityToggle = mode === 1
  const shouldShowNewGameButton = useMemo(() => {
    if (!(mode === 1 && isGameOver)) return false
    // Show after board reveal from Game Over modal
    for (let r = 0; r < autoRevealed.length; r++) {
      for (let c = 0; c < autoRevealed[r].length; c++) {
        if (autoRevealed[r][c]) return true
      }
    }
    return false
  }, [mode, isGameOver, autoRevealed])

  return (
    <div className="hazard-stats">
      <div className="hazard-card" title="Total rupees available on the board (bombs and rupoors don't count)">
        <span className="hazard-row" aria-label="Total rupees">
          <img src={greenIcon} alt="Rupees" />
          <span className="hazard-value">{boardTotal}</span>
        </span>
      </div>
      {showRupoors && (
        <div className="hazard-card" title="Remaining rupoors to find (total - found)">
          <span className="hazard-row" aria-label="Known rupoors">
            <img src={rupoorIcon} alt="Rupoor" />
            <span className="hazard-value">{remainingRupoors}</span>
          </span>
        </div>
      )}
      <div className="hazard-card" title="Remaining hazards: bombs + rupoors - found - confirmed 100% squares">
        <span className="hazard-row" aria-label="Remaining hazards">
          {!showRupoors && (
            <>
              <img src={bombImg} alt="Bomb" />
              <span className="hazard-value">{remainingHazards}</span>
            </>
          )}
          {showRupoors && (
            <>
              <img src={rupoorIcon} alt="Rupoor" />
              <img src={bombImg} alt="Bomb" />
              <span className="hazard-value">{remainingHazards}</span>
            </>
          )}
        </span>
      </div>
        {shouldShowProbabilityToggle && !shouldShowNewGameButton && (
          <div className="probability-toggle-row">
            <button
              className={`probability-pill ${showProbabilitiesInPlayMode ? 'is-active' : ''}`}
              onClick={toggleProbabilitiesInPlayMode}
              aria-pressed={showProbabilitiesInPlayMode}
              aria-label={`Probabilities ${showProbabilitiesInPlayMode ? 'on' : 'off'}`}
            >
              <span className="pill-label">Probabilities</span>
              <span className="pill-state">{showProbabilitiesInPlayMode ? 'On' : 'Off'}</span>
            </button>
          </div>
        )}
        {shouldShowNewGameButton && (
          <div className="probability-toggle-row">
            <button
              className="probability-pill new-game-pill"
              onClick={() => resetGame(difficulty, mode)}
              aria-label="Start a new game"
            >
              <span className="pill-label">New Game</span>
            </button>
          </div>
        )}
    </div>
  )
}
