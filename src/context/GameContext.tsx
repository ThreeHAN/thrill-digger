import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type { GameState, GameBoardActions } from '../hooks/useGameBoard'

interface GameContextType {
  gameState: GameState
  gameActions: GameBoardActions
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ 
  children, 
  gameState, 
  gameActions 
}: { 
  children: ReactNode
  gameState: GameState
  gameActions: GameBoardActions
}) {
  return (
    <GameContext.Provider value={{ gameState, gameActions }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within GameProvider')
  }
  return context
}
