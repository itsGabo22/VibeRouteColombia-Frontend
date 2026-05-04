import { useEffect, useRef, useCallback, useState } from 'react';
import api from './axiosInstance';

interface GpsPosition {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

interface UseGpsTrackingOptions {
  /** Numeric driver ID to be sent to the backend */
  driverId: number;
  /** Interval in ms between pings. Default: 3000 */
  intervalMs?: number;
  /** Mount the hook in active mode. Default: true */
  enabled?: boolean;
  /** Called on every successful position update */
  onPositionUpdate?: (pos: GpsPosition) => void;
  /** Called when the backend responds with a deviation / alert */
  onAlert?: (message: string) => void;
}

interface GpsState {
  position: GpsPosition | null;
  error: string | null;
  isTracking: boolean;
  lastPingSentAt: number | null;
}

/**
 * GPS Tracking hook for VibeRoute Colombia.
 *
 * Every `intervalMs` (default 3 s) it reads the browser's
 * navigator.geolocation and fires a POST to /api/v1/locations/ping
 * with { driverId, lat, lng }.
 *
 * The backend pipes that into ProximityAlertService which can
 * trigger WebSocket alerts on /topic/logistics.
 */
export function useGpsTracking({
  driverId,
  intervalMs = 3000,
  enabled = true,
  onPositionUpdate,
  onAlert,
}: UseGpsTrackingOptions) {
  const [state, setState] = useState<GpsState>({
    position: null,
    error: null,
    isTracking: false,
    lastPingSentAt: null,
  });

  // Stable refs to avoid stale closures in the interval
  const onPositionRef = useRef(onPositionUpdate);
  const onAlertRef    = useRef(onAlert);
  useEffect(() => { onPositionRef.current = onPositionUpdate; }, [onPositionUpdate]);
  useEffect(() => { onAlertRef.current    = onAlert; },          [onAlert]);

  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSendingRef  = useRef(false); // guard against overlapping pings

  const sendPing = useCallback(() => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, error: 'Geolocalización no disponible en este dispositivo.' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (geo) => {
        const pos: GpsPosition = {
          lat:       geo.coords.latitude,
          lng:       geo.coords.longitude,
          accuracy:  geo.coords.accuracy,
          timestamp: geo.timestamp,
        };

        // Update UI immediately
        setState(s => ({ ...s, position: pos, error: null, lastPingSentAt: Date.now() }));
        onPositionRef.current?.(pos);

        // Send to backend (fire-and-forget but guarded)
        if (isSendingRef.current) return;
        isSendingRef.current = true;

        try {
          await api.post('/locations/ping', {
            driverId,
            lat: pos.lat,
            lng: pos.lng,
          });
        } catch (err) {
          // Swallow network errors silently – tracking should be resilient
          console.warn('[GPS] Ping failed, will retry next interval:', err);
        } finally {
          isSendingRef.current = false;
        }
      },
      (geoErr) => {
        const messages: Record<number, string> = {
          1: 'Permiso de ubicación denegado. Actívalo en la configuración del navegador.',
          2: 'No se pudo determinar la posición. Verifica tu señal GPS.',
          3: 'Tiempo de espera del GPS agotado.',
        };
        setState(s => ({
          ...s,
          error:      messages[geoErr.code] ?? 'Error de geolocalización desconocido.',
          isTracking: false,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout:            8000,
        maximumAge:         2000,
      }
    );
  }, [driverId]);
  
  // Start / stop the interval
  useEffect(() => {
    if (!enabled || !driverId) return;

    setState(s => ({ ...s, isTracking: true }));
    sendPing(); // immediate first ping

    intervalRef.current = setInterval(sendPing, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setState(s => ({ ...s, isTracking: false }));
    };
  }, [enabled, driverId, intervalMs, sendPing]);

  return state;
}
