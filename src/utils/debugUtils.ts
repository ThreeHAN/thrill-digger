/**
 * Debug utilities for exporting/importing game state
 */

import type { BoardCell } from './gameLogic'
import type { SolvedBoard } from './solver'
import type { GameMode } from '../stores/gameStore'
import type { Difficulty } from './gameLogic'

export interface SerializedGameState {
  mode: GameMode
  difficulty: Difficulty
  board: BoardCell[][]
  revealed: boolean[][]
  currentRupees: number
  rupoorCount: number
  isGameOver: boolean
  isWon: boolean
  solvedBoard: SolvedBoard | null
}

/**
 * Serialize game state to a compact JSON format
 */
export function serializeGameState(state: SerializedGameState): string {
  return JSON.stringify(state)
}

/**
 * Encode serialized state to base64
 */
export function encodeStateToBase64(serialized: string): string {
  return btoa(serialized)
}

/**
 * Decode base64 back to serialized state
 */
export function decodeStateFromBase64(encoded: string): string {
  return atob(encoded)
}

/**
 * Deserialize JSON back to game state
 */
export function deserializeGameState(serialized: string): SerializedGameState {
  return JSON.parse(serialized)
}

/**
 * Full round-trip: state → base64
 */
export function stateToBase64(state: SerializedGameState): string {
  const serialized = serializeGameState(state)
  return encodeStateToBase64(serialized)
}

/**
 * Full round-trip: base64 → state
 */
export function base64ToState(encoded: string): SerializedGameState {
  try {
    const serialized = decodeStateFromBase64(encoded)
    return deserializeGameState(serialized)
  } catch (error) {
    console.error('Failed to decode game state:', error)
    throw new Error('Invalid game state')
  }
}

/**
 * Copy state to clipboard as base64
 */
export async function copyStateToClipboard(state: SerializedGameState): Promise<void> {
  try {
    const encoded = stateToBase64(state)
    await navigator.clipboard.writeText(encoded)
    console.log('✅ Game state copied to clipboard')
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    throw new Error('Failed to copy to clipboard')
  }
}

/**
 * Extract and decode game state from URL parameter
 * Returns null if no valid state parameter found
 */
export function loadStateFromUrl(): SerializedGameState | null {
  try {
    const params = new URLSearchParams(window.location.search)
    const encoded = params.get('gameState')
    
    if (!encoded) {
      return null
    }
    
    const state = base64ToState(encoded)
    console.log('🐛 Game state loaded from URL')
    return state
  } catch (error) {
    console.error('Failed to load game state from URL:', error)
    return null
  }
}

/**
 * Generate a URL with the encoded game state
 */
export function generateStateUrl(state: SerializedGameState): string {
  const encoded = stateToBase64(state)
  const baseUrl = window.location.origin + window.location.pathname
  return `${baseUrl}?gameState=${encoded}`
}
