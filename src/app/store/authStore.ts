import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  name: string;
  email: string;
  role: string;
  assignedCity?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, role: string, email: string, name?: string, assignedCity?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, role, email, name = 'Usuario', assignedCity) => 
        set({ token, user: { name, email, role, assignedCity } }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'vibe-auth-storage',
    }
  )
);
