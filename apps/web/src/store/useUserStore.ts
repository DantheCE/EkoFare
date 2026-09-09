import { create } from 'zustand';
import type { User, Role } from '../types';

export const MOCK_USERS: User[] = [
  { id: 'u_1', name: 'Standard User', role: 'USER' },
  { id: 'u_2', name: 'Community Mod', role: 'MODERATOR' },
  { id: 'u_3', name: 'Admin', role: 'ADMIN' },
];

interface UserStore {
  user: User;
  setUser: (user: User) => void;
  setRole: (role: Role) => void;
}

// Starts as a standard user
export const useUserStore = create<UserStore>((set) => ({
  user: MOCK_USERS[0],
  setUser: (user) => set({ user }),
  setRole: (role) => 
    set((state) => {
      const match = MOCK_USERS.find(u => u.role === role);
      return { user: match || { ...state.user, role } };
    }),
}));
