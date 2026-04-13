import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, role: string, email: string, name?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, role, email, name = 'Usuario') => 
        set({ token, user: { name, email, role } }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'vibe-auth-storage',
    }
  )
);
