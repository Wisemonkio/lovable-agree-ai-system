import { useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'

declare global {
  interface Window {
    Intercom: any
    intercomSettings: any
  }
}

export const useIntercom = () => {
  const { user } = useAuth()
  const isInitialized = useRef(false)

  useEffect(() => {
    const appId = import.meta.env.VITE_INTERCOM_APP_ID
    
    if (!appId) {
      console.warn('Intercom App ID not found. Please set VITE_INTERCOM_APP_ID in your environment variables.')
      return
    }

    // Load Intercom script
    const script = document.createElement('script')
    script.src = `https://widget.intercom.io/widget/${appId}`
    script.async = true
    document.body.appendChild(script)

    script.onload = () => {
      if (!isInitialized.current) {
        window.Intercom('boot', {
          app_id: appId,
          user_id: user?.id,
          email: user?.email,
          created_at: user?.created_at ? new Date(user.created_at).getTime() / 1000 : undefined,
        })
        isInitialized.current = true
      }
    }

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  // Update user data when authentication changes
  useEffect(() => {
    if (isInitialized.current && window.Intercom) {
      if (user) {
        window.Intercom('update', {
          user_id: user.id,
          email: user.email,
          created_at: user.created_at ? new Date(user.created_at).getTime() / 1000 : undefined,
        })
      } else {
        window.Intercom('shutdown')
        isInitialized.current = false
      }
    }
  }, [user])

  const showMessenger = () => {
    if (window.Intercom) {
      window.Intercom('show')
    }
  }

  const hideMessenger = () => {
    if (window.Intercom) {
      window.Intercom('hide')
    }
  }

  return {
    showMessenger,
    hideMessenger,
  }
}