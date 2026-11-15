# Integración local de roles

15 de noviembre de 2026.

## Ramas y prioridad

- Frontend: rama local `feature/roles`, siguiendo `origin/feature/roles`, commit `9c9c1ce`.
- Backend: rama local `Feature/roles`, siguiendo `origin/Feature/roles`, commit `5d29d9f`. El remoto del backend usa `Feature` con mayúscula.
- Las ramas originales `main` y `master` se conservaron. No se crearon commits ni se hicieron pushes o despliegues.
- Los cambios locales de Quirón se recuperaron encima como modificaciones sin commit. En backend también se recuperó la implementación de diálogo que pertenecía al commit local `9b4dc78`, ausente de la rama de roles.

## Respaldo

Se guardaron y verificaron copias antes de modificar el árbol de trabajo:

- `artifacts/roles-integration/20261115-072656/frontend.zip`
- `artifacts/roles-integration/20261115-072656/backend.zip`
- `artifacts/roles-integration/20261115-072656/integration.json`

Las copias contienen los archivos locales, bases de comparación, parches y configuración local. Se mantuvieron en una carpeta ignorada por Git.

## Conflictos

El conflicto directo estuvo en `src/components/quiron/QuironChat.tsx`. Se priorizaron las conversaciones física/emocional y las llamadas a la plataforma de roles. Después se integraron las declaraciones de consentimiento, historial y cancelación compatibles con esos flujos.

El contexto del chat incluye ahora la misión de plataforma, el perfil y el rol. Al cambiar de rol se limpia el hilo y se descartan respuestas tardías. Esto conserva el cambio de rol sin trasladar una conversación privada al nuevo perfil.

Se verificó que los archivos remotos de `src/platform`, pantallas de roles y plataforma, componentes de roles, enrutamiento y Shell del frontend no difieren de la rama remota. En backend se conservaron intactos plataforma, simulación, `main.ts` y `app.module.ts` de roles.

## Validación

- Frontend: 117 pruebas unitarias aprobadas; build y TypeScript aprobados.
- Backend: 159 pruebas aprobadas en 17 suites; TypeScript aprobado. Incluye las siete pruebas de plataforma, privacidad, permisos y solicitudes de incorporación.
- Navegador con API real: cinco pruebas aprobadas. Entrada de jefe, tripulante, médico y psicólogo; cambio entre roles conservando la misión y sin trasladar el hilo privado de bienestar.
- La prueba de navegador del chat público también pasó después de la integración.
- `git diff --check`, aceptando los finales de línea CRLF, sin errores.

El lint general no queda limpio: la rama remota ya contiene errores en `CarouselStrip.tsx` (`no-noninteractive-tabindex`) y `PrepAiPanel.tsx` (`label-has-associated-control`), además de una advertencia de dependencias en `MissionsHubPage.tsx`. Se conservaron esos archivos para respetar la prioridad de roles. No se ejecutó toda la batería E2E heredada: varias pruebas anteriores asumen acceso directo a `/app`, mientras roles exige perfil y misión mediante `MissionGate`.

Estas comprobaciones acreditan los recorridos descritos; no constituyen una garantía de funcionamiento del 100% de todos los casos posibles.

## Repetir las comprobaciones de roles

```powershell
npm exec -- playwright test e2e/roles-integration.spec.ts e2e/quiron-dialogue.spec.ts
```

Para trabajar con la integración, ejecutar `npm run dev` en el frontend. Si había servidores iniciados antes del cambio de rama, reiniciarlos para cargar ambos proyectos actualizados.
