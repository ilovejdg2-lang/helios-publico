# Auditoría HELIOS — 15 nov 2026

Alcance realmente comprobado (no “100 % funcional”). **Quirón IA / modelo no se probó** (pedido explícito del usuario).

Entorno: Vite `http://127.0.0.1:5176` + Nest `http://127.0.0.1:3000`. Datos: perfiles demo + misiones `AUDIT-*` / `H-*`. Emulación móvil vía CDP (no dispositivo físico).

---

## 1. Por rol

### Jefe (Elena Torres)

| Acción | Resultado | Corrección |
|---|---|---|
| Entrar demo → hub → tablero | OK | — |
| Ver Centro + Mi salud en nav | OK (añadido antes / verificado) | — |
| Guardar día / síntomas (Mi salud) | UI operativa | — |
| Agregar personas (antes) | **FALLO**: solo `sessionStorage`, sin backend | Reescrito: código real + aceptar/rechazar `pending` vía `join-decide` |
| Contador 5/4 integrantes | **Inconsistencia seed** | `plannedCrewCount` demo → 5 |
| `document.title` | Quedaba en “Misiones” | Título en Centro / Mi salud |

### Tripulante / médico (API + UI parcial)

| Acción | Resultado | Corrección |
|---|---|---|
| Join por código → pending + `membershipId` | Antes sin id | Backend ahora devuelve `membershipId` |
| Accept join | OK tras fix | — |
| Wake + síntoma propios | OK | — |
| Médico lee síntomas sin grant (`subjectId`) | 403 OK | — |
| Con grant → 1 ítem; tras revoke → 403 | OK | Cliente: `listSymptoms`/`listSleep` con `subjectId` |
| Start con prep 0% | Bloqueado (80% + críticos) OK | — |
| Cross-mission wake | 403 OK | — |

Prueba de regresión: `platform.spec.ts` — 7/7 PASS (incluye grants).

### Psicólogo

No se recorrió UI completa en esta sesión. Backend: conversación emocional `private: true` cubierta por test existente. Pendiente: recorrido browser completo de PsychHome + citas.

---

## 2. NASA — integración REAL verificada

| Campo | Valor |
|---|---|
| API | NASA OSDR BioData v2 |
| Docs | https://visualization.osdr.nasa.gov/biodata/api/ |
| Endpoint Nest | `GET /api/nasa/osdr/studies/OSD-575` |
| Upstream | `https://visualization.osdr.nasa.gov/biodata/api/v2/dataset/OSD-575/` |
| HTTP | **200** · `2026-11-15T08:57:01.814Z` (primera) · luego `cached=true` |
| Fragmento | `title=SpaceX Inspiration4 Blood Serum Metabolic Panel…` · `studyId=OSD-575` · `simulated` no inventado |
| Servicio | `NASA_SPACE_APP-BACKEND/src/nasa/nasa.module.ts` |
| UI | Riesgos NASA → `ScientificInsights` (browser: OSD-288/575 con `Consultado en NASA · 2026-11-15T09:20:44Z`) + RadLab REM-Lid |

También verificado:

| API | Endpoint Nest | Upstream | HTTP | Notas |
|---|---|---|---|---|
| DONKI (CCMC) | `/api/nasa/donki/events?type=FLR&startDate=2024-05-10&endDate=2024-05-10` | `https://ccmc.gsfc.nasa.gov/DONKI/WS/get/FLR?...` | 200 | 15 eventos · `simulated: false` |

**Distinción:** OSDR/DONKI/RadLab = API real (proxy Nest + caché marcada). Catálogo `NASA_SOURCES` = documental. Simulador biométrico = ficticio. No se presenta OSDR como diagnóstico ni DONKI como dosis personal.

---

## 3. Responsive

| Página / vista | Tamaño | Hallazgo | Estado |
|---|---|---|---|
| Home público | ~desktop/emulado | Hero + EN/ES OK | Revisado en browser |
| `/entrar` | carga perfiles | Botones disabled mientras carga | OK |
| Centro jefe | 390×844, 320×568 (CDP) | FAB Quirón tapaba cascos | Padding content móvil ↑; FAB dashboard un poco más alto |
| Mi salud | móvil | Formulario usable | OK |
| Sitio completo 768–1920 | — | **Pendiente** barrido exhaustivo | Limitación de tiempo |

Emulación CDP, no hardware físico.

---

## 4. Validación técnica

Comandos:

- `npm run dev` (web 5176 + api 3000)
- Live: OSDR, DONKI, platform join/grant/start-check
- `pnpm test -- --runInBand src/platform/platform.spec.ts` → **7 passed**

Archivos tocados (auditoría):

- `ChiefHome.tsx`, `platform/api.ts`, `platform.service.ts`, `platform.spec.ts`, `seed.ts`
- `MyHealthPage.tsx`, `DailyCarePanel.tsx`, `index.css`, `quiron.css`
- (sesión previa) Quirón topics, banner NestJS, nav Mi salud jefe

### Pendiente / bloqueos

1. Recorrido UI completo médico/psicólogo/checklist 80%/citas en browser.
2. Responsive 768–1920 y sitio público página a página.
3. Quirón modelo (excluido a pedido).
4. Export historial JSON/CSV apertura de archivos.
5. Demo seed reinicia `plannedCrewCount` solo en DB nueva; sesiones JSON viejas pueden seguir en 4.

### Datos de prueba

Prefijo `AUDIT-` / códigos `H-*`. No se borró almacenamiento real externo; store platform en memoria/data local de Nest.
