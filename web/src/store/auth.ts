// store/authStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface User {
  id: string
  username: string
  email: string
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isHydrated: boolean  // Add hydration state
  login: (token: string, user: User) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
  setHydrated: (state: boolean) => void  // Add setter for hydration
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isHydrated: false,  // Start as not hydrated
      login: (token, user) =>
        set({
          token,
          user,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        }),
      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        })),
      setHydrated: (state) =>
        set({
          isHydrated: state
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // When rehydration is complete, update the hydration state
        if (state) {
          state.setHydrated(true);
        }
      }
    }
  )
)