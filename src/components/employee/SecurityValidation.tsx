
import { z } from 'zod'

// Security validation schemas
export const EmployeeSecuritySchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters'),
  
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters'),
  
  email: z.string()
    .email('Invalid email format')
    .max(254, 'Email must be less than 254 characters')
    .toLowerCase(),
  
  jobTitle: z.string()
    .min(1, 'Job title is required')
    .max(100, 'Job title must be less than 100 characters'),
  
  annualGrossSalary: z.number()
    .min(1, 'Salary must be greater than 0')
    .max(100000000, 'Salary cannot exceed 100 million')
    .int('Salary must be a whole number'),
  
  clientName: z.string()
    .min(1, 'Company name is required')
    .max(100, 'Company name must be less than 100 characters'),
  
  clientEmail: z.string()
    .email('Invalid client email format')
    .max(254, 'Client email must be less than 254 characters')
    .toLowerCase(),
  
  aadhar: z.string()
    .optional()
    .refine((val) => !val || /^\d{12}$/.test(val), 'Aadhar must be 12 digits'),
  
  pincode: z.string()
    .optional()
    .refine((val) => !val || /^\d{6}$/.test(val), 'Pincode must be 6 digits'),
  
  age: z.number()
    .optional()
    .refine((val) => !val || (val >= 18 && val <= 100), 'Age must be between 18 and 100')
})

// Sanitize text input to prevent XSS
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

// Validate file uploads (for future use)
export const validateFileUpload = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
  const maxSize = 10 * 1024 * 1024 // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only PDF, JPEG, and PNG files are allowed.' }
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 10MB limit.' }
  }
  
  return { valid: true }
}

// Rate limiting for form submissions (client-side protection)
export class FormRateLimit {
  private static submissions: number[] = []
  private static readonly MAX_SUBMISSIONS = 5
  private static readonly TIME_WINDOW = 60000 // 1 minute
  
  static canSubmit(): boolean {
    const now = Date.now()
    
    // Remove old submissions outside time window
    this.submissions = this.submissions.filter(time => now - time < this.TIME_WINDOW)
    
    if (this.submissions.length >= this.MAX_SUBMISSIONS) {
      return false
    }
    
    this.submissions.push(now)
    return true
  }
  
  static getTimeUntilNextSubmission(): number {
    if (this.submissions.length === 0) return 0
    
    const oldestSubmission = Math.min(...this.submissions)
    const timeUntilReset = this.TIME_WINDOW - (Date.now() - oldestSubmission)
    
    return Math.max(0, timeUntilReset)
  }
}
