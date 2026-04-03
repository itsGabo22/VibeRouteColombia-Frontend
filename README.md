# 🚀 VibeRoute Colombia — Frontend

Sistema Inteligente de Logística y Optimización de Rutas desarrollado para la monitorización de entregas nacionales en Colombia. Esta interfaz consume servicios de una API centralizada (Backend independiente).

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-444444?style=for-the-badge&logo=react&logoColor=white)

---

## 🏗️ Arquitectura: Feature-Sliced Design (FSD)

El proyecto utiliza **FSD**, una metodología arquitectónica moderna que separa las responsabilidades por capas funcionales, facilitando la escalabilidad y el mantenimiento:

- `app/`: Configuración global, estado de la aplicación (`Zustand`) y ruteo central.
- `pages/`: Vistas de alto nivel compuestas por características y componentes.
- `features/`: Lógica de negocio interactiva (Auth, Gestión de Pedidos).
- `shared/`: Recursos reutilizables desacoplados (`UI components`, `api axios config`, `utils`).

---

## 🔗 Conexión con el Backend

Este frontend está diseñado para conectarse a un **Backend externo**. Asegúrate de configurar la URL correcta en las variables de entorno.

### Configuración de Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto y define la variable:

```bash
VITE_API_URL=https://vibe-route-backend-url.onrender.com/api/v1
```

> [!IMPORTANT]
> Todas las peticiones están pre-configuradas con interceptores de Axios para incluir el Bearer Token automáticamente desde el `useAuthStore`.

---

## 🛠️ Comandos de Desarrollo

1. **Instalación de dependencias:**
   ```bash
   npm install
   ```
2. **Levantar el servidor local (Vite):**
   ```bash
   npm run dev
   ```
3. **Construir para producción (Build):**
   ```bash
   npm run build
   ```

---

## 📄 Notas adicionales
- **Estilo**: Tailwind CSS + Lucide React para iconografía.
- **Estado**: Zustand con persistencia en localStorage para el rol y token del usuario.
- **Despliegue**: Optimizado para Vercel o Docker.
