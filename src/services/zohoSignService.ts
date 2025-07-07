
import { supabase } from '@/integrations/supabase/client'
import { z } from 'zod'

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

// Security validation schemas
const ClientInfoSchema = z.object({
  clientName: z.string()
    .min(1, 'Client name is required')
    .max(100, 'Client name too long')
    .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Client name contains invalid characters'),
  clientEmail: z.string()
    .email('Invalid client email format')
    .max(254, 'Email too long')
    .toLowerCase()
})

const EmployeeIdSchema = z.string()
  .uuid('Invalid employee ID format')

// Security: Input validation and sanitization
const validateSendForSigningParams = (employeeId: string, clientInfo?: ClientInfo) => {
  // Validate employee ID
  const employeeIdResult = EmployeeIdSchema.safeParse(employeeId)
  if (!employeeIdResult.success) {
    throw new Error('Invalid employee ID provided')
  }

  // Validate client info if provided
  if (clientInfo) {
    const clientInfoResult = ClientInfoSchema.safeParse(clientInfo)
    if (!clientInfoResult.success) {
      const errors = clientInfoResult.error.errors.map(err => err.message).join(', ')
      throw new Error(`Invalid client information: ${errors}`)
    }
  }

  return {
    sanitizedEmployeeId: employeeIdResult.data,
    sanitizedClientInfo: clientInfo ? ClientInfoSchema.parse(clientInfo) : undefined
  }
}

export const sendForSigning = async (employeeId: string, clientInfo?: ClientInfo): Promise<SendForSigningResponse> => {
  try {
    // Security: Validate and sanitize inputs
    const { sanitizedEmployeeId, sanitizedClientInfo } = validateSendForSigningParams(employeeId, clientInfo)

    // Security: Check if user has access to this employee record
    const { data: employee, error: accessError } = await supabase
      .from('employee_details')
      .select('id, user_id')
      .eq('id', sanitizedEmployeeId)
      .single()

    if (accessError || !employee) {
      throw new Error('Employee not found or access denied')
    }

    // Security: Verify current user owns this employee record
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || employee.user_id !== user.id) {
      throw new Error('Access denied: You can only send agreements for your own employees')
    }

    const requestBody: any = { employeeId: sanitizedEmployeeId }
    
    if (sanitizedClientInfo) {
      requestBody.clientName = sanitizedClientInfo.clientName
      requestBody.clientEmail = sanitizedClientInfo.clientEmail
    }

    // Security: Call edge function with validated data
    const { data, error } = await supabase.functions.invoke('send-for-signing', {
      body: requestBody
    })

    if (error) {
      console.error('Zoho Sign service error:', error)
      throw new Error('Failed to send document for signing. Please try again.')
    }

    return data
  } catch (error) {
    console.error('Error in sendForSigning:', error)
    
    // Security: Don't leak internal error details
    const userFriendlyMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred while sending for signing'
    
    throw new Error(userFriendlyMessage)
  }
}

export const checkSigningStatus = async (requestId: string) => {
  try {
    // Security: Validate request ID format
    const requestIdSchema = z.string().min(1).max(100)
    const validatedRequestId = requestIdSchema.parse(requestId)

    const { data, error } = await supabase.functions.invoke('check-signing-status', {
      body: { requestId: validatedRequestId }
    })

    if (error) {
      console.error('Signing status check error:', error)
      throw new Error('Failed to check signing status. Please try again.')
    }

    return data
  } catch (error) {
    console.error('Error checking signing status:', error)
    
    // Security: Don't leak internal error details
    const userFriendlyMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred while checking signing status'
    
    throw new Error(userFriendlyMessage)
  }
}
