import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MissionState {
  currentBatchId: number | null;
  activeOrderId: number | null;
  isNavigationActive: boolean;
  
  // Acciones
  startMission: (batchId: number) => void;
  setActiveOrder: (orderId: number | null) => void;
  toggleNavigation: (active: boolean) => void;
  clearMission: () => void;
}

/**
 * Store central de Misión (Persistence)
 * Asegura que el conductor no pierda su progreso incluso si cierra el navegador.
 */
export const useMissionStore = create<MissionState>()(
  persist(
    (set) => ({
      currentBatchId: null,
      activeOrderId: null,
      isNavigationActive: false,

      startMission: (batchId) => set({ 
        currentBatchId: batchId 
      }),
      
      setActiveOrder: (orderId) => set({ 
        activeOrderId: orderId 
      }),

      toggleNavigation: (active) => set({ 
        isNavigationActive: active 
      }),

      clearMission: () => set({ 
        currentBatchId: null, 
        activeOrderId: null, 
        isNavigationActive: false 
      }),
    }),
    {
      name: 'vibe-mission-storage', // Clave única en LocalStorage
    }
  )
);
