# 🚛 VibeRoute Colombia: Arquitectura de Roles y Flujo de Operaciones

Este documento define la arquitectura de roles y el flujo de trabajo financiero y operativo para la plataforma de logística **VibeRoute**.

---

## 🎭 Arquitectura de Roles

### 1. 🥇 Administrador (Estrategia y Finanzas)
*Responsabilidad:* Supervisar la rentabilidad total y la salud de la flota.

*   *Funciones Claves:*
    *   *Dashboard de Rentabilidad:* Monitoreo en tiempo real de Ingresos vs. Gastos Operativos.
    *   *Auditoría de Reportes:* Revisión de facturas y manifiestos PDF subidos por Logística.
    *   *Gestión de Ranking:* Identificación de conductores de alto rendimiento para incentivos.
    *   *Mando Nacional:* Visualización de eventos críticos y alertas en vivo de todas las ciudades.
*   *Consejo de Uso:* El Admin debe usar el Dashboard cada 2 horas para detectar desviaciones en la utilidad neta.

---

### 2. 📦 Coordinador de Logística (Operación y Despacho)
*Responsabilidad:* Garantizar que los paquetes salgan a tiempo y que la información sea verídica.

*   *Funciones Clave:*
    *   *Centro de Despacho (Manual & AI):* Asignar lotes de pedidos a los conductores más eficientes disponibles.
    *   *Carga Masiva (Bulk Data):* Importación de bases de datos de clientes para la creación de rutas diarias.
    *   *Gestión Documental:* Digitalización de la operación mediante la subida de PDFs al Admin (Manifiestos de carga).
    *   *Control de Unidades:* Monitoreo del pool de conductores y sus estados (Disponible, En Ruta, Pausa).
*   *Consejo de Uso:* Logística debe asegurar que cada lote tenga un conductor asignado antes de las 8:00 AM para maximizar el uso de la flota.

---

### 3. 🚛 Operativo de Campo / Conductor (Ejecución y Datos)
*Responsabilidad:* Realizar las entregas y alimentar el sistema de datos en tiempo real.

*   *Funciones Clave:*
    *   *Navegación GPS Optimizada:* Seguimiento de la hoja de ruta generada por el algoritmo para ahorrar combustible.
    *   *Confirmación de Entrega (Tratamiento Financiero):* Cada "check" de entrega actualiza el balance de ingresos del Admin.
    *   *Gemini AI Advisor:* Consulta de sugerencias matutinas sobre clima, tráfico y prioridad de clientes.
    *   *Reporte de Novedades:* Registro inmediato de por qué un pedido no pudo entregarse (alimentando la métrica de efectividad).
*   *Consejo de Uso:* El conductor debe usar la navegación asistida para evitar los picos de tráfico en ciudades de alta congestión como Bogotá.

---

## 🔄 Flujo de Datos Vitales (La "Ruta del Dinero")

1.  *ENTRADA:* Logística sube un JSON con pedidos que tienen un valor asignado (price).
2.  *DESPACHO:* Logística asigna un Conductor con un costo fijo por hora (costPerHour).
3.  *EJECUCIÓN:* El Conductor entrega el pedido. El sistema suma el price al *Revenue* global.
4.  *CÁLCULO:* El sistema resta el costo del Conductor al Revenue.
5.  *RESULTADO:* El Admin ve la *Utilidad Neta* actualizada al segundo en su Dashboard.

---

## 🤖 El toque de IA (Google Gemini)

*   *Logística:* La IA sugiere a quién asignar el lote basándose en el historial de velocidad de los conductores.
*   *Admin:* La IA genera reportes semanales analizando por qué bajó la rentabilidad en ciertas zonas.
*   *Conductor:* La IA actúa como un copiloto que predice retrasos y sugiere cambios de ruta dinámicos.

---
VibeRoute Colombia - Elevando la logística nacional con tecnología de punta.
