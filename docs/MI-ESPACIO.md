# Mi espacio: memoria, Quirón Bot y herramientas

Implementación local del 14 de noviembre de 2026. React/Vite consume NestJS; no se añadió lógica de IA al servidor Hono heredado ni dependencias nuevas. No se hizo commit, push ni despliegue.

Actualización: el [plan maestro implementado](PLAN-IMPLEMENTADO.md) amplía las herramientas a siete, incorpora tendencias y calidad, y resuelve los fallos de paridad mencionados en los resultados históricos de este documento.

## Conversación y consentimiento

Quirón recibe el mensaje actual por separado y, con permiso independiente, hasta 12 mensajes recientes con sus roles `user` y `assistant`. Se excluye el mensaje actual duplicado. Cada mensaje tiene un máximo de 2000 caracteres; el frontend limita el historial serializado a 12000 bytes UTF-8 y el servidor a 16000. El sobre completo enviado al proveedor admite hasta 32000 bytes, incluidos instrucciones y resultados de herramientas.

El consentimiento para el modelo y para incluir historial comienza desactivado. Cambiar preferencias inicia una nueva ventana de conversación para el modelo y cancela la respuesta en curso. No se envían automáticamente conversaciones cargadas de visitas anteriores. El historial sigue en el almacén IndexedDB existente, separado por astronauta; no se añadió una base de datos de recuerdos emocionales. Se conservan los últimos 200 mensajes y 100 solicitudes. Las escrituras por persona se serializan.

El prompt admite ES/EN, escucha activa, referencias al contexto reciente y preguntas opcionales. Respeta la negativa a seguir hablando y permite conversar sin datos biométricos. No debe diagnosticar, recetar, inventar mediciones, atribuir a NASA el uso de HELIOS ni afirmar que ha notificado a alguien. El motor local ofrece respuestas contextuales limitadas cuando no hay proveedor, clave o API; no es un modelo generativo.

La página muestra el estado de respuesta, permite cancelarla, distingue `model` de `local_engine` e indica las herramientas consultadas. Una sola solicitud está activa por página. La respuesta local ocupa una única burbuja que se actualiza si llega un resultado válido del modelo. Identidad de propietario, versión y AbortController descartan resultados tardíos.

## Contrato de NestJS

1. `POST /api/space/access`, con `X-Simulation-Id`, recibe `{ crewId, pin, modelConsent: true, historyConsent, dataUse: { sleep, pulse, symptoms, mission } }`.
2. Nest valida la sesión, el rol astronauta, el propietario y el PIN público de demostración. Devuelve `{ token, expiresAt, simulated: true }`. El permiso dura 15 minutos, está ligado a la sesión y a las preferencias y sustituye al permiso anterior de esa sesión.
3. `POST /api/ai/space` requiere `X-Simulation-Id` y `X-Space-Token`, además de `crewId`, `textoPersona`, `locale`, `selectedLevel` e `history`. Los campos biométricos del cliente no son una fuente de autoridad: Nest selecciona sus propios datos.
4. `DELETE /api/space/access`, con ambos encabezados, revoca el permiso. La interfaz intenta revocarlo al cambiar preferencias o salir. El token queda solo en memoria de la página; Nest conserva únicamente su hash y metadatos de permiso, sin PIN ni conversación.

La autorización se vuelve a comprobar en cada ronda, cada herramienta y después de esperar al proveedor. Un historial sin consentimiento o un propietario distinto se rechaza. El endpoint antiguo de Mi espacio sin permiso devuelve 401; es un cambio intencional de seguridad. Las rutas de análisis y chat existentes se conservan.

## Herramientas de solo lectura

| Herramienta | Autorización y resultado |
| --- | --- |
| `getRecentSleep` | Preferencia sueño; última medición fiable de horas de sueño del propietario, o `null`. |
| `getLatestVitals` | Preferencia pulso; únicamente frecuencia cardíaca fiable del propietario. No habilita otros signos vitales. |
| `getMissionContext` | Permiso específico de misión; nombre, etapa, destino y enlace simulado. |
| `getSupportOptions` | Opciones de apoyo humano; siempre indica `notified: false`. |
| `getVitalTrends` | Pulso autorizado; tendencia descriptiva de 30 minutos y línea base del propietario. |
| `getMeasurementQuality` | Pulso autorizado; frescura, señal, integridad, posible congelamiento y reposo. |
| `getActiveHealthAlerts` | Solo metadatos de cambios/síntomas autorizados del propietario, sin razones ni notas privadas. |

Todas usan SimulationService y selectores existentes. Sus argumentos son objetos vacíos estrictos validados con Zod: el modelo no puede elegir otro astronauta. Los síntomas autorizados se reducen a las cuatro últimas categorías del propietario, sin notas libres. Al desactivar síntomas no se incluyen en el contexto. Las mediciones inexistentes o no fiables no se presentan como estabilidad.

No hay herramientas para modificar misión, alertas, comunicaciones o registros. OpenAI compatible y Anthropic tienen protocolos nativos de llamadas y resultados con sus identificadores. Un proveedor personalizado que solo implemente `complete` conserva respuesta textual con historial, sin ejecutar herramientas.

## Límites y fallos

- Hasta 3 rondas del proveedor y 4 llamadas a herramientas por interacción; se rechazan identificadores de llamada repetidos y herramientas no autorizadas.
- Plazo total de 35 segundos en Nest, timeout del proveedor de 25 segundos por defecto (configurable con `AI_TIMEOUT_MS`), espera del cliente de 40 segundos y autorización inicial de 10 segundos. Incluso un proveedor personalizado que ignore la señal no bloquea indefinidamente la solicitud.
- Máximo de salida del proveedor: 1200 tokens. Los sobres y respuestas se validan; una salida inválida mantiene la respuesta local.
- Se mantienen los límites de consumo existentes: 60 llamadas al proveedor por minuto y 2 simultáneas por proceso; cada ronda consume presupuesto. El guard de IA limita solicitudes por IP a 20 por minuto.
- Sin `AI_API_KEY`, Nest devuelve 503 controlado y la conversación local continúa. Las claves solo se configuran en el backend.

