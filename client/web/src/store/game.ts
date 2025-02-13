// store/game.ts

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface GameState {
  currentGameId: string | null
  setCurrentGameId: (gameId: string) => void
  clearCurrentGame: () => void
  isInGame: () => boolean
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      currentGameId: null,

      setCurrentGameId: (gameId: string) => {
        set({ currentGameId: gameId })
      },

      clearCurrentGame: () => {
        set({ currentGameId: null })
      },

      isInGame: () => {
        return get().currentGameId !== null
      },
    }),
    {
      name: 'game-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
