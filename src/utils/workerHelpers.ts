/**
 * Helper utilities for managing Web Worker interactions with the solver
 */

import type { SolverWorkerOutput } from '../workers/solver.worker'

export interface WorkerMessageHandlerConfig {
  /** Called when progress updates are received */
  onProgress: (processed: number, total: number, elapsedMs: number) => void
  /** Called when an error occurs */
  onError: (error: string) => void
  /** Called when computation completes successfully */
  onComplete: (result: number[] | null) => void
  /** Optional callback to clear interval/timer when computation finishes */
  onFinalize?: () => void
}

/**
 * Creates a standardized message handler for solver worker responses
 * Eliminates duplication of worker.onmessage logic across the codebase
 * 
 * @param config Configuration object with callbacks for different message types
 * @param startTime Performance timestamp when computation began (for elapsed time tracking)
 * @returns Message event handler to assign to worker.onmessage
 */
export function createWorkerMessageHandler(
  config: WorkerMessageHandlerConfig,
  startTime: number
): (e: MessageEvent<SolverWorkerOutput>) => void {
  return (e: MessageEvent<SolverWorkerOutput>) => {
    const msg = e.data
    
    if (msg.type === 'progress') {
      const processed = msg.processed || 0
      const total = msg.total || 0
      const elapsedMs = msg.elapsedMs || 0
      config.onProgress(processed, total, elapsedMs)
      return
    }
    
    // Finalize (clear timers/intervals) before processing result/error
    if (config.onFinalize) {
      config.onFinalize()
    }
    
    if (msg.type === 'error') {
      console.error('❌ Worker error:', msg.error)
      config.onError(msg.error || 'Unknown error')
      return
    }
    
    // Success case
    const elapsed = Math.round(performance.now() - startTime)
    console.log(`✅ Worker computation complete in ${elapsed}ms, updating probabilities...`)
    config.onComplete(msg.result ?? null)
  }
}

/**
 * Calculate ETA for solver computation based on progress
 * @param processed Number of combinations processed
 * @param total Total number of combinations
 * @param elapsedMs Elapsed time in milliseconds
 * @returns Estimated remaining time in seconds
 */
export function calculateSolverETA(
  processed: number,
  total: number,
  elapsedMs: number
): number {
  if (processed <= 0 || elapsedMs <= 0) return 0
  
  const rate = processed / elapsedMs // combos per ms
  const remaining = Math.max(0, total - processed)
  const etaMs = rate > 0 ? Math.round(remaining / rate) : 0
  return Math.max(1, Math.ceil(etaMs / 1000))
}
