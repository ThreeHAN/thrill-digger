import { useMemo, type ReactNode } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Difficulty } from '../utils/gameLogic'
import { GameMode, useGameStore } from '../stores/gameStore'
import { getImageForItem } from '../utils/imageMap'
import bombImg from '../assets/minigame/bomb.png'

export default function HazardStats({ boardTotal }: { boardTotal: number }) {
  const {
    board,
    revealed,
    autoRevealed,
    solvedBoard,
    difficulty,
    config,
    mode,
    isGameOver,
    showProbabilitiesInPlayMode,
    toggleProbabilitiesInPlayMode,
    resetGame,
  } = useGameStore(useShallow(state => ({
    board: state.board,
    revealed: state.revealed,
    autoRevealed: state.autoRevealed,
    solvedBoard: state.solvedBoard,
    difficulty: state.difficulty,
    config: state.config,
    mode: state.mode,
    isGameOver: state.isGameOver,
    showProbabilitiesInPlayMode: state.showProbabilitiesInPlayMode,
    toggleProbabilitiesInPlayMode: state.toggleProbabilitiesInPlayMode,
    resetGame: state.resetGame,
  })))

  const rupoorIcon = getImageForItem('rupoor')
  const greenIcon = getImageForItem('green rupee')

  const isPlayMode = mode === GameMode.Play
  const showRupoors = difficulty !== Difficulty.Beginner
  const { bombCount, rupoorCount, width } = config

  const { remainingRupoors, remainingHazards } = useMemo(() => {
    const flatBoard = board.flat()
    const isRupoor = (value: number) => value === -10 || value === -2

    let rupoorsFound = 0
    let guaranteedHazardsFound = 0

    if (isPlayMode) {
      for (let i = 0; i < flatBoard.length; i++) {
        const row = Math.floor(i / width)
        const col = i % width
        if (isRupoor(flatBoard[i]) && revealed[row][col]) {
          rupoorsFound++
        }
      }
    } else {
      rupoorsFound = flatBoard.reduce<number>((count, cell) => count + (isRupoor(cell) ? 1 : 0), 0)

      if (solvedBoard && solvedBoard.length === flatBoard.length) {
        for (let i = 0; i < solvedBoard.length; i++) {
          if (flatBoard[i] === 0 && solvedBoard[i] === 1) {
            guaranteedHazardsFound++
          }
        }
      }
    }

    const totalPossibleHazards = bombCount + rupoorCount
    const remainingHazards = Math.max(0, totalPossibleHazards - rupoorsFound - guaranteedHazardsFound)
    const remainingRupoors = Math.max(0, rupoorCount - rupoorsFound)

    return { remainingRupoors, remainingHazards }
  }, [board, revealed, solvedBoard, bombCount, rupoorCount, width, isPlayMode])

  const shouldShowProbabilityToggle = isPlayMode
  const shouldShowNewGameButton = useMemo(() => {
    if (!(isPlayMode && isGameOver)) return false
    return autoRevealed.some((row: boolean[]) => row.some(Boolean))
  }, [isPlayMode, isGameOver, autoRevealed])

  return (
    <div className="hazard-stats">
      <HazardCard title="Total rupees available on the board (bombs and rupoors don't count)" ariaLabel="Total rupees">
        <img src={greenIcon} alt="Rupees" />
        <span className="hazard-value">{boardTotal}</span>
      </HazardCard>

      {showRupoors && (
        <HazardCard title="Remaining rupoors to find (total - found)" ariaLabel="Known rupoors">
          <img src={rupoorIcon} alt="Rupoor" />
          <span className="hazard-value">{remainingRupoors}</span>
        </HazardCard>
      )}

      <HazardCard title="Remaining hazards: bombs + rupoors - found - confirmed 100% squares" ariaLabel="Remaining hazards">
        {showRupoors && <img src={rupoorIcon} alt="Rupoor" />}
        <img src={bombImg} alt="Bomb" />
        <span className="hazard-value">{remainingHazards}</span>
      </HazardCard>

      {shouldShowProbabilityToggle && !shouldShowNewGameButton && (
        <ProbabilityToggle
          active={showProbabilitiesInPlayMode}
          onToggle={toggleProbabilitiesInPlayMode}
        />
      )}

      {shouldShowNewGameButton && (
        <NewGameButton onReset={() => resetGame(difficulty, mode)} />
      )}
    </div>
  )
}

function HazardCard({ title, ariaLabel, children }: { title: string; ariaLabel: string; children: ReactNode }) {
  return (
    <div className="hazard-card" title={title}>
      <span className="hazard-row" aria-label={ariaLabel}>
        {children}
      </span>
    </div>
  )
}

function ProbabilityToggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <div className="probability-toggle-row">
      <button
        className={`probability-pill ${active ? 'is-active' : ''}`}
        onClick={onToggle}
        aria-pressed={active}
        aria-label={`Probabilities ${active ? 'on' : 'off'}`}
      >
        <span className="pill-label">Probabilities</span>
        <span className="pill-state">{active ? 'On' : 'Off'}</span>
      </button>
    </div>
  )
}

function NewGameButton({ onReset }: { onReset: () => void }) {
  return (
    <div className="probability-toggle-row">
      <button
        className="probability-pill new-game-pill"
        onClick={onReset}
        aria-label="Start a new game"
      >
        <span className="pill-label">New Game</span>
      </button>
    </div>
  )
}
