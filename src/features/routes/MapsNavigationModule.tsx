import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { Loader2, Navigation, Clock, MapPin, Box, Target, Sun, Moon, Phone, User } from 'lucide-react';
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
  
  // ESTADOS LOCALES PARA CONTROL TOTAL
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [optMode, setOptMode] = useState<'EFFICIENCY' | 'PRIORITY'>('EFFICIENCY');
  const [activePath, setActivePath] = useState<google.maps.LatLngLiteral[]>([]);
  const [futurePath, setFuturePath] = useState<google.maps.LatLngLiteral[]>([]);
  const [etaInfo, setEtaInfo] = useState<{distance: string, duration: string} | null>(null);
  const [routeVersion, setRouteVersion] = useState(0); 
  
  const activePolylineRef = useRef<google.maps.Polyline | null>(null);
  const futurePolylineRef = useRef<google.maps.Polyline | null>(null);
  
  const [isFollowing, setIsFollowing] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  const mapRef = useRef<google.maps.Map | null>(null);
  const lastRequestId = useRef<number>(0);

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

  // Limpiar solo el estado LOCAL de ruta al montar. NO tocar backupOrders del store
  // (ya fueron cargados por DriverDashboardPage antes de montar este componente).
  useEffect(() => {
    setActivePath([]);
    setFuturePath([]);
    setEtaInfo(null);
    setRoute(null);
  }, []);

  const syncRoute = useCallback(async (targetMode: 'EFFICIENCY' | 'PRIORITY') => {
    if (!currentBatchId || !driverPos || !isLoaded) {
       setLoading(false);
       return;
    }

    const reqId = ++lastRequestId.current;
    setOptimizing(true);
    
    // LIMPIEZA ATÓMICA DE ESTADOS LOCALES
    setActivePath([]);
    setFuturePath([]);
    setEtaInfo(null);

    try {
      const { data: optRoute } = await api.post(`/batches/${currentBatchId}/optimize`, {
        lat: driverPos.lat,
        lng: driverPos.lng,
        mode: targetMode
      });

      if (reqId !== lastRequestId.current) return;
      
      setRoute(optRoute);
      setRouteVersion(prev => prev + 1);

      const ds = new google.maps.DirectionsService();
      const stops = optRoute.stops.map((s: any) => ({
        location: { lat: Number(s.lat || s.location?.lat), lng: Number(s.lng || s.location?.lng) },
        stopover: true
      }));

      ds.route({
        origin: driverPos,
        destination: stops[stops.length - 1].location,
        waypoints: stops.slice(0, -1),
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      }, (res, status) => {
        if (reqId === lastRequestId.current && status === 'OK' && res) {
          const leg1 = res.routes[0].legs[0];
          setEtaInfo({ distance: leg1.distance?.text || '', duration: leg1.duration?.text || '' });
          setActivePath(leg1.steps.flatMap(s => s.path.map(p => ({ lat: p.lat(), lng: p.lng() }))));
          
          const future = res.routes[0].legs.slice(1).flatMap(leg => 
            leg.steps.flatMap(step => step.path.map(p => ({ lat: p.lat(), lng: p.lng() })))
          );
          setFuturePath(future);
        }
      });

    } catch (e) {
      console.error("Error Sync:", e);
    } finally {
      if (reqId === lastRequestId.current) {
        setOptimizing(false);
        setLoading(false);
      }
    }
  }, [currentBatchId, driverPos, isLoaded, setRoute]);

  // DISPARADORES DE SINCRONIZACIÓN
  useEffect(() => {
    if (!isLoaded) return;
    if (currentBatchId && driverPos) {
      syncRoute(optMode);
    } else {
      // API cargada pero sin lote o sin GPS aún: mostrar mapa con backupOrders
      setLoading(false);
    }
  }, [optMode, currentBatchId, !!driverPos, isLoaded]);

  // Watch Position
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

  // LA CURA DEFINITIVA PARA LA SOBREPOSICIÓN: Gestión Manual de Polilíneas
  useEffect(() => {
    if (!mapRef.current) return;

    if (activePolylineRef.current) activePolylineRef.current.setMap(null);
    if (futurePolylineRef.current) futurePolylineRef.current.setMap(null);

    if (activePath.length > 0) {
      activePolylineRef.current = new google.maps.Polyline({
        path: activePath,
        strokeColor: '#10b981',
        strokeWeight: 8,
        strokeOpacity: 1,
        zIndex: 100,
        icons: [{ icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3, fillColor: '#fff', fillOpacity: 1, strokeColor: '#10b981' }, offset: '0', repeat: '80px' }]
      });
      activePolylineRef.current.setMap(mapRef.current);
    }

    if (futurePath.length > 0) {
      futurePolylineRef.current = new google.maps.Polyline({
        path: futurePath,
        strokeColor: '#10b981',
        strokeOpacity: 0.25,
        strokeWeight: 5,
        zIndex: 50,
        icons: [{ icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 2, fillColor: '#10b981', fillOpacity: 0.4, strokeColor: 'transparent' }, offset: '0', repeat: '100px' }]
      });
      futurePolylineRef.current.setMap(mapRef.current);
    }

    return () => {
      if (activePolylineRef.current) activePolylineRef.current.setMap(null);
      if (futurePolylineRef.current) futurePolylineRef.current.setMap(null);
    };
  }, [activePath, futurePath]);


  const displayStops = useMemo(() => {
    const s = route?.stops || backupOrders || [];
    return s.map((o: any) => ({
      ...o,
      lat: Number(o.lat || o.latitude || o.location?.lat),
      lng: Number(o.lng || o.longitude || o.location?.lng)
    })).filter((o: any) => !isNaN(o.lat) && !isNaN(o.lng));
  }, [route, backupOrders]);

  const fitAll = useCallback(() => {
    if (!mapRef.current || displayStops.length === 0) return;
    setIsFollowing(false);
    const b = new google.maps.LatLngBounds();
    displayStops.forEach((s: any) => b.extend({ lat: s.lat, lng: s.lng }));
    if (driverPos) b.extend(driverPos);
    mapRef.current.fitBounds(b, { top: 100, bottom: 250, left: 60, right: 60 });
  }, [displayStops, driverPos]);

  if (loadError) return <div className="p-8">Error: {loadError.message}</div>;
  if (!isLoaded || (loading && !driverPos)) return <div className="w-full h-full flex flex-col items-center justify-center bg-white"><Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" /><p className="text-sm font-black text-slate-900 uppercase tracking-widest animate-pulse">Iniciando Navegación...</p></div>;

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
        {displayStops.map((stop: any, idx: number) => (
          <MarkerF
            key={`${stop.id || idx}-v${routeVersion}`}
            position={{ lat: stop.lat, lng: stop.lng }}
            onClick={() => setSelectedOrder(stop)}
            label={{ text: (idx + 1).toString(), color: 'white', fontWeight: '900', fontSize: '11px' }}
            icon={{ path: google.maps.SymbolPath.CIRCLE, fillColor: idx === 0 ? '#fbbf24' : '#f43f5e', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2, scale: 8 }}
          />
        ))}

        {selectedOrder && (
          <InfoWindowF position={{ lat: selectedOrder.lat, lng: selectedOrder.lng }} onCloseClick={() => setSelectedOrder(null)}>
            <div className="p-4 min-w-[240px] bg-white rounded-2xl shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${selectedOrder.priority === 'HIGH' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
                    {selectedOrder.priority === 'HIGH' ? 'Prioridad Alta' : 'Estándar'}
                </div>
                <span className="text-[10px] font-bold text-slate-400">#{selectedOrder.id?.toString().slice(-4)}</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3"><User className="w-4 h-4 text-emerald-500 mt-0.5" /><div><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Cliente</p><p className="text-sm font-black text-slate-900">{(selectedOrder.clientName && selectedOrder.clientName !== 'Cliente VibeRoute' && selectedOrder.clientName !== 'Cliente Viberoute') ? selectedOrder.clientName : (selectedOrder.clientReference || 'Sin nombre')}</p>{selectedOrder.clientReference && selectedOrder.clientName && selectedOrder.clientName !== 'Cliente VibeRoute' && selectedOrder.clientName !== 'Cliente Viberoute' && <p className="text-[10px] text-slate-400 font-semibold">Ref: {selectedOrder.clientReference}</p>}</div></div>
                <div className="flex items-start gap-3"><MapPin className="w-4 h-4 text-emerald-500 mt-0.5" /><div><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Entrega en</p><p className="text-[11px] font-bold text-slate-600 leading-tight">{selectedOrder.address}</p></div></div>
                <div className="flex items-start gap-3"><Phone className="w-4 h-4 text-emerald-500 mt-0.5" /><div><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Contacto</p><a href={`tel:${selectedOrder.phone || '3000000000'}`} className="text-[11px] font-black text-emerald-600 underline decoration-emerald-200">{selectedOrder.phone || 'Llamar al cliente'}</a></div></div>
              </div>
            </div>
          </InfoWindowF>
        )}

        {driverPos && (
          <MarkerF position={driverPos} zIndex={1000} icon={{ path: 'M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z', fillColor: '#3b82f6', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2, scale: 1.5, anchor: new google.maps.Point(12, 12) }} />
        )}
      </GoogleMap>

      {/* PANEL SUPERIOR */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none w-full max-w-[calc(100%-120px)]">
        <AnimatePresence mode="wait">
          {displayStops[0] && etaInfo && (
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white/95 backdrop-blur-xl p-4 rounded-[2.5rem] border border-slate-200 shadow-2xl pointer-events-auto">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-3 rounded-2xl text-white shadow-lg shadow-emerald-500/20"><Navigation className="w-6 h-6" fill="currentColor" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Siguiente Destino</p>
                  <p className="text-sm text-slate-900 font-black truncate">{displayStops[0].address}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] font-black">
                    <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl text-slate-700 border border-slate-200"><Clock className="w-3.5 h-3.5 text-emerald-600" /> {etaInfo.duration}</span>
                    <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl text-slate-700 border border-slate-200"><MapPin className="w-3.5 h-3.5 text-emerald-600" /> {etaInfo.distance}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute top-4 right-4 z-20 flex flex-col gap-3">
        <button onClick={() => setMapTheme(mapTheme === 'light' ? 'dark' : 'light')} className="bg-white/95 backdrop-blur-md p-4 rounded-2xl text-slate-900 shadow-xl border border-slate-200">{mapTheme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}</button>
        <button onClick={fitAll} className="bg-white/95 p-4 rounded-2xl text-slate-900 shadow-xl border border-slate-200"><Target className="w-5 h-5" /></button>
      </div>

      <div className="absolute bottom-32 inset-x-4 z-10 flex flex-col gap-4">
        <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl p-5 border border-slate-200 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 p-3 rounded-2xl text-emerald-600"><Box className="w-6 h-6" /></div>
              <div>
                <p className="text-sm font-black text-slate-900 leading-none">Lote #{currentBatchId || 'Asignado'}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{displayStops.length} Envíos activos</p>
              </div>
            </div>
            {currentBatchId && (
              <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200">
                <button onClick={() => { setOptMode('EFFICIENCY'); }} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${optMode === 'EFFICIENCY' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Eficiencia</button>
                <button onClick={() => { setOptMode('PRIORITY'); }} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${optMode === 'PRIORITY' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Prioridad</button>
              </div>
            )}
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
