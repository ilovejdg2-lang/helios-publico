# Medidas de seguridad de HELIOS

Implementadas y verificadas localmente el 14 de noviembre de 2026. Frontend en main; backend en master. No se hicieron commits, pushes ni un despliegue de estos cambios de seguridad. Las modificaciones NASA previas se conservaron.

## A. Claves y contraseñas

- Nest obtiene AI_API_KEY desde su entorno; no la añade a los mensajes del modelo ni a respuestas HTTP. El proveedor usa el valor solamente en el encabezado de autenticación saliente.
- El frontend activo no lee esa clave. El antiguo servidor Node/Hono conservado en `server/` también es código de servidor, no parte del bundle ni el backend iniciado por `npm run dev`. Los controles descritos aquí se aplican al backend oficial Nest, no a una eventual publicación independiente de ese servidor legado.
- `.gitignore` del backend excluye ahora todas las variantes `.env.*`, mantiene `.env.example` y conserva `/data/` para las sesiones. Frontend ya excluye `.env*` reales; `.vercelignore` también los excluye del envío.
- Vite rechaza variables VITE_ con nombres de claves privadas, contraseñas, secretos, tokens y service role. También rechaza prefijos conocidos de credenciales privadas y JWT Supabase service_role aunque se disfracen de publishable key. La publishable/anon key de Supabase es pública por diseño y puede permanecer en el navegador.
- `scripts/security_audit.py` revisa código local, blobs de las referencias Git disponibles, archivos privados versionados y los artefactos compilados. Compara valores privados configurados con el bundle sin imprimirlos. La salida solo incluye categorías y ubicaciones; el informe está en `docs/security-audit.json`.
- El análisis de las referencias locales disponibles no detectó credenciales expuestas. Es heurístico: no demuestra que nunca haya existido una filtración ni revisa servicios remotos, capturas o referencias Git no descargadas. No se rotaron claves porque no se identificó una filtración. Si aparece una, hay que revocarla en el proveedor, sustituirla y actualizar el backend; borrar el texto del último commit no revoca la credencial.

## B. Límite propio de solicitudes

Se añadió un guard de Nest 11 sin dependencias nuevas; no había un limitador general por cliente. El límite externo de NASA existente no reemplazaba esta protección. Se consideró el mecanismo documentado de guards/throttling de Nest y se utilizó un guard local pequeño para estas tres categorías de demostración.

| Categoría | Valor inicial | Variable |
|---|---:|---|
| POST de IA, compartido entre analyze/chat/space | 20/min por IP observada | AI_RATE_LIMIT_PER_MINUTE |
| Otras escrituras, incluidas Simulation/actions y Monitoring | 240/min por IP | WRITE_RATE_LIMIT_PER_MINUTE |
| Inicialización/importación POST /api/simulation | 20/min por IP | SESSION_RATE_LIMIT_PER_MINUTE |

Cada ventana dura 60 segundos desde la primera solicitud. Los límites configurables aceptan enteros de 1 a 10000; configuraciones inválidas impiden iniciar el guard. Un exceso devuelve 429 y Retry-After antes del controlador/proveedor. Las lecturas, health checks y consultas normales no comparten el presupuesto de escrituras. Las ventanas tienen almacenamiento acotado a 10000 entradas; si se llena, se rechazan nuevas escrituras hasta liberar ventanas, sin expulsar contadores activos para reiniciar cuotas.

Además, IA tiene un presupuesto global por proceso de 60 llamadas/minuto y máximo dos llamadas simultáneas, independiente de la IP. Son límites propios; un 429 del proveedor externo sigue siendo otro caso. Las pruebas comprueban que el proveedor no se invoca al exceder las cuotas locales.

Identidad y límites: Express no confía por defecto en X-Forwarded-For. No se usa X-Simulation-Id como identidad, porque el cliente lo puede cambiar. Detrás de un proxy todos pueden compartir la misma IP; antes de publicar hay que definir explícitamente los proxies de confianza según la topología y exigir que el ingress controle los encabezados de cliente. No habilitar confianza indiscriminada en encabezados suministrados por Internet. Sin login no se identifica a una persona, distintas IP pueden obtener cuotas separadas y los contadores se reinician al reiniciar Nest. Varias instancias requieren un contador compartido o límites en el ingress. El guard no sustituye autenticación, autorización real ni protección de infraestructura.

## C. Validación y tamaño de entradas

