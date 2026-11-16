import { useEffect, useMemo, useRef, useState } from 'react'
import { DEMO_PROTOCOLS, type DemoProtocol } from '../../shared/protocols'
import type { Resource } from '../../shared/types'
import { PrepAiPanel } from '../components/resources/PrepAiPanel'
import { Empty, Field, Modal } from '../components/ui'
import { planResourceUse } from '../domain/inventory'
import { formatMission, movementLabel, roleLabel } from '../domain/format'
import { useLocale } from '../i18n'
import { platformApi } from '../platform/api'
import { getActiveMissionId } from '../platform/session'
import { useApp } from '../state/store'

type Tab = 'equipment' | 'supply' | 'protocol'

function stockLabel(quantity: number, english: boolean) {
  if (english) return quantity === 1 ? '1 unit' : `${quantity} units`
  return quantity === 1 ? '1 unidad' : `${quantity} unidades`
}

function kindLabel(kind: Resource['kind'], english: boolean) {
  if (kind === 'reusable') return english ? 'Reusable' : 'Reutilizable'
  return english ? 'Consumable' : 'Consumible'
}

export function ResourcesPage() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { state } = useApp()
  const [tab, setTab] = useState<Tab>('equipment')
  const [selected, setSelected] = useState('oximeter')
  const [protocolId, setProtocolId] = useState(DEMO_PROTOCOLS[0]?.id ?? '')
  const [useOpen, setUseOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [consult, setConsult] = useState<DemoProtocol | null>(null)
  const [missionStage, setMissionStage] = useState<string | undefined>()
  const [analysisStale, setAnalysisStale] = useState(false)
  const rows = useMemo(
    () => state.resources.filter((item) => (tab === 'protocol' ? false : item.category === tab)),
    [state.resources, tab],
  )
  const resource = rows.find((item) => item.id === selected) ?? null
  const protocol = DEMO_PROTOCOLS.find((item) => item.id === protocolId) ?? DEMO_PROTOCOLS[0]

  useEffect(() => {
    if (tab === 'protocol') return
    if (rows.some((item) => item.id === selected)) return
    setSelected(rows[0]?.id ?? '')
  }, [rows, selected, tab])

  useEffect(() => {
    const missionId = getActiveMissionId()
    if (!missionId) return
    let alive = true
    platformApi.mission(missionId)
      .then((data) => {
        if (!alive) return
        setMissionStage(data.mission.stage)
        setAnalysisStale(Boolean(data.mission.analysisStale))
      })
      .catch(() => undefined)
    return () => { alive = false }
  }, [])

  function refreshMissionMeta() {
    const missionId = getActiveMissionId()
    if (!missionId) return
    platformApi.mission(missionId)
      .then((data) => {
        setMissionStage(data.mission.stage)
        setAnalysisStale(Boolean(data.mission.analysisStale))
      })
      .catch(() => undefined)
  }

  const registered = state.resources.length
  const review = state.resources.filter((item) => item.status === 'review').length
  const movements = state.movements.length

  return (
    <div className="inv-page">
      <header className="inv-head">
        <div className="inv-head-row">
          <div>
            <p className="inv-kicker">{en ? 'Resources' : 'Recursos'}</p>
            <h1>{en ? 'Ship inventory' : 'Inventario de la nave'}</h1>
          </div>
          {tab !== 'protocol' ? (
            <button className="inv-add-btn" type="button" onClick={() => setAddOpen(true)}>
              {en ? 'Add' : 'Añadir'}
            </button>
          ) : null}
        </div>
        <p className="inv-lede">
          {en
            ? 'Reusable equipment is not deducted when used. A supply cannot go below zero. Having it on board is not a medical indication.'
            : 'El equipo reutilizable no se descuenta al usarlo. Un suministro no puede quedar bajo cero. Tenerlo a bordo no es una indicación médica.'}
        </p>
      </header>
      <div className="inv-cats" role="tablist" aria-label={en ? 'Categories' : 'Categorías'}>
        {([
          ['equipment', en ? 'Equipment' : 'Equipos'],
          ['supply', en ? 'Supplies' : 'Suministros'],
          ['protocol', en ? 'Protocols' : 'Protocolos'],
        ] as const).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      <PrepAiPanel
        stage={missionStage}
        analysisStale={analysisStale}
        onSaved={refreshMissionMeta}
      />
      <dl className="inv-metrics">
        <div><dt>{en ? 'Registered' : 'Registrados'}</dt><dd>{registered}</dd></div>
        <div><dt>{en ? 'To review' : 'Por revisar'}</dt><dd>{review}</dd></div>
        <div><dt>{en ? 'Movements' : 'Movimientos'}</dt><dd>{movements}</dd></div>
      </dl>
      <div className="inv-main">
        {tab === 'protocol' ? (
          <ProtocolTable
            english={en}
            selectedId={protocol?.id ?? ''}
            onSelect={setProtocolId}
          />
        ) : rows.length === 0 ? (
          <Empty
            title={en ? 'Nothing in this category' : 'No hay recursos en esta categoría'}
            text={en ? 'The scenario does not include items here.' : 'Este escenario no incluye existencias en esta categoría.'}
          />
        ) : (
          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>{en ? 'Resources' : 'Recursos'}</th>
                  <th>{en ? 'Available' : 'Disponible'}</th>
                  <th>{en ? 'Location' : 'Ubicación'}</th>
                  <th>{en ? 'Status' : 'Estado'}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id} data-testid={`resource-${item.id}`} className={item.id === resource?.id ? 'is-selected' : undefined}>
                    <td>
                      <span className="inv-res">
                        <button type="button" aria-pressed={item.id === resource?.id} onClick={() => setSelected(item.id)}>{item.name}</button>
                        <span>{kindLabel(item.kind, en)}</span>
                      </span>
                    </td>
                    <td>{stockLabel(item.quantity, en)}</td>
                    <td>{item.location}</td>
                    <td><span className={item.status === 'review' ? 'inv-state is-review' : 'inv-state'}>{item.status === 'ready' ? (en ? 'Ready' : 'Listo') : (en ? 'Review' : 'Revisar')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === 'protocol' && protocol ? (
          <aside className="inv-detail">
            <h2>{protocol.title}</h2>
            <p>{protocol.summary}</p>
            <div className="inv-detail-space" />
            <div className="inv-detail-actions">
              <button type="button" className="inv-btn is-sky" onClick={() => setConsult(protocol)}>{en ? 'Consult' : 'Consultar'}</button>
            </div>
          </aside>
        ) : resource ? (
          <aside className="inv-detail">
            <h2>{resource.name}</h2>
            <p>{stockLabel(resource.quantity, en)} - {resource.location}</p>
            <div className="inv-detail-space" />
            <div className="inv-detail-actions">
              <button type="button" className="inv-btn is-pink" data-testid="open-use" onClick={() => setUseOpen(true)}>{en ? 'Record use' : 'Registrar uso'}</button>
              <button type="button" className="inv-btn is-sky" onClick={() => setEditOpen(true)}>{en ? 'Edit record' : 'Editar ficha'}</button>
            </div>
          </aside>
        ) : (
          <aside className="inv-detail">
            <h2>{en ? 'No item selected' : 'Sin recurso seleccionado'}</h2>
            <p>{en ? 'Choose a row to see its record.' : 'Elegí una fila para ver su ficha.'}</p>
          </aside>
        )}
      </div>
      <section className="inv-moves">
        <h2>{en ? 'Movements' : 'Movimientos'}</h2>
        {state.movements.length === 0 ? (
          <p>{en ? 'There are no movements in this scenario yet.' : 'Todavía no hay movimientos en este escenario.'}</p>
        ) : (
          <ul>
            {[...state.movements].reverse().map((item) => {
              const name = state.resources.find((entry) => entry.id === item.resourceId)?.name ?? item.resourceId
              const reusable = state.resources.find((entry) => entry.id === item.resourceId)?.kind === 'reusable'
              const amount = item.type === 'use' && reusable
                ? (en ? 'use recorded, stock unchanged' : 'uso registrado, sin salida de inventario')
                : `${item.quantityDelta >= 0 ? '+' : ''}${item.quantityDelta}`
              return (
                <li key={item.id}>
                  {movementLabel(item.type)} · {name} · {formatMission(item.at)} · {amount} · {roleLabel(item.actor)}{item.note ? ` · ${item.note}` : ''}
                </li>
              )
            })}
          </ul>
        )}
      </section>
      {resource ? <UseDialog open={useOpen} resource={resource} onClose={() => setUseOpen(false)} /> : null}
      <AddDialog open={addOpen} onClose={() => setAddOpen(false)} />
      {resource ? <EditDialog open={editOpen} resource={resource} onClose={() => setEditOpen(false)} /> : null}
      <Modal open={consult !== null} title={consult?.title ?? ''} description={consult?.limitation} onClose={() => setConsult(null)}>
        {consult ? <ol>{consult.steps.map((step) => <li key={step}>{step}</li>)}</ol> : null}
      </Modal>
    </div>
  )
}

function ProtocolTable({ english, selectedId, onSelect }: { english: boolean; selectedId: string; onSelect: (id: string) => void }) {
  return (
    <div className="inv-table-wrap">
      <table className="inv-table">
        <thead>
          <tr>
            <th>{english ? 'Document' : 'Documento'}</th>
            <th>{english ? 'Type' : 'Tipo'}</th>
            <th>{english ? 'Note' : 'Nota'}</th>
          </tr>
        </thead>
        <tbody>
          {DEMO_PROTOCOLS.map((protocol) => (
            <tr key={protocol.id} className={protocol.id === selectedId ? 'is-selected' : undefined}>
              <td>
                <button type="button" aria-pressed={protocol.id === selectedId} onClick={() => onSelect(protocol.id)}>{protocol.title}</button>
              </td>
              <td>{english ? 'Demonstration' : 'Demostración'}</td>
              <td>{protocol.limitation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function UseDialog({ open, resource, onClose }: { open: boolean; resource: Resource; onClose: () => void }) {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { dispatch } = useApp()
  const [quantity, setQuantity] = useState('1')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const key = useRef('')
  useEffect(() => {
    if (!open) return
    setQuantity('1')
    setError('')
    setBusy(false)
    key.current = `use-${resource.id}-${crypto.randomUUID()}`
  }, [open, resource.id])
  return (
    <Modal open={open} title={`${en ? 'Record use' : 'Registrar uso'} · ${resource.name}`} description={resource.kind === 'reusable' ? (en ? 'This equipment does not lose units. Availability is not a medical indication.' : 'Este equipo no pierde unidades. Tenerlo disponible no es una indicación médica.') : (en ? 'Consumption is deducted once and cannot go below zero.' : 'El consumo se descuenta una sola vez y no puede dejar la existencia bajo cero.')} onClose={onClose}>
      <Field id="use-quantity" label={en ? 'Quantity' : 'Cantidad'} error={error}>
        <input id="use-quantity" data-testid="use-quantity" inputMode="numeric" value={quantity} aria-invalid={Boolean(error)} aria-describedby={error ? 'use-quantity-error' : undefined} onChange={(event) => setQuantity(event.target.value)} />
      </Field>
      <button className="btn btn-primary" type="button" data-testid="save-use" disabled={busy} onClick={() => {
        if (busy) return
        const parsed = Number(quantity)
        if (!Number.isInteger(parsed) || parsed < 1) {
          setError(en ? 'Enter an integer greater than zero.' : 'Indicá un entero mayor que cero.')
          return
        }
        const plan = planResourceUse(resource, parsed)
        if (!plan.ok) {
          setError(plan.error)
          return
        }
        setBusy(true)
        dispatch({ type: 'useResource', resourceId: resource.id, quantity: parsed, idempotencyKey: key.current, note: '' })
        onClose()
      }}>{busy ? (en ? 'Saving…' : 'Guardando…') : (en ? 'Confirm use' : 'Confirmar uso')}</button>
    </Modal>
  )
}

function AddDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { state, dispatch } = useApp()
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [kind, setKind] = useState<Resource['kind']>('reusable')
  const [error, setError] = useState('')
  return (
    <Modal open={open} title={en ? 'Add resource' : 'Añadir recurso'} onClose={onClose}>
      <Field id="res-name" label={en ? 'Name' : 'Nombre'} error={error}><input id="res-name" value={name} aria-invalid={Boolean(error)} aria-describedby={error ? 'res-name-error' : undefined} onChange={(event) => setName(event.target.value)} /></Field>
      <Field id="res-location" label={en ? 'Location' : 'Ubicación'}><input id="res-location" value={location} onChange={(event) => setLocation(event.target.value)} /></Field>
      <Field id="res-qty" label={en ? 'Starting quantity' : 'Cantidad inicial'}><input id="res-qty" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></Field>
      <Field id="res-kind" label={en ? 'Type' : 'Tipo'}>
        <select id="res-kind" value={kind} onChange={(event) => setKind(event.target.value as Resource['kind'])}>
          <option value="reusable">{en ? 'Reusable' : 'Reutilizable'}</option>
          <option value="consumable">{en ? 'Consumable' : 'Consumible'}</option>
        </select>
      </Field>
      <button className="btn btn-primary" type="button" onClick={() => {
        const parsed = Number(quantity)
        if (name.trim().length < 2 || location.trim().length < 2 || !Number.isInteger(parsed) || parsed < 0) { setError(en ? 'Check the name, location, and quantity.' : 'Revisá nombre, ubicación y cantidad.'); return }
        dispatch({ type: 'createResource', name, location, quantity: parsed, kind, category: kind === 'consumable' ? 'supply' : 'equipment', idempotencyKey: `new-${state.seq}-${name}` })
        onClose()
      }}>{en ? 'Save' : 'Guardar'}</button>
    </Modal>
  )
}

function EditDialog({ open, resource, onClose }: { open: boolean; resource: Resource; onClose: () => void }) {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { dispatch } = useApp()
  const [name, setName] = useState(resource.name)
  const [location, setLocation] = useState(resource.location)
  const [status, setStatus] = useState(resource.status)
  const [quantity, setQuantity] = useState(String(resource.quantity))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!open) return
    setName(resource.name)
    setLocation(resource.location)
    setStatus(resource.status)
    setQuantity(String(resource.quantity))
    setError('')
    setBusy(false)
  }, [open, resource])
  return (
    <Modal open={open} title={en ? 'Edit record' : 'Editar ficha'} description={en ? 'Changing the quantity creates an adjustment. Earlier movements stay in the history.' : 'Cambiar la cantidad crea un ajuste. Los movimientos anteriores se conservan.'} onClose={onClose}>
      <Field id="edit-name" label={en ? 'Name' : 'Nombre'} error={error}><input id="edit-name" value={name} aria-invalid={Boolean(error)} onChange={(event) => setName(event.target.value)} /></Field>
      <Field id="edit-category" label={en ? 'Category' : 'Categoría'}>
        <input id="edit-category" value={resource.category === 'supply' ? (en ? 'Supply' : 'Suministro') : (en ? 'Equipment' : 'Equipo')} readOnly />
      </Field>
      <Field id="edit-location" label={en ? 'Location' : 'Ubicación'}><input id="edit-location" value={location} onChange={(event) => setLocation(event.target.value)} /></Field>
      <Field id="edit-status" label={en ? 'Review status' : 'Estado de revisión'}>
        <select id="edit-status" value={status} onChange={(event) => setStatus(event.target.value as Resource['status'])}>
          <option value="ready">{en ? 'Ready' : 'Listo'}</option>
          <option value="review">{en ? 'Review' : 'Revisar'}</option>
        </select>
      </Field>
      <button className="btn" type="button" disabled={busy} onClick={() => {
        if (busy) return
        if (name.trim().length < 2 || location.trim().length < 2) {
          setError(en ? 'Name and location are required.' : 'Nombre y ubicación son obligatorios.')
          return
        }
        setBusy(true)
        dispatch({ type: 'updateResource', resourceId: resource.id, name, location, status })
        onClose()
      }}>{en ? 'Save record' : 'Guardar ficha'}</button>
      <Field id="edit-qty" label={en ? 'Adjust quantity' : 'Ajustar existencia'}><input id="edit-qty" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></Field>
      <button className="btn btn-amber" type="button" disabled={busy} onClick={() => {
        if (busy) return
        const parsed = Number(quantity)
        if (!Number.isInteger(parsed) || parsed < 0) {
          setError(en ? 'Quantity must be zero or a positive integer.' : 'La existencia debe ser un entero igual o mayor que cero.')
          return
        }
        setBusy(true)
        dispatch({ type: 'adjustResource', resourceId: resource.id, quantity: parsed, idempotencyKey: `adj-${resource.id}-${crypto.randomUUID()}`, note: en ? 'Manual adjustment' : 'Ajuste manual' })
        onClose()
      }}>{en ? 'Adjust quantity' : 'Ajustar cantidad'}</button>
    </Modal>
  )
}
