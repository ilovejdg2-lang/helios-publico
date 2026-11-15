> Registro historico. Ver la configuracion actual y los pendientes en [RELEASE.md](RELEASE.md). No se ha publicado el nuevo proxy.

# Despliegue Vercel

Publicado el 14 de noviembre de 2026 (Costa Rica).

- Producción: https://helios-nasa.vercel.app
- Proyecto: helios-nasa
- Cuenta/equipo: elianfajardogutierrez-9645s-projects
- Estado de Vercel: READY, production.
- El despliegue incluye los cambios locales; no se hicieron commits ni pushes.
- Configuración: vercel.json, .vercelignore y vínculo local .vercel ignorado por Git.
- Se excluyen archivos .env, artefactos de pruebas y documentación de la carga de código. No se transfirieron las claves locales a Vercel.
- Comprobación HTTP: /, /app/mision y /app/riesgos devolvieron 200.

## Backend pendiente

Este despliegue publica el frontend Vite. No hay una URL pública de Nest configurada; /api/nasa/sources devuelve 404. El simulador conserva su respaldo local, pero NASA en vivo, IA y persistencia Nest requieren un backend público y un proxy /api en vercel.json. El backend actual guarda sesiones en archivos: no debe trasladarse sin cambios a almacenamiento efímero como si fuera persistente. No se cambió Supabase.

La regla SPA excluye /api para que los errores de API no se conviertan en respuestas HTML de apariencia exitosa. Una vez disponible Nest, añadir antes de la regla SPA una reescritura /api/:path* a la URL verificada del backend, conservando /api. Configurar NASA_API_KEY y AI_* solo en el backend.

## Volver a desplegar

```powershell
$env:NODE_OPTIONS='--use-system-ca'
npx vercel deploy --prod --yes
```

La sesión de Vercel y el proyecto ya quedaron vinculados localmente. El primer despliegue usó el proyecto explícito con --create-if-missing. La producción responde públicamente; las URL de despliegue pueden tener protección de Vercel según la configuración de la cuenta.

## Ramas de producción

- Frontend: `main`, actualizado con `origin/main` (`1404385`).
- Backend: `master`, actualizado con `origin/master` (`9e48a26`). Se integró primero master en backend-frontend mediante fast-forward y después se trasladó el trabajo local a master.
- Los cambios NASA locales se preservaron sin commits ni pushes. Se verificó su restauración antes de retirar los stashes temporales.
- Vercel publicó desde la rama local main: `dpl_Ccv9RSwN9DaG8w5xmPfmHswYrSFp`, estado READY. La API de Vercel confirma branch main.
- La conexión automática con `ilovejdg2-lang/astrodeepspacenasa` sigue rechazada por Vercel; la API del proyecto conserva link=null. Hace falta conectar ese repositorio desde Settings > Git en la cuenta/equipo propietario. No se afirma que los pushes a main ya disparen despliegues.
- El backend todavía no tiene un despliegue público conectado. Su rama elegida para producción es master; compila y pasa las nueve pruebas NASA tras integrar el remoto.
