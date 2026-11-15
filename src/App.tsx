import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RouteFallback } from './components/RouteFallback'
import { PublicLayout } from './components/public/PublicLayout'

const HomePage = lazy(() => import('./pages/public/HomePage').then((m) => ({ default: m.HomePage })))
const ProyectoPage = lazy(() => import('./pages/public/ProyectoPage').then((m) => ({ default: m.ProyectoPage })))
const ComoFuncionaPage = lazy(() =>
  import('./pages/public/ComoFuncionaPage').then((m) => ({ default: m.ComoFuncionaPage })),
)
const NosotrosPage = lazy(() => import('./pages/public/NosotrosPage').then((m) => ({ default: m.NosotrosPage })))
const PerfilPage = lazy(() => import('./pages/public/PerfilPage').then((m) => ({ default: m.PerfilPage })))
const VideoPage = lazy(() => import('./pages/public/VideoPage').then((m) => ({ default: m.VideoPage })))
const DocumentosPage = lazy(() =>
  import('./pages/public/DocumentosPage').then((m) => ({ default: m.DocumentosPage })),
)
const DatosPage = lazy(() => import('./pages/public/DatosPage').then((m) => ({ default: m.DatosPage })))

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<LazyPage><HomePage /></LazyPage>} />
          <Route path="proyecto" element={<LazyPage><ProyectoPage /></LazyPage>} />
          <Route path="como-funciona" element={<LazyPage><ComoFuncionaPage /></LazyPage>} />
          <Route path="nosotros" element={<LazyPage><NosotrosPage /></LazyPage>} />
          <Route path="nosotros/:slug" element={<LazyPage><PerfilPage /></LazyPage>} />
          <Route path="video" element={<LazyPage><VideoPage /></LazyPage>} />
          <Route path="documentos" element={<LazyPage><DocumentosPage /></LazyPage>} />
          <Route path="datos" element={<LazyPage><DatosPage /></LazyPage>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
