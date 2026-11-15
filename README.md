# HELIOS

**Health Evaluation & Life Indicators Observation System** — simulador de evaluación de salud e indicadores vitales para una tripulación ficticia. No es una herramienta clínica y no produce diagnósticos.

La documentación extendida está en la carpeta hermana [`../mds/README.md`](../mds/README.md) cuando el repo se usa dentro de la carpeta de trabajo `Nasa`. Esa carpeta no forma parte de este repositorio git.

## Qué demuestra

- Etapas de misión: preembarque, a bordo y posmisión (cambiar de etapa no cierra episodios).
- Lista de preparación con estados (propuesto → cargado y verificado).
- Biblioteca seleccionada de riesgos NASA (HRR/HRP, OCHMO, OSDR).
- Monitoreo, alertas, inventario y Quirón Bot (motor local + IA opcional).
- Espacio privado de bienestar con consentimiento antes de compartir.
- Continuidad local si Nest no responde; enlace Tierra simulado por separado.

## Requisitos

Node.js 20 o superior.

## Ejecutar

```bash
npm install
copy .env.example .env
npm run dev
```

La aplicación queda en `http://127.0.0.1:5173`. Las rutas `/api` las atiende el backend Nest en `../NASA_SPACE_APP-BACKEND`, puerto 3000. Sin `AI_API_KEY` el motor local sigue funcionando y la interfaz marca el servicio como no configurado. `npm run dev:api` inicia el backend oficial NestJS en el puerto 3000. Las variables AI_* se configuran únicamente en `../NASA_SPACE_APP-BACKEND/.env`.

## Comandos

| Comando | Uso |
|---|---|
| `npm run dev` | Vite y backend NestJS |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |
| `npm run test:e2e` | Playwright |
| `npm run build` | Typecheck y build de producción |

El escenario inicial es “Cambio y cansancio”, con Elena Torres en 104 lpm y un autorreporte. El reloj arranca en pausa. La misión demo arranca en etapa **a bordo**.

## Estado y continuidad local

`stateVersion` es 3 (incluye `mission` y `prepItems`). NestJS conserva el estado de simulación por sesión. IndexedDB conserva una copia local. El indicador de la barra superior muestra “NestJS conectado” o “Simulador local”. Si la API deja de responder, se continúa localmente. El enlace simulado con Tierra se controla de forma independiente.

Los diez escenarios y las reglas de análisis siguen disponibles sin API. La arquitectura, los contratos y los recursos científicos se documentan en el [README del backend](../NASA_SPACE_APP-BACKEND/README.md).

## Supabase

HELIOS usa **Vite + Nest**, no Next.js. La conexión se hace con `@supabase/supabase-js` y variables `VITE_SUPABASE_*` en el frontend (y `SUPABASE_*` en Nest).

1. Copiá `.env.example` → `.env` en `astrodeepspacenasa` y en `NASA_SPACE_APP-BACKEND`.
2. Completá URL y publishable key. La **contraseña de la base** solo va en el `.env` del backend (`SUPABASE_DB_PASSWORD`), nunca en el navegador.
3. Health check Nest: `GET http://127.0.0.1:3000/api/supabase/health`.

La simulación sigue en Nest/IndexedDB hasta que migremos tablas a Supabase.

## Fuentes NASA (documentales + OSDR)

- HRR Evidence, Medical Operations, OCHMO Technical Briefs, BPS/OSDR data.
- NTRS sobre monitoreo metabólico EVA (FC / BTU/hr); **no hay telemetría EMU/xEMU pública en vivo**.
- Metadatos OSDR vía Nest: `GET /api/nasa/sources` y `GET /api/nasa/osdr/studies/OSD-575` (cortesía: NASA Open Science Data Repository).
- Pantalla **Riesgos NASA** lista riesgos, rangos EVA documentados y el resultado de la consulta OSDR.

## Integraciones ambientales NASA

DONKI en Misión y Alertas; RadLab y Scientific Health Insights en Riesgos NASA. Datos ambientales separados de las alertas médicas. Configurar NASA_API_KEY solo en Nest. [Contratos, verificación real, pruebas, archivos y limitaciones](docs/NASA-INTEGRATION.md).

## Controles de seguridad

Límites por cliente, validación y cuerpos por ruta, errores seguros con requestId, registros técnicos mínimos, integridad HMAC de demostración y fronteras de IA. Vite rechaza credenciales privadas en variables públicas. Ejecutar `npm run security:audit` para revisar el historial local y los artefactos sin imprimir valores. Ver [medidas, evidencias, comandos y limitaciones](docs/SECURITY.md).

## Mi espacio y Quirón Bot

Memoria reciente opcional, consentimiento independiente para el modelo, herramientas de solo lectura en Nest, cancelación y continuidad local. Se conserva el nivel de compartir elegido. Ver [contratos, archivos, pruebas y límites de seguridad](docs/MI-ESPACIO.md).

El [plan maestro implementado](docs/PLAN-IMPLEMENTADO.md) documenta las siete herramientas, tendencias y calidad de evidencia, paridad React/Nest, trazabilidad NASA y demo guiada de siete pasos.

## Gemini y Quiron AI

[Configuracion, evidencia, pruebas y activacion en Render](docs/GEMINI.md). Las claves permanecen exclusivamente en Nest.
