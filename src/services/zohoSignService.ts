
import { supabase } from '@/integrations/supabase/client'

export interface SendForSigningResponse {
  success: boolean
  message: string
  request_id?: string
  error?: string
}

export interface ClientInfo {
  clientName: string
  clientEmail: string
}

export const sendForSigning = async (employeeId: string, clientInfo?: ClientInfo): Promise<SendForSigningResponse> => {
  try {
    const requestBody: any = { employeeId }
    
    if (clientInfo) {
      requestBody.clientName = clientInfo.clientName
      requestBody.clientEmail = clientInfo.clientEmail
    }

    const { data, error } = await supabase.functions.invoke('send-for-signing', {
      body: requestBody
    })

    if (error) {
      throw new Error(error.message || 'Failed to send for signing')
    }

    return data
  } catch (error) {
    console.error('Error in sendForSigning:', error)
    throw error
  }
}

export const checkSigningStatus = async (requestId: string) => {
  // This would be used to check the status of a signing request
  // Implementation would depend on Zoho Sign webhook or polling strategy
  try {
    const { data, error } = await supabase.functions.invoke('check-signing-status', {
      body: { requestId }
    })

    if (error) {
      throw new Error(error.message || 'Failed to check signing status')
    }

    return data
  } catch (error) {
    console.error('Error checking signing status:', error)
    throw error
  }
}
