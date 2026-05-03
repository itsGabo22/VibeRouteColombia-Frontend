import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RouteState {
  route: any | null;
  backupOrders: any[];
  driverPos: { lat: number; lng: number } | null;
  mapTheme: 'light' | 'dark';
  showPOIs: boolean;
  setRoute: (route: any) => void;
  setBackupOrders: (orders: any[]) => void;
  setDriverPos: (pos: { lat: number; lng: number }) => void;
  setMapTheme: (theme: 'light' | 'dark') => void;
  setShowPOIs: (show: boolean) => void;
  clear: () => void;
}

export const useRouteStore = create<RouteState>()(
  persist(
    (set) => ({
      route: null,
      backupOrders: [],
      driverPos: { lat: 1.2136, lng: -77.2811 }, // Pasto por defecto
      mapTheme: 'light',
      showPOIs: false,
      setRoute: (route) => set({ route }),
      setBackupOrders: (backupOrders) => set({ backupOrders }),
      setDriverPos: (driverPos) => set({ driverPos }),
      setMapTheme: (mapTheme) => set({ mapTheme }),
      setShowPOIs: (showPOIs) => set({ showPOIs }),
      clear: () => set({ route: null, backupOrders: [], mapTheme: 'light', showPOIs: false }),
    }),
    { 
      name: 'viberoute-navigation-storage',
      partialize: (state) => ({ 
        driverPos: state.driverPos, 
        mapTheme: state.mapTheme, 
        showPOIs: state.showPOIs 
      })
    }
  )
);
