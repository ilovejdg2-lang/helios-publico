# Implementación del plan maestro HELIOS

Se aplicaron las seis fases de `contexto/plan-astrodeepspace-helios.md` sobre la integración local de `main`, en ambos repositorios. No se hicieron commits, push ni despliegues en esta etapa. Las claves existentes permanecen en archivos `.env` ignorados por Git.

## Dominio y lenguaje

Los 17 archivos que comprueba la suite de paridad mantienen las mismas reglas y texto, con las adaptaciones de rutas de importación que ya hacía la prueba. También se sincroniza `scienceBrief.ts`, dependencia del análisis. No se deshabilitaron ni relajaron las pruebas de paridad.

El frontend conserva sus traducciones y la configuración de URL de API incorporada desde `main`. Nest usa un adaptador `locale.ts` con AsyncLocalStorage: `Accept-Language: en` o `es` selecciona el idioma de cada petición sin compartir una variable global entre usuarios. SimulationClient envía el idioma de la interfaz. Sin cabecera se mantiene español. Las reglas de negocio no dependen de React, Supabase ni de una clave de IA.

Se preservaron el límite de 180 caracteres de asunto, los permisos y el evento `edit-communication-draft` del backend al sincronizar el reductor. Se verificó que el prompt compartido sea UTF-8 y contenga “Quirón”, “simulación” y “español” correctamente. Se corrigieron caracteres de los textos nuevos.

## Evidencia explicable

`vitalTrends` selecciona únicamente frecuencia cardíaca fiable del propietario en los últimos 30 minutos, elimina timestamps duplicados y calcula una regresión lineal descriptiva en lpm/min. Expone el rango basal individual, el valor actual, `deltaHr` respecto al límite **superior** de ese rango, el diferencial respecto al punto medio y los identificadores utilizados. Una sola muestra no produce una pendiente; una serie sin evidencia válida devuelve valores nulos.

`measurementQuality` expone antigüedad, señal 0–100, integridad, control en reposo y los estados `valid`, `stale`, `pending` y `frozen`. Tres muestras iguales del mismo sensor en tiempos distintos producen una bandera `possibleFrozen`: requiere verificación y no demuestra que el sensor esté roto. Las lecturas futuras, sin señal o sin integridad válida no se usan como evidencia actual. Los signos vitales dejan de ser recientes después de 30 minutos; el sueño conserva su ventana independiente de 36 horas. No se convierte una lectura antigua o una serie posiblemente congelada en postura estable.

El análisis se organiza en hallazgos objetivos, calidad y vacíos, contexto operativo y límite de seguridad. Incluye la diferencia basal, la pendiente cuando existe, el sueño y autorreportes disponibles, actividad y estado del enlace. La asociación temporal no se presenta como causalidad. El cierre requiere confirmación y revisión del médico de vuelo.

## Siete herramientas

Las cuatro herramientas existentes siguen disponibles: `getRecentSleep`, `getLatestVitals`, `getMissionContext` y `getSupportOptions`.

| Herramienta añadida | Alcance y consentimiento |
| --- | --- |
| `getVitalTrends` | Solo pulso autorizado del propietario; ventana de 30 minutos y línea base individual. |
| `getMeasurementQuality` | Calidad de la frecuencia cardíaca autorizada; no habilita otros signos vitales. |
| `getActiveHealthAlerts` | Metadatos de avisos de cambio si se autorizó pulso, y de síntomas si se autorizaron síntomas. No incluye razones, notas libres ni información de otros astronautas. |

Las herramientas del proveedor solo se ejecutan en Nest. Conservan argumentos vacíos estrictos Zod, token ligado a sesión y preferencias, expiración de 15 minutos, revocación, hasta 4 llamadas por interacción y 3 rondas. Ninguna modifica registros, comunicaciones o alertas. La interfaz nunca convierte una sugerencia en consentimiento para compartir.

Sin API, el motor local puede explicar esas mismas tendencias, calidad y avisos mediante los selectores compartidos, con el rol y propietario correspondientes y los interruptores activos. Son consultas locales explícitas, no llamadas de un proveedor externo desde el navegador. Las reglas urgentes locales tienen prioridad sobre esas explicaciones.

## NASA

Las tarjetas diferencian:

- `NASA Real Data · DONKI`: registros de eventos de clima espacial.
- `NASA Historical Benchmark · RadLab`: mediciones ambientales históricas con detector/nave y tiempo UTC.
- `NASA Research Metadata · OSDR`: metadatos de investigación, con advertencia sobre modelos animales y extrapolación humana.

Se mantienen las unidades reales de RadLab `µGy/h` y `µSv/h`. No se cambian las etiquetas a `µGy/day`, ni se fabrican valores en nT o km/s cuando el contrato no los incluye. El ejemplo local verificado sigue identificado como ejemplo histórico. Ningún evento ambiental se convierte en diagnóstico individual ni genera alertas médicas por sí mismo.

