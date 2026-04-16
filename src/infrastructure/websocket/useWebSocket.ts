import { useEffect, useRef, useCallback } from 'react';
import { Client, StompSubscription, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

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
 * Connects via SockJS → STOMP, subscribes to a topic and fires
 * onMessage whenever the backend pushes a frame.
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

  // Stable references
  const onMessageRef   = useRef(onMessage);
  const onConnectRef    = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { onConnectRef.current = onConnect; }, [onConnect]);
  useEffect(() => { onDisconnectRef.current = onDisconnect; }, [onDisconnect]);

  const connect = useCallback(() => {
    if (clientRef.current?.active) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(url) as any,
      reconnectDelay:   5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
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
        onDisconnectRef.current?.();
      },
      onStompError: (frame) => {
        console.error('[WS] STOMP error', frame.headers['message']);
      },
    });

    client.activate();
    clientRef.current = client;
  }, [url, topic]);

  const disconnect = useCallback(() => {
    subRef.current?.unsubscribe();
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
