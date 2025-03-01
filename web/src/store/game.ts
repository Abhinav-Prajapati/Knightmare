import { create } from 'zustand'

interface GameState {
  currentGameId: string | null
  setCurrentGameId: (gameId: string) => void
  clearCurrentGame: () => void
  isInGame: () => boolean
}

export const useGameStore = create<GameState>()((set, get) => ({
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
}))
