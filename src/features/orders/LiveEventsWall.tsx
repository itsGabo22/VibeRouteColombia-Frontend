import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, AlertTriangle, Navigation, XCircle,
  Package, Wifi, WifiOff, Trash2
} from 'lucide-react';
import { useWebSocket } from '../../infrastructure/websocket/useWebSocket';

// ─── Types ──────────────────────────────────────────────────────────────────

type EventType = 'DELIVERED' | 'NOVEDAD' | 'ON_ROUTE' | 'CANCELLED' | 'GENERIC';

interface LiveEvent {
  id: string;
  type: EventType;
  title: string;
  subtitle: string;
  timestamp: Date;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const EVENT_META: Record<EventType, { icon: React.ElementType; color: string; dot: string }> = {
  DELIVERED: { icon: CheckCircle2, color: 'bg-green-50  text-green-600  border-green-100', dot: 'bg-green-500' },
  NOVEDAD:   { icon: AlertTriangle, color: 'bg-amber-50  text-amber-600  border-amber-100', dot: 'bg-amber-500' },
  ON_ROUTE:  { icon: Navigation,   color: 'bg-blue-50   text-blue-600   border-blue-100',  dot: 'bg-blue-500'  },
  CANCELLED: { icon: XCircle,      color: 'bg-red-50    text-red-600    border-red-100',    dot: 'bg-red-500'   },
  GENERIC:   { icon: Package,      color: 'bg-slate-50  text-slate-600  border-slate-100',  dot: 'bg-slate-400' },
};

function formatTime(d: Date): string {
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function toEventType(raw: string): EventType {
  const map: Record<string, EventType> = {
    DELIVERED: 'DELIVERED',
    NOVEDAD:   'NOVEDAD',
    ON_ROUTE:  'ON_ROUTE',
    CANCELLED: 'CANCELLED',
  };
  return map[raw] ?? 'GENERIC';
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * "Muro de Eventos" — real-time event wall powered by STOMP/WS.
 * Mounts a low-level WebSocket connection and renders every incoming
 * event as an animated card without ever refreshing the page.
 */
export const LiveEventsWall: React.FC = () => {
  const [events, setEvents]     = useState<LiveEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [maxReached, setMaxReached] = useState(false);

  const MAX_EVENTS = 50;

  const handleMessage = useCallback((body: any) => {
    const rawStatus = body?.newStatus ?? body?.type ?? body?.status ?? '';
    const type = toEventType(rawStatus);

    const statusLabels: Record<string, string> = {
      DELIVERED: 'Entregado exitosamente',
      ON_ROUTE:  'En camino al destino',
      NOVEDAD:   'Novedad reportada',
      CANCELED:  'Pedido cancelado',
      CANCELLED: 'Pedido cancelado',
      RETURNED:  'Devuelto al origen',
      PENDING:   'Volvió a pendiente',
    };

    const newEvent: LiveEvent = {
      id:       `${Date.now()}-${Math.random()}`,
      type,
      title:    `Pedido #${body?.orderId ?? '—'} — ${statusLabels[rawStatus] ?? rawStatus}`,
      subtitle: [
        body?.city     ? `📍 ${body.city}` : '',
        body?.reason   ?  `⚠️ ${body.reason}` : ''
      ].filter(Boolean).join('  •  '),
      timestamp: new Date(),
    };

    setEvents(prev => {
      const updated = [newEvent, ...prev];
      if (updated.length >= MAX_EVENTS) setMaxReached(true);
      return updated.slice(0, MAX_EVENTS);
    });
  }, []);

  // Detectar URL base para el WebSocket
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
  const WS_URL = `${apiBase.replace('/api/v1', '')}/ws-alertas`;

  const { connect, disconnect } = useWebSocket({
    url:       WS_URL,
    topic:     '/topic/logistica',
    onMessage: handleMessage,
    onConnect: () => setConnected(true),
    onDisconnect: () => setConnected(false),
  });

  const clearEvents = () => {
    setEvents([]);
    setMaxReached(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100 mb-2">
            {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
            {connected ? 'En Vivo' : 'Conectando...'}
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic">
            Muro de <span className="text-green-500">Eventos</span>
          </h3>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            {events.length} evento{events.length !== 1 ? 's' : ''} recibido{events.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live pulse indicator */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {connected ? 'Activo' : 'Offline'}
            </span>
          </div>

          {events.length > 0 && (
            <button
              onClick={clearEvents}
              className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all border border-slate-100"
              title="Limpiar muro"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── Capacity warning ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {maxReached && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-2xl text-amber-700 text-[11px] font-bold flex items-center gap-2"
          >
            <AlertTriangle size={14} /> Se alcanzó el límite de {MAX_EVENTS} eventos. Los más antiguos fueron descartados.
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Event feed ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <AnimatePresence initial={false}>
          {events.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 border-2 border-dashed border-slate-200">
                <Wifi size={32} className="text-slate-300" />
              </div>
              <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] mb-2">
                Esperando eventos del servidor
              </p>
              <p className="text-slate-300 text-xs font-medium max-w-xs">
                Cuando el backend publique en <code className="bg-slate-100 px-1 rounded text-slate-500">/topic/logistica</code>, aparecerán aquí al instante.
              </p>
            </motion.div>
          ) : (
            events.map((event) => {
              const meta = EVENT_META[event.type];
              const Icon = meta.icon;
              return (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, x: -24, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 24, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className={`flex items-start gap-4 p-5 rounded-[1.5rem] border ${meta.color} shadow-sm`}
                >
                  {/* Icon */}
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0 border border-white/80">
                    <Icon size={18} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm tracking-tight leading-snug truncate">{event.title}</p>
                    {event.subtitle && (
                      <p className="text-[11px] font-bold opacity-70 mt-0.5 truncate">{event.subtitle}</p>
                    )}
                  </div>

                  {/* Right: type badge + time */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60 whitespace-nowrap">
                      {formatTime(event.timestamp)}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
