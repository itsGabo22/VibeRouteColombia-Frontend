# 🇨🇴 VibeRoute Colombia - Sistema de Logística Inteligente (Fase Final)

Este documento resume la implementación de los módulos core de navegación, rastreo satelital y operaciones en vivo de la plataforma **VibeRoute Colombia**.

## 🚀 Módulos Implementados

### 1. Corazón del Conductor (Maps SDK & Navigation)
- **Integración Google Maps:** Implementación de la API de Maps con diseño personalizado "Silver".
- **Rutas Dinámicas:** Renderizado de trayectorias (Polylines) en tiempo real basadas en la hoja de ruta del conductor.
- **Alertas de Desviación:** Sistema visual de flechas y marcadores de alerta sobre el mapa para notificar incidencias geográficas.

### 2. Tracking GPS Profesional
- **Servicio de Ubicación:** Implementación de `navigator.geolocation` con alta precisión.
- **Transmisión de Datos:** Envío automático de pings de ubicación al backend cada **3 segundos** para monitorización centralizada.
- **Manejo de Estados:** Indicadores visuales de precisión y estado del sensor (Activo/Inactivo).

### 3. Operaciones en Vivo (Real-Time Wall)
- **WebSockets (STOMP.js):** Conexión de bajo nivel para recepción de eventos instantáneos.
- **Muro de Eventos:** Panel administrativo que se actualiza en tiempo real sin recargar la página, mostrando entregas, alertas y novedades.

### 4. Acceso y Seguridad Universal
- **Selector de Rol Visual:** Interfaz de login intuitiva con perfiles diferenciados (Admin, Logística, Driver).
- **Persistencia JWT:** Almacenamiento seguro en LocalStorage para mantener sesiones activas.
- **Auto-Seeder:** Inicialización automática de la base de datos con usuarios de prueba.

## 🛠️ Stack Tecnológico
- **Frontend:** React 18, Vite, Framer Motion (Animaciones), Lucide React (Iconografía), Google Maps SDK.
- **Backend:** Spring Boot (Java), STOMP WebSockets, PostGIS (Geografía).
- **Infraestructura:** Docker Compose (Orquestación completa de DB, API y Client).

## 🔐 Credenciales de Prueba (Contraseña: 123)
- **Admin:** `admin@viberoute.com`
- **Logística:** `logistica@viberoute.com`
- **Conductor:** `driver@viberoute.com`

---
*Desarrollado con arquitectura modular y escalable para la logística moderna en Colombia.* 🚛✨
