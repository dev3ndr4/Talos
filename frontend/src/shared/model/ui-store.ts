import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

const getStoredSidebarOpen = (): boolean => {
  const stored = localStorage.getItem('talos_sidebar_open');
  return stored !== null ? JSON.parse(stored) : true;
};

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: getStoredSidebarOpen(),
  toggleSidebar: () =>
    set((state) => {
      const newState = !state.sidebarOpen;
      localStorage.setItem('talos_sidebar_open', JSON.stringify(newState));
      return { sidebarOpen: newState };
    }),
  setSidebarOpen: (open) => {
    localStorage.setItem('talos_sidebar_open', JSON.stringify(open));
    set({ sidebarOpen: open });
  },
}));
