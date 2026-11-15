# Verificación de HELIOS — 14 de noviembre de 2026

Se probaron ambos repositorios y los endpoints NASA reales a través de Nest con las CA del sistema (`NODE_OPTIONS=--use-system-ca`). No se hicieron commits ni pushes.

## Resultado

| Comprobación | Resultado |
|---|---|
| Frontend: typecheck y build | Correctos |
| Frontend: pruebas unitarias | 46/46 |
| Frontend: lint | Sin errores; advertencia previa useEffect en MySpacePage |
| Backend: build y typecheck | Correctos |
| Backend: suite completa | 58/64; seis diferencias de paridad previas |
| Backend: pruebas NASA tras correcciones | 9/9 |
| Backend: pruebas HTTP Jest | 3/3 |
| Lint de archivos NASA backend | Correcto |
| Navegador: pruebas NASA y recorrido de diez páginas | 4/4 |
| Navegador: persistencia y continuidad local, repetición aislada | 2/2 |

## Consultas reales verificadas

- DONKI FLR, 2024-05-10: 15 eventos.
- DONKI SEP, 2024-05-10 a 2024-05-11: 6 eventos.
- DONKI CME, mismo intervalo: 11 eventos.
- RadLab REM-Lid / ISS, 2023-05-16: 288 mediciones, unidades válidas. Primera consulta final: 2,17 s; consulta en caché: 0,02 s.
- RadLab DosTel1, 2021-01-01: respuesta válida sin mediciones.
- Ejemplo RadLab local: 13 registros, unidades válidas y etiqueta explícita; comprobado también mediante el navegador contra Nest real.
- OSD-575: título y organismo Homo sapiens.
- OSD-288: título y organismo Mus musculus.
- Fecha inexistente, intervalo excesivo e instrumento desconocido: HTTP 400.
- Estudio fuera del catálogo: HTTP 404.

No se encontraron claves API en las respuestas ambientales comprobadas. El entorno no tenía secretos privados reales configurados para compararlos con el bundle; no se afirma una auditoría de seguridad exhaustiva.

## Fallos encontrados y corregidos en esta verificación

1. El ejemplo local tenía `?Gy/h` y `?Sv/h` por un problema de codificación. Se corrigieron a µGy/h y µSv/h, y la prueba HTTP ahora comprueba ambas unidades. Se añadió una prueba de navegador del ejemplo real para evitar la regresión.
2. Una consulta directa RadLab tardó 22,66 s y el timeout anterior de 12 s producía 503. Se amplió únicamente RadLab a 30 s en Nest y 40 s en el navegador. Se conserva la cancelación y el estado de error; DONKI y OSDR mantienen sus límites anteriores.

## Pendientes confirmados

- Seis pruebas backend de paridad textual fallan en analysis, selectors, reduce, inventory, format y crew porque sus copias React/Nest ya difieren. No se reemplazó el motor ni se modificaron las pruebas para ocultarlo.
- El recorrido completo previo de navegador falla al esperar un aviso de equipo en inglés: Nest devuelve el texto en español.
- La prueba previa de accesibilidad del monitor detecta aria-prohibited-attr y color-contrast.
- La primera ejecución concurrente hizo fallar la conexión inicial del test de continuidad local; la repetición sin compilaciones simultáneas pasó junto con persistencia (2/2).
- El lint global del backend conserva los errores previos documentados en NASA-INTEGRATION.md; se comprobó aparte el código NASA modificado.
- El build avisa sobre tamaño del bundle. NASA puede tardar o estar temporalmente inaccesible; un resultado correcto hoy no garantiza disponibilidad futura.

## Reproducción

```powershell
# Frontend
$env:NODE_OPTIONS='--use-system-ca'
npm run typecheck
npm test
npm run lint
npm run build
npx playwright test e2e/nasa.spec.ts e2e/backend.spec.ts --workers=1
# Incluye también los fallos previos descritos:
npx playwright test --workers=1

# Backend, desde su carpeta
npm run build
npx tsc --noEmit --incremental false
npm test -- --runInBand
npm test -- --runInBand src/nasa/nasa.spec.ts
npm run test:e2e -- --runInBand
npx eslint src/nasa/*.ts
```

Archivos ajustados durante esta verificación: backend `src/nasa/radlab-example.ts`, `src/nasa/nasa-http.ts`, `src/nasa/nasa-services.ts`, `src/nasa/nasa.spec.ts`; frontend `src/api/environment.ts`, `e2e/nasa.spec.ts`; documentación en ambos repositorios.
