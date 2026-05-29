import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF, OverlayViewF, OverlayView } from '@react-google-maps/api';
import { Loader2, Navigation, Clock, MapPin, Box, Target, Sun, Moon, Phone, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../shared/lib/api';
import { useMissionStore } from '../../app/store/missionStore';
import { useRouteStore } from '../../app/store/routeStore';

const containerStyle = { width: '100%', height: '100%' };
const LIBRARIES: ("geometry" | "drawing" | "places" | "visualization")[] = ["geometry"];
const COMPLETED_STATUSES = new Set(['DELIVERED', 'RETURNED', 'CANCELLED']);

type MapStop = {
  id?: number;
  lat: number;
  lng: number;
  status?: string;
  address?: string;
  priority?: string;
  clientName?: string;
  clientReference?: string;
  phone?: string;
  driverName?: string;
};

const isActiveStop = (stop: { status?: string }) =>
  !stop.status || !COMPLETED_STATUSES.has(stop.status);

const normalizeStop = (o: Record<string, unknown>): MapStop => ({
  ...(o as MapStop),
  lat: Number(o.lat ?? o.latitude ?? (o.location as { lat?: number })?.lat),
  lng: Number(o.lng ?? o.longitude ?? (o.location as { lng?: number })?.lng),
});

export const MapsNavigationModule: React.FC = () => {
  const { currentBatchId } = useMissionStore();
  const route = useRouteStore((s) => s.route);
  const backupOrders = useRouteStore((s) => s.backupOrders);
  const driverPos = useRouteStore((s) => s.driverPos);
  const mapTheme = useRouteStore((s) => s.mapTheme);
  const setRoute = useRouteStore((s) => s.setRoute);
  const setDriverPos = useRouteStore((s) => s.setDriverPos);
  const setMapTheme = useRouteStore((s) => s.setMapTheme);
  
  // ESTADOS LOCALES PARA CONTROL TOTAL
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [optMode, setOptMode] = useState<'EFFICIENCY' | 'PRIORITY'>('EFFICIENCY');
  const [activePath, setActivePath] = useState<google.maps.LatLngLiteral[]>([]);
  const [futurePath, setFuturePath] = useState<google.maps.LatLngLiteral[]>([]);
  const [etaInfo, setEtaInfo] = useState<{distance: string, duration: string} | null>(null);
  
  const activePolylineRef = useRef<google.maps.Polyline | null>(null);
  const futurePolylineRef = useRef<google.maps.Polyline | null>(null);
  
  const [isFollowing, setIsFollowing] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [deviceHeading, setDeviceHeading] = useState(0);
  
  const mapRef = useRef<google.maps.Map | null>(null);
  const lastRequestId = useRef<number>(0);
  const prevActiveCount = useRef<number>(0);
  const isMapDraggingRef = useRef(false);
  const followPanFrameRef = useRef<number | null>(null);
  const routeSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobile =
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;

  // [FASE 1] DESCONEXIÓN DEL CENTRO REACTIVO: Calculamos el centro inicial una sola vez
  const initialCenter = useMemo(() => driverPos || { lat: 1.2136, lng: -77.2811 }, []);

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

  // DECLARACIÓN DE CALLBACKS (ANTES DE EFECTOS)
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

      const activeOrders = optRoute.stops.filter((s: { status?: string }) => isActiveStop(s));

      if (activeOrders.length === 0) {
        setOptimizing(false);
        return;
      }

      const ds = new google.maps.DirectionsService();
      const stops = activeOrders.map((s: any) => ({
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

  // INTEGRACIÓN DE GIROSCOPIO / BRÚJULA (DeviceOrientation API)
  useEffect(() => {
    const handleOrientation = (e: any) => {
      // Prioridad a iOS (webkitCompassHeading)
      if (e.webkitCompassHeading !== undefined) {
        setDeviceHeading(e.webkitCompassHeading);
      } 
      // Estándar absoluto (Android/Chrome)
      else if (e.absolute && e.alpha !== null) {
        setDeviceHeading(360 - e.alpha);
      }
    };

    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    window.addEventListener('deviceorientation', handleOrientation, true);
    
    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  useEffect(() => {
    const activeCount = backupOrders.filter((o) => isActiveStop(o)).length;

    if (activeCount < prevActiveCount.current && activeCount > 0 && isLoaded) {
      if (selectedOrder && !isActiveStop(selectedOrder)) {
        setSelectedOrder(null);
      }
      if (routeSyncTimerRef.current) clearTimeout(routeSyncTimerRef.current);
      routeSyncTimerRef.current = setTimeout(() => syncRoute(optMode), 700);
    }
    prevActiveCount.current = activeCount;
    return () => {
      if (routeSyncTimerRef.current) clearTimeout(routeSyncTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backupOrders, optMode, isLoaded]);

  // Limpiar solo el estado LOCAL de ruta al montar.
  useEffect(() => {
    setActivePath([]);
    setFuturePath([]);
    setEtaInfo(null);
    setRoute(null);
  }, []);

  // DISPARADORES DE SINCRONIZACIÓN
  useEffect(() => {
    if (!isLoaded) return;
    if (currentBatchId && driverPos) {
      syncRoute(optMode);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optMode, currentBatchId, !!driverPos, isLoaded]);

  useEffect(() => {
    if (!isFollowing || !mapRef.current || !driverPos || isMapDraggingRef.current) return;
    if (followPanFrameRef.current) cancelAnimationFrame(followPanFrameRef.current);
    followPanFrameRef.current = requestAnimationFrame(() => {
      if (!isMapDraggingRef.current && mapRef.current && driverPos) {
        mapRef.current.panTo(driverPos);
      }
    });
    return () => {
      if (followPanFrameRef.current) cancelAnimationFrame(followPanFrameRef.current);
    };
  }, [driverPos?.lat, driverPos?.lng, isFollowing]);

  const lastGpsRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const wId = navigator.geolocation.watchPosition(
      (p) => {
        const np = { lat: p.coords.latitude, lng: p.coords.longitude };
        const prev = lastGpsRef.current;
        if (
          prev &&
          Math.abs(prev.lat - np.lat) < 0.00003 &&
          Math.abs(prev.lng - np.lng) < 0.00003
        ) {
          return;
        }
        lastGpsRef.current = np;
        setDriverPos(np);
      },
      null,
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(wId);
  }, [setDriverPos]);

  useEffect(() => {
    if (!mapRef.current) return;

    const upsertPolyline = (
      ref: React.MutableRefObject<google.maps.Polyline | null>,
      path: google.maps.LatLngLiteral[],
      options: google.maps.PolylineOptions
    ) => {
      if (path.length === 0) {
        ref.current?.setMap(null);
        ref.current = null;
        return;
      }
      if (!ref.current) {
        ref.current = new google.maps.Polyline({ ...options, path, map: mapRef.current! });
      } else {
        ref.current.setPath(path);
        ref.current.setOptions(options);
        if (!ref.current.getMap()) ref.current.setMap(mapRef.current);
      }
    };

    upsertPolyline(activePolylineRef, activePath, {
      strokeColor: '#10b981',
      strokeWeight: isMobile ? 6 : 8,
      strokeOpacity: 1,
      zIndex: 10,
      clickable: false,
      icons: [{
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 3,
          fillColor: '#fff',
          fillOpacity: 1,
          strokeColor: '#10b981',
        },
        offset: '0',
        repeat: '80px',
      }],
    });

    upsertPolyline(futurePolylineRef, futurePath, {
      strokeColor: '#10b981',
      strokeOpacity: 0.25,
      strokeWeight: isMobile ? 4 : 5,
      zIndex: 5,
      clickable: false,
      icons: [{
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 2,
          fillColor: '#10b981',
          fillOpacity: 0.4,
          strokeColor: 'transparent',
        },
        offset: '0',
        repeat: '100px',
      }],
    });
  }, [activePath, futurePath, isMobile]);

  const allStops = useMemo((): MapStop[] => {
    const raw: unknown[] = route?.stops ?? backupOrders ?? [];
    return raw
      .map((item) => normalizeStop(item as Record<string, unknown>))
      .filter((stop: MapStop) => !Number.isNaN(stop.lat) && !Number.isNaN(stop.lng));
  }, [route, backupOrders]);

  const activeStops = useMemo(
    () => allStops.filter((stop: MapStop) => isActiveStop(stop)),
    [allStops]
  );

  const nextStop = activeStops[0] ?? null;

  const fitAll = useCallback(() => {
    if (!mapRef.current || activeStops.length === 0) return;
    setIsFollowing(false);
    const b = new google.maps.LatLngBounds();
    activeStops.forEach((stop: MapStop) => b.extend({ lat: stop.lat, lng: stop.lng }));
    if (driverPos) b.extend(driverPos);
    mapRef.current.fitBounds(b, {
      top: isMobile ? 88 : 100,
      bottom: isMobile ? 140 : 250,
      left: 48,
      right: 48,
    });
  }, [activeStops, driverPos, isMobile]);

  const handleMapZoomChange = useCallback(() => {
    if (isFollowing) setIsFollowing(false);
  }, [isFollowing]);

  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: true,
      clickableIcons: false,
      styles: mapStyles,
      gestureHandling: 'greedy' as const,
      tilt: isMobile ? 0 : isFollowing ? 45 : 0,
      zoomControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    }),
    [mapStyles, isFollowing, isMobile]
  );

  if (loadError) return <div className="p-8">Error: {loadError.message}</div>;
  if (!isLoaded || (loading && !driverPos)) return <div className="w-full h-full flex flex-col items-center justify-center bg-white"><Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" /><p className="text-sm font-black text-slate-900 uppercase tracking-widest animate-pulse">Iniciando Navegación...</p></div>;

  return (
    <div
      className={`relative w-full h-full min-h-0 overflow-hidden overscroll-none ${mapTheme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}
    >
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={initialCenter}
        zoom={16}
        onLoad={(m) => {
          mapRef.current = m;
        }}
        onDragStart={() => {
          isMapDraggingRef.current = true;
          setIsFollowing(false);
        }}
        onDragEnd={() => {
          isMapDraggingRef.current = false;
        }}
        onZoomChanged={handleMapZoomChange}
        options={mapOptions}
      >
        {activeStops.map((stop: MapStop, idx: number) => (
          <MarkerF
            key={`stop-${stop.id ?? idx}`}
            position={{ lat: stop.lat, lng: stop.lng }}
            onClick={() => setSelectedOrder(stop)}
            label={{ text: (idx + 1).toString(), color: 'white', fontWeight: '900', fontSize: '11px' }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: idx === 0 ? '#fbbf24' : '#f43f5e',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
              scale: isMobile ? 7 : 8,
            }}
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
          <>
            <OverlayViewF
              position={driverPos}
              mapPaneName={OverlayView.OVERLAY_LAYER}
            >
              <div className="pointer-events-none relative flex h-0 w-0 items-center justify-center">
                <div className="absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/25 animate-pulse" />
              </div>
            </OverlayViewF>
            <MarkerF
              position={driverPos}
              zIndex={1000}
              icon={{
                path: 'M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z',
                fillColor: '#3b82f6',
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 2,
                scale: isMobile ? 1.35 : 1.5,
                anchor: new google.maps.Point(12, 12),
                rotation: deviceHeading,
              }}
            />
          </>
        )}
      </GoogleMap>


      <div className="absolute top-[max(1rem,env(safe-area-inset-top))] left-4 z-20 pointer-events-none w-full max-w-[calc(100%-7.5rem)]">
        <AnimatePresence mode="wait">
          {nextStop && etaInfo && (
            <motion.div 
              key={nextStop.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-white/95 backdrop-blur-xl p-4 rounded-[2.5rem] border border-slate-200 shadow-2xl pointer-events-auto touch-manipulation"
            >
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-3 rounded-2xl text-white shadow-lg shadow-emerald-500/20"><Navigation className="w-6 h-6" fill="currentColor" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Siguiente Destino</p>
                  <p className="text-sm text-slate-900 font-black truncate">{nextStop.address}</p>
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

      <div className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 z-20 flex flex-col gap-3 pointer-events-none">
        <button type="button" onClick={() => setMapTheme(mapTheme === 'light' ? 'dark' : 'light')} className="pointer-events-auto touch-manipulation min-h-[44px] min-w-[44px] bg-white/95 backdrop-blur-md p-4 rounded-2xl text-slate-900 shadow-xl border border-slate-200 active:scale-95">{mapTheme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}</button>
        <button type="button" onClick={fitAll} className="pointer-events-auto touch-manipulation min-h-[44px] min-w-[44px] bg-white/95 p-4 rounded-2xl text-slate-900 shadow-xl border border-slate-200 active:scale-95"><Target className="w-5 h-5" /></button>
        
        {/* BOTÓN RECENTRAR: Visible cuando isFollowing es false */}
        <AnimatePresence>
          {!isFollowing && driverPos && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              onClick={() => {
                setIsFollowing(true);
                if (mapRef.current && driverPos) mapRef.current.panTo(driverPos);
              }}
              className="pointer-events-auto touch-manipulation min-h-[44px] min-w-[44px] bg-blue-500 text-white p-4 rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center border border-blue-400 active:scale-95"
            >
              <Navigation className="w-5 h-5" fill="currentColor" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className={`absolute inset-x-4 z-10 flex flex-col gap-4 pointer-events-none ${isMobile ? 'bottom-[max(6.5rem,env(safe-area-inset-bottom))]' : 'bottom-[max(1rem,env(safe-area-inset-bottom))]'}`}>
        <div className="pointer-events-auto touch-manipulation bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl p-4 sm:p-5 border border-slate-200 flex flex-col gap-3 max-h-[28vh] overflow-y-auto overscroll-contain">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-emerald-500/10 p-3 rounded-2xl text-emerald-600 shrink-0"><Box className="w-6 h-6" /></div>
              <div className="min-w-0">
                <p className="text-sm font-black text-slate-900 leading-none truncate">Lote #{currentBatchId || 'Asignado'}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{activeStops.length} envíos activos</p>
              </div>
            </div>
            {currentBatchId && (
              <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200 shrink-0">
                <button type="button" onClick={() => setOptMode('EFFICIENCY')} className={`min-h-[40px] px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${optMode === 'EFFICIENCY' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>Eficiencia</button>
                <button type="button" onClick={() => setOptMode('PRIORITY')} className={`min-h-[40px] px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${optMode === 'PRIORITY' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400'}`}>Prioridad</button>
              </div>
            )}
          </div>
          {optimizing && (
            <div className="flex items-center justify-center gap-2 py-1">
              <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">IA recalculando ruta...</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
