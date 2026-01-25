/**
 * Web Worker for offloading heavy solver computations
 * Keeps UI responsive during long-running constraint satisfaction solving
 */

import { solveBoardProbabilities } from '../utils/solver'
import type { BoardCell } from '../utils/gameLogic'

export interface SolverWorkerInput {
  board: BoardCell[][]
  width: number
  height: number
  bombCount: number
  rupoorCount: number
}

export interface SolverWorkerOutput {
  result: number[] | null
  error?: string
}

// Listen for messages from main thread
self.onmessage = (e: MessageEvent<SolverWorkerInput>) => {
  const { board, width, height, bombCount, rupoorCount } = e.data
  
  try {
    const result = solveBoardProbabilities(board, width, height, bombCount, rupoorCount)
    
    const response: SolverWorkerOutput = { result }
    self.postMessage(response)
  } catch (error) {
    const response: SolverWorkerOutput = {
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
    self.postMessage(response)
  }
}
