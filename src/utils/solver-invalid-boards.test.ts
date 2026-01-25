import { describe, it, expect } from 'vitest'
import { solveBoardProbabilities } from './solver'
import { invalidBoardFixtures } from '../test-data/invalidBoardFixtures'

describe('solveBoardProbabilities - Invalid Boards', () => {
  describe('should handle unsolvable/invalid boards gracefully', () => {
    invalidBoardFixtures.forEach((fixture) => {
      it(`should return null for invalid board: ${fixture.name}`, { timeout: 30000 }, () => {
        const result = solveBoardProbabilities(
          fixture.board,
          fixture.width,
          fixture.height,
          fixture.bombCount,
          fixture.rupoorCount
        )

        // These boards should return null (unsolvable or invalid)
        expect(result).toBeNull()
      })
    })
  })
})
