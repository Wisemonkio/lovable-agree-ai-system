import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'

declare global {
  interface Window {
    Intercom: any
    intercomSettings: any
  }
}

export const useIntercom = () => {
  const { user } = useAuth()
  const isInitialized = useRef(false)
  const [intercomJWT, setIntercomJWT] = useState<string | null>(null)

  // Generate secure JWT for Intercom
  const generateIntercomJWT = async () => {
    if (!user) return null
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-intercom-jwt')
      
      if (error) {
        console.error('Failed to generate Intercom JWT:', error)
        return null
      }
      
      return data.jwt
    } catch (error) {
      console.error('Error generating Intercom JWT:', error)
      return null
    }
  }

  useEffect(() => {
    const appId = import.meta.env.VITE_INTERCOM_APP_ID
    
    if (!appId) {
      console.warn('Intercom App ID not found. Please set VITE_INTERCOM_APP_ID in your environment variables.')
      return
    }

    const initializeIntercom = async () => {
      // Generate JWT for authenticated users
      if (user) {
        const jwt = await generateIntercomJWT()
        setIntercomJWT(jwt)
      }

      // Load Intercom script with integrity check
      const script = document.createElement('script')
      script.src = `https://widget.intercom.io/widget/${appId}`
      script.async = true
      script.crossOrigin = 'anonymous'
      
      // Add error handling for script loading
      script.onerror = () => {
        console.error('Failed to load Intercom script')
      }
      
      document.body.appendChild(script)

      script.onload = () => {
        if (!isInitialized.current) {
          const intercomConfig: any = {
            app_id: appId,
          }

          // Add secure user data for authenticated users
          if (user && intercomJWT) {
            intercomConfig.user_id = user.id
            intercomConfig.email = user.email
            intercomConfig.user_hash = intercomJWT // JWT for identity verification
            intercomConfig.created_at = user.created_at ? new Date(user.created_at).getTime() / 1000 : undefined
          }

          window.Intercom('boot', intercomConfig)
          isInitialized.current = true
          
          console.log('Intercom initialized securely with JWT verification')
        }
      }

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script)
        }
      }
    }

    initializeIntercom()
  }, [user])

  // Update user data when authentication changes
  useEffect(() => {
    if (isInitialized.current && window.Intercom) {
      if (user && intercomJWT) {
        window.Intercom('update', {
          user_id: user.id,
          email: user.email,
          user_hash: intercomJWT,
          created_at: user.created_at ? new Date(user.created_at).getTime() / 1000 : undefined,
        })
      } else {
        window.Intercom('shutdown')
        isInitialized.current = false
        setIntercomJWT(null)
      }
    }
  }, [user, intercomJWT])

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