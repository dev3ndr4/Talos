import { create } from 'zustand';
import { api } from '@/shared/api/base';

interface User {
  id: string;
  email: string;
  user_summary: string;
}

interface UserStore {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  fetchMe: () => Promise<void>;
  logout: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  fetchMe: async () => {
    try {
      set({ isLoading: true });
      const { data } = await api.get('/auth/me');
      set({ user: data, isLoading: false });
    } catch (error) {
      set({ user: null, isLoading: false });
    }
  },
  logout: () => {
    localStorage.removeItem('talos_token');
    set({ user: null });
  },
}));
