import { describe, it, expect } from 'vitest'
import { solveBoardProbabilities } from './solver'
import { solverFixtures } from '../test-data/solverFixtures'

describe('solveBoardProbabilities', () => {
  describe('baseline regression tests', () => {
    solverFixtures.forEach((fixture) => {
      it(`should produce correct probabilities for: ${fixture.name}`, () => {
        const result = solveBoardProbabilities(
          fixture.board,
          fixture.width,
          fixture.height,
          fixture.bombCount,
          fixture.rupoorCount
        )

        expect(result).not.toBeNull()
        expect(result).toEqual(fixture.expectedSolvedBoard)
      })
    })
  })

  describe('edge cases', () => {
    it('should return uniform probabilities for empty board', () => {
      const board = [
        [0, 0],
        [0, 0],
      ]
      const result = solveBoardProbabilities(board, 2, 2, 2, 0)

      expect(result).not.toBeNull()
      // All cells should have equal probability (2 bombs / 4 cells = 0.5)
      expect(result).toEqual([0.5, 0.5, 0.5, 0.5])
    })

    it('should handle single constraint correctly', () => {
      const board = [
        [0, 0, 0],
        [0, 2, 0],
        [0, 0, 0],
      ]
      const result = solveBoardProbabilities(board, 3, 3, 2, 0)

      expect(result).not.toBeNull()
      // Center cell is the constraint (value 2), all others equal probability
      expect(result?.[4]).toBe(2) // Center constraint preserved
      // Other cells should have equal probability
      const nonConstraintCells = result?.filter((_, idx) => idx !== 4)
      const uniqueProbs = new Set(nonConstraintCells)
      expect(uniqueProbs.size).toBe(1) // All non-constraint cells same probability
    })

    it('should return null for invalid board (impossible constraints)', () => {
      // Board with constraint requiring more bombs than available
      const board = [
        [0, 0, 0],
        [0, 8, 0], // Requires 8 bombs in neighbors, but only 1 bomb total
        [0, 0, 0],
      ]
      const result = solveBoardProbabilities(board, 3, 3, 1, 0)

      expect(result).toBeNull()
    })
  })
})
