import { useEffect, useRef, useCallback } from 'react';
import { Client, StompSubscription, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '../../app/store/authStore';

interface UseWebSocketOptions {
  /** Backend WebSocket URL, e.g. http://localhost:8080/ws-alertas */
  url: string;
  /** STOMP topic to subscribe to, e.g. /topic/eventos */
  topic: string;
  /** Called every time a message arrives */
  onMessage: (body: any) => void;
  /** Called when the connection is established */
  onConnect?: () => void;
  /** Called when the connection is lost */
  onDisconnect?: () => void;
  /** Whether to actually connect (gates the hook) */
  enabled?: boolean;
}

/**
 * Low-level STOMP hook for VibeRoute Colombia.
 *
 * Connects via SockJS → STOMP, subscribes to a topic and fires
 * onMessage whenever the backend pushes a frame.
 *
 * Autenticación: Inyecta el JWT del authStore como header nativo
 * STOMP "Authorization: Bearer <token>" durante el frame CONNECT.
 * Esto permite que el ChannelInterceptor del backend autentique
 * al usuario y establezca el Principal en el contexto de mensajería.
 *
 * Cleans up the connection automatically on unmount.
 */
export function useWebSocket({ 
  url, 
  topic, 
  onMessage, 
  onConnect, 
  onDisconnect,
  enabled = true 
}: UseWebSocketOptions) {
  const clientRef = useRef<Client | null>(null);
  const subRef    = useRef<StompSubscription | null>(null);

  // Stable references to avoid re-creating the STOMP client on every render
  const onMessageRef    = useRef(onMessage);
  const onConnectRef    = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { onConnectRef.current = onConnect; }, [onConnect]);
  useEffect(() => { onDisconnectRef.current = onDisconnect; }, [onDisconnect]);

  const connect = useCallback(() => {
    if (clientRef.current?.active) return;

    // Leer el token JWT del store de autenticación persistido
    const token = useAuthStore.getState().token;

    // Construir los headers de conexión STOMP con el Bearer token.
    // El backend (WebSocketConfig.JwtStompChannelInterceptor) lee este
    // header durante el frame CONNECT para autenticar al usuario.
    const connectHeaders: Record<string, string> = {};
    if (token) {
      connectHeaders['Authorization'] = `Bearer ${token}`;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(url) as any,
      connectHeaders,
      reconnectDelay:   5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        console.info('[WS] ✅ Conectado a STOMP', { topic, authenticated: !!token });
        onConnectRef.current?.();
        subRef.current = client.subscribe(topic, (frame: IMessage) => {
          try {
            const parsed = JSON.parse(frame.body);
            onMessageRef.current(parsed);
          } catch {
            onMessageRef.current(frame.body);
          }
        });
      },

      onDisconnect: () => {
        console.info('[WS] Desconectado de STOMP');
        onDisconnectRef.current?.();
      },

      onStompError: (frame) => {
        console.error('[WS] STOMP error:', frame.headers['message']);
      },

      onWebSocketError: (event) => {
        console.error('[WS] WebSocket transport error:', event);
      },
    });

    client.activate();
    clientRef.current = client;
  }, [url, topic]);

  const disconnect = useCallback(() => {
    subRef.current?.unsubscribe();
    subRef.current = null;
    clientRef.current?.deactivate();
    clientRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    connect();
    return () => disconnect();
  }, [enabled, connect, disconnect]);

  return { disconnect, connect };
}
