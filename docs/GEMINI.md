# Gemini en Quirón AI

Implementación incremental en React/Vite y NestJS; no se añadieron dependencias, no se cambió la base de datos y no se hicieron commits, merges, pushes ni despliegues.

## Configuración privada

Solo en el `.env` del backend o en las variables de Render:

```env
AI_PROVIDER=openai-compatible
AI_API_KEY=YOUR_GEMINI_API_KEY
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
AI_MODEL=gemini-3.5-flash-lite
AI_TIMEOUT_MS=25000
```

También se admite `AI_PROVIDER=gemini`, con el endpoint oficial como valor predeterminado. La configuración solicitada quedó guardada localmente y el propietario ya sustituyó el marcador por una clave real. El respaldo anterior está en `.env.before-gemini`; ambos archivos están ignorados por Git. Se preservaron las demás variables del backend y no se publican sus valores.

Gemini se detecta por el endpoint oficial, incluso usando el nombre `openai-compatible`. OpenAI y Anthropic siguen disponibles sin cambiar React. Para Gemini se exige un modelo explícito y se rechazan marcadores de clave. El health informa configuración, no disponibilidad real del modelo.

## Modelo y verificación real

El modelo local es `gemini-3.5-flash-lite`, verificado con generación real y las siete herramientas. El modelo inicialmente solicitado, `gemini-3.8-flash`, aparece en el [catálogo oficial](https://ai.google.dev/gemini-api/docs/models), pero no respondió dentro de los plazos probados. Antes de activar cualquier modelo en otro entorno, ejecutar desde el backend:

```powershell
npm run ai:gemini:check
npm run ai:gemini:check -- --smoke
# Opcional: verificar individualmente las siete herramientas con datos ficticios
npm run ai:gemini:check -- --tools
```

El primer comando consulta la lista de modelos accesibles sin generación. Solo permite los siguientes pasos si el modelo seleccionado aparece en esa lista. `--smoke` ejecuta una conversación estructurada con una sesión temporal ficticia; `--tools` solicita cada herramienta y exige evidencia de que fue ejecutada. No utiliza sesiones ni conversaciones de personas reales. Los archivos temporales se eliminan y se restaura la ruta de datos original.

Una conversación admite hasta tres rondas del proveedor; verificar las siete herramientas puede utilizar hasta 21 llamadas y hasta 1200 tokens de salida por llamada. Es una operación opcional que consume cuota. El script imprime modelo, validación y herramientas utilizadas, sin claves, respuestas privadas ni firmas. No se ejecuta como parte del arranque o despliegue.

El 15 de noviembre de 2026 se verificó lo siguiente con datos ficticios:

- `gemini-3.8-flash`: listado, pero generación con 503 o timeout de 25 segundos. Peticiones mínimas independientes a la API nativa y a la compatible con OpenAI también agotaron 45 segundos. No se obtuvo una conversación válida con este modelo.
- `gemini-3.5-flash-lite`: petición mínima HTTP 200 en aproximadamente un segundo, conversación estructurada válida y las siete herramientas verificadas individualmente mediante NestJS. Se seleccionó en el `.env` local, conservando la clave y el timeout de 25 segundos.
- Una comprobación anterior con 2.5 Flash devolvió 404 por indisponibilidad para usuarios nuevos.

Los identificadores `models/` se normalizan antes de verificar la lista. Estar listado no garantiza poder generar. El cliente distingue timeout, ruta ausente y fallos del proveedor; conserva el motor local ante errores. Un 404 de otro recurso necesita su URL concreta para diagnosticarse.

## Protocolo y seguridad

Se utiliza la [API oficial compatible con OpenAI](https://ai.google.dev/gemini-api/docs/openai). Los esquemas se derivan de Zod y se envían como structured outputs. La respuesta sigue pasando por Zod y las comprobaciones de referencias de HELIOS; declarar un esquema al proveedor no reemplaza la validación del servidor.

Las rondas conservan la respuesta original del proveedor, incluidos `extra_content.google.thought_signature` en los mensajes y llamadas. Se devuelve el resultado con el identificador correspondiente de la herramienta. Las firmas son metadatos opacos, no instrucciones ni texto para mostrar. Véase el [protocolo oficial de firmas de Google](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/thinking/thought-signatures). Permanecen únicamente en memoria de Nest durante la interacción; no se incluyen en HTTP, IndexedDB, registros o la evidencia visible.

Se conserva el límite de cuatro llamadas a herramientas y tres rondas, 35 segundos por interacción, timeout configurable del proveedor, límites de contexto y consumo existentes. Una firma que exceda el presupuesto no se recorta silenciosamente: la interacción falla de forma controlada y mantiene la alternativa local. La memoria entre turnos conserva únicamente el historial textual autorizado; no crea una memoria central de firmas o contenido emocional.

El esfuerzo de razonamiento de Gemini es `low` por defecto; para Gemini 2.5 Flash es `none`. La prueba real de 3.8 rechazó `minimal` con HTTP 400, por lo que se corrigió este valor. Puede configurarse `AI_REASONING_EFFORT` con valores admitidos, cuya compatibilidad debe verificarse para el modelo elegido. Se mantiene el límite de 1200 tokens de salida; una respuesta truncada o bloqueada se rechaza, no se publica como explicación completa.

HTTP 429, autenticación rechazada, modelo inexistente, petición incompatible, JSON inválido, timeout y cancelación se convierten en errores seguros. No se reenvía el cuerpo de error del proveedor ni se reintenta una llamada con otro modelo de forma silenciosa.

## Herramientas y fuentes

Se conservan `getRecentSleep`, `getLatestVitals`, `getMissionContext`, `getSupportOptions`, `getVitalTrends`, `getMeasurementQuality` y `getActiveHealthAlerts`. Su ejecución sigue exclusivamente en Nest con token de 15 minutos, propietario ligado a sesión, permisos, consentimiento y argumentos vacíos estrictos Zod. Las declaraciones Gemini sin argumentos omiten el esquema vacío; el servidor sigue rechazando argumentos adicionales.

El contexto de misión añade cantidades de comunicaciones en cola, enviadas y recibidas y marcas temporales de cambios de enlace. No incluye asuntos, cuerpos ni conversaciones privadas. Los datos son de simulación; ninguna herramienta escribe, notifica o cambia umbrales.

No se añadieron herramientas NASA nuevas en esta etapa: DONKI, RadLab y OSDR mantienen sus servicios y paneles existentes con trazabilidad. El modelo no recibe sus registros simplemente porque la integración exista. Debe reconocer cuando no los ha consultado; los documentos de contexto no equivalen a eventos actuales, exposición individual o un diagnóstico.

## Conversaciones e interfaz

- Público: conserva respuestas documentales locales y no recibe contexto privado ni invoca al proveedor.
- Dashboard: mantiene el análisis autorizado existente y la alternativa local. Su health muestra “configurado”, evitando afirmar que una conversación real ya fue verificada.
- Mi espacio: preserva consentimiento independiente, historial acotado, cuatro niveles de compartir y prioridad de las reglas urgentes locales. Gemini no puede cambiar el nivel seleccionado.
- Se identifica Gemini cuando la respuesta pertenece a un modelo `gemini-*`. “Evidencia consultada” enumera únicamente herramientas ejecutadas con éxito; no las disponibles ni las denegadas.
- Nueva conversación cancela/revoca la interacción, limpia el chat existente y comienza una ventana de historial vacía; conserva preferencias y solicitudes guardadas. El botón informa que borra ese chat.

Se mantienen el formato seguro de respuestas, diseño, fuentes, cancelación, ES/EN y separación de astronautas. No se han convertido los PIN públicos, IndexedDB o los roles de demostración en autenticación de producción.

## Archivos

Backend: `src/ai/provider.ts`, `ai.service.ts`, `space-conversation.contract.ts`, `space-conversation.service.ts`, `space-tools.service.ts`, `space-conversation.spec.ts`, nuevo `gemini.spec.ts`, `scripts/gemini-check.ts`, `.env.example`, `package.json`, `tsconfig.build.json`. El build limita sus entradas a `src` para conservar `dist/main.js`; el verificador no cambia el punto de entrada de Render.

Frontend: `src/ai/client.ts`, `quironAsk.ts`, nuevo `quironPrivacy.test.ts`, `src/components/quiron/QuironChat.tsx`, `src/pages/MySpacePage.tsx`, `src/persistence/space.ts`, `e2e/space-conversation.spec.ts` y documentación.

## Resultados verificados

| Comprobación | Resultado |
| --- | --- |
| Jest backend completo | 139/139, incluida paridad y normalización de modelos de Google |
| Pruebas de IA | Incluidas en la suite completa; siete herramientas mediante el adaptador Gemini |
| Vitest frontend | 90/90, incluidos errores HTTP, timeout y respuesta local de Quirón |
| HTTP Nest | 3/3 |
| Playwright | 17/17; móvil, nueva conversación, evidencia, privacidad y siete pasos |
| Build, TypeScript y lint | Correctos |
| Arranque `start:prod` | Correcto; conserva `dist/main.js` |
| Health local con clave real | `configured:true`, modelo `gemini-3.5-flash-lite` tras reiniciar NestJS |
| Chat real mediante Vite `/api/ai/chat` | HTTP 201 en unos 2,5 segundos; esquema y referencias validados |
| Auditoría de secretos | Sin hallazgos dentro del alcance del script |
| Google real | Flash Lite: conversación y siete herramientas válidas; 3.8: 503/timeout |

El build conserva el aviso previo de tamaño del bundle principal. Las auditorías automatizadas de accesibilidad en ambos temas pasaron; no equivalen a validación clínica ni certificación manual completa.

## Activación en Render

La clave real ya está configurada localmente. Para Render, el propietario debe añadirla por un canal privado, configurar el modelo que haya verificado con su cuenta y autorizar una nueva publicación del backend. Consultar `/api/ai/health` y realizar una conversación sintética con consentimiento; el health por sí solo no basta. El frontend continúa usando el proxy preparado en Vercel; no necesita una clave ni cambios de proveedor.

No se cambiaron variables remotas ni se desplegó. Antes de publicar, confirmar almacenamiento persistente y una sola instancia mientras los permisos temporales sigan siendo locales al proceso.
