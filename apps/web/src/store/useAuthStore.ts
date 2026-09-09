import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  role: 'ADMIN' | 'USER' | 'MODERATOR';
  setToken: (token: string | null) => void;
  login: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: 'USER',
      setToken: (token) => set({ token, role: token ? 'ADMIN' : 'USER' }),
      login: (token) => set({ token, role: 'ADMIN' }),
      logout: () => set({ token: null, role: 'USER' }),
    }),
    {
      name: 'ekofare-auth',
    }
  )
);
