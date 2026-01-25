/**
 * Constants for solver and computation thresholds
 */

// Solver performance thresholds
export const SOLVER_CONSTANTS = {
  // Unknown cell count threshold that triggers UI warnings
  HEAVY_COMPUTATION_THRESHOLD: 22,
  
  // Time threshold (seconds) that requires explicit user confirmation
  CONFIRMATION_REQUIRED_TIME: 30,
  
  // Approximate computations per millisecond (for ETA calculation)
  COMPUTATIONS_PER_MS: 1111111,

  // Phase transition timings for loading UI
  PHASE1_SPINNER_DELAY_MS: 200,
  PHASE2_MODAL_DELAY_MS: 1000,
  COMPUTATION_START_DELAY_MS: 100,
  
  // Progress reporting threshold
  PROGRESS_UPDATE_THRESHOLD_MS: 2000,
}
