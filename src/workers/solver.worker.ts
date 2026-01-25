/**
 * Web Worker for offloading heavy solver computations
 * Keeps UI responsive during long-running constraint satisfaction solving
 */

import { solveBoardProbabilities, setSolverProgressHandler } from '../utils/solver'
import type { BoardCell } from '../utils/gameLogic'

export interface SolverWorkerInput {
  board: BoardCell[][]
  width: number
  height: number
  bombCount: number
  rupoorCount: number
}

export interface SolverWorkerOutput {
  type: 'done' | 'progress' | 'error'
  result?: number[] | null
  processed?: number
  total?: number
  elapsedMs?: number
  error?: string
}

// Listen for messages from main thread
self.onmessage = (e: MessageEvent<SolverWorkerInput>) => {
  const { board, width, height, bombCount, rupoorCount } = e.data
  
  console.log(`🧵 [Worker] Starting computation: ${width}×${height} board, ${bombCount} bombs`)
  const startTime = performance.now()
  
  try {
    // Attach progress handler to post updates directly (no timer needed)
    setSolverProgressHandler((processed, total) => {
      const response: SolverWorkerOutput = {
        type: 'progress',
        processed,
        total,
        elapsedMs: Math.round(performance.now() - startTime),
      }
      self.postMessage(response)
    })

    const result = solveBoardProbabilities(board, width, height, bombCount, rupoorCount)
    const endTime = performance.now()
    
    console.log(`🧵 [Worker] Computation complete in ${(endTime - startTime).toFixed(2)}ms`)
    
    // Clear handler
    setSolverProgressHandler(null)
    const response: SolverWorkerOutput = { type: 'done', result }
    self.postMessage(response)
  } catch (error) {
    setSolverProgressHandler(null)
    const response: SolverWorkerOutput = {
      type: 'error',
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
    self.postMessage(response)
  }
}
