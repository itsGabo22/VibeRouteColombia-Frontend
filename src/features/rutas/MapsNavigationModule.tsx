import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsRenderer, MarkerF } from '@react-google-maps/api';
import { Loader2, Navigation, Clock, MapPin, BrainCircuit, RefreshCw, Box, Target, ChevronRight, Zap, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../shared/lib/api';
import { useMissionStore } from '../../app/store/missionStore';
import { useRouteStore } from '../../app/store/routeStore';

const containerStyle = { width: '100%', height: '100%' };
const bogotaCenter = { lat: 4.6097, lng: -74.0817 };
const LIBRARIES: ("geometry" | "drawing" | "places" | "visualization")[] = ["geometry"];

export const MapsNavigationModule: React.FC<{ driverId?: number }> = ({ driverId }) => {
  const { currentBatchId } = useMissionStore();
  const { route, backupOrders, driverPos, setRoute, setBackupOrders, setDriverPos } = useRouteStore();
  
  const [loading, setLoading] = useState(!route);
  const [optimizing, setOptimizing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(true); // Auto-seguimiento activo por defecto
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '',
    libraries: LIBRARIES,
    language: 'es',
  });

  const fetchRoute = useCallback(async (forceOptimize = false) => {
    if (!currentBatchId) return;
    if (forceOptimize) setOptimizing(true);
    
    try {
      if (backupOrders.length === 0 || forceOptimize) {
        const { data: batchData } = await api.get(`/batches/${currentBatchId}`);
        if (batchData?.orders) setBackupOrders(batchData.orders);
      }

      const res = await api.get(`/routes/batch/${currentBatchId}`);
      if (res.status === 200 && res.data?.stops?.length > 0) {
        setRoute(res.data);
      } else if (forceOptimize || !route) {
        const { data: optimizedRoute } = await api.post(`/batches/${currentBatchId}/optimize`);
        setRoute(optimizedRoute);
      }
    } catch (err) {
      console.error("Error flujo:", err);
    } finally {
      setLoading(false);
      setOptimizing(false);
    }
  }, [currentBatchId, route, backupOrders, setRoute, setBackupOrders]);

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setDriverPos(newPos);
          if (isFollowing && mapRef.current) {
            mapRef.current.panTo(newPos);
          }
        },
        null, { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [setDriverPos, isFollowing]);

  useEffect(() => { fetchRoute(); }, [currentBatchId, fetchRoute]);

  const displayStops = useMemo(() => {
    const stops = route?.stops?.length > 0 ? route.stops : backupOrders;
    return stops.map((s: any) => ({
      ...s,
      lat: Number(s.lat || s.latitude || s.location?.lat),
      lng: Number(s.lng || s.longitude || s.location?.lng)
    })).filter((s: any) => !isNaN(s.lat) && !isNaN(s.lng));
  }, [route, backupOrders]);

  useEffect(() => {
    if (!isLoaded || displayStops.length < 1 || !driverPos) return;
    const ds = new google.maps.DirectionsService();
    ds.route({
      origin: driverPos,
      destination: { lat: displayStops[displayStops.length - 1].lat, lng: displayStops[displayStops.length - 1].lng },
      waypoints: displayStops.slice(0, -1).map((s: any) => ({ location: { lat: s.lat, lng: s.lng }, stopover: true })),
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: false,
    }, (result, status) => {
      if (status === 'OK') setDirectionsResponse(result);
    });
  }, [isLoaded, displayStops, driverPos]);

  const fitAll = useCallback(() => {
    if (!mapRef.current || displayStops.length === 0) return;
    setIsFollowing(false); // Al encuadrar todo, desactivamos seguimiento para que no se mueva solo
    const bounds = new google.maps.LatLngBounds();
    displayStops.forEach((s: any) => bounds.extend({ lat: s.lat, lng: s.lng }));
    if (driverPos) bounds.extend(driverPos);
    mapRef.current.fitBounds(bounds, { top: 120, bottom: 320, left: 60, right: 60 });
  }, [displayStops, driverPos]);

  if (loadError) return <div className="p-8">Error: {loadError.message}</div>;
  if (!isLoaded) return <div className="w-full h-full bg-slate-900 flex items-center justify-center"><Loader2 className="w-12 h-12 text-emerald-500 animate-spin" /></div>;

  const nextStop = displayStops.find((s: any) => s.status === 'PENDING' || s.status === 'ON_ROUTE') || displayStops[0];

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={driverPos || bogotaCenter}
        zoom={17}
        onLoad={m => { mapRef.current = m; }}
        onDragStart={() => setIsFollowing(false)} // Si el usuario mueve el mapa, paramos el seguimiento
        options={{ 
          disableDefaultUI: true,
          styles: [
            { "featureType": "water", "stylers": [{ "color": "#0e171d" }] },
            { "featureType": "landscape", "stylers": [{ "color": "#1e2327" }] },
            { "featureType": "road", "stylers": [{ "color": "#2d333c" }] },
            { "featureType": "poi", "stylers": [{ "visibility": "off" }] }
          ]
        }}
      >
        {directionsResponse && (
          <DirectionsRenderer 
            directions={directionsResponse}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#10b981',
                strokeWeight: 8,
                strokeOpacity: 0.9,
                zIndex: 50
              }
            }}
          />
        )}

        {displayStops.map((stop: any, idx: number) => (
          <MarkerF
            key={stop.id || idx}
            position={{ lat: stop.lat, lng: stop.lng }}
            label={{ text: (idx + 1).toString(), color: 'white', fontWeight: '900', fontSize: '11px' }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: stop.id === nextStop?.id ? '#fbbf24' : '#f43f5e',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 8
            }}
          />
        ))}

        {driverPos && (
          <MarkerF
            position={driverPos}
            zIndex={1000}
            icon={{
              path: 'M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z', // Flecha Navigation 3D
              fillColor: '#3b82f6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 1.5,
              anchor: new google.maps.Point(12, 12),
              rotation: 0 // Podríamos calcular la rotación en el futuro
            }}
          />
        )}
      </GoogleMap>

      {/* STATUS BADGE */}
      <div className="absolute top-28 left-4 z-20">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md ${route ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/20 border-amber-500/30 text-amber-400'}`}>
          <Zap className="w-3.5 h-3.5" fill="currentColor" />
          <span className="text-[10px] font-black uppercase tracking-widest">
            {route ? 'IA: Ruta Optimizada' : 'IA: Calculando...'}
          </span>
        </div>
      </div>

      {/* PANEL SUPERIOR */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <AnimatePresence mode="wait">
          {nextStop && directionsResponse && (
            <motion.div
              initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="bg-slate-900/95 backdrop-blur-2xl p-4 rounded-[2.5rem] border border-white/10 shadow-2xl max-w-xs pointer-events-auto"
            >
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-3 rounded-2xl shadow-lg shadow-emerald-500/20">
                  <Navigation className="w-6 h-6 text-white" fill="currentColor" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-0.5">Próxima Parada</p>
                  <p className="text-sm text-white font-bold leading-tight truncate">{nextStop.address}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-xl text-white text-[11px] font-bold border border-white/5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" /> {directionsResponse.routes[0].legs[0].duration?.text}
                    </span>
                    <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-xl text-white text-[11px] font-bold border border-white/5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" /> {directionsResponse.routes[0].legs[0].distance?.text}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CONTROLES LATERALES */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-3">
        <button 
          onClick={() => setIsFollowing(!isFollowing)}
          className={`p-4 rounded-2xl shadow-2xl transition-all active:scale-90 border ${isFollowing ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-900 text-slate-400 border-white/10'}`}
        >
          {isFollowing ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </button>
        <button onClick={fitAll} className="bg-white p-4 rounded-2xl text-slate-900 shadow-2xl active:scale-95 transition-all border border-slate-200">
          <Target className="w-5 h-5" />
        </button>
      </div>

      {/* PANEL INFERIOR */}
      <div className="absolute bottom-28 inset-x-4 z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-[3rem] shadow-2xl p-6 flex items-center justify-between border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/10 p-4 rounded-2xl">
              <Box className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 leading-none mb-1.5">Batch #{currentBatchId}</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">{displayStops.length} Envíos activos</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => fetchRoute(true)}
            disabled={optimizing}
            className="relative group bg-slate-900 text-white px-8 py-4 rounded-3xl text-sm font-black overflow-hidden transition-all active:scale-95 shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-2">
              {optimizing ? <Loader2 className="animate-spin w-5 h-5" /> : <BrainCircuit className="w-5 h-5" />}
              <span>{optimizing ? 'IA TRABAJANDO...' : 'OPTIMIZAR'}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
