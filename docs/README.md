# VibeRoute Colombia - Sistema de Gestión Logística Inteligente 🇨🇴🚚

¡Bienvenido al core operativo de **VibeRoute Colombia**! Este repositorio contiene la primera fase del sistema unificado de seguimiento y optimización de rutas, diseñado bajo estándares de **Clean Architecture** y alto rendimiento logístico.

## 🚀 Módulo 1: Gestión Operativa y Autenticación Unificada

En esta primera etapa, hemos consolidado la infraestructura base y los portales críticos para la operación nacional:

### 🛠️ Características Principales
- **Dashboard Administrativo (Manager)**: Panel central para la toma de decisiones, visualización de métricas de entrega y analíticas generadas por IA.
- **Logística Operativa (Driver Portal)**: Una interfaz móvil-first exclusiva para el personal de campo, que consume datos en tiempo real de lotes asignados, estados de entrega y sugerencias de ruta.
- **Seguridad Robusta**: Sistema de autenticación JWT (JSON Web Tokens) con persistencia de estado mediante **Zustand**.
- **Diseño Premium**: Interfaz moderna con tema claro (Light Mode), utilizando **Framer Motion** para transiciones fluidas y **Lucide React** para iconografía profesional.

### ⚙️ Ajustes Críticos del Backend
Para esta fase, se realizaron optimizaciones de infraestructura y seguridad:
- **CORS Management**: Configuración de `SecurityConfig.java` para permitir el tráfico desde el puerto `3000` del frontend.
- **Jerarquía de Permisos**: Actualización de políticas de acceso para permitir que el rol `DRIVER` consulte sus propios lotes y analíticas operativas.
- **Virtualización de DB**: Mapeo de puertos reconfigurado a `5433:5432` en Docker para evitar colisiones con instancias locales de PostgreSQL.

### 🏗️ Arquitectura del Sistema
- **Backend**: Spring Boot 3 + PostgreSQL/PostGIS (Georeferenciación avanzada).
- **Frontend**: React (Vite) + TypeScript + Tailwind CSS.
- **Contenerización**: Despliegue listo para producción mediante **Docker Compose**.

## 📦 Instalación y Ejecución

1. **Clonar el repositorio:**
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   ```

2. **Levantar infraestructura (Docker):**
   ```bash
   docker-compose up --build
   ```

3. **Poblar datos de prueba (Opcional):**
   ```bash
   python ./backend/test_flujo.py
   ```

4. **Acceso:**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8080/api/v1`

## 👨‍💻 Integrantes de Logística
- **Operación de Campo**: Gestionada a través del nuevo `LogisticDashboardPage`.
- **Control Central**: Gestionado a través del `DashboardPage`.

---
*VibeRoute Colombia - Transformando la red de suministros nacional con tecnología de punta.*