## Demo de siete pasos

`Start Mission Demo` abre un controlador con Anterior, Siguiente y acceso directo a cada paso. Cada navegación reproduce un escenario determinista para evitar borradores duplicados:

1. Línea base, reloj en pausa y rol médico simulado.
2. Fatiga gradual de Elena, 104 lpm frente a 64–76 basales.
3. Centro de alertas y evidencia del cambio.
4. Análisis y apertura de Quirón con una pregunta sobre el cambio y la calidad. La consulta al proveedor continúa siendo opcional; no se concede automáticamente consentimiento para IA privada.
5. Redacción y cola de una solicitud real dentro del simulador.
6. Enlace interrumpido y mensaje todavía en cola, con monitoreo local disponible.
7. Recuperación, entrega y confirmación de recepción simuladas. Los avisos pasan a seguimiento; el episodio permanece abierto para revisión humana. Terminar el demo no representa un alta médica.

La guía explica que carga escenarios ficticios y reemplaza el estado actual. Funciona con Nest y con el motor local desconectado. El MAC es de demostración: comprueba integridad del paquete, no precisión clínica ni autenticación de una persona real.

## Accesibilidad y verificación

Se añadieron pruebas del recorrido completo, navegación directa sin duplicación y funcionamiento sin API; pruebas de tendencias, series repetidas, antigüedad y consentimiento; pruebas de las siete herramientas y aislamiento ES/EN.

La auditoría automatizada recorre 18 rutas públicas y del panel en claro y oscuro, con reglas WCAG 2 A/AA y 2.1 A/AA. Respeta preferencia de movimiento reducido para medir el estado de lectura y evita confundir un fotograma de transición con el contraste final. Se corrigen nombres accesibles, foco en contenido oculto, grupos de filtros y contraste conservando la estructura visual. Las pruebas automatizadas no certifican cumplimiento completo: sigue siendo necesaria revisión manual con teclado, lector de pantalla, distintos dispositivos y estados abiertos de los diálogos.

Comandos:

```powershell
# Frontend
npm test
npm run build
npm run lint
npx playwright test --workers=1
npm run security:audit

# Backend
npm test -- --runInBand
npm run build
npm run test:e2e -- --runInBand
```

No ejecutar el build de Nest mientras Playwright utiliza el mismo `dist` en modo watch. Las pruebas de IA usan un proveedor controlado; no se ha validado un modelo real ni calidad clínica. El PIN, las sesiones, los datos y el rol siguen siendo de demostración; IndexedDB no proporciona confidencialidad real. Para uso con personas reales son necesarias identidad verificable, autorización de producción, almacenamiento protegido y validación clínica humana.

## Archivos principales

Resultados finales de esta implementación:

| Comprobación | Resultado |
| --- | --- |
| Frontend Vitest | 79/79 |
| Backend Jest completo | 119/119; incluye paridad y consentimiento de las siete herramientas |
| Paridad de dominio | 17/17 archivos; también pasan los 3 contratos compartidos |
| Backend HTTP | 3/3 |
| Playwright funcional | 13/13 |
| Playwright accesibilidad | 2/2 auditorías, 18 rutas en cada tema, sin violaciones reportadas |
| Build y TypeScript de ambos repositorios | Correctos |
| ESLint frontend y archivos backend afectados | Correcto |
| Auditoría de secretos | Sin hallazgos en el alcance del script |

Las auditorías se repitieron después del último ajuste visual; los recorridos funcionales y de accesibilidad se verificaron en ejecuciones separadas. Las pruebas navegan por los enlaces de la SPA para respetar el límite de creación de sesiones, sin desactivarlo ni elevarlo. Se inspeccionó la [captura del paso final](../artifacts/mission-demo-step7.png). El reporte de secretos queda en `artifacts/plan-security-audit.json`, fuera de Git.

El build conserva el aviso de Vite por el tamaño del bundle principal (aproximadamente 1.33 MB sin comprimir). No impide compilar; reducirlo requiere trabajo adicional de división de módulos.

Frontend: `src/domain/{selectors,constants,analysis,reduce,inventory,crew,format,scienceBrief,spaceEngine}.ts`, `src/domain/healthEvidence.test.ts`, `src/api/simulation.ts`, `src/state/store.tsx`, `src/components/{MissionDemo,NasaEnvironment,ScientificInsights,HeliosLogo,Shell}.tsx`, `src/components/quiron/QuironChat.tsx`, componentes públicos y estilos de accesibilidad, `e2e/{mission-demo,accessibility}.spec.ts`.

Backend: los archivos correspondientes de `src/simulation/domain/`, `src/simulation/locale.ts` y su prueba, `src/security/configure-http.ts`, `src/ai/{space-conversation.contract,space-conversation.service,space-tools.service,space-conversation.spec}.ts`, y esta documentación en `docs/`.
