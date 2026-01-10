import Hole from './Hole'
import { useGame } from '../context/GameContext'

export default function GameBoard() {
  const { gameState, gameActions } = useGame()
  const { config, board } = gameState
  const HOLE_WIDTH = 125
  const gridWidth = config.width * HOLE_WIDTH

  const holes: React.ReactNode[] = []
  for (let row = 0; row < config.height; row++) {
    for (let col = 0; col < config.width; col++) {
      holes.push(
        <Hole 
          key={`${col}-${row}`} 
          row={row} 
          col={col} 
          cellValue={board[row][col]}
          isRevealed={gameState.revealed[row][col]}
          gameMode={gameState.mode}
          gameActions={gameActions}
        />
      )
    }
  }

  return (
    <div id="gamearea" className="m-auto">
      <div id="diggerarea" className="diggerarea">
        <div className="digger-grid" style={{ width: `${gridWidth}px` }}>
          {holes}
        </div>
      </div>
    </div>
  )
}
