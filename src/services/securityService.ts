import { z } from 'zod'
import { EmployeeSecuritySchema, sanitizeInput, FormRateLimit } from '@/components/employee/SecurityValidation'

// Enhanced security schemas for edge function validation
export const EdgeFunctionRequestSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID format'),
  timestamp: z.number().optional(),
  requestId: z.string().optional()
})

export const ClientInfoSecuritySchema = z.object({
  clientName: z.string()
    .min(1, 'Client name is required')
    .max(100, 'Client name too long')
    .regex(/^[a-zA-Z0-9\s\-&.,()]+$/, 'Client name contains invalid characters'),
  clientEmail: z.string()
    .email('Invalid client email format')
    .max(254, 'Client email too long')
    .toLowerCase()
})

// Security utility functions
export class SecurityService {
  // Validate and sanitize all string inputs
  static sanitizeAndValidate(input: any, schema: z.ZodSchema): any {
    // First sanitize string inputs
    const sanitized = this.deepSanitize(input)
    
    // Then validate with schema
    const result = schema.safeParse(sanitized)
    if (!result.success) {
      throw new Error(`Validation failed: ${result.error.errors.map(e => e.message).join(', ')}`)
    }
    
    return result.data
  }

  // Deep sanitization for nested objects
  static deepSanitize(obj: any): any {
    if (typeof obj === 'string') {
      return sanitizeInput(obj)
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepSanitize(item))
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.deepSanitize(value)
      }
      return sanitized
    }
    
    return obj
  }

  // Check rate limiting
  static checkRateLimit(): boolean {
    return FormRateLimit.canSubmit()
  }

  // Generate secure request ID
  static generateRequestId(): string {
    return crypto.randomUUID()
  }

  // Validate request size
  static validateRequestSize(request: any, maxSizeKB: number = 100): boolean {
    const requestSize = JSON.stringify(request).length
    const maxSizeBytes = maxSizeKB * 1024
    
    if (requestSize > maxSizeBytes) {
      throw new Error(`Request too large: ${requestSize} bytes. Maximum allowed: ${maxSizeBytes} bytes`)
    }
    
    return true
  }

  // Security headers for responses
  static getSecurityHeaders() {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'",
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  }

  // Log security events
  static logSecurityEvent(event: string, details: any, severity: 'low' | 'medium' | 'high' = 'medium') {
    console.log(`[SECURITY-${severity.toUpperCase()}] ${event}:`, {
      timestamp: new Date().toISOString(),
      ...details
    })
  }
}

// Request validation middleware for edge functions
export const validateEdgeFunctionRequest = (body: any, schema: z.ZodSchema) => {
  try {
    // Check request size
    SecurityService.validateRequestSize(body)
    
    // Sanitize and validate
    const validated = SecurityService.sanitizeAndValidate(body, schema)
    
    // Log successful validation
    SecurityService.logSecurityEvent('REQUEST_VALIDATED', { 
      hasEmployeeId: !!validated.employeeId 
    }, 'low')
    
    return validated
  } catch (error) {
    SecurityService.logSecurityEvent('VALIDATION_FAILED', { 
      error: error.message,
      requestBody: typeof body === 'object' ? Object.keys(body) : 'invalid'
    }, 'high')
    throw error
  }
}

// Enhanced SQL injection prevention for client-side
export const secureSupabaseQuery = async (
  queryBuilder: any,
  operation: string,
  params: Record<string, any> = {}
) => {
  try {
    // Log the operation
    SecurityService.logSecurityEvent('DB_OPERATION', { operation }, 'low')
    
    // All Supabase operations are already parameterized and safe
    // This wrapper adds logging and monitoring
    const result = await queryBuilder
    
    if (result.error) {
      SecurityService.logSecurityEvent('DB_ERROR', { 
        operation, 
        error: result.error.message 
      }, 'medium')
    }
    
    return result
  } catch (error) {
    SecurityService.logSecurityEvent('DB_EXCEPTION', { 
      operation, 
      error: error.message 
    }, 'high')
    throw error
  }
}