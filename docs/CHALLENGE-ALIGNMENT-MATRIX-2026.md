# Matriz de alineación · Health Monitoring Software (NASA Space Apps 2026)

**Proyecto:** HELIOS (Astro Deep Space)  
**Reto:** [Create Health Monitoring Software for Astronauts on Space Missions](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/)  
**Fecha de auditoría/actualización:** 2026-11-15  
**Alcance:** Frontend `astrodeepspacenasa` + Backend `NASA_SPACE_APP-BACKEND`  
**Aviso:** HELIOS es un **prototipo de demostración**. **No** está aprobado ni certificado por NASA.

## Cómo leer esta matriz

| Columna | Significado |
|--------|-------------|
| Objetivo | Requisito o consideración del reto / brief del equipo |
| Prioridad | **Obligatorio** (núcleo del reto), **Recomendado**, **Opcional** (ideas sugeridas: figura corporal, gamificación) |
| Función HELIOS | Módulo concreto |
| Estado | `implementado y verificado` / `parcial` / `ausente` (post-trabajo de esta entrega) |
| Evidencia | Pantalla / código / prueba |
| Trabajo | Qué se hizo o qué falta |
| Resultado | Estado tras corregir |

---

## Matriz

| Objetivo o consideración del reto | Prioridad | Función HELIOS | Estado | Evidencia | Trabajo necesario | Resultado después de corregir |
|-----------------------------------|-----------|----------------|--------|-----------|-------------------|-------------------------------|
| Recopilar indicadores de salud del astronauta | Obligatorio | Platform indicators + DailyCare + sim monitor | implementado y verificado | `POST/GET /api/platform/missions/:id/indicators`; `MyHealthPage` / `HealthIndicatorsPanel`; test `stores blood pressure…` | Añadir BP, glucosa, RR, mood, SpO₂, temp, sueño como lecturas tipadas | Tripulante puede registrar y persistir indicadores con unidad, origen, calidad y contexto |
| Permitir evaluar el estado (visualizar + comprender) | Obligatorio | Tarjetas de estado + historial + explicaciones | implementado y verificado | `HealthIndicatorsPanel` estados; `HistoryPage` (sim); “Entender este indicador” | Estados visuales + texto; línea base pendiente explícita | Usuario ve valor, unidad, origen, frescura, cambio y siguiente paso |
| Facilitar actuar (orientación / revisión / urgente) | Obligatorio | Quirón, citas, grants, urgent | implementado y verificado | `platformApi.urgent`, grant/revoke en Mi salud; Quirón care | Cablear UI urgente y grants | Flujo urgente + compartir con profesional sin fingir diagnóstico |
| Distinguir simulación vs evidencia NASA vs dato de usuario | Obligatorio | Datos / Evidencia / etiquetas origin | implementado y verificado | `DatosPage`, `EvidencePage`, `origin` en indicadores, `docs/NASA-INTEGRATION.md` | Reforzar etiquetas en indicadores nuevos | Orígenes `manual|sensor|import|simulation` visibles |
| Usar ≥1 recurso NASA del reto (DONKI / OSDR / HRP) | Obligatorio (premios globales) | Proxies NASA + riesgos/peligros | implementado y verificado | `/api/nasa/donki`, `/osdr`, RadLab; `RisksPage` hazards; Evidence | Mantener citas y limitaciones | Integración verificable con links y fecha de consulta |
| Explicaciones sencillas de indicadores | Obligatorio | Catálogo `healthIndicators.ts` | implementado y verificado | Botón “Entender este indicador” | Textos claros + límites + fuentes | Ayuda contextual sin jerga clínica |
| Cinco peligros del vuelo espacial (HRP) | Recomendado / contextual | Sección en Riesgos | implementado y verificado | `spaceHazards.ts` + `RisksPage` | Conectar con Mi salud / prep / Quirón | 5 peligros con límites y fuentes |
| Biblioteca de riesgos / evidencia HRP | Recomendado | `RisksPage` + `shared/risks.ts` | implementado y verificado | Biblioteca previa + hazards | Separar 80% prep como regla HELIOS (no NASA) | Evidencia citada; 80% etiquetado como simulación |
| Registro diario / rutina / wake | Obligatorio (recorrido) | DailyCarePanel + rutina en Mi salud | implementado y verificado | Wake/sleep/symptoms + lista rutina | Recordatorios locales pendientes (no push) | Rutina respeta despertar; vencido ≠ enfermedad |
| Consentimientos / grants por rol | Obligatorio (privacidad) | Grants platform | implementado y verificado | grant/revoke UI + tests acceso | Completar UX create/revoke | Medic no lee sin grant |
| Roles diferenciados (crew/medic/psych/chief) | Recomendado (demo) | Role dashboards | implementado y verificado | `RoleHome`, Shell | — | Conservado |
| Presión arterial sistólica/diastólica | Obligatorio (si se ofrece PA) | Indicator `blood_pressure` | implementado y verificado | Backend valida par; UI dos campos | — | No se guarda un solo número ambiguo |
| Estado de ánimo como autorreporte | Obligatorio (si se ofrece mood) | Indicator `mood` 1–5 | implementado y verificado | Escala + regla demo ≤2 | No diagnosticar | Etiquetado autorreporte |
| Visualización histórica comprensible | Obligatorio | Sparklines por indicador + History sim | parcial → mejorado | Sparks en tarjetas; HistoryPage pulse/sleep | Series multi-indicador en History sim aún parcial | Periodo 24h/7d/30d en Mi salud |
| Figura humana interactiva | Opcional (sugerida) | `BodyMap` SVG | implementado y verificado | `BodyMap.tsx` en Mi salud | Alternativa lista + a11y | Sin pintar órganos “enfermos” |
| Gamificación responsable | Opcional | Contador local opt-out | implementado y verificado | Solo cuenta registros; desactivable | No rankings de salud | Cumple restricciones éticas |
| Entornos de misión (nave/estación/rover/base) | Recomendado | `mission.environment` | implementado y verificado | Wizard + tipo backend + Mi salud | No umbrales médicos por entorno | Contexto en UI/reportes |
| Recursos CSA | Recomendado | Citado en hazards closed env | parcial | Link CSA en `spaceHazards` | Ampliar si se usa material con permiso | Procedencia registrada |
| Offline / pérdida de conexión | Recomendado | Cola local + flush online | implementado y verificado | `offlineQueue.ts`, `OfflineSyncBar`, encolado de indicadores/síntomas/wake | — | Acciones locales encoladas; sync al volver online |
| Historial multi-indicador platform | Obligatorio | PlatformIndicatorCharts | implementado y verificado | `HistoryPage` + `Mi salud`; un eje por unidad | — | FC/PA/SpO₂/etc. graficables sin mezclar unidades |
| Recordatorios / notificaciones | Recomendado | MissionRemindersPanel + Notification API | implementado y verificado | Completar / posponer / omitir + permiso navegador | No es push servidor FCM (PWA local) | Recordatorios vencidos = pendientes |
| Recursos CSA | Recomendado | `csaResources.ts` + Datos + hazards | implementado y verificado | Radiation CSA page + Sciences portal citados con pantallas | Sin copiar imágenes | Integración educativa con limitaciones |
| Reglas de cambio (demo, no clínicas) | Obligatorio (transparencia) | `HELIOS-DEMO-REVIEW-v1` | implementado y verificado | `demoReviewProtocol.ts` + IDs en tarjetas | Intencional: no se inventan umbrales clínicos NASA | Protocolo versionado explícito en UI |
| Diseño / responsive / Quirón | Obligatorio (calidad) | role-dash + public | implementado y verificado | CSS health responsive | Revisar móvil Mi salud | Conserva identidad |
| Escenarios A–F demostrables | Obligatorio (entrega) | Docs + flujos UI | implementado y verificado | `DEMO-SCENARIOS-CHALLENGE-2026.md` | Ejecutar en navegador en demo | Guion jueces listo |

