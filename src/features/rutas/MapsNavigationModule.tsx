import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Polyline, Marker } from '@react-google-maps/api';
import { Loader2, Navigation, AlertTriangle, ChevronRight, MapPin, Clock, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGpsTracking } from '../../infrastructure/api/useGpsTracking';
import { useAuthStore } from '../../app/store/authStore';
import { useMissionStore } from '../../app/store/missionStore';
import api from '../../shared/lib/api';

// ─── Map config ──────────────────────────────────────────────────────────────

const containerStyle = {
  width: '100%',
  height: '100%',
};

const bogotaCenter = { lat: 4.6097, lng: -74.0817 };

// Libraries needed for polyline decoding
const LIBRARIES: ("geometry" | "drawing" | "places" | "visualization")[] = ["geometry"];

// ─── Types ────────────────────────────────────────────────────────────────────

interface MapsNavigationModuleProps {
  driverId?: number;
  onTargetReached?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const MapsNavigationModule: React.FC<MapsNavigationModuleProps> = ({
  driverId,
}) => {
  const { user } = useAuthStore();
  const { currentBatchId } = useMissionStore();
  const resolvedDriverId = driverId ?? 0;

  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Google Maps JS API loader
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '',
    libraries: LIBRARIES,
  });

  const fetchRoute = useCallback(async () => {
    if (!currentBatchId) return;
    try {
      const { data } = await api.get(`/routes/batch/${currentBatchId}`);
      setRoute(data);
    } catch (err) {
      console.error("Error fetching real route:", err);
    } finally {
      setLoading(false);
    }
  }, [currentBatchId]);

  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  const handlePositionUpdate = useCallback(
    (pos: { lat: number; lng: number; accuracy: number }) => {
      const newPos = { lat: pos.lat, lng: pos.lng };
      setDriverPos(newPos);
      setGpsAccuracy(pos.accuracy);
      
      if (mapRef.current) {
        mapRef.current.panTo(newPos);
      }
    },
    []
  );

  const { error: gpsError, isTracking } = useGpsTracking({
    driverId:         resolvedDriverId,
    intervalMs:       3000,
    enabled:          resolvedDriverId > 0,
    onPositionUpdate: handlePositionUpdate,
  });

  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);

  // Decode polyline if available from backend (fast load) or fetch from Directions API (real streets)
  const polylinePath = useMemo(() => {
    // If we have a fresh Directions Response from the frontend, use it (it's the most accurate)
    if (directionsResponse && directionsResponse.routes[0]) {
      return directionsResponse.routes[0].overview_path.map(p => ({ lat: p.lat(), lng: p.lng() }));
    }

    // Fallback to backend encoded polyline if available
    if (route?.encodedPolyline && isLoaded) {
      try {
          return google.maps.geometry.encoding.decodePath(route.encodedPolyline).map(p => ({
              lat: p.lat(),
              lng: p.lng()
          }));
      } catch (e) {
          console.error("Failed to decode polyline", e);
      }
    }
    
    // Last fallback: straight lines between stops
    return (route?.stops || []).map((s: any) => ({ lat: s.location.lat, lng: s.location.lng }));
  }, [route, isLoaded, directionsResponse]);

  // Request real street path from Google Directions API
  useEffect(() => {
    if (!isLoaded || !route?.stops || route.stops.length < 2) return;

    const directionsService = new google.maps.DirectionsService();

    const origin = driverPos || { lat: route.stops[0].location.lat, lng: route.stops[0].location.lng };
    const destination = { lat: route.stops[route.stops.length - 1].location.lat, lng: route.stops[route.stops.length - 1].location.lng };
    
    // Middle waypoints (limit to 25 due to Google API restrictions)
    const waypoints = route.stops.slice(1, -1).slice(0, 23).map((s: any) => ({
      location: new google.maps.LatLng(s.location.lat, s.location.lng),
      stopover: true
    }));

    directionsService.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          setDirectionsResponse(result);
        } else {
          console.error(`error fetching directions ${status}`);
        }
      }
    );
  }, [isLoaded, route?.stops, driverPos]);

  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: true,
      zoomControl:      false,
      tilt:             45, // Uber-like 3D view
      heading:          0,
      styles: [
        { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
        { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
        { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
        { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
        { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
        { "featureType": "administrative.country", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
        { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
        { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#181818" }] },
        { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
        { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#8a8a8a" }] },
        { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#3c3c3c" }] },
        { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
      ],
    }),
    []
  );

  if (!isLoaded || loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-slate-950 rounded-[2.5rem] border border-white/5 p-10">
        <Loader2 className="animate-spin text-green-500 mb-6" size={48} />
        <p className="text-white/40 font-black uppercase tracking-[0.3em] text-[10px]">
          Sincronizando con Satélite...
        </p>
      </div>
    );
  }

  const nextStop = route?.stops?.find((s: any) => s.status === 'PENDING');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-full h-[700px] bg-black rounded-[3rem] overflow-hidden shadow-2xl border-[12px] border-slate-900"
    >
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={driverPos ?? (polylinePath[0] || bogotaCenter)}
        zoom={17}
        options={mapOptions}
        onLoad={(map) => { 
            mapRef.current = map;
            map.setTilt(45);
        }}
      >
        <Polyline
          path={polylinePath}
          options={{
            strokeColor:   '#22c55e',
            strokeOpacity: 1,
            strokeWeight:  8,
            geodesic:      true,
          }}
        />

        {/* Glow effect for polyline */}
        <Polyline
          path={polylinePath}
          options={{
            strokeColor:   '#22c55e',
            strokeOpacity: 0.2,
            strokeWeight:  16,
          }}
        />

        {/* Start Point */}
        {polylinePath.length > 0 && (
          <Marker
            position={polylinePath[0]}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#FFFFFF',
              fillOpacity: 1,
              strokeWeight: 4,
              strokeColor: '#000000',
              scale: 6,
            }}
          />
        )}

        {/* Stops */}
        {route?.stops?.map((stop: any, idx: number) => (
           <Marker
             key={stop.id || idx}
             position={{ lat: stop.location.lat, lng: stop.location.lng }}
             label={stop.status === 'PENDING' ? { text: (idx + 1).toString(), color: 'white', fontSize: '10px', fontWeight: '900' } : undefined}
             icon={stop.status === 'DELIVERED' ? {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#10b981',
                fillOpacity: 1,
                scale: 4,
                strokeWeight: 0
             } : {
                path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z',
                fillColor: stop.id === nextStop?.id ? '#22c55e' : '#475569',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 2,
                scale: 1,
             }}
           />
        ))}

        {/* Driver (Uber Arrow) */}
        {driverPos && (
          <Marker
            position={driverPos}
            icon={{
              path: "M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z",
              fillColor: '#3b82f6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 1.5,
              anchor: new google.maps.Point(12, 12),
              rotation: 0 // In real app, calculate from bearing
            }}
            zIndex={100}
          />
        )}
      </GoogleMap>

      {/* ── Uber Interface Overlays ────────────────────────────────── */}
      
      {/* 1. Next Instruction (Top) */}
      <div className="absolute top-8 left-8 right-8 z-10">
        <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-black text-white p-6 rounded-[2rem] shadow-2xl flex items-center justify-between border border-white/10"
        >
            <div className="flex items-center gap-6">
                <div className="bg-green-500 p-4 rounded-2xl">
                    <ArrowUpRight size={32} className="text-black" />
                </div>
                <div>
                    <p className="text-2xl font-black tracking-tight">{nextStop ? 'Dirígete al punto #' + (route.stops.indexOf(nextStop) + 1) : 'Ruta completada'}</p>
                    <p className="text-white/50 text-sm font-bold uppercase tracking-widest">{nextStop?.address || 'Fin del trayecto'}</p>
                </div>
            </div>
            <div className="flex flex-col items-end">
                <p className="text-3xl font-black tracking-tighter">450 <span className="text-lg text-white/40">m</span></p>
            </div>
        </motion.div>
      </div>

      {/* 2. Destination Info (Mid-Left) */}
      <div className="absolute top-44 left-8 z-10">
        <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-100">
            <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center">
                <MapPin size={14} className="text-white" />
            </div>
            <div>
                <p className="text-[10px] font-black uppercase text-slate-400">Próxima entrega</p>
                <p className="text-xs font-bold text-slate-900">{nextStop?.clientReference || 'Buscando...'}</p>
            </div>
        </div>
      </div>

      {/* 3. Bottom Card (Status) */}
      <div className="absolute bottom-10 left-8 right-8 z-10">
        <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
            <div className="p-8 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-50 flex items-center justify-center">
                             <span className="text-2xl font-black text-slate-400">{user?.name?.[0]}</span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-sm flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-2xl font-black tracking-tighter text-slate-900">
                                {route ? Math.round(route.estimatedTimeSeconds / 60) : '--'} min
                            </p>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <p className="text-xl font-bold text-slate-400 tracking-tighter">
                                {route ? (route.totalDistanceMeters / 1000).toFixed(1) : '--'} km
                            </p>
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                           <Clock size={12} /> Llegada aprox. {new Date(Date.now() + (route?.estimatedTimeSeconds || 0) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button className="bg-slate-100 p-5 rounded-2xl text-slate-900 hover:bg-slate-200 transition-colors">
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>
            
            {/* Mission Progress Bar */}
            <div className="h-2 bg-slate-50 w-full">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(route?.stops?.filter((s: any) => s.status === 'DELIVERED').length / (route?.stops?.length || 1)) * 100}%` }}
                    className="h-full bg-green-500" 
                />
            </div>
        </motion.div>
      </div>

      {gpsError && (
        <div className="absolute inset-0 bg-red-500/20 backdrop-blur-[2px] z-50 flex items-center justify-center p-10">
             <div className="bg-white p-8 rounded-3xl shadow-2xl flex items-center gap-4 max-w-md">
                <AlertTriangle className="text-red-500" size={32} />
                <p className="text-sm font-bold text-slate-900">{gpsError}</p>
             </div>
        </div>
      )}
    </motion.div>
  );
};
