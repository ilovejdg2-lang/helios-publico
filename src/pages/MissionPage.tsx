import { SpaceWeatherPanel } from '../components/NasaEnvironment'
import { CheckCircle2, CircleHelp, ClipboardList, Rocket } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MISSION_STAGE_LABEL, PREP_STATUS_LABEL } from '../../shared/mission'
import { RISK_CATEGORY_LABEL, riskById } from '../../shared/risks'
import type { MissionStage, PrepStatus } from '../../shared/types'
import { answerMissionLocal } from '../domain/analysis'
import { formatMission } from '../domain/format'
import { useLocale } from '../i18n'
import { useApp } from '../state/store'
import { Badge } from '../components/ui'

const STAGES: MissionStage[] = ['preembarque', 'a_bordo', 'posmision']

const STAGE_HELP: Record<MissionStage, string> = {
  preembarque: 'Preparar necesidades de salud, recursos y revisiones antes de abordar.',
  a_bordo: 'Monitorear cambios, ofrecer apoyo inicial y coordinar seguimiento.',
  posmision: 'Organizar la evolución, las evaluaciones y los pendientes posteriores.',
}

const STAGE_HELP_EN: Record<MissionStage, string> = {
  preembarque: 'Prepare health needs, resources, and reviews before boarding.',
  a_bordo: 'Watch for changes, offer initial support, and coordinate follow-up.',
  posmision: 'Organize progress, evaluations, and later open items.',
}

const STAGE_EN: Record<MissionStage, string> = {
  preembarque: 'Preflight',
  a_bordo: 'In Flight',
  posmision: 'Completed',
}

