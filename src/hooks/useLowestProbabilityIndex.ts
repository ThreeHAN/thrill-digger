import { useMemo } from 'react'
import { useGameStore } from '../stores/gameStore'

export function useLowestProbabilityIndex(): number {
  const mode = useGameStore(state => state.mode)
  const board = useGameStore(state => state.board)
  const solvedBoard = useGameStore(state => state.solvedBoard)
  const config = useGameStore(state => state.config)
  const lastChangedIndex = useGameStore(state => state.lastChangedIndex)

  return useMemo(() => {
    if (mode !== 2 || !solvedBoard) {
      return -1
    }

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
    if (minProbability >= maxProbability) {
      return -1
    }

    // Collect all candidate indices with the minimum probability
    const candidates: number[] = []
    for (let i = 0; i < solvedBoard.length; i++) {
      const boardCell = flatBoard[i]
      const prob = solvedBoard[i]
      if (boardCell === 0 && typeof prob === 'number' && Math.abs(prob - minProbability) < 0.0001) {
        candidates.push(i)
      }
    }

    if (candidates.length === 0) {
      return -1
    }

    if (typeof lastChangedIndex === 'number') {
      const w = config.width
      const lastRow = Math.floor(lastChangedIndex / w)
      const lastCol = lastChangedIndex % w
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

      return bestIdx
    }

    // Fallback: first candidate
    return candidates[0]
  }, [mode, board, solvedBoard, config.width, lastChangedIndex])
}
