import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Polyline, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { Loader2, Navigation, AlertTriangle, ArrowUpRight, ShieldCheck, Compass, Clock, MapPin, BrainCircuit, RefreshCw, X, Box, Target, Layers, Info, ChevronRight } from 'lucide-react';
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
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
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
      // 1. Carga de Backup si no hay nada
      if (backupOrders.length === 0 || forceOptimize) {
        const { data: batchData } = await api.get(`/batches/${currentBatchId}`);
        if (batchData?.orders) setBackupOrders(batchData.orders);
      }

      // 2. Carga de Ruta
      if (!route || forceOptimize) {
        const res = await api.get(`/routes/batch/${currentBatchId}`);
        if (res.status === 200 && res.data?.stops?.length > 0) {
          setRoute(res.data);
        } else if (forceOptimize || !route) {
          const { data: optimizedRoute } = await api.post(`/batches/${currentBatchId}/optimize`);
          setRoute(optimizedRoute);
        }
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

  useEffect(() => {
    fetchRoute();
  }, [currentBatchId, fetchRoute]);

  const displayStops = useMemo(() => {
    const stops = route?.stops?.length > 0 ? route.stops : backupOrders;
    // Normalizar coordenadas para que NADA falle
    return stops.map((s: any) => ({
      ...s,
      lat: Number(s.lat || s.latitude || s.location?.lat),
      lng: Number(s.lng || s.longitude || s.location?.lng)
    })).filter((s: any) => !isNaN(s.lat) && !isNaN(s.lng));
  }, [route, backupOrders]);

  const polylinePath = useMemo(() => {
    if (isLoaded && route?.encodedPolyline) {
      return google.maps.geometry.encoding.decodePath(route.encodedPolyline).map(p => ({ lat: p.lat(), lng: p.lng() }));
    }
    return displayStops.map((s: any) => ({ lat: s.lat, lng: s.lng }));
  }, [route, isLoaded, displayStops]);

  useEffect(() => {
    if (!isLoaded || displayStops.length < 1 || !driverPos) return;
    const ds = new google.maps.DirectionsService();
    ds.route({
      origin: driverPos,
      destination: { lat: displayStops[displayStops.length - 1].lat, lng: displayStops[displayStops.length - 1].lng },
      waypoints: displayStops.slice(0, -1).map((s: any) => ({ location: { lat: s.lat, lng: s.lng }, stopover: true })),
      travelMode: google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === 'OK') setDirectionsResponse(result);
    });
  }, [isLoaded, displayStops, driverPos]);

  const fitAll = useCallback(() => {
    if (!mapRef.current) return;
    const bounds = new google.maps.LatLngBounds();
    polylinePath.forEach((p: any) => bounds.extend(p));
    if (driverPos) bounds.extend(driverPos);
    mapRef.current.fitBounds(bounds, { top: 100, bottom: 250, left: 50, right: 50 });
  }, [polylinePath, driverPos]);

  if (loadError) return <div className="p-8">Error: {loadError.message}</div>;
  if (!isLoaded) return <div className="w-full h-full bg-slate-900 flex items-center justify-center"><Loader2 className="w-10 h-10 text-emerald-500 animate-spin" /></div>;

  const nextStop = displayStops.find((s: any) => s.status === 'PENDING' || s.status === 'ON_ROUTE') || displayStops[0];

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={driverPos || bogotaCenter}
        zoom={16}
        onLoad={m => { mapRef.current = m; }}
        options={{ disableDefaultUI: true }}
      >
        <Polyline path={polylinePath} options={{ strokeColor: '#10b981', strokeOpacity: 0.9, strokeWeight: 6 }} />

        {displayStops.map((stop: any, idx: number) => (
          <MarkerF
            key={stop.id || idx}
            position={{ lat: stop.lat, lng: stop.lng }}
            label={{ text: (idx + 1).toString(), color: 'white', fontWeight: 'bold' }}
            onClick={() => setSelectedOrder(stop)}
          />
        ))}

        {driverPos && (
          <MarkerF
            position={driverPos}
            zIndex={1000}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#3b82f6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 4,
              scale: 12
            }}
          />
        )}
      </GoogleMap>

      {/* Panel Superior: Navegación */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <AnimatePresence>
          {nextStop && directionsResponse && (
            <motion.div
              initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="bg-slate-900/95 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl max-w-xs pointer-events-auto"
            >
              <div className="flex items-start gap-4">
                <div className="bg-emerald-500 p-2.5 rounded-2xl shadow-lg">
                  <Navigation className="w-6 h-6 text-white" fill="currentColor" />
                </div>
                <div>
                  <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-0.5">Siguiente Destino</p>
                  <p className="text-sm text-white font-bold leading-tight truncate w-40">{nextStop.address}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-white text-xs font-bold flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" /> {directionsResponse.routes[0].legs[0].duration?.text}
                    </span>
                    <span className="text-white text-xs font-bold flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" /> {directionsResponse.routes[0].legs[0].distance?.text}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Botones Flotantes */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-3">
        <button onClick={() => fetchRoute(true)} className="bg-slate-900/90 p-4 rounded-full border border-white/10 text-white hover:bg-emerald-500 shadow-xl transition-all">
          <BrainCircuit className={optimizing ? "animate-spin" : "w-5 h-5"} />
        </button>
        <button onClick={fitAll} className="bg-slate-900/90 p-4 rounded-full border border-white/10 text-white hover:bg-blue-600 shadow-xl transition-all">
          <Target className="w-5 h-5" />
        </button>
      </div>

      {/* DEBUG: Contador de puntos (Eliminar cuando funcione) */}
      <div className="absolute top-40 left-4 bg-black/50 text-white text-[10px] p-2 rounded-lg z-30">
        Puntos: {displayStops.length} | Lat: {driverPos?.lat.toFixed(4)}
      </div>

      {/* Panel Inferior: Optimizar */}
      <div className="absolute bottom-28 inset-x-4 z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl p-5 flex items-center justify-between border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="bg-slate-100 p-3 rounded-2xl">
              <Box className="w-6 h-6 text-slate-800" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">Batch #{currentBatchId}</p>
              <p className="text-[11px] text-slate-500 font-bold uppercase">{displayStops.length} Pedidos</p>
            </div>
          </div>
          <button 
            onClick={() => fetchRoute(true)}
            disabled={optimizing}
            className="bg-emerald-500 text-white px-6 py-4 rounded-2xl text-xs font-black hover:scale-105 transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2"
          >
            {optimizing ? <Loader2 className="animate-spin w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
            OPTIMIZAR
          </button>
        </div>
      </div>
    </div>
  );
};