export function MissionPage() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { state, dispatch } = useApp()
  const [answer, setAnswer] = useState('')
  const openEpisodes = state.episodes.filter((item) => item.status !== 'closed')
  const canEdit = state.role === 'medical' || state.role === 'ops'
  const canEditPrep = canEdit && state.mission.stage === 'preembarque'
  const counts = Object.fromEntries(
    (['propuesto', 'pendiente_revision', 'aprobado', 'disponible', 'faltante', 'cargado_verificado'] as PrepStatus[]).map((status) => [
      status,
      state.prepItems.filter((item) => item.status === status).length,
    ]),
  ) as Record<PrepStatus, number>

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="kicker"><Rocket aria-hidden="true" size={16} strokeWidth={1.75} /> {en ? 'Mission' : 'Misión'}</p>
          <h1>{state.mission.name}</h1>
          <p className="lede">
            {en ? 'HELIOS adapts support to the stage. Changing stage keeps the history and does not close open health episodes.' : 'HELIOS adapta el acompañamiento a la etapa. Cambiar de etapa conserva el historial y no cierra episodios de salud pendientes.'}
          </p>
        </div>
        <Badge tone="ok">{en ? STAGE_EN[state.mission.stage] : MISSION_STAGE_LABEL[state.mission.stage]}</Badge>
      </header>

      <SpaceWeatherPanel />

      <section className="panel">
        <h2>{en ? 'Mission data' : 'Datos de la misión'}</h2>
        <dl className="quiet-metrics">
          <div className="metric"><dt>{en ? 'Destination' : 'Destino'}</dt><dd>{state.mission.destination}</dd></div>
          <div className="metric"><dt>{en ? 'Duration' : 'Duración'}</dt><dd>{state.mission.durationDays} {en ? 'days' : 'días'}</dd></div>
          <div className="metric"><dt>{en ? 'Crew' : 'Tripulación'}</dt><dd>{state.mission.crewCount}</dd></div>
        </dl>
        <p className="muted">{en ? 'Planned activities' : 'Actividades previstas'}: {state.mission.activities.join(' · ')}</p>
        <p className="muted">{en ? 'Stage updated' : 'Etapa actualizada'} {formatMission(state.mission.stageChangedAt)} UTC · {en ? 'open episodes' : 'episodios abiertos'}: {openEpisodes.length}</p>
      </section>

      <section className="panel">
        <h2>{en ? 'Mission stage' : 'Etapa de la misión'}</h2>
        <div className="chips" role="group" aria-label={en ? 'Mission stage' : 'Etapa de la misión'}>
          {STAGES.map((stage) => {
            const currentIdx = STAGES.indexOf(state.mission.stage)
            const targetIdx = STAGES.indexOf(stage)
            const goingBack = targetIdx < currentIdx
            return (
              <button
                key={stage}
                type="button"
                className="chip"
                data-testid={`stage-${stage}`}
                aria-pressed={state.mission.stage === stage}
                disabled={!canEdit || goingBack}
                title={goingBack
                  ? (en
                    ? 'Cannot go back to an earlier stage'
                    : 'No se puede volver a una etapa anterior')
                  : undefined}
                onClick={() => dispatch({ type: 'setMissionStage', stage })}
              >
                {en ? STAGE_EN[stage] : MISSION_STAGE_LABEL[stage]}
              </button>
            )
          })}
        </div>
        <p className="lede">{(en ? STAGE_HELP_EN : STAGE_HELP)[state.mission.stage]}</p>
        {canEdit ? (
          <p className="muted">
            {en
              ? 'Stages only move forward. After takeoff you cannot return to the prep checklist step.'
              : 'Las etapas solo avanzan. Después del despegue no se vuelve al paso del checklist.'}
          </p>
        ) : null}
        {!canEdit ? <p className="callout callout-amber">{en ? 'The astronaut role can view the stage, but cannot change it.' : 'El rol astronauta puede consultar la etapa, pero no cambiarla.'}</p> : null}
      </section>

      <section className="panel">
        <div className="spread">
          <h2><ClipboardList aria-hidden="true" size={18} strokeWidth={1.75} /> {en ? 'Preparation list' : 'Lista de preparación'}</h2>
          <Link className="btn" to="/app/riesgos">{en ? 'View NASA risks' : 'Ver riesgos NASA'}</Link>
        </div>
        <p className="lede">{en ? 'Quirón Bot proposes categories and reviews. Authorized staff define products, quantities, and conditions.' : 'Quirón Bot propone categorías y revisiones. El personal autorizado define productos, cantidades y condiciones.'}</p>
        <dl className="quiet-metrics">
          {(Object.keys(counts) as PrepStatus[]).map((status) => (
            <div key={status} className="metric"><dt>{PREP_STATUS_LABEL[status]}</dt><dd>{counts[status]}</dd></div>
          ))}
        </dl>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{en ? 'Item' : 'Elemento'}</th>
                <th>{en ? 'Category' : 'Categoría'}</th>
                <th>{en ? 'Status' : 'Estado'}</th>
                <th>{en ? 'Risks' : 'Riesgos'}</th>
                <th>{en ? 'Note' : 'Nota'}</th>
              </tr>
            </thead>
            <tbody>
              {state.prepItems.map((item) => (
                <tr key={item.id} data-testid={`prep-${item.id}`}>
                  <td>{item.title}</td>
                  <td>{RISK_CATEGORY_LABEL[item.category]}</td>
                  <td>
                    <label className="sr-only" htmlFor={`prep-status-${item.id}`}>Estado de {item.title}</label>
                    <select
                      id={`prep-status-${item.id}`}
                      value={item.status}
                      disabled={!canEditPrep}
                      onChange={(event) => dispatch({ type: 'setPrepStatus', prepId: item.id, status: event.target.value as PrepStatus })}
                    >
                      {(Object.keys(PREP_STATUS_LABEL) as PrepStatus[]).map((status) => (
                        <option key={status} value={status}>{PREP_STATUS_LABEL[status]}</option>
                      ))}
                    </select>
                  </td>
                  <td>{item.riskIds.map((id) => riskById(id)?.title ?? id).join('; ')}</td>
                  <td>{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {state.mission.stage === 'posmision' ? (
        <section className="panel" data-testid="postmission-summary">
          <h2>Revisión de misión</h2>
          <p className="lede">
            Resumen organizado para el personal autorizado. Las decisiones de recuperación corresponden a profesionales responsables.
          </p>
          <dl className="quiet-metrics">
            <div className="metric"><dt>Episodios abiertos</dt><dd>{openEpisodes.length}</dd></div>
            <div className="metric"><dt>Alertas activas</dt><dd>{state.alerts.filter((item) => item.status !== 'closed').length}</dd></div>
            <div className="metric"><dt>Síntomas registrados</dt><dd>{state.symptoms.length}</dd></div>
            <div className="metric"><dt>Movimientos de inventario</dt><dd>{state.movements.length}</dd></div>
            <div className="metric"><dt>Comunicaciones</dt><dd>{state.communications.length}</dd></div>
            <div className="metric"><dt>Revisiones prep. pendientes</dt><dd>{counts.propuesto + counts.pendiente_revision + counts.faltante}</dd></div>
          </dl>
          {openEpisodes.length > 0 ? (
            <ul>
              {openEpisodes.map((item) => (
                <li key={item.id}>{item.title} · {item.status}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">No hay episodios abiertos. El historial de la misión se conserva.</p>
          )}
        </section>
      ) : null}

      <section className="panel">
        <h2>{en ? 'Quirón Bot · stage questions' : 'Quirón Bot · preguntas de etapa'}</h2>
        <div className="questions">
          {(en ? [
            'What should I review before boarding?',
            'Which proposed resources are still pending approval?',
            'What follow-up is still open after I return?',
            'Which NASA risks apply to this mission?',
            'What does the literature say about metabolic effort in EVA?',
          ] : [
            '¿Qué debo revisar antes de abordar?',
            '¿Qué recursos propuestos siguen pendientes de aprobación?',
            '¿Qué seguimiento tengo pendiente después de regresar?',
            '¿Qué riesgos NASA aplican a esta misión?',
            '¿Qué dice la literatura sobre esfuerzo metabólico en EVA?',
          ]).map((question) => (
            <button key={question} type="button" className="btn btn-ghost" onClick={() => setAnswer(answerMissionLocal(state, question))}>
              <CircleHelp aria-hidden="true" size={16} strokeWidth={1.75} /> {question}
            </button>
          ))}
        </div>
        {answer ? (
          <p className="callout callout-ok" data-testid="mission-answer">
            <CheckCircle2 aria-hidden="true" size={16} strokeWidth={1.75} /> {answer}
          </p>
        ) : null}
      </section>
    </div>
  )
}
