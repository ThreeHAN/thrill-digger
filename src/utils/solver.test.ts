import { describe, it, expect, afterAll } from 'vitest'
import { solveBoardProbabilities } from './solver'
import { solverFixtures } from '../test-data/solverFixtures'

interface TimingEntry {
  name: string
  timeMs: number
  width: number
  height: number
}

const timings: TimingEntry[] = []

describe('solveBoardProbabilities', () => {
  describe('baseline regression tests', () => {
    solverFixtures.forEach((fixture) => {
      it(`should produce correct probabilities for: ${fixture.name}`, { timeout: 30000 }, () => {
        const startTime = performance.now()
        const result = solveBoardProbabilities(
          fixture.board,
          fixture.width,
          fixture.height,
          fixture.bombCount,
          fixture.rupoorCount
        )
        const endTime = performance.now()
        
        timings.push({
          name: fixture.name,
          timeMs: endTime - startTime,
          width: fixture.width,
          height: fixture.height,
        })

        expect(result).not.toBeNull()
        
        // Compare with floating-point tolerance for mathematically equivalent results
        expect(result?.length).toBe(fixture.solvedBoard.length)
        for (let i = 0; i < result!.length; i++) {
          const actual = result![i]
          const expected = fixture.solvedBoard[i]
          
          // For probability values (0-1), use relative tolerance
          if (typeof actual === 'number' && typeof expected === 'number') {
            if (actual < 0 || expected < 0) {
              // Special values (like -1, -2, -3) must match exactly
              expect(actual).toBe(expected)
            } else {
              // Probabilities: allow small floating-point differences
              expect(Math.abs(actual - expected)).toBeLessThan(1e-10)
            }
          } else {
            expect(actual).toBe(expected)
          }
        }
      })
    })
  })

  afterAll(() => {
    if (timings.length > 0) {
      const totalTime = timings.reduce((sum, t) => sum + t.timeMs, 0)
      const avgTime = totalTime / timings.length
      const sorted = [...timings].sort((a, b) => b.timeMs - a.timeMs)
      
      console.log('\n📊 Solver Performance Benchmark')
      console.log('================================')
      console.log(`Total fixtures: ${timings.length}`)
      console.log(`Total time: ${totalTime.toFixed(2)}ms`)
      console.log(`Average time: ${avgTime.toFixed(3)}ms`)
      console.log(`Fastest: ${sorted[sorted.length - 1].name} (${sorted[sorted.length - 1].timeMs.toFixed(3)}ms)`)
      console.log(`Slowest: ${sorted[0].name} (${sorted[0].timeMs.toFixed(3)}ms)`)
      console.log('\nTop 5 slowest fixtures:')
      sorted.slice(0, 5).forEach((t, i) => {
        console.log(`  ${i + 1}. ${t.name} (${t.width}×${t.height}): ${t.timeMs.toFixed(3)}ms`)
      })
    }
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
