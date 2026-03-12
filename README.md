![Next.js](https://img.shields.io/badge/Next.js-16.1.6-blueviolet?logo=next.js) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.6-skyblue?logo=tailwindcss) ![TypeScript](https://img.shields.io/badge/TypeScript-5.4.2-3178c6?logo=typescript) ![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-green?logo=leaflet) ![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)

# 🗳️ Votantes Map

Plataforma de campo para gestionar votantes, construir rutas de visita y visualizar el estado en un mapa interactivo.

## ✨ Qué trae esta versión

- Panel lateral con búsqueda, filtros y listado de votantes sincronizado con la capa Leaflet.
- Modal completo para crear/editar votantes (documento, contacto, dirección/conexión de ubicación) con validación y advertencias si hay cambios sin guardar.
- Mapa con control de zoom + interacción, botones de atajo (`L`, `S`, `N`, `M`, `+`, `-`), cambio de tipo de mapa y detección de ubicación.
- Portal de rutas flotante: arrastra para ordenar, agrega desde la selección o autocompleta, guarda rutas con nombre/fecha/hora, mantiene historial en `localStorage` y dibuja la polilínea cuando hay al menos dos puntos.
- Estado completo en `localStorage` (votantes, rutas, vista del mapa) para conservar datos entre recargas.

## 🚀 Cómo correrlo

1. `npm install`
2. `npm run dev`  
   El servidor usa `http://localhost:3000` por defecto (Turbopack ya busca puertos alternos si el 3000 está ocupado).
3. Abre tu navegador y navega a `http://localhost:3000`.
4. Usa el panel, edita votantes en el modal, construye rutas y prueba guardar/cargar desde las rutas guardadas.

## 📦 Estructura clave

- `src/app/page.tsx`: lógica central de UI, paneles, estado local y panel de rutas.
- `src/components/MapView.tsx`: vista del mapa con SquareMarkers, polilíneas de ruta y selección manual.
- `src/lib/voters-store.ts`: modelo de votante + estado simulado (para referencias o futuras llamadas API).
- `public/` y `src/app/**/*`: assets y estilos base (Tailwind + CSS global para scrollbars y modal).

## 📚 Workflows adicionales

- **Localización manual:** actívala con “Seleccionar en mapa” en el modal del votante, luego haz clic en el mapa para fijar coordenadas.
- **Rutas guardadas:** define nombre/fecha/hora, guarda, luego recarga para ver que el panel lista esos recorridos y puedes importarlos.
- **Ocultar panel:** usa el botón `Ocultar` del panel o el pill “Mostrar rutas” para dejar limpia la vista del mapa.

## 🧹 Limpieza

1. `npm run lint` (si tienes reglas definidas).  
2. `npm run test` (si agregas pruebas).  
3. `npm run build` antes de desplegar (asegura que Turbopack transpila sin errores).

## 📦 Despliegue

Usa Vercel o cualquier otro host compatible con Next.js (recuerda habilitar variables si más adelante se agregan APIs reales). La compilación ya incluye el soporte de font optimizado (`next/font`).
