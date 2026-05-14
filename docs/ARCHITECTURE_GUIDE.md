# 🏗️ Guía de Arquitectura: Frontend VibeRoute Colombia v1.0

Esta rama introduce una estructura basada en **Clean Architecture** y **Atomic Design**, diseñada para que el proyecto sea escalable, fácil de testear y profesional.

---

## 📂 Estructura de Carpetas

### 1. `src/app/`  
**Propósito:** Punto de entrada y configuración global de la aplicación.
-   **`App.tsx`**: Orquestador de rutas.
-   **`store/`**: Estado global (Zustand). Aquí vive la persistencia de la sesión.
-   **`routes.tsx`**: Definición centralizada de todas las URL.

### 2. `src/core/`
**Propósito:** El "Cerebro" del negocio. Código TypeScript puro, sin React.
-   **`domain/`**: Entidades e interfaces. (Ej: `Order.ts`, `User.ts`). Si el backend cambia un campo, se actualiza la interfaz aquí.
-   **`application/`**: Casos de uso. La lógica de "qué pasa" cuando se hace una acción.

### 3. `src/infrastructure/`
**Propósito:** Los "Cables". Conectividad con el mundo exterior.
-   **`api/`**: Clientes (Axios) y configuraciones de seguridad.
-   **`repositories/`**: Implementaciones de las llamadas a la API.

### 4. `src/features/` (Enfoque Modular)
**Propósito:** Divisiones por funcionalidad de negocio.
-   `auth/`, `pedidos/`, `repartidores/`.
-   Cada carpeta tiene su propio mini-ecosistema para evitar que un cambio en "pedidos" rompa "auth".

### 5. `src/ui/`
**Propósito:** La "Piel". Todo lo que el usuario ve y toca (React).
-   **`pages/`**: Vistas completas que ocupan toda la pantalla.
-   **`components/`**: Pequeñas piezas reutilizables.
-   **`hooks/`**: Lógica de presentación (animaciones, estados locales de UI).

### 6. `src/shared/`
**Propósito:** Caja de herramientas universal.
-   **`assets/`**: Imágenes, logos y fondos.
-   **`lib/`**: Configuraciones de librerías externas.
-   **`utils/`**: Funciones matemáticas o de formato (fechas, pesos colombianos).

---

## 💡 ¿Por que usamos esto?

1.  **Independencia**: El diseño (`ui`) está separado de la lógica (`core`). Podríamos cambiar Tailwind por otra cosa y la lógica seguiría intacta.
2.  **Mantenibilidad**: Es muy fácil para un nuevo programador saber dónde está cada cosa sin preguntar.
3.  **Cero Ruido**: Hemos eliminado carpetas redundantes y archivos sueltos en la raíz para mantener el `src` limpio.

---

## 🛠️ Comandos de Desarrollo
```bash
npm install     # Instalar dependencias
npm run dev     # Correr servidor local
```