`configureHttp` se ejecuta con bodyParser:false y selecciona el parser JSON antes de decodificar el cuerpo:

| Rutas | Límite de transporte |
|---|---:|
| /api/ai y subrutas | 64 KiB |
| POST /api/simulation, incluida importación de estado | 10 MiB, conservado |
| Resto de JSON de la API | 256 KiB |

Se rechazan cuerpos comprimidos en estos parsers (415), evitando descompresión no acotada. Un cuerpo excesivo devuelve 413; JSON malformado devuelve 400. AI conserva también su validación estructural y el máximo de contexto, ahora medido como 32000 bytes UTF-8. Los IDs de tripulación IA deben pertenecer a los cuatro perfiles ficticios y el nombre se toma del catálogo del servidor.

Los contratos actuales de telemetría, rangos, unidades, simulated:true, calidad, fecha y mutaciones con revisión siguen vigentes. Una entrada inválida no modifica la sesión. Se conservó la capacidad de importar estados existentes sin reducir globalmente el límite previo de 10 MB.

## D. Errores y registros

- Un filtro global devuelve únicamente statusCode, un código permitido, un mensaje breve controlado y requestId. No serializa la excepción, stack, issues con datos, rutas de archivos ni errores arbitrarios del proveedor.
- El identificador UUID lo genera el servidor; no se refleja un X-Request-Id arbitrario del solicitante. Se devuelve también en el encabezado X-Request-Id, expuesto por CORS junto a Retry-After.
- El registro técnico contiene fecha, requestId, método, plantilla de ruta, estado y categoría. No guarda cuerpo, consulta URL, nombres, síntomas, conversaciones, encabezados, claves, identificadores de sesión ni IP en texto.
- 429, 403 y 5xx se registran como advertencias categorizadas; una respuesta normal no genera una advertencia. No se configuró envío externo de alertas, correos ni un SIEM.
- El historial y la auditoría funcional de la simulación permanecen en sus contratos existentes. Los registros técnicos nuevos no copian esos datos.

## E. Telemetría

Se mantiene HMAC-SHA256 v2 y la representación canónica existente. Las pruebas comparan la firma con node:crypto y comprueban alteraciones de valor, timestamp e identificadores; registran rechazos sin crear mediciones. Un reenvío duplicado no duplica la medición. Una secuencia anterior se rechaza y las lecturas antiguas quedan marcadas stale, fuera de la evidencia reciente confiable.

DEMO_MAC_KEY es pública deliberadamente y está también en el cliente. Demuestra detección de alteración accidental; no autentica dispositivos frente a alguien que conoce la clave y puede firmar otro paquete. La detección de duplicados/secuencias es por sesión. Sensores reales requieren claves por dispositivo en un almacén protegido, autenticación y protección de replay con estado adecuado; no se presentan como implementados aquí.

## F. IA y prompt injection

Entrada: contextos de episodios/análisis y propuestas de Mi espacio, con datos ficticios, notas y referencias. Salida: JSON de análisis/propuesta validado, con humanReviewRequired:true. AiService no tiene dependencias de escritura, herramientas del modelo ni un despachador de acciones sobre las sesiones.

- Las instrucciones permanecen en el rol system. La tarea es fija y todo el contexto, incluida la pregunta, nombres, documentos y notas, se serializa como untrustedData.
- Separar roles no es la frontera de autorización. Lo decisivo es que la respuesta no se ejecuta: las mutaciones siguen siendo endpoints explícitos sujetos a los contratos y permisos del backend.
- Se conservan el JSON estricto, referencias a IDs presentes y protocolos permitidos. Los IDs inventados y campos de acción adicionales se rechazan. Esto valida referencias, no la veracidad clínica de cada frase libre ni la autenticidad del contexto enviado por el navegador.
- Nombre del perfil tomado del catálogo ficticio; no se incluye la configuración ni las claves en el contexto. Las notas libres siguen siendo responsabilidad del operador: usar exclusivamente ejemplos ficticios; no existe un detector infalible de información personal real.
- Timeout y cancelación existentes conservados. La desconexión de la respuesta también cancela la solicitud al proveedor. Máximo solicitado: 1200 tokens de salida; límite de lectura externo: 64 KiB incluso sin Content-Length; texto del modelo: 16000 bytes antes de parsearlo.
- La prueba adversarial manda una instrucción ficticia para borrar alertas/revelar claves, simula una respuesta con una acción y compara la sesión real antes y después: permanece idéntica. No se afirma que el modelo nunca produzca texto indebido; se demuestra que ese texto no tiene autoridad sobre registros.
- Sin clave, IA devuelve 503 controlado y el simulador local sigue disponible. Las etiquetas de simulación y revisión humana se conservaron; no se generan tratamientos ni diagnósticos automáticos.

