# Preparación de producción — 15 noviembre 2026

Cambios locales, sin commits, pushes, despliegues ni migraciones.

## Conexión preparada

Render verificado: https://helios-api-d2ah.onrender.com. Health, fuentes NASA y DONKI respondieron 200 JSON; DONKI devolvió cinco eventos. El health indicó ausencia de `AI_API_KEY`. No se confirmó CORS directo para Vercel.

`vercel.json` ahora dirige `/api/:path*` a Render, conservando `/api`, antes del fallback SPA. Tanto la SPA como el service worker excluyen `/api` del fallback. En Vercel, mantener `VITE_API_BASE_URL` vacío o sin definir para utilizar el proxy en el mismo origen. Esta estrategia no requiere CORS directo del navegador a Render.

Alternativamente, configurar `VITE_API_BASE_URL=https://helios-api-d2ah.onrender.com` en el build y `CORS_ORIGINS=https://helios-nasa.vercel.app` en Render para acceso directo. No mezclar estrategias sin revisar las variables efectivas.

El frontend público auditado todavía no contiene las mejoras recientes y devuelve 404 en sus rutas API. La configuración nueva requiere una publicación autorizada; no se afirma que ya esté activa. No hay herramientas administrativas disponibles para Render/Vercel en esta sesión y no se modificaron variables remotas.

## Continuidad

Las recargas recuperan la sesión con GET; solo un 404 permite inicializarla con POST. Se conserva `Retry-After` de los 429, se muestra la espera y no se reintentan escrituras automáticamente. El indicador Nest/local y los errores son visibles.

Avanzar por la demo conserva el estado, la comunicación y la auditoría. Reiniciar o retroceder reconstruye el escenario. Recuperar el enlace entrega únicamente el mensaje de la demo, sin enviar comunicaciones ajenas. El episodio continúa abierto para revisión humana.

## Pendientes administrativos

- Confirmar un volumen persistente en Render y definir `SIMULATION_DATA_DIR` dentro del montaje. Una ruta por sí sola no garantiza persistencia. No se creó un disco ni se contrató un plan.
- Mantener una instancia mientras sesiones y permisos temporales no sean compartidos. Los permisos en memoria requieren nueva autorización tras reiniciar.
- Mantener `NASA_API_KEY` y las variables `AI_*` solo en Render, sin prefijo `VITE_`. El propietario debe aportar la clave del proveedor de IA.
- Comprobar el health antes de presentar para anticipar arranques en frío; recargar después de recuperar el servicio si se activó el simulador local.
- Los límites por IP siguen activos. Antes de una prueba con muchos jueces, verificar cómo Render identifica al cliente detrás del proxy; no habilitar confianza indiscriminada en `X-Forwarded-For`. Recuperar sesiones con GET reduce inicializaciones, pero no elimina una cuota compartida entre clientes que aparezcan bajo la misma IP.

## Validación tras una publicación futura

Confirmar el commit publicado y probar `/app`, `/app/mision`, `/api/ai/health`, `/api/nasa/sources` y una API inexistente. Una respuesta API nunca debe ser `index.html`. Repetir los siete pasos desde Vercel y verificar la conservación del mismo mensaje e historial durante el blackout. Probar Mi espacio con consentimiento y sin proveedor. Confirmar volumen, variables e instancias en los paneles.

Comandos locales: `npm test`, `npm run build`, `npm run lint`, `npm run test:e2e -- --workers=1`, `npm run security:audit`.

Validación de estos cambios: 83/83 pruebas unitarias y 16/16 pruebas Playwright, incluidas ambas auditorías de accesibilidad, conservación del historial durante el blackout y aviso visible de HTTP 429. Build, TypeScript y lint correctos; auditoría de secretos sin hallazgos en su alcance. No se modificaron reglas de dominio ni código del backend.
