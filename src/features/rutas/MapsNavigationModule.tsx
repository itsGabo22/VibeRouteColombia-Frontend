import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsRenderer, MarkerF } from '@react-google-maps/api';
import { Loader2, Navigation, Clock, MapPin, BrainCircuit, Box, Target, Zap, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../shared/lib/api';
import { useMissionStore } from '../../app/store/missionStore';
import { useRouteStore } from '../../app/store/routeStore';

const containerStyle = { width: '100%', height: '100%' };
const LIBRARIES: ("geometry" | "drawing" | "places" | "visualization")[] = ["geometry"];

export const MapsNavigationModule: React.FC = () => {
  const { currentBatchId } = useMissionStore();
  const {
    route, backupOrders, driverPos, mapTheme,
    setRoute, setBackupOrders, setDriverPos, setMapTheme
  } = useRouteStore();

  const [loading, setLoading] = useState(!route);
  const [optimizing, setOptimizing] = useState(false);
  const [optMode, setOptMode] = useState<'EFFICIENCY' | 'PRIORITY'>('EFFICIENCY');
  const [isFollowing, setIsFollowing] = useState(true);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '',
    libraries: LIBRARIES,
    language: 'es',
  });

  const mapStyles = useMemo(() => [
    { "featureType": "poi", "stylers": [{ "visibility": mapTheme === 'light' ? "on" : "off" }] },
    { "featureType": "landscape", "stylers": [{ "color": mapTheme === 'light' ? "#f8fafc" : "#0a1a2a" }] },
    { "featureType": "road", "stylers": [{ "color": mapTheme === 'light' ? "#ffffff" : "#162c44" }] },
    { "featureType": "water", "stylers": [{ "color": mapTheme === 'light' ? "#cbd5e1" : "#050d14" }] }
  ], [mapTheme]);

  const fetchRoute = useCallback(async (forceOptimize = false) => {
    if (!currentBatchId) return;
    if (forceOptimize) {
      setOptimizing(true);
      setDirectionsResponse(null); // Limpiar para evitar basura visual
    }
    try {
      if (backupOrders.length === 0 || forceOptimize) {
        const { data: bData } = await api.get(`/batches/${currentBatchId}`);
        if (bData?.orders) setBackupOrders(bData.orders);
      }
      const res = await api.get(`/routes/batch/${currentBatchId}`);
      if (res.status === 200 && res.data?.stops?.length > 0 && !forceOptimize) {
        setRoute(res.data);
      } else if (forceOptimize || !route) {
        const { data: optRoute } = await api.post(`/batches/${currentBatchId}/optimize`, {
          lat: driverPos?.lat,
          lng: driverPos?.lng,
          mode: optMode
        });
        setRoute(optRoute);
      }
    } catch (e) { console.error(e); } finally { setOptimizing(false); setLoading(false); }
  }, [currentBatchId, route, backupOrders, setRoute, setBackupOrders, driverPos, optMode]);

  useEffect(() => {
    if (isLoaded) fetchRoute(true);
  }, [optMode, isLoaded]);

  useEffect(() => {
    if (navigator.geolocation) {
      const wId = navigator.geolocation.watchPosition(
        (p) => {
          const np = { lat: p.coords.latitude, lng: p.coords.longitude };
          setDriverPos(np);
          if (isFollowing && mapRef.current) mapRef.current.panTo(np);
        },
        null, { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(wId);
    }
  }, [setDriverPos, isFollowing]);

  useEffect(() => { fetchRoute(); }, [currentBatchId, fetchRoute]);

  const displayStops = useMemo(() => {
    const s = route?.stops?.length > 0 ? route.stops : backupOrders;
    return s.map((o: any) => ({
      ...o,
      lat: Number(o.lat || o.latitude || o.location?.lat),
      lng: Number(o.lng || o.longitude || o.location?.lng)
    })).filter((o: any) => !isNaN(o.lat) && !isNaN(o.lng));
  }, [route, backupOrders]);

  // CALCULAR LA RUTA COMPLETA (UNA SOLA VEZ)
  useEffect(() => {
    if (!isLoaded || displayStops.length < 1 || !driverPos) return;
    const ds = new google.maps.DirectionsService();
    ds.route({
      origin: driverPos,
      destination: { lat: displayStops[displayStops.length - 1].lat, lng: displayStops[displayStops.length - 1].lng },
      waypoints: displayStops.slice(0, -1).map((s: any) => ({ location: { lat: s.lat, lng: s.lng }, stopover: true })),
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: false,
    }, (res, status) => {
      if (status === 'OK') setDirectionsResponse(res);
    });
  }, [isLoaded, displayStops, driverPos]);

  // SEPARAR PIEZAS: ACTIVA Y FUTURA
  const activeRoute = useMemo(() => {
    if (!directionsResponse) return null;
    return {
      ...directionsResponse,
      routes: [{
        ...directionsResponse.routes[0],
        legs: [directionsResponse.routes[0].legs[0]] // TRAMO 1
      }]
    };
  }, [directionsResponse]);

  const futureRoute = useMemo(() => {
    if (!directionsResponse || directionsResponse.routes[0].legs.length < 2) return null;
    return {
      ...directionsResponse,
      routes: [{
        ...directionsResponse.routes[0],
        legs: directionsResponse.routes[0].legs.slice(1) // TRAMOS 2 EN ADELANTE
      }]
    };
  }, [directionsResponse]);

  const fitAll = useCallback(() => {
    if (!mapRef.current || displayStops.length === 0) return;
    setIsFollowing(false);
    const b = new google.maps.LatLngBounds();
    displayStops.forEach((s: any) => b.extend({ lat: s.lat, lng: s.lng }));
    if (driverPos) b.extend(driverPos);
    mapRef.current.fitBounds(b, { top: 100, bottom: 250, left: 60, right: 60 });
  }, [displayStops, driverPos]);

  if (loadError) return <div className="p-8">Error: {loadError.message}</div>;
  if (!isLoaded) return <div className="w-full h-full flex items-center justify-center bg-slate-50"><Loader2 className="w-12 h-12 text-emerald-500 animate-spin" /></div>;

  return (
    <div className={`relative w-full h-full overflow-hidden ${mapTheme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={driverPos || { lat: 1.2136, lng: -77.2811 }}
        zoom={16}
        onLoad={m => { mapRef.current = m; }}
        onDragStart={() => setIsFollowing(false)}
        options={{ disableDefaultUI: true, styles: mapStyles }}
      >
        {/* PIEZA B: RUTA FUTURA (TENUE CON FLECHAS) */}
        {futureRoute && (
          <DirectionsRenderer
            key={`future-${optMode}-${currentBatchId}`}
            directions={futureRoute}
            options={{
              suppressMarkers: true,
              preserveViewport: true,
              polylineOptions: {
                strokeColor: '#10b981', strokeOpacity: 0.25, strokeWeight: 5, zIndex: 30,
                icons: [{ icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 2, fillColor: '#10b981', fillOpacity: 0.4, strokeColor: 'transparent' }, offset: '0', repeat: '100px' }]
              }
            }}
          />
        )}

        {/* PIEZA A: RUTA ACTIVA (SÓLIDA CON FLECHAS) */}
        {activeRoute && (
          <DirectionsRenderer
            key={`active-${optMode}-${currentBatchId}`}
            directions={activeRoute}
            options={{
              suppressMarkers: true,
              preserveViewport: true,
              polylineOptions: {
                strokeColor: '#10b981', strokeWeight: 8, strokeOpacity: 1, zIndex: 60,
                icons: [{ icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3, fillColor: '#fff', fillOpacity: 1, strokeColor: '#10b981' }, offset: '0', repeat: '80px' }]
              }
            }}
          />
        )}

        {displayStops.map((stop: any, idx: number) => (
          <MarkerF
            key={stop.id || idx}
            position={{ lat: stop.lat, lng: stop.lng }}
            label={{ text: (idx + 1).toString(), color: 'white', fontWeight: '900', fontSize: '11px' }}
            icon={{ path: google.maps.SymbolPath.CIRCLE, fillColor: idx === 0 ? '#fbbf24' : '#f43f5e', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2, scale: 8 }}
          />
        ))}

        {driverPos && (
          <MarkerF
            position={driverPos}
            zIndex={1000}
            icon={{ path: 'M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z', fillColor: '#3b82f6', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2, scale: 1.5, anchor: new google.maps.Point(12, 12) }}
          />
        )}
      </GoogleMap>

      {/* CONTROLES LATERALES */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-3">
        <button onClick={() => setMapTheme(mapTheme === 'light' ? 'dark' : 'light')} className="bg-white/95 backdrop-blur-md p-4 rounded-2xl text-slate-900 shadow-xl border border-slate-200">{mapTheme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}</button>
        <button onClick={() => setIsFollowing(!isFollowing)} className={`p-4 rounded-2xl shadow-xl border ${isFollowing ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white text-slate-400 border-slate-200'}`}><Eye className="w-5 h-5" /> </button>
        <button onClick={fitAll} className="bg-white/95 p-4 rounded-2xl text-slate-900 shadow-xl border border-slate-200"><Target className="w-5 h-5" /></button>
      </div>

      {/* PANEL SUPERIOR */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none w-full max-w-[calc(100%-120px)]">
        <AnimatePresence mode="wait">
          {displayStops[0] && directionsResponse && (
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white/95 backdrop-blur-xl p-4 rounded-[2.5rem] border border-slate-200 shadow-2xl pointer-events-auto">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-3 rounded-2xl text-white shadow-lg shadow-emerald-500/20"><Navigation className="w-6 h-6" fill="currentColor" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Siguiente Destino</p>
                  <p className="text-sm text-slate-900 font-black truncate">{displayStops[0].address}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] font-black">
                    <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl text-slate-700 border border-slate-200"><Clock className="w-3.5 h-3.5 text-emerald-600" /> {directionsResponse.routes[0].legs[0].duration?.text}</span>
                    <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl text-slate-700 border border-slate-200"><MapPin className="w-3.5 h-3.5 text-emerald-600" /> {directionsResponse.routes[0].legs[0].distance?.text}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PANEL INFERIOR */}
      <div className="absolute bottom-20 inset-x-4 z-10 flex flex-col gap-4">
        <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl p-5 border border-slate-200 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 p-3 rounded-2xl text-emerald-600"><Box className="w-6 h-6" /></div>
              <div>
                <p className="text-sm font-black text-slate-900 leading-none">Lote #{currentBatchId}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{displayStops.length} Envíos activos</p>
              </div>
            </div>

            <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200">
              <button
                onClick={() => setOptMode('EFFICIENCY')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${optMode === 'EFFICIENCY' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Eficiencia
              </button>
              <button
                onClick={() => setOptMode('PRIORITY')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${optMode === 'PRIORITY' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Prioridad
              </button>
            </div>
          </div>

          {optimizing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2 py-1">
              <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">IA recalculando ruta...</span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
