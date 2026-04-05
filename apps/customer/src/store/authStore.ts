import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserDto } from '@stockbite/api-client';
import { setAuthTokens, clearAuthTokens } from '@stockbite/api-client';

interface AuthState {
  user: UserDto | null;
  isAuthenticated: boolean;
  subscribedModules: number[];
  permissions: string[];
  login: (
    user: UserDto,
    accessToken: string,
    refreshToken: string,
    subscribedModules: number[]
  ) => void;
  logout: () => void;
  updateUser: (patch: Partial<Pick<UserDto, 'firstName' | 'lastName'>>) => void;
  setSubscribedModules: (modules: number[]) => void;
  hasModule: (moduleId: number) => boolean;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      subscribedModules: [],
      permissions: [],

      login: (user, accessToken, refreshToken, subscribedModules) => {
        setAuthTokens(accessToken, refreshToken);
        set({
          user,
          isAuthenticated: true,
          subscribedModules,
          permissions: user.permissions,
        });
      },

      logout: () => {
        clearAuthTokens();
        set({
          user: null,
          isAuthenticated: false,
          subscribedModules: [],
          permissions: [],
        });
      },

      updateUser: (patch) =>
        set((state) =>
          state.user ? { user: { ...state.user, ...patch } } : {}
        ),

      setSubscribedModules: (modules) => set({ subscribedModules: modules }),

      hasModule: (moduleId) => get().subscribedModules.includes(moduleId),

      hasPermission: (permission) => {
        const { user, permissions } = get();
        if (!user) return false;
        if (user.role === 'Owner') return true;
        return permissions.includes(permission);
      },
    }),
    {
      name: 'sb-customer-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        subscribedModules: state.subscribedModules,
        permissions: state.permissions,
      }),
    }
  )
);