## SQL injection: inventario y alcance

La persistencia activa es JSON por sesión en Nest e IndexedDB en el navegador. Supabase está configurado para cliente/health check, pero no hay consultas SQL activas, ORM, llamadas rpc ni sentencias SQL construidas por concatenación en los módulos de datos inspeccionados. NASA y el proveedor IA se consultan por HTTP. Por tanto no se inventó una migración SQL ni se añadió una consulta de ejemplo como si fuera la persistencia actual.

Los IDs de sesión UUID y enums se validan antes de llegar al almacenamiento. Una entrada con sintaxis SQL como ID se rechaza y se comprueba que no cambie la sesión; esto verifica la frontera actual, no reemplaza los parámetros de una futura consulta SQL. Cuando se migre, usar parámetros/ORM seguro, RLS y permisos mínimos. No se comprobó ni alteró el rol SQL de una base externa no conectada.

## Pruebas y comandos

```powershell
# Frontend
npm run typecheck
npm test
npm run lint
npm run build
npm run security:audit -- --output docs/security-audit.json
$env:NODE_OPTIONS='--use-system-ca'
npx playwright test e2e/nasa.spec.ts e2e/backend.spec.ts --workers=1

# Backend, desde su carpeta
npm run build
npx tsc --noEmit --incremental false
npx eslint src/security/*.ts src/ai/ai.service.ts src/ai/ai.controller.ts src/ai/provider.ts src/ai/contract.ts src/ai/ai.service.spec.ts src/main.ts src/app.module.ts
npm test -- --runInBand src/security src/ai src/nasa
npm run test:e2e -- --runInBand
npm test -- --runInBand
```

La prueba de recuperación adelanta el reloj controlado 60001 ms; no afirma haber esperado un minuto real. Las llamadas externas de seguridad usan un proveedor simulado, por lo que no consumen una cuenta IA. Para una demo manual, arrancar Nest con los límites anteriores, enviar 21 POST válidos ficticios desde el mismo cliente y comprobar 429; health debe seguir en 200. Tras 60 segundos la ventana se recupera.

Resultados al cerrar la implementación: frontend 50/50; seguridad backend 19/19; módulos seguridad+IA+NASA 32/32; HTTP Jest 3/3. Compilación, typecheck y lint de archivos backend modificados correctos. Frontend lint sin errores, con la advertencia previa de useEffect en MySpacePage. Suite completa backend: 77 pasan y seis fallan por las diferencias previas entre copias del simulador (analysis, selectors, reduce, inventory, format y crew). No se cambiaron esas reglas ni se desactivaron pruebas. El lint global previo y los problemas previos de idioma/accesibilidad del monitor siguen documentados en VERIFICATION.md.

## Archivos de esta medida

Backend: `.gitignore`, `.env.example`, `src/main.ts`, `src/app.module.ts`, `src/security/*`, `src/ai/ai.controller.ts`, `src/ai/ai.service.ts`, `src/ai/provider.ts`, `src/ai/contract.ts`, adaptación del fixture tipado `src/ai/ai.service.spec.ts`, README y esta documentación.

Frontend: `vite.config.ts`, `scripts/client-env.ts`, `scripts/security_audit.py`, `src/security/client-env.test.ts`, script security:audit en package.json, README y esta documentación/informe. No se añadieron dependencias ni cambios de persistencia.

Referencias: [guards y rate limiting de Nest](https://docs.nestjs.com/security/rate-limiting), [filtros de excepciones](https://docs.nestjs.com/exception-filters). Las limitaciones del prototipo y de las pruebas se indican expresamente; estas medidas no convierten HELIOS en un sistema clínico autenticado de producción.

Regresión final de navegador: 6/6 (persistencia Nest, continuidad local, paneles NASA, error DONKI, ejemplo real RadLab y recorrido de diez páginas). La primera ejecución coincidió con la limpieza/recompilación de dist y perdió temporalmente el backend; se repitió después de terminar las compilaciones, sin cambios de ejecución durante la prueba. No se ocultó ese fallo operativo ni se modificaron los criterios de aceptación.
