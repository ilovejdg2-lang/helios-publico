import { useLocale } from '../../i18n'
import { roleLabel, stageLabel } from '../../platform/copy'
import type { WorkspaceMode, WorkspaceRole } from '../../platform/workspace'

export function RoleContextBar({
  missionName,
  stage,
  role,
  mode,
  subject,
}: {
  missionName?: string
  stage?: string
  role?: WorkspaceRole | null
  mode?: WorkspaceMode
  subject?: string | null
}) {
  const { lang } = useLocale()
  const en = lang === 'en'
  return (
    <div className="rd-meta" aria-label={en ? 'Active context' : 'Contexto activo'}>
      {missionName ? <span className="rd-chip">{missionName}</span> : null}
      {stage ? <span className="rd-chip">{stageLabel(stage, en)}</span> : null}
      {role ? <span className="rd-chip">{en ? 'Role' : 'Rol'}: {roleLabel(role, en)}</span> : null}
      {mode === 'demo' ? <span className="rd-chip rd-demo">{en ? 'Demonstration' : 'Demostración'}</span> : null}
      {subject ? <span className="rd-chip">{en ? 'Viewing' : 'Consultando'}: {subject}</span> : null}
    </div>
  )
}