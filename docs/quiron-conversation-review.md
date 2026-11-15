# Quirón: límites de privacidad y continuidad

Revisión local: 15 de noviembre de 2026. Sin commits, pushes ni despliegues.

## Causas corregidas

- El componente del chat público existía, pero no estaba montado en `PublicLayout`. Ahora está conectado y tiene una prueba de navegador del recorrido completo.
- El fallback público confundía cualquier mención de alertas o mediciones con una solicitud de registros privados. Ahora hay explicaciones generales sin acceso a registros; una solicitud personal sigue indicando el límite, pero también explica cómo interpretar un registro.
- El signo inicial `¿` impedía reconocer seguimientos como «¿Y eso por qué?» en el fallback. Las explicaciones de indicadores ahora pueden continuar con un ejemplo.
- El frontend dependía de una comprobación de salud previa para intentar Gemini. Ahora el consentimiento habilita el intento y una comprobación fallida no lo desactiva silenciosamente.
- El dashboard podía acabar usando respuestas del sitio público cuando no había episodio. Puede consultar indicadores locales mediante los selectores deterministas, ligados al rol y a la persona autorizada.
- Los prompts limitaban demasiado los temas públicos. Ahora distinguen explicar conceptos de recuperar datos privados. Una pregunta sobre salud o emociones no justifica rechazar toda la conversación.
- La conexión local de Node con Google fallaba con `UNABLE_TO_VERIFY_LEAF_SIGNATURE`. Se añadió `AI_USE_SYSTEM_CA=true` como opción explícita en el backend y se activó en su `.env` local. Incorpora las autoridades del sistema sin quitar las predeterminadas ni desactivar TLS. En otros entornos permanece desactivada por defecto. Requiere Node con soporte para consultar y configurar las autoridades de confianza.
- En una evaluación real, Mi espacio asumió que la persona estaba en órbita. Se corrigió el prompt y se repitió la evaluación sin esa suposición.
- Gemini negaba permisos que estaban concedidos y omitía herramientas, llegando a inventar opciones de apoyo. Ahora recibe la autorización efectiva del servidor. Para solicitudes concretas, el backend selecciona una herramienta autorizada y exige su consulta antes de aceptar la respuesta; las definiciones y conversaciones emocionales no fuerzan lecturas biométricas.
- Google rechaza las llamadas forzadas a funciones junto con formato JSON estructurado. Se omite ese formato únicamente en el turno de selección de herramienta; la respuesta final conserva su esquema y validación. Se añadieron pruebas de regresión del adaptador.

## Límites conservados

El chat público no recibe contexto privado. El dashboard conserva su consentimiento adicional para enviar indicadores al proveedor. Mi espacio sigue separado, con PIN, consentimiento, siete herramientas de solo lectura y selección humana del nivel de compartir. Las respuestas locales consultan datos ya disponibles dentro del rol, sin enviarlos a Gemini. No se modificó el motor determinista de salud.

Los fallos del proveedor se identifican como fallos del servicio; no como preguntas demasiado sensibles. El consentimiento de mensajes sigue siendo necesario para utilizar Gemini.

## Evidencia de evaluación

- Frontend: 117 pruebas aprobadas; build y lint aprobados.
- Backend: 152 pruebas aprobadas; comprobación TypeScript aprobada. Tras precisar la detección de preguntas sobre calidad de vida, las 28 pruebas de conversación volvieron a pasar.
- Navegador: tres pruebas de Mi espacio aprobadas y una nueva del chat público aprobada. Esta última comprueba consentimiento, historial y envío al modelo pese a un fallo previo de la comprobación de salud.
- Nuevas pruebas: definiciones sin rechazo de privacidad, seguimientos bilingües, soledad, lectura local sin episodio, aislamiento del rol de operaciones, propietario de los datos, consentimiento de historial, referencias inventadas y configuración de certificados.
- Gemini real: conversaciones públicas y de dashboard de cuatro turnos en español e inglés; Mi espacio de tres turnos en ambos idiomas sin permisos biométricos. No hubo rechazos globales ni respuestas exactamente repetidas en las ejecuciones completadas. Esto es una muestra de comportamiento, no una garantía de ausencia de errores en cualquier conversación.
- Hubo un fallo transitorio de red en una primera ejecución pública; al repetirla se completaron ambos idiomas.
- Las siete herramientas se verificaron con Gemini real. La ejecución conjunta completó seis y encontró un límite 429 en la séptima; la comprobación aislada posterior de `getMeasurementQuality` pasó. Se conservaron los controles de autorización y compartir.

Ejemplos reales de Gemini:

- Dashboard, «¿Qué es una alerta y por qué importa la calidad del sensor?»: «Una alerta en HELIOS es una notificación del sistema cuando un indicador simulado sale de los parámetros esperados»; continuó explicando la fiabilidad de la señal.
- Seguimiento, «No entiendo, explícamelo más sencillo»: «Imagina que usas una cámara con niebla para vigilar un pasillo»; desarrolló una analogía en vez de pedir permisos o repetir la respuesta.
- Mi espacio, «¿Qué podemos hacer?» después de hablar de soledad: «Cuando la sensación de soledad pesa, a veces ayuda cambiar de foco por un instante con algo muy sencillo: escuchar una canción que te guste…». No consultó datos biométricos.
- Mi espacio, «No quiero seguir hablando»: «De acuerdo, respetemos tu decisión de detener la conversación aquí».

Antes de corregir la selección de herramientas, una prueba real de `getLatestVitals` devolvió: «I am unable to access your latest simulated heart rate because permissions for vital signs are not currently enabled», pese a que el permiso estaba concedido. Después, la evaluación real confirmó `toolsUsed: ["getLatestVitals"]` y una respuesta estructurada válida con nivel `solo_yo`.

La rigidez de las respuestas locales anteriores se verificó en el código; no se reconstruyó una conversación histórica de Gemini.

## Reproducción

```powershell
npm test
npm run build
npm run lint
npm exec -- playwright test e2e/quiron-dialogue.spec.ts e2e/space-conversation.spec.ts
node scripts/quiron-live-eval.mjs --mode=public
node scripts/quiron-live-eval.mjs --mode=dashboard
node scripts/quiron-live-eval.mjs --mode=space
```

La evaluación real requiere el backend hermano `../NASA_SPACE_APP-BACKEND`, sus dependencias y credenciales Gemini autorizadas. Solo usa escenarios sintéticos en memoria. No imprime claves. Las comprobaciones de repetición y rechazo son heurísticas; las salidas requieren revisión humana para juzgar precisión y tono. Para aplicar el cambio de certificados a un backend que ya está ejecutándose, reiniciarlo.

En el backend: `npm run ai:gemini:check -- --tools` comprueba las herramientas; `--tool=getMeasurementQuality` permite verificar una sola sin repetir las demás. Los límites de cuota del proveedor siguen siendo aplicables.
