import { useApp } from '../../state/store'
import { QuironChat } from './QuironChat'

/** Montaje dentro de AppProvider: pasa el estado autorizado del panel. */
export function QuironDashboard() {
  const { state } = useApp()
  return <QuironChat mode="dashboard" state={state} />
}
