import { useMemo } from 'react'
import { useGameStore } from '../stores/gameStore'
import { getImageForItem } from '../utils/imageMap'
import bombImg from '../assets/minigame/bomb.png'

export default function HazardStats({ boardTotal }: { boardTotal: number }) {
  const board = useGameStore(state => state.board)
  const solvedBoard = useGameStore(state => state.solvedBoard)
  const difficulty = useGameStore(state => state.difficulty)
  const config = useGameStore(state => state.config)

  const rupoorIcon = getImageForItem('rupoor')
  const greenIcon = getImageForItem('green rupee')

  const { remainingRupoors, remainingHazards } = useMemo(() => {
    const flat = board.flat()
    const rupoorsFound = flat.reduce((acc, cell) => (
      cell === -10 || cell === -2 ? acc + 1 : acc
    ), 0)

    let guaranteedHazardsFound = 0
    if (solvedBoard && solvedBoard.length === flat.length) {
      for (let i = 0; i < solvedBoard.length; i++) {
        if (flat[i] === 0 && solvedBoard[i] === 1) {
          guaranteedHazardsFound++
        }
      }
    }

    // Remaining hazards = (total bombs + total rupoors) - rupoors found - 100% probability squares
    const totalPossibleHazards = config.bombCount + config.rupoorCount
    const remainingHazards = Math.max(0, totalPossibleHazards - rupoorsFound - guaranteedHazardsFound)
    const remainingRupoors = Math.max(0, config.rupoorCount - rupoorsFound)

    return { remainingRupoors, remainingHazards }
  }, [board, solvedBoard, config.bombCount, config.rupoorCount])

  const showRupoors = difficulty !== 1

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
    </div>
  )
}
