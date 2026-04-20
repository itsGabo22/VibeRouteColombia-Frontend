# 🎨 VibeRoute Colombia - Guía UI/UX (Frontend)

Este documento detalla la lógica de la interfaz y los componentes premium desarrollados para el ecosistema VibeRoute.

## 💎 Diseño y Estética
Se ha aplicado una estética **Premium Dark/Teal** inspirada en aplicaciones de logística de clase mundial.
- **Librería de Animaciones:** `Framer Motion` para transiciones suaves entre pestañas y modales.
- **Iconografía:** `Lucide React` para consistencia visual.
- **Responsividad:** 100% adaptable para dispositivos móviles utilizados por conductores.

## 📦 Módulos Principales

### 1. Muro de Eventos en Vivo (`LiveEventsWall`)
Monitor de eventos en tiempo real que utiliza WebSockets a través de STOMP.
- Detecta cambios de estado de pedidos realizados por conductores.
- Muestra los motivos de las novedades (cancelaciones/devoluciones) inmediatamente sin recargar la página.

### 2. Monitor de Despacho (`LogisticsDispatchCenter`)
Interfaz diseñada para que el equipo operativo asigne conductores a los lotes de pedidos pendientes de forma rápida mediante "drag-and-click".

### 3. Navegación Asistida (`MapsNavigationModule`)
- **Mapa Uber-like:** Perspectiva de 3D (tilt 45°) para una mejor orientación.
- **Trazado Real:** Polilíneas que siguen las calles mediante Google Directions.
- **GPS Tracking:** Actualización de posición cada 3 segundos enviada al backend.

### 4. Consolidación de Lotes (`BatchConsolidationModule`)
Módulo crítico que permite a Logística agrupar pedidos individuales en lotes eficientes antes de asignarlos a un conductor.

## 🔐 Variables de Entorno (`.env`)
El frontend utiliza variables con el prefijo `VITE_` para que sean expuestas al cliente durante el build:
- `VITE_API_URL`: URL base del backend.
- `VITE_GOOGLE_MAPS_KEY`: Llave de API para el mapa y directions.

---

## 🛠️ Desarrollo Local
Para trabajar sin Docker:
1. `cd frontend_new`
2. `npm install`
3. `npm run dev`
