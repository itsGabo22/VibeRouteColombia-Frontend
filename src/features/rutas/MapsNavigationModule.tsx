import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Polyline, MarkerF, InfoWindowF, DirectionsRenderer } from '@react-google-maps/api';
import { Loader2, Navigation, Clock, MapPin, BrainCircuit, RefreshCw, Box, Target, Info } from 'lucide-react';
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
        (pos) => setDriverPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        null, { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [setDriverPos]);

  useEffect(() => { fetchRoute(); }, [currentBatchId, fetchRoute]);

  const displayStops = useMemo(() => {
    const stops = route?.stops?.length > 0 ? route.stops : backupOrders;
    return stops.map((s: any) => ({
      ...s,
      lat: Number(s.lat || s.latitude || s.location?.lat),
      lng: Number(s.lng || s.longitude || s.location?.lng)
    })).filter((s: any) => !isNaN(s.lat) && !isNaN(s.lng));
  }, [route, backupOrders]);

  // CALCULAR RUTA SIGUIENDO CALLES (Google Directions)
  useEffect(() => {
    if (!isLoaded || displayStops.length < 1 || !driverPos) return;
    
    const ds = new google.maps.DirectionsService();
    ds.route({
      origin: driverPos,
      destination: { lat: displayStops[displayStops.length - 1].lat, lng: displayStops[displayStops.length - 1].lng },
      waypoints: displayStops.slice(0, -1).map((s: any) => ({ 
        location: { lat: s.lat, lng: s.lng }, 
        stopover: true 
      })),
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: false, // El orden ya lo da nuestra IA
    }, (result, status) => {
      if (status === 'OK') setDirectionsResponse(result);
    });
  }, [isLoaded, displayStops, driverPos]);

  const fitAll = useCallback(() => {
    if (!mapRef.current || displayStops.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    displayStops.forEach((s: any) => bounds.extend({ lat: s.lat, lng: s.lng }));
    if (driverPos) bounds.extend(driverPos);
    mapRef.current.fitBounds(bounds, { top: 100, bottom: 300, left: 60, right: 60 });
  }, [displayStops, driverPos]);

  if (loadError) return <div className="p-8">Error: {loadError.message}</div>;
  if (!isLoaded) return <div className="w-full h-full bg-slate-900 flex items-center justify-center"><Loader2 className="w-10 h-10 text-emerald-500 animate-spin" /></div>;

  const nextStop = displayStops.find((s: any) => s.status === 'PENDING' || s.status === 'ON_ROUTE') || displayStops[0];

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden font-sans">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={driverPos || bogotaCenter}
        zoom={15}
        onLoad={m => { mapRef.current = m; }}
        options={{ 
          disableDefaultUI: true,
          styles: [
            { "featureType": "poi", "stylers": [{ "visibility": "simplified" }] }
          ]
        }}
      >
        {/* RUTA PROFESIONAL POR CALLES */}
        {directionsResponse && (
          <DirectionsRenderer 
            directions={directionsResponse}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#10b981',
                strokeWeight: 6,
                strokeOpacity: 0.8
              }
            }}
          />
        )}

        {/* MARCADORES DE PEDIDOS */}
        {displayStops.map((stop: any, idx: number) => (
          <MarkerF
            key={stop.id || idx}
            position={{ lat: stop.lat, lng: stop.lng }}
            label={{ text: (idx + 1).toString(), color: 'white', fontWeight: '900', fontSize: '12px' }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: stop.id === nextStop?.id ? '#fbbf24' : '#ef4444',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 9
            }}
          />
        ))}

        {/* CONDUCTOR (WAZE STYLE) */}
        {driverPos && (
          <MarkerF
            position={driverPos}
            zIndex={1000}
            icon={{
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              fillColor: '#3b82f6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
              scale: 6,
              rotation: 0
            }}
          />
        )}
      </GoogleMap>

      {/* PANEL SUPERIOR: Navegación */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <AnimatePresence mode="wait">
          {nextStop && directionsResponse && (
            <motion.div
              initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
              className="bg-slate-950/90 backdrop-blur-xl p-4 rounded-[2rem] border border-white/10 shadow-2xl max-w-xs pointer-events-auto"
            >
              <div className="flex items-start gap-4">
                <div className="bg-emerald-500 p-3 rounded-2xl shadow-lg shadow-emerald-500/20">
                  <Navigation className="w-6 h-6 text-white" fill="currentColor" />
                </div>
                <div>
                  <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-0.5">Siguiente Destino</p>
                  <p className="text-sm text-white font-bold leading-tight line-clamp-1">{nextStop.address}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-white text-[11px] font-bold flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-xl border border-white/5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" /> {directionsResponse.routes[0].legs[0].duration?.text}
                    </span>
                    <span className="text-white text-[11px] font-bold flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-xl border border-white/5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" /> {directionsResponse.routes[0].legs[0].distance?.text}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BOTONES FLOTANTES: Centrar vista */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-3">
        <button 
          onClick={fitAll} 
          className="bg-white p-4 rounded-2xl text-slate-900 shadow-2xl active:scale-95 transition-all flex items-center gap-2 border border-slate-200"
          title="Centrar todos los puntos"
        >
          <Target className="w-5 h-5" />
        </button>
      </div>

      {/* PANEL INFERIOR: Acción Principal */}
      <div className="absolute bottom-28 inset-x-4 z-10">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-6 flex items-center justify-between border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-50 p-3.5 rounded-2xl">
              <Box className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <p className="text-base font-black text-slate-900 leading-none mb-1">Lote #{currentBatchId}</p>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-tight">{displayStops.length} Pedidos en curso</p>
            </div>
          </div>
          <button 
            onClick={() => fetchRoute(true)}
            disabled={optimizing}
            className="bg-emerald-500 text-white px-7 py-4 rounded-2xl text-sm font-black hover:bg-emerald-600 active:scale-95 transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-2"
          >
            {optimizing ? <Loader2 className="animate-spin w-5 h-5" /> : <RefreshCw className="w-5 h-5" />}
            OPTIMIZAR
          </button>
        </div>
      </div>
    </div>
  );
};
