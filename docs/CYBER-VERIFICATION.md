# Verificación ciber · HELIOS (frontend)

Complementa `NASA_SPACE_APP-BACKEND/docs/SECURITY.md`.  
**No cambia** la entrada por roles demo.

## A. Claves

| Comprobación | Resultado esperado |
|---|---|
| `AI_API_KEY` solo en backend `.env` | Sí — el frontend usa Nest vía `/api` |
| Bundle Vite / `dist` | No debe contener el valor real de `AI_API_KEY` |
| Variables `VITE_*` | Solo públicas (p. ej. `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_API_BASE_URL`) |
| `.gitignore` / `.vercelignore` | Excluyen `.env` reales |

Comando útil (desde frontend):

```powershell
npm run security:audit -- --output docs/security-audit.json
rg -n "AI_API_KEY|sk-|AIza" dist --glob "*.js" || echo "sin coincidencias de valor"
```

## B–F y SQL

Implementadas en Nest (`src/security/*`, `src/ai/*`, monitoring HMAC). Resumen:

- **B** Rate limit propio → 429 + `Retry-After` (AI 20/min cubre `/api/ai/*` y Quirón platform; escrituras 240/min; import 20/min). `POST /api/platform/auth/select` sigue en presupuesto de escritura, no AI. Un 429 del proveedor ≠ rate limit propio.
- **C** Body: AI 64 KiB, API 256 KiB, import simulación 10 MiB → 413 / JSON inválido 400.
- **D** `SafeExceptionFilter` + `X-Request-Id`; logs sin claves ni cuerpos.
- **E** HMAC-SHA256 v2; DEMO_MAC_KEY pública = demo de alteración, no autenticidad de dispositivo.
- **F** `untrustedData`, `humanReviewRequired:true`, sin mutaciones automáticas por IA.
- **Prompt injection** barrera de backend: la IA no escribe registros.
- **SQL** persistencia activa = JSON/IndexedDB; sin SQL concatenado en módulos de datos.

## Roles

Entrar eligiendo perfil/rol demo permanece igual. El rate limit de IA **no** aplica a `POST /api/platform/auth/select`.
