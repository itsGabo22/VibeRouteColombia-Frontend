import React, { useMemo, useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Polyline, Marker } from '@react-google-maps/api';
import { Loader2, Navigation, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGpsTracking } from '../../infrastructure/api/useGpsTracking';
import { useAuthStore } from '../../app/store/authStore';

// ─── Map config ──────────────────────────────────────────────────────────────

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '2rem',
};

const bogotaCenter = { lat: 4.6097, lng: -74.0817 };

// Ruta mockeada — será reemplazada por la polilínea real del backend
const routePolylines = [
  { lat: 4.6097, lng: -74.0817 },
  { lat: 4.6120, lng: -74.0800 },
  { lat: 4.6150, lng: -74.0780 },
  { lat: 4.6180, lng: -74.0750 },
  { lat: 4.6210, lng: -74.0720 },
];

const alertMarkers = [
  { lat: 4.6150, lng: -74.0780, type: 'NOVEDAD' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface MapsNavigationModuleProps {
  /** Numeric driver ID fetched from the user profile / batch */
  driverId?: number;
  onTargetReached?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const MapsNavigationModule: React.FC<MapsNavigationModuleProps> = ({
  driverId,
  onTargetReached,
}) => {
  const { user } = useAuthStore();
  const resolvedDriverId = driverId ?? 0;

  // Live GPS state
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const handlePositionUpdate = useCallback(
    (pos: { lat: number; lng: number; accuracy: number }) => {
      const newPos = { lat: pos.lat, lng: pos.lng };
      setDriverPos(newPos);
      setGpsAccuracy(pos.accuracy);
      // Smoothly follow the driver
      mapRef.current?.panTo(newPos);
    },
    []
  );

  // GPS hook — one ping every 3 s when a real driverId is provided
  const { error: gpsError, isTracking } = useGpsTracking({
    driverId:         resolvedDriverId,
    intervalMs:       3000,
    enabled:          resolvedDriverId > 0,
    onPositionUpdate: handlePositionUpdate,
  });

  // Google Maps JS API loader
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.GOOGLE_MAPS_KEY || '',
  });

  // Memoized map style (Silver theme, no POI clutter)
  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: true,
      zoomControl:      false,
      styles: [
        { elementType: 'geometry',         stylers: [{ color: '#f5f5f5' }] },
        { elementType: 'labels.icon',      stylers: [{ visibility: 'off' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
        { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
        { featureType: 'poi',      elementType: 'geometry',         stylers: [{ color: '#eeeeee' }] },
        { featureType: 'poi',      elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
        { featureType: 'poi.park', elementType: 'geometry',         stylers: [{ color: '#e5e5e5' }] },
        { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
        { featureType: 'road',          elementType: 'geometry',         stylers: [{ color: '#ffffff' }] },
        { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
        { featureType: 'road.highway',  elementType: 'geometry',         stylers: [{ color: '#dadada' }] },
        { featureType: 'road.highway',  elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
        { featureType: 'road.local',    elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
        { featureType: 'transit.line',    elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
        { featureType: 'transit.station', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
        { featureType: 'water', elementType: 'geometry',         stylers: [{ color: '#c9c9c9' }] },
        { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
      ],
    }),
    []
  );

  // ── Loading state ────────────────────────────────────────────────────────────
  if (!isLoaded) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-white rounded-[2rem] border border-slate-100 shadow-sm p-10">
        <Loader2 className="animate-spin text-green-500 mb-4" size={40} />
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
          Iniciando Módulo GPS...
        </p>
      </div>
    );
  }

  // GPS signal quality color
  const signalColor =
    gpsAccuracy === null   ? 'bg-slate-400'
    : gpsAccuracy < 20    ? 'bg-green-500'
    : gpsAccuracy < 60    ? 'bg-amber-400'
    : 'bg-red-500';

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative w-full h-[600px] bg-slate-100 rounded-[2rem] overflow-hidden shadow-xl shadow-slate-200/50 border-4 border-white"
    >
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={driverPos ?? bogotaCenter}
        zoom={15}
        options={mapOptions}
        onLoad={(map) => { mapRef.current = map; }}
      >
        {/* ── Optimal route polyline ──────────────────────────────── */}
        <Polyline
          path={routePolylines}
          options={{
            strokeColor:   '#22c55e',
            strokeOpacity: 0.8,
            strokeWeight:  6,
            geodesic:      true,
          }}
        />

        {/* ── Origin marker ───────────────────────────────────────── */}
        <Marker
          position={routePolylines[0]}
          icon={{
            path:        google.maps.SymbolPath.CIRCLE,
            fillColor:   '#0f172a',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#ffffff',
            scale:       8,
          }}
        />

        {/* ── Destination pin ─────────────────────────────────────── */}
        <Marker
          position={routePolylines[routePolylines.length - 1]}
          icon={{
            path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z M -2,-30 a 2,2 0 1,1 4,0 2,2 0 1,1 -4,0',
            fillColor:   '#22c55e',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale:       1.5,
          }}
        />

        {/* ── Live driver position ────────────────────────────────── */}
        {driverPos && (
          <Marker
            position={driverPos}
            icon={{
              path:        google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              fillColor:   '#3b82f6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale:       7,
              rotation:    0,
            }}
            title={`${user?.name ?? 'Conductor'} — GPS en vivo`}
            zIndex={10}
          />
        )}

        {/* ── GPS accuracy halo ───────────────────────────────────── */}
        {driverPos && gpsAccuracy && (
          <Marker
            position={driverPos}
            icon={{
              path:          google.maps.SymbolPath.CIRCLE,
              fillColor:     '#3b82f6',
              fillOpacity:   0.12,
              strokeColor:   '#3b82f6',
              strokeOpacity: 0.3,
              strokeWeight:  1,
              scale:         Math.min(gpsAccuracy / 3, 40),
            }}
            zIndex={1}
          />
        )}

        {/* ── Alert / deviation markers ───────────────────────────── */}
        {alertMarkers.map((alert, idx) => (
          <Marker
            key={idx}
            position={{ lat: alert.lat, lng: alert.lng }}
            icon={{
              path:        google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              fillColor:   '#ef4444',
              fillOpacity: 0.9,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale:       6,
            }}
          />
        ))}
      </GoogleMap>

      {/* ── Overlay ─────────────────────────────────────────────────────── */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">

        {/* ETA card */}
        <div className="bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl pointer-events-auto border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Navigation size={14} className="text-green-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">En Ruta</span>
          </div>
          <p className="text-2xl font-black italic tracking-tighter leading-none">12 min</p>
          <p className="text-[10px] text-slate-400 font-bold mt-1">4.2 km hacia el destino</p>
        </div>

        {/* GPS status + alert pills */}
        <div className="flex flex-col gap-2 items-end pointer-events-auto">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl shadow-2xl backdrop-blur-md border text-white text-[10px] font-black uppercase tracking-widest
              ${isTracking ? 'bg-slate-900/90 border-white/10' : 'bg-slate-500/90 border-white/10'}`}
          >
            <span className={`w-2 h-2 rounded-full ${signalColor} ${isTracking ? 'animate-pulse' : ''}`} />
            {isTracking
              ? gpsAccuracy !== null
                ? `GPS ±${Math.round(gpsAccuracy)}m`
                : 'Adquiriendo...'
              : 'GPS Inactivo'}
          </div>

          {alertMarkers.length > 0 && (
            <div className="bg-red-500/90 backdrop-blur-md text-white px-3 py-2 rounded-xl shadow-2xl border border-red-400/30">
              <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                {alertMarkers.length} Alerta
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Error / permission banner */}
      <AnimatePresence>
        {gpsError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-6 left-6 right-6 bg-amber-500/95 backdrop-blur-md text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-amber-400/30"
          >
            <AlertTriangle size={18} className="shrink-0" />
            <p className="text-xs font-bold leading-snug">{gpsError}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
