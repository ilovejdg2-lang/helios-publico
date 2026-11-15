# Escenarios de demostración · Health Monitoring Software 2026

Usá el perfil demo **Mateo Ruiz (Tripulante)** salvo que se indique otro. Misión demo `HELIOS-DEMO`.

## Escenario A — Registro y seguimiento

1. Entrar → elegir **Tripulante**.
2. Ir a **Mi salud**.
3. Completar chequeo diario (sueño + estado).
4. Registrar: horas de sueño, ánimo 1–5, FC, presión **sistólica/diastólica**, SpO₂.
5. Verificar tarjetas: valor, unidad, origen, calidad, hora.
6. Abrir **Entender este indicador**.

**Éxito:** datos persisten al refrescar; no hay “normalidad” inventada sin datos.

## Escenario B — Cambio que requiere revisión

1. Registrar FC 70 bpm (reposo, calidad buena).
2. Registrar FC 95 bpm (mismo día).
3. La tarjeta muestra **Cambio observado** (regla demo ≥20 bpm) + siguiente paso hacia revisión profesional.
4. No aparece la palabra “diagnóstico”.

## Escenario C — Datos insuficientes

1. Indicador sin lecturas → estado **Sin datos** + “completar medición”.
2. Intentar guardar PA solo con sistólica → error backend/UI.
3. Lectura con calidad **pobre** o antigua → **Requiere comprobación** / **Dato antiguo**.
4. Texto: línea base pendiente (no se inventa).

## Escenario D — Apoyo emocional

1. Ánimo ≤2 → estado **Revisión profesional pendiente**.
2. Abrir Quirón emocional; generar resumen; decidir compartir.
3. Solicitar cita psicología; grant opcional a psicólogo.

## Escenario E — Pérdida de conexión

1. Con red: registrar indicador.
2. Sin red: Quirón modo local / UI muestra error de red sin borrar registros ya guardados.
3. Comunicaciones pendientes conservan estado al volver (limitación: cola completa es mejora futura).

## Escenario F — Evidencia NASA

1. **Riesgos** → sección **Cinco peligros** → abrir link HRP Hazards.
2. **Datos** / **Evidencia** → ver DONKI/OSDR/RadLab con rol y limitación.
3. RadiationPanel muestra procedencia; no afirma signos vitales NASA en vivo.

---

# Recorrido breve para jueces (≈4 min)

1. Home público HELIOS (identidad + footer marcas).  
2. Entrar como **Tripulante** → Mi salud.  
3. Registrar PA + ánimo + FC; mostrar tarjeta y “Entender”.  
4. Mostrar cambio observado o ánimo bajo → siguiente paso.  
5. Mapa corporal → región pecho.  
6. Riesgos → 5 peligros + fuente NASA.  
7. Datos/Evidencia → API DONKI/OSDR etiquetada.  
8. Cierre: “prototipo de demostración, no producto oficial NASA”.
