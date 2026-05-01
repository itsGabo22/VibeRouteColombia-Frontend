import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RouteState {
  route: any | null;
  backupOrders: any[];
  driverPos: { lat: number; lng: number } | null;
  setRoute: (route: any) => void;
  setBackupOrders: (orders: any[]) => void;
  setDriverPos: (pos: { lat: number; lng: number }) => void;
  clear: () => void;
}

export const useRouteStore = create<RouteState>()(
  persist(
    (set) => ({
      route: null,
      backupOrders: [],
      driverPos: { lat: 1.2136, lng: -77.2811 }, // Pasto por defecto
      setRoute: (route) => set({ route }),
      setBackupOrders: (backupOrders) => set({ backupOrders }),
      setDriverPos: (driverPos) => set({ driverPos }),
      clear: () => set({ route: null, backupOrders: [] }),
    }),
    { name: 'viberoute-navigation-storage' }
  )
);
