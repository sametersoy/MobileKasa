import { useLayoutContext } from '@/context/useLayoutContext'
import { useAuth } from '@/hooks/useAuth'
import HorizontalLayout from '@/layouts/HorizontalLayout'
import VerticalLayout from '@/layouts/VerticalLayout'
import { Navigate, Outlet } from 'react-router'

const MainLayout = () => {
  const { orientation } = useLayoutContext()
  const { isAuthenticated, role } = useAuth()

  if (!isAuthenticated) return null
  if (role === 'sakin') return <Navigate to="/sakin/panelim" replace />

  return (
    <>
      {orientation === 'vertical' && <VerticalLayout><Outlet /></VerticalLayout>}
      {orientation === 'horizontal' && <HorizontalLayout><Outlet /></HorizontalLayout>}
    </>
  )
}

export default MainLayout