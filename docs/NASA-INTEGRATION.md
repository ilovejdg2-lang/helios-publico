# Integración NASA en HELIOS

Implementación local revisable, sin commits ni pushes. Repositorios inspeccionados: frontend `1404385` (1.0.0), backend `5b7fe27` (0.0.1). Se conservaron el motor, IndexedDB, contratos de simulación, roles y configuración Supabase.

## Comportamiento y contratos

- Misión: Space Weather Monitoring. Alertas: avisos ambientales independientes, sin crear alertas médicas.
- Riesgos NASA: Radiation Analysis con Recharts y Scientific Health Insights con tarjetas OSD-288 / OSD-575.
- Todas las nuevas secciones tienen textos ES/EN, filtros, estados de carga, vacío y error; las observaciones científicas conservan su idioma original.
- `GET /api/nasa/donki/events?type=FLR&startDate=2024-05-10&endDate=2024-05-10`. Tipo opcional SEP/FLR/CME; sin tipo consulta los tres. Fechas inclusivas, diferencia máxima 30 días; por defecto últimos siete días. Retorna `events`, `sources`, `query`. ID, clasificación y descripción provienen del registro; campos ausentes son null. No se deduce exposición personal.
- `GET /api/nasa/radlab/measurements?instrument=REM-Lid&startDate=2023-05-16&endDate=2023-05-16`. Instrumentos permitidos: REM-Lid, DosTel1, DosTel2. Diferencia máxima entre fechas: un día (dos días calendario inclusivos). El final se convierte al inicio del día siguiente, exclusivo. REM-Lid es el instrumento demostrado; no se promete cobertura para DosTel.
- RadLab interpreta el formato real `columns/index/data`; tasas absorbidas en µGy/h y equivalentes en µSv/h se mantienen separadas, con gráficos independientes y null como ausencia, nunca cero. No hay dosis acumulada ni umbrales médicos.
- `GET /api/nasa/radlab/example`: 13 mediciones NASA REM-Lid / ISS, 2023-05-16 00:00–01:00 UTC. Botón explícito de ejemplo local verificado; no se activa silenciosamente. `example: true`, `historical: true`, `simulated: false`. Su `fetchedAt` representa solo la fecha de verificación (2026-11-14, codificada a medianoche), no una consulta nueva. Requiere Nest disponible; sin Nest el simulador sigue local y los paneles informan el error.
- Se conservan `/sources`, `/osdr/studies`, `/osdr/studies/:id`. OSDR ahora lee `[accession].metadata`, incluyendo título, descripción completa, organismo, técnica, factores y misión. Sin enriquecimiento clínico automático ni categorizaciones inferidas. OSD-288: Mus musculus; OSD-575: Homo sapiens / SpaceX Inspiration4. Los factores no representan resultados ni condiciones completas a nivel de muestra.

Procedencia: fuente, URL pública sin clave, fecha de consulta, `cached`, `historical`, `simulated`. Eventos y mediciones se mantienen fuera del estado biométrico y sus mutaciones.

## Protección y configuración

`NASA_API_KEY` se configura exclusivamente en el `.env` de Nest; `.env.example` incluye `DEMO_KEY` para desarrollo. En producción se exige una clave distinta de DEMO_KEY. No hay variables VITE de NASA ni acceso del navegador directamente a NASA.

Timeout externo 12 s (RadLab: 30 s; navegador RadLab: 40 s), límite de lectura 2 MB, caché en memoria 5 minutos / máximo 100 consultas, solicitudes concurrentes idénticas unificadas, máximo 20 consultas externas por minuto por proceso y enfriamiento de 60 s al recibir 429. Sin reintentos automáticos ni sustituciones ficticias. Caché expirada no se sirve silenciosamente. En varias instancias se requeriría un límite compartido; no sustituye protección de infraestructura.

Las fechas se validan estrictamente como YYYY-MM-DD, sin días inexistentes, intervalos invertidos ni fechas futuras. Zod valida entradas y respuestas ambientales en el navegador. Normalizadores del servidor trabajan desde unknown y comprueban las estructuras esperadas. URLs de registros se limitan a HTTPS NASA.

## Verificación real, 14 noviembre 2026

Se consultaron respuestas públicas reales desde este entorno con acceso de red autorizado. Las respuestas originales se guardan como fixtures backend; `verification.json` registra URLs y hashes SHA-256.

- DONKI FLR 2024-05-10; SEP y CME 2024-05-10 a 2024-05-11: respuestas JSON reales.
- El intento `https://api.nasa.gov/DONKI/FLR?...&api_key=DEMO_KEY` devolvió HTTP 404. Se utiliza el servicio oficial CCMC migrado, `https://ccmc.gsfc.nasa.gov/DONKI/WS/get/{type}`, conservando startDate/endDate y la clave solo en servidor. El servicio CCMC responde públicamente; su política de cuotas puede diferir del gateway api.nasa.gov.
- RadLab: la consulta documentada con `instrument=REM`, límites timestamp y `format=json` produjo 13 filas. Consultas iniciales a DosTel1 en 2021-01-01 y 2023-05-16 no devolvieron mediciones; no se inventaron valores.
- OSD-288 y OSD-575: respuestas de `/biodata/api/v2/dataset/{id}/` verificadas.

Referencias oficiales:
- https://ccmc.gsfc.nasa.gov/tools/DONKI/ (migración anunciada en septiembre 2026; datos preliminares para investigación).
- https://ccmc.gsfc.nasa.gov/DONKI/api/
- https://visualization.osdr.nasa.gov/radlab/gui/data-api/
- https://visualization.osdr.nasa.gov/biodata/api/

## Ejecutar y verificar

```powershell
# Backend, desde su carpeta
pnpm install --frozen-lockfile
pnpm start:dev
pnpm build
pnpm exec tsc --noEmit --incremental false
pnpm test -- --runInBand
pnpm test -- --runInBand src/nasa/nasa.spec.ts
pnpm test:e2e -- --runInBand
pnpm exec eslint src/nasa/*.ts

# Frontend, desde su carpeta
npm install
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
npx playwright test --workers=1
```

`npm run dev:api` ahora usa npm para invocar Nest, evitando depender de que pnpm esté disponible en el PATH del proceso hijo. No se añadieron dependencias. Las dependencias Supabase ya declaradas estaban ausentes y se instalaron para poder compilar.

Para verificar en vivo, iniciar Nest y abrir los endpoints de arriba, o usar `Invoke-RestMethod 'http://127.0.0.1:3000/api/nasa/radlab/measurements?instrument=REM-Lid&startDate=2023-05-16&endDate=2023-05-16'`. Revisar sourceUrl, fetchedAt y cached. La existencia de datos en estas fechas no garantiza disponibilidad futura de NASA.

## Archivos

Frontend: `package.json`, `.env.example`, `README.md`, `src/api/nasa.ts`, `src/api/environment.ts`, `src/api/environment.test.ts`, `src/components/NasaEnvironment.tsx`, `src/components/ScientificInsights.tsx`, `src/pages/MissionPage.tsx`, `src/pages/AlertsPage.tsx`, `src/pages/RisksPage.tsx`, `src/index.css`, `e2e/nasa.spec.ts`, `docs/NASA-INTEGRATION.md`, `docs/verification.json`.

Backend: `.env.example`, `README.md`, `src/nasa/nasa.module.ts`, `src/nasa/nasa-http.ts`, `src/nasa/nasa-services.ts`, `src/nasa/radlab-example.ts`, `src/nasa/nasa.spec.ts`, `src/nasa/fixtures/*.json`, `docs/NASA-INTEGRATION.md`, `docs/verification.json`. `.env` local solo recibe DEMO_KEY si no tenía NASA_API_KEY; no se versiona.

## Limitaciones y pendientes

No se valida exposición individual, riesgo clínico o recomendaciones. No se infiere relación causal entre eventos y astronautas. NASA puede revisar los datos. No se descargan datasets completos ni se recuperan todos los metadatos de muestra OSDR. Los campos no suministrados permanecen ausentes. La caché no persiste al reiniciar Nest; el ejemplo real sí forma parte del código.

Los fallos previos del simulador y del lint global se registran en los resultados de validación al pie; no se alteran las reglas ni se debilitan pruebas para ocultarlos.

## Resultados finales de validación

- Frontend: typecheck y build correctos; 46/46 pruebas Vitest pasan. Lint sin errores en código entregado; advertencia preexistente useEffect en MySpacePage. Build advierte sobre tamaño del bundle.
- Backend: build y typecheck correctos; pruebas NASA 9/9 y pruebas e2e Jest 3/3 pasan. Suite completa: 58 pasan y 6 fallan por paridad textual previa en analysis, selectors, reduce, inventory, format y crew; no se modificaron esos archivos. Lint global: 1217 errores previos y una advertencia en la primera ejecución, mayormente formato. Los archivos NASA se comprobaron por separado.
- Playwright con un worker: 5/7 pasan. Pasan persistencia Nest, continuidad local sin API, landing y las dos nuevas pruebas NASA (incluida vista móvil). Fallan dos pruebas previas: aviso de equipo que Nest devuelve en español aunque el test espera inglés, y accesibilidad del monitor (aria-prohibited-attr / color-contrast). No se ocultaron ni desactivaron estas pruebas. La ejecución inicial en paralelo sufrió timeouts; repetir con --workers=1.

## TLS de este entorno y comprobación HTTP final

El Node 22.20 instalado devuelve UNABLE_TO_VERIFY_LEAF_SIGNATURE con su almacén predeterminado; Python puede acceder a NASA. Con las CA del sistema, Node valida correctamente los certificados, sin desactivar TLS:

```powershell
$env:NODE_OPTIONS='--use-system-ca'
npm run dev
# Alternativa desde backend, después de compilar:
node --use-system-ca dist/main.js
```

Usar esta opción únicamente con una versión de Node que la soporte; para otros entornos se puede configurar NODE_EXTRA_CA_CERTS con la CA de confianza correspondiente antes de iniciar Node. No usar NODE_TLS_REJECT_UNAUTHORIZED=0.

Verificación final mediante HTTP local Nest con TLS válido: DONKI FLR devolvió 15 eventos, RadLab REM-Lid devolvió 288 mediciones para el día 2023-05-16 y OSD-575 devolvió título y metadatos reales. `/radlab/example` devolvió las 13 mediciones históricas guardadas. El filtro RadLab utiliza las comparaciones key-value documentadas y elimina en el servidor la fila de medianoche del día siguiente para evitar solapamientos. Una prueba adicional de sintaxis booleana devolvió HTTP 500; no se utiliza.


Updated verification and fixes: [VERIFICATION.md](VERIFICATION.md).