---

## Objetivos centrales vs opcionales

**Centrales (el software debe demostrar):** recopilar indicadores → visualizar → explicar → detectar cambios con reglas explícitas → orientar acción → pedir apoyo profesional, con evidencia NASA citada y datos etiquetados.

**Opcionales / sugeridos:** figura corporal interactiva, gamificación. HELIOS los incluye de forma **no clínica** y desactivable (gamificación).

---

## Recursos y APIs NASA (verificables)

| Recurso | URL / endpoint | Aporta | Pantalla | Limitación |
|---------|----------------|--------|----------|------------|
| DONKI | Backend `GET /api/nasa/donki/events` → CCMC DONKI | Clima espacial / SEP-flare contexto | Misión / Alertas / RadiationPanel | No es dosis personal |
| RadLab | `GET /api/nasa/radlab/measurements` | Mediciones radiación ejemplo | NasaEnvironment | Histórico / demo, no telemetría tripulante |
| OSDR | `GET /api/nasa/osdr/studies` | Estudios biología espacial | ScientificInsights / Evidencia | Metadatos de estudio, no signos vitales en vivo |
| HRP Hazards | https://www.nasa.gov/hrp/hazards/ | Marco 5 peligros | Riesgos | Educativo |
| HRP Risks | https://www.nasa.gov/hrp/risks/ | Riesgos investigación | Riesgos / catálogo | No conclusiones clínicas definitivas |
| Human Research Roadmap Evidence | https://humanresearchroadmap.nasa.gov/Evidence/ | Evidencia asociada a riesgos | Biblioteca riesgos | Selección curada |
| CSA Sciences | https://www.asc-csa.gc.ca/eng/sciences/ | Contexto partner | Hazards closed env | Solo enlace; revisar permisos de media |

**Ejemplo de respuesta (sin secretos):** ver `docs/NASA-INTEGRATION.md` y proxies en `NASA_SPACE_APP-BACKEND/src/nasa/nasa.module.ts`.

---

## Funciones que ya existían y fueron verificadas

- Misiones, prep 80% (regla **HELIOS**, no NASA), roles demo, Quirón, wake/sleep/symptoms, inventario, monitor sim, historial pulse/sleep, sitio público, animaciones, CORS Render/Vercel.
- Integraciones DONKI / RadLab / OSDR.
- Grants backend + privacidad conversaciones emocionales.

## Funciones añadidas o corregidas en esta entrega

- API y store `healthIndicators` (BP dual, glucosa, mood, etc.).
- UI Mi salud: registro, tarjetas, explicaciones, rutina, urgent, grants create/revoke, body map, progreso opt-out.
- `mission.environment` en backend + wizard.
- Sección **5 peligros** en Riesgos.
- Documentación de matriz, escenarios y walkthrough jueces.
- Test backend PA/mood/grants vitals.

## Limitaciones y pendientes

- No hay sensores físicos reales ni validación clínica.
- Reglas de “cambio observado” son **demostración** explícita.
- HistoryPage de simulación aún no grafica todos los indicadores platform.
- Offline sync de cola de citas/grants puede mejorarse.
- Push notifications no implementadas (recordatorios in-app solamente).
- Materiales CSA: solo citas/enlaces; no se reutilizan assets sin permiso.

## Declaración de cumplimiento

El prototipo **responde de forma demostrable** al desafío: recopila indicadores, ayuda a entenderlos y facilita acciones fundamentadas, conservando lo construido. **No** afirma certificación NASA ni diagnósticos.
