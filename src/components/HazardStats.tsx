import { useMemo } from 'react'
import { useGame } from '../context/GameContext'
import { getImageForItem } from '../utils/imageMap'

export default function HazardStats({ boardTotal }: { boardTotal: number }) {
  const { gameState } = useGame()
  const { board, solvedBoard, difficulty } = gameState

  const rupoorIcon = getImageForItem('rupoor')
  const greenIcon = getImageForItem('green rupee')

  const { rupoorCount, guaranteedBombs } = useMemo(() => {
    const flat = board.flat()
    const rupoorCount = flat.reduce((acc, cell) => (
      cell === -10 || cell === -2 ? acc + 1 : acc
    ), 0)

    let guaranteedBombs = 0
    if (solvedBoard && solvedBoard.length === flat.length) {
      for (let i = 0; i < solvedBoard.length; i++) {
        if (flat[i] === 0 && solvedBoard[i] === 1) {
          guaranteedBombs++
        }
      }
    }

    return { rupoorCount, guaranteedBombs }
  }, [board, solvedBoard])

  const showHazardDetails = difficulty !== 1

  return (
    <div className="hazard-stats">
      <div className="hazard-card">
        <span className="hazard-row" aria-label="Total rupees">
          <img src={greenIcon} alt="Rupees" />
          <span className="hazard-value">{boardTotal}</span>
        </span>
      </div>
      {showHazardDetails && (
        <>
          <div className="hazard-card">
            <span className="hazard-row" aria-label="Known rupoors">
              <img src={rupoorIcon} alt="Rupoor" />
              <span className="hazard-value">{rupoorCount}</span>
            </span>
          </div>
          <div className="hazard-card">
            <span className="hazard-row" aria-label="Guaranteed bombs">
              <span className="hazard-emoji" role="img" aria-label="Bomb">💣</span>
              <span className="hazard-value">{guaranteedBombs}</span>
            </span>
          </div>
        </>
      )}
    </div>
  )
}
