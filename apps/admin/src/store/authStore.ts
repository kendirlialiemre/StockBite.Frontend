import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserDto } from '@stockbite/api-client';
import { setAuthTokens, clearAuthTokens } from '@stockbite/api-client';

interface AuthState {
  user: UserDto | null;
  isAuthenticated: boolean;
  login: (user: UserDto, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (user, accessToken, refreshToken) => {
        setAuthTokens(accessToken, refreshToken);
        set({ user, isAuthenticated: true });
      },

      logout: () => {
        clearAuthTokens();
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'sb-admin-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