## Privacidad y excepciones de seguridad

Los niveles `solo_yo`, `generica`, `medico` y `equipo` siguen disponibles. Una sugerencia local o del modelo nunca cambia la selección del usuario. La vista previa se genera localmente con su texto y nivel; compartir requiere el botón explícito. El permiso para usar un proveedor externo es distinto del permiso para compartir con el equipo.

Se conservan las reglas locales de escalamiento: expresiones explícitas de urgencia y umbrales extremos de pulso de demostración, si el uso de pulso está habilitado. Se ampliaron expresiones en inglés y se añadió un botón explícito para pedir apoyo humano sin depender del modelo ni de palabras clave. Estas rutas pueden crear la alerta **simulada** existente aunque el nivel seleccionado siga en `solo_yo`; constituyen la excepción de seguridad ya prevista y no envían la conversación completa. No hay notificación real a servicios externos. El modelo no puede suprimir la respuesta urgente local.

Las reglas son heurísticas de un prototipo, no detección clínica validada ni triaje. El PIN y los roles son públicos y seleccionables; `X-Simulation-Id` no autentica a una persona. Los controles del servidor limitan el alcance dentro de la simulación, pero no convierten estos mecanismos en autenticación real. IndexedDB y los archivos de simulación permanecen en texto claro.

Cancelar evita aplicar respuestas y solicita abortar la llamada, pero no retira datos ya transmitidos al proveedor. Revocar desde el navegador es un intento con timeout; si falla la red, el permiso expira a los 15 minutos. La retención del proveedor depende de su configuración. Antes de usar datos reales hacen falta identidad y sesiones verificadas, acceso por usuario, almacenamiento seguro, revisión de retención y validación humana de contenido y escalamiento.

## Archivos de esta mejora

Frontend:

- `shared/spaceSchema.ts`: historial, idioma y nivel elegido.
- `src/ai/spaceMemory.ts` y `.test.ts`: selección acotada de memoria y pruebas de consentimiento, contexto, niveles y urgencias.
- `src/ai/client.ts`: permisos, revocación, cancelación y resultado con trazabilidad.
- `src/ai/spaceContext.ts`: datos ausentes explícitos.
- `src/domain/spaceEngine.ts`: continuidad local contextual y prioridad de seguridad.
- `src/pages/MySpacePage.tsx`: consentimiento, memoria, estado, cancelación, aislamiento y apoyo humano.
- `src/persistence/space.ts`: últimas entradas y escrituras ordenadas por persona.
- `e2e/space-conversation.spec.ts`: recorrido en navegador.
- `README.md` y este documento.

Backend:

- `src/ai/space-conversation.contract.ts`: esquemas y contrato del proveedor.
- `src/ai/space-tools.service.ts`: permisos y herramientas autorizadas.
- `src/ai/space-access.controller.ts`: emisión y revocación.
- `src/ai/space-conversation.service.ts`: memoria, rondas y validación.
- `src/ai/ai.controller.ts`, `ai.module.ts`, `ai.service.ts`: integración con el backend existente y presupuesto compartido.
- `src/ai/contract.ts`, `provider.ts`: instrucciones y protocolos de herramientas.
- `src/ai/space-conversation.spec.ts`, `provider-conversation.spec.ts`, `space-access.spec.ts`: pruebas de servicio, proveedor y HTTP.
- `src/security/security.spec.ts`: pruebas existentes adaptadas al permiso obligatorio.
- `README.md` y copia de este documento en `docs/`.

## Verificación

Las pruebas del proveedor usan dobles controlados de red y modelo. No se verificó una conversación con un proveedor real ni su calidad clínica.

| Comprobación | Resultado |
| --- | --- |
| Frontend Vitest | 59/59 |
| Frontend typecheck, build y lint | Correctos |
| Backend IA y seguridad enfocadas | 44/44 |
| Backend build, TypeScript y ESLint de archivos afectados | Correctos |
| Backend HTTP Jest | 3/3 |
| Playwright: Mi espacio, Nest y NASA | 8/8 |
| Suite completa backend | 108 correctas, 6 fallidas preexistentes de paridad textual |
| Auditoría local de secretos | Sin hallazgos en el alcance del script; no es una certificación exhaustiva |

Las seis pruebas de paridad pendientes comparan copias de `analysis`, `selectors`, `reduce`, `inventory`, `format` y `crew`; no se ocultaron ni deshabilitaron. La suite general de navegador también tiene incidencias previas de idioma y accesibilidad, fuera de esta mejora.

Comandos reproducibles desde cada repositorio:

```powershell
# Frontend
npm test
npm run build
npm run lint
npx playwright test e2e/space-conversation.spec.ts e2e/backend.spec.ts e2e/nasa.spec.ts --workers=1

# Backend
npm test -- --runInBand src/ai src/security/security.spec.ts
npm run test:e2e -- --runInBand
npm run build
npx tsc --noEmit --incremental false
npx eslint src/ai/*.ts src/security/security.spec.ts
```

No ejecutar el build de Nest mientras Playwright usa su servidor en modo watch: ambos escriben en `dist`. Para abrir localmente: `npm run dev` desde el frontend, visitar `http://127.0.0.1:5173/app/tripulacion`, seleccionar astronauta, abrir Mi espacio e introducir el PIN público de demostración. Elena: 1001; Mateo: 1002; Sofía: 1003; Alex: 1004.
