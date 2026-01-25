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

// Flag to check if worker should continue processing
let shouldContinue = true

// Handle termination gracefully
self.onmessageerror = () => {
  shouldContinue = false
}

// Listen for messages from main thread
self.onmessage = (e: MessageEvent<SolverWorkerInput>) => {
  const { board, width, height, bombCount, rupoorCount } = e.data
  
  console.log(`🧵 [Worker] Starting computation: ${width}×${height} board, ${bombCount} bombs`)
  const startTime = performance.now()
  
  try {
    // Attach progress handler to post updates directly (no timer needed)
    setSolverProgressHandler((processed, total) => {
      if (!shouldContinue) return // Skip if worker is being terminated
      
      const response: SolverWorkerOutput = {
        type: 'progress',
        processed,
        total,
        elapsedMs: Math.round(performance.now() - startTime),
      }
      try {
        self.postMessage(response)
      } catch {
        // Port closed, worker is being terminated
        shouldContinue = false
      }
    })

    const result = solveBoardProbabilities(board, width, height, bombCount, rupoorCount)
    const endTime = performance.now()
    
    console.log(`🧵 [Worker] Computation complete in ${(endTime - startTime).toFixed(2)}ms`)
    
    // Clear handler
    setSolverProgressHandler(null)
    
    // Only post result if worker hasn't been terminated
    if (shouldContinue) {
      const response: SolverWorkerOutput = { type: 'done', result }
      try {
        self.postMessage(response)
      } catch {
        // Port closed, worker is being terminated
        console.log('🧵 [Worker] Port closed before final result could be sent')
      }
    }
  } catch (error) {
    setSolverProgressHandler(null)
    
    // Only post error if worker hasn't been terminated
    if (shouldContinue) {
      const response: SolverWorkerOutput = {
        type: 'error',
        result: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
      try {
        self.postMessage(response)
      } catch {
        // Port closed, worker is being terminated
        console.log('🧵 [Worker] Port closed before error could be sent')
      }
    }
  }
}
