import { create } from "zustand";
import { authApi } from "../lib/api";

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,
  authError: null,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: Boolean(user),
      isInitializing: false,
      authError: null,
    }),

  clearUser: () =>
    set({
      user: null,
      isAuthenticated: false,
      isInitializing: false,
      authError: null,
    }),

  initializeAuth: async () => {
    set({ isInitializing: true, authError: null });

    try {
      const { data } = await authApi.me();
      const user = data?.user ?? data?.data?.user ?? data?.data ?? null;

      if (!user?.id || !user?.role) {
        set({
          user: null,
          isAuthenticated: false,
          isInitializing: false,
        });

        return null;
      }

      set({
        user,
        isAuthenticated: true,
        isInitializing: false,
        authError: null,
      });

      return user;
    } catch (error) {
      const status = error?.response?.status;

      set({
        user: null,
        isAuthenticated: false,
        isInitializing: false,
        authError: status === 401 ? null : error,
      });

      return null;
    }
  },
}));