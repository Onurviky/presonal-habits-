# Life Tracker

Dashboard personal de seguimiento diario. Hábitos, tareas, sueño, microvictorias y diario — todo en un solo lugar, sin backend.

## Instalación

```bash
npm install
npm run dev
```

La app queda disponible en `http://localhost:5173`.

## Stack

- **React 18** + **Vite 5**
- **CSS Modules** para estilos (sin frameworks externos)
- **localStorage** para toda la persistencia (no hay backend ni base de datos)

## Módulos

| Módulo | Descripción |
|--------|-------------|
| Dashboard | Resumen del día: hábitos, sueño, tareas, microvictorias y snippet del diario |
| Hábitos | Seguimiento diario con rachas (streak) y % mensual |
| To-Do | Lista de tareas con prioridades y filtros |
| Sueño | Registro de horas dormidas con gráfico de 14 días |
| Microvictorias | Checklist de 10 logros configurables + extras libres |
| Diario | Editor con autoguardado, contador de palabras y buscador |
| Ajustes | Nombre de usuario, lista de microvictorias, exportar/importar/resetear datos |

## Navegación por fecha

Usá los botones `‹ ›` en la barra lateral para cambiar de día. Todos los módulos responden a la fecha activa seleccionada.

## Datos

Los datos se guardan en `localStorage` del navegador bajo claves con prefijo `lt_`. Desde **Ajustes** podés exportar todo como JSON o importar datos de una sesión anterior.
