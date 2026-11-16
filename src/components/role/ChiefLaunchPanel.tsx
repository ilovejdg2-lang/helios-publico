import { useEffect, useState } from 'react'
import { useLocale } from '../../i18n'
import { platformApi, type PrepItem } from '../../platform/api'
import { stageBlurb, stageLabel } from '../../platform/copy'

function itemProgress(item: PrepItem): number {
  if (!item.applies || item.status === 'no_aplica') return 0
  if (item.qtyRequired != null && item.qtyRequired > 0) {
    return Math.min(1, Math.max(0, Number(item.qtyAvailable ?? 0)) / item.qtyRequired)
  }
  return item.status === 'cargado_verificado' ? 1 : 0
}

function formatPrepQty(item: PrepItem, en: boolean): string | null {
  if (item.qtyRequired == null) return null
  const have = item.qtyAvailable ?? 0
  const pct = Math.round(itemProgress(item) * 100)
  return en
    ? `Have ${have} / need ${item.qtyRequired} (${pct}%)`
    : `Tengo ${have} / necesito ${item.qtyRequired} (${pct}%)`
}

/** Plan obligatorio + análisis + checklist ≥80% para despegar. Cambios → re-analizar. */
export function ChiefLaunchPanel({
  missionId,
  stage,
  plannedCrewCount,
  teamSize,
  durationDays,
  prep,
  percent,
  analysisStale,
  onChanged,
}: {
  missionId: string
  stage?: string
  plannedCrewCount?: number
  /** Integrantes activos del equipo; es el default del tamaño de personas. */
  teamSize?: number
  durationDays?: number
  prep: PrepItem[]
  percent: number
  analysisStale?: boolean
  onChanged: () => Promise<void> | void
}) {
  const { lang } = useLocale()
  const en = lang === 'en'
  const afterDeploy = stage === 'aboard' || stage === 'postmission' || stage === 'archived' || stage === 'cancelled'
  const beforeDeploy = !afterDeploy
  const stale = Boolean(analysisStale) || (beforeDeploy && prep.length === 0)
  const displayStage = afterDeploy
    ? (stage || '')
    : prep.length > 0 && !stale
      ? 'preflight'
      : (stage || 'draft')
  /** Tamaño fijo = equipo de cascos. No se permite editar. */
  const lockedPeople = teamSize && teamSize > 0 ? teamSize : plannedCrewCount && plannedCrewCount > 0 ? plannedCrewCount : 4
  const [days, setDays] = useState(String(durationDays || ''))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [planSaved, setPlanSaved] = useState(Boolean(plannedCrewCount && durationDays))
  const [daysTouched, setDaysTouched] = useState(false)

  useEffect(() => {
    if (!daysTouched) setDays(String(durationDays || ''))
  }, [durationDays, daysTouched])

  useEffect(() => {
    setPlanSaved(Boolean(plannedCrewCount && durationDays && plannedCrewCount > 0 && durationDays > 0))
  }, [plannedCrewCount, durationDays])

  const canLaunch = percent >= 80 && beforeDeploy && planSaved && !stale
  const canEndMission = stage === 'aboard'
  const marked = prep.filter((item) => item.applies && itemProgress(item) >= 1).length
  const partial = prep.filter((item) => {
    const p = itemProgress(item)
    return item.applies && p > 0 && p < 1
  }).length

  async function endMission() {
    setBusy(true)
    setError('')
    setOk('')
    try {
      await platformApi.setStage(missionId, 'postmission')
      await onChanged()
      setOk(en
        ? 'Mission moved to Completed. This is the demo “mission ended” stage.'
        : 'Misión pasada a posmisión. Esa es la etapa demo de “misión terminada”.')
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not end mission' : 'No se pudo terminar la misión'))
    } finally {
      setBusy(false)
    }
  }
  const applicable = prep.filter((item) => item.applies && item.status !== 'no_aplica').length
  const planDirty =
    lockedPeople !== Number(plannedCrewCount || 0) ||
    Number(days) !== Number(durationDays || 0)

  async function savePlan() {
    const duration = Number(days)
    if (!Number.isInteger(duration) || duration < 1) {
      setError(en ? 'Mission days are required (at least 1).' : 'Los días de misión son obligatorios (mínimo 1).')
      return
    }
    setBusy(true)
    setError('')
    setOk('')
    try {
      await platformApi.updateDraft(missionId, {
        plannedCrewCount: lockedPeople,
        durationDays: duration,
      })
      if (stage === 'draft') {
        await platformApi.setStage(missionId, 'preflight').catch(() => undefined)
      }
      setPlanSaved(true)
      setDaysTouched(false)
      setOk(en
        ? 'Plan saved. Quantity checks were cleared where amounts may change — re-analyze, then mark again.'
        : 'Plan guardado. Se desmarcaron ítems con cantidad (puede cambiar con los días). Volvé a analizar y marcá de nuevo.')
      await onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not save plan' : 'No se pudo guardar el plan'))
    } finally {
      setBusy(false)
    }
  }

  async function runAnalysis() {
    if (!planSaved && !planDirty) {
      setError(en ? 'Save mission days first.' : 'Guardá primero los días de misión.')
      return
    }
    setBusy(true)
    setError('')
    setOk('')
    try {
      if (planDirty) {
        const duration = Number(days)
        if (!Number.isInteger(duration) || duration < 1) {
          setError(en ? 'Mission days are required.' : 'Los días son obligatorios.')
          return
        }
        await platformApi.updateDraft(missionId, {
          plannedCrewCount: lockedPeople,
          durationDays: duration,
        })
        setPlanSaved(true)
        setDaysTouched(false)
      }
      await platformApi.commitAiPrep(missionId)
      if (stage === 'draft') {
        await platformApi.setStage(missionId, 'preflight').catch(() => undefined)
      }
      setOk(en
        ? 'Analysis updated. Items whose required qty changed were unchecked — confirm what you have, then mark 80%+.'
        : 'Análisis actualizado. Ítems cuya cantidad cambió quedaron sin marcar: confirmá si los tenés y volvé a marcar hasta 80%+.')
      await onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not run analysis' : 'No se pudo analizar'))
    } finally {
      setBusy(false)
    }
  }

  async function savePrepPatch(
    item: PrepItem,
    patch: { status?: string; qtyAvailable?: number | null },
  ) {
    if (!beforeDeploy || busy) return
    setBusy(true)
    setError('')
    try {
      await platformApi.upsertPrep(missionId, {
        id: item.id,
        title: item.title,
        category: item.category,
        description: item.description,
        source: item.source,
        status: patch.status ?? item.status,
        critical: item.critical,
        applies: item.applies,
        evidence: item.evidence,
        qtyRequired: item.qtyRequired,
        qtyAvailable:
          patch.qtyAvailable !== undefined ? patch.qtyAvailable : item.qtyAvailable,
      })
      await onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not update item' : 'No se pudo actualizar el ítem'))
    } finally {
      setBusy(false)
    }
  }

  async function toggleItem(item: PrepItem) {
    // Sin cantidad: check binario. Con cantidad: check = llenar al requerido / vaciar.
    if (item.qtyRequired != null && item.qtyRequired > 0) {
      const full = itemProgress(item) >= 1
      await savePrepPatch(item, {
        qtyAvailable: full ? 0 : item.qtyRequired,
        status: full ? 'pendiente_revision' : 'cargado_verificado',
      })
      return
    }
    const nextStatus = item.status === 'cargado_verificado' ? 'pendiente_revision' : 'cargado_verificado'
    await savePrepPatch(item, { status: nextStatus })
  }

  async function setHaveQty(item: PrepItem, raw: string) {
    if (!beforeDeploy || busy) return
    const parsed = raw.trim() === '' ? 0 : Number(raw)
    if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
      setError(en ? 'Enter a whole number ≥ 0 for what you have.' : 'Ingresá un entero ≥ 0 de lo que tenés.')
      return
    }
    await savePrepPatch(item, { qtyAvailable: parsed })
  }

  async function launch() {
    if (!canLaunch) return
    setBusy(true)
    setError('')
    setOk('')
    try {
      const check = await platformApi.startCheck(missionId)
      if (check.analysisStale) {
        setError(en
          ? 'Something changed since the last analysis. Run analysis again.'
          : 'Hubo cambios desde el último análisis. Volvé a analizar.')
        await onChanged()
        return
      }
      if (!check.ok || check.percent < 80) {
        setError(en
          ? `Need 80% or more prep to take off (now ${check.percent}%).`
          : `Necesitás 80% o más de preparación para despegar (ahora ${check.percent}%).`)
        return
      }
      await platformApi.start(missionId)
      setOk(en
        ? 'Mission deployed. No more astronauts can be added.'
        : 'Misión desplegada. Ya no se pueden agregar más astronautas.')
      await onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not start mission' : 'No se pudo iniciar la misión'))
    } finally {
      setBusy(false)
    }
  }

  if (afterDeploy) {
    return (
      <section className="chief-launch is-locked" aria-label={en ? 'Mission status' : 'Estado de la misión'}>
        <div className="chief-launch-head">
          <h2>{en ? 'Mission status' : 'Estado de la misión'}</h2>
          <span className="chief-launch-chip">{stageLabel(stage || '', en)}</span>
        </div>
        <p className="muted">{stageBlurb(stage || '', en)}</p>
        <p className="chief-launch-locked" role="status">
          {en
            ? 'Preparation Checklist is permanently closed after takeoff. It cannot be reopened.'
            : 'El checklist de preparación quedó cerrado de forma definitiva tras el despegue. No se puede reabrir.'}
        </p>
        <p className="muted">
          {en ? 'Prep snapshot at deploy' : 'Snapshot de prep al despegar'}: <strong>{percent}%</strong>
          {' · '}
          {en ? 'Crew locked' : 'Tripulación bloqueada'}
        </p>
        {stage === 'aboard' ? (
          <div className="rd-actions" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy || !canEndMission}
              onClick={() => void endMission()}
            >
              {en ? 'End mission → Completed' : 'Terminar misión → Finalizada'}
            </button>
          </div>
        ) : null}
        {stage === 'postmission' ? (
          <p className="muted">
            {en
              ? 'Mission ended (Completed). Review stays available; no more crew adds; checklist stays closed.'
              : 'Misión terminada (posmisión). La revisión sigue disponible; no se agregan integrantes; el checklist permanece cerrado.'}
          </p>
        ) : null}
        {error ? <p className="field-error" role="alert">{error}</p> : null}
        {ok ? <p className="muted">{ok}</p> : null}
      </section>
    )
  }

  return (
    <section className="chief-launch" aria-label={en ? 'Launch readiness' : 'Listos para despegar'}>
      <div className="chief-launch-head">
        <div>
          <h2>{en ? 'Prepare & take off' : 'Preparar y despegar'}</h2>
          <p className="muted">{stageBlurb(displayStage, en)}</p>
        </div>
        <span className="chief-launch-chip">{stageLabel(displayStage, en)}</span>
      </div>

      <div className="chief-launch-plan">
        <label className="chief-launch-field">
          <span>{en ? 'Crew size (fixed)' : 'Tamaño de personas (fijo)'}</span>
          <input
            type="number"
            min={1}
            step={1}
            value={lockedPeople}
            readOnly
            disabled
            aria-readonly="true"
            title={en ? 'Fixed to the current crew roster' : 'Fijo según el equipo actual'}
          />
          <small className="muted">
            {en
              ? `Locked to current crew (${lockedPeople}). Not editable.`
              : `Bloqueado al equipo actual (${lockedPeople}). No se puede editar.`}
          </small>
        </label>
        <label className="chief-launch-field">
          <span>{en ? 'Mission days (required)' : 'Días de misión (obligatorio)'}</span>
          <input
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={days}
            disabled={busy || afterDeploy}
            onChange={(event) => {
              setDaysTouched(true)
              setDays(event.target.value)
            }}
          />
        </label>
        <button type="button" className="btn" disabled={busy} onClick={() => void savePlan()}>
          {en ? 'Save plan' : 'Guardar plan'}
        </button>
      </div>

      {stale || planDirty ? (
        <p className="chief-launch-stale" role="status">
          {en
            ? 'Plan or crew changed — run analysis again before takeoff. You can still mark checklist items now.'
            : 'Hubo cambios en el plan o la tripulación: volvé a analizar antes de despegar. Igual podés marcar el checklist ahora.'}
        </p>
      ) : null}

      <div className="chief-launch-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy || (!planSaved && !planDirty)}
          onClick={() => void runAnalysis()}
        >
          {stale || planDirty
            ? (en ? 'Re-analyze' : 'Volver a analizar')
            : (en ? 'Run analysis' : 'Analizar')}
        </button>
        <button
          type="button"
          className="btn btn-primary chief-launch-go"
          disabled={busy || !canLaunch}
          title={!canLaunch
            ? (en
              ? 'Need a fresh analysis and 80%+ checklist to take off'
              : 'Necesitás análisis al día y checklist al 80% o más para despegar')
            : undefined}
          onClick={() => void launch()}
        >
          {en ? 'Deploy' : 'Desplegar'}
        </button>
      </div>

      <div className="chief-launch-meter" aria-live="polite">
        <div className="chief-launch-meter-top">
          <strong>{en ? 'Checklist' : 'Checklist'}</strong>
          <span className={percent >= 80 && !stale ? 'is-ok' : 'is-warn'}>
            {percent}% · {marked}/{applicable || 0} {en ? 'complete' : 'completos'}
            {partial > 0 ? (en ? ` · ${partial} partial` : ` · ${partial} parciales`) : ''}
          </span>
        </div>
        <div className="chief-launch-bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${Math.min(100, percent)}%` }} />
          <i className="chief-launch-threshold" style={{ left: '80%' }} title="80%" />
        </div>
        <p className="muted">
          {en
            ? 'Enter how many you have now. Partial stock counts toward the %. Need 80%+ to deploy.'
            : 'Indicá cuánto tenés ahora. Lo parcial suma al %. Necesitás 80%+ para desplegar.'}
        </p>
      </div>

      {prep.length > 0 ? (
        <ul className="chief-launch-list">
          {prep.map((item) => {
            const progress = itemProgress(item)
            const done = progress >= 1
            const qtyLine = formatPrepQty(item, en)
            const hasQty = item.qtyRequired != null && item.qtyRequired > 0
            return (
              <li key={item.id} className={done ? 'is-on' : progress > 0 ? 'is-partial' : undefined}>
                <label>
                  <input
                    type="checkbox"
                    checked={done}
                    disabled={busy || !item.applies}
                    onChange={() => void toggleItem(item)}
                    title={hasQty
                      ? (en ? 'Check = set have to required amount' : 'Check = poner que tenés lo requerido')
                      : undefined}
                  />
                  <span>
                    <strong>{item.title}</strong>
                    {qtyLine ? <span className="chief-launch-qty">{qtyLine}</span> : null}
                    {hasQty ? (
                      <span className="chief-launch-have">
                        <span>{en ? 'I have now' : 'Tengo ahora'}</span>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          inputMode="numeric"
                          disabled={busy || !item.applies || afterDeploy}
                          defaultValue={item.qtyAvailable ?? 0}
                          key={`${item.id}-${item.qtyRequired}-${item.qtyAvailable ?? 0}`}
                          onBlur={(event) => void setHaveQty(item, event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              void setHaveQty(item, (event.target as HTMLInputElement).value)
                            }
                          }}
                        />
                        <span className="muted">/ {item.qtyRequired}</span>
                      </span>
                    ) : null}
                    <span className="muted">
                      {item.critical ? (en ? 'Critical · ' : 'Crítico · ') : ''}
                      {item.source}
                    </span>
                    {item.description ? (
                      <span className="muted chief-launch-desc">{item.description}</span>
                    ) : null}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="muted">
          {en
            ? 'No checklist yet. Save the plan, then run analysis.'
            : 'Todavía no hay checklist. Guardá el plan y después analizá.'}
        </p>
      )}

      {error ? <p className="field-error" role="alert">{error}</p> : null}
      {ok ? <p className="muted">{ok}</p> : null}
    </section>
  )
}
