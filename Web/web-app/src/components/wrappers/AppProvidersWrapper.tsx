import { BuildingProvider } from '@/context/BuildingContext'
import { StoreProvider } from '@/context/StoreContext'
import { LayoutProvider } from '@/context/useLayoutContext'
import { NotificationProvider } from '@/context/useNotificationContext'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate, useLocation } from 'react-router'
import React, { useEffect } from 'react'

const PUBLIC_PATHS = ['/']

const AppProvidersWrapper = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { isAuthenticated, role } = useAuth()

  useEffect(() => {
    const isPublic = PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/auth/')

    if (!isAuthenticated && !isPublic) {
      navigate('/', { replace: true })
      return
    }

    if (isAuthenticated && role === 'sakin' && !pathname.startsWith('/sakin')) {
      navigate('/sakin/panelim', { replace: true })
    }
  }, [pathname, isAuthenticated, role])

  const needsBuildings = isAuthenticated && role !== 'sakin'

  return (
    <LayoutProvider>
      <NotificationProvider>
        {needsBuildings ? (
          <StoreProvider>
            <BuildingProvider>{children}</BuildingProvider>
          </StoreProvider>
        ) : (
          children
        )}
      </NotificationProvider>
    </LayoutProvider>
  )
}

export default AppProvidersWrapper
