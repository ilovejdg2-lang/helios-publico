import { useCallback, useEffect, useState } from 'react'
import { platformApi, type MissionDetail, type PrepItem } from '../../platform/api'
import { getActiveMissionId, getStoredProfile } from '../../platform/session'
import {
  getWorkspaceMode,
  getWorkspaceRole,
  isDemoExplore,
  resolveAuthorizedRole,
  setWorkspaceMode,
  setWorkspaceRole,
  type WorkspaceRole,
} from '../../platform/workspace'

export function useMissionWorkspace() {
  const missionId = getActiveMissionId()
  const profile = getStoredProfile()
  const [detail, setDetail] = useState<MissionDetail | null>(null)
  const [prep, setPrep] = useState<PrepItem[]>([])
  const [percent, setPercent] = useState(0)
  const [appointments, setAppointments] = useState<unknown[]>([])
  const [wakeNote, setWakeNote] = useState('')
  const [symptoms, setSymptoms] = useState<unknown[]>([])
  const [grants, setGrants] = useState<unknown[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<WorkspaceRole | null>(getWorkspaceRole())

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    if (!missionId) return
    if (!opts?.silent) setLoading(true)
    setError('')
    try {
      const [mission, prepData, appts, wake, symptomData, grantData] = await Promise.all([
        platformApi.mission(missionId),
        platformApi.prep(missionId).catch(() => ({ items: [] as PrepItem[], percent: 0, canStart: false })),
        platformApi.appointments(missionId).catch(() => ({ items: [] as unknown[] })),
        platformApi.wake(missionId, false).catch(() => ({ note: '', check: null })),
        platformApi.listSymptoms(missionId).catch(() => ({ items: [] as unknown[] })),
        platformApi.grants(missionId).catch(() => ({ items: [] as unknown[], chief: { sharesWithChief: [], neverAutoShared: [], note: '' } })),
      ])
      setDetail(mission)
      setPrep(prepData.items)
      setPercent(prepData.percent)
      setAppointments(appts.items)
      setWakeNote(wake.note || '')
      setSymptoms(symptomData.items)
      setGrants(grantData.items)
      const mine = mission.members.find((m) => m.profileId === profile?.id && m.status === 'active')
      const resolved = resolveAuthorizedRole(mine?.role || '', profile?.demoRole)
      // In demo explore, keep the role the user just picked — don't thrash UI by overwriting it.
      const nextRole = isDemoExplore() ? (getWorkspaceRole() || resolved) : resolved
      if (nextRole) {
        if (!isDemoExplore()) setWorkspaceRole(nextRole)
        setWorkspaceMode(isDemoExplore() ? 'demo' : 'authorized')
        setRole(nextRole)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }, [missionId, profile?.id, profile?.demoRole])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    missionId,
    profile,
    detail,
    prep,
    percent,
    appointments,
    wakeNote,
    symptoms,
    grants,
    error,
    loading,
    refresh,
    role: role || getWorkspaceRole(),
    mode: getWorkspaceMode(),
    demo: isDemoExplore(),
  }
}