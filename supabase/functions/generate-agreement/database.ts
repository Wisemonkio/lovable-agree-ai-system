
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Employee } from './types.ts'

export const createSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export const updateEmployeeStatus = async (employeeId: string, status: string, additionalData: Record<string, any> = {}) => {
  const supabase = createSupabaseClient()
  
  const { error } = await supabase
    .from('employee_details')
    .update({
      agreement_status: status,
      ...additionalData
    })
    .eq('id', employeeId)

  if (error) {
    throw new Error(`Failed to update status: ${error.message}`)
  }
}

export const fetchEmployee = async (employeeId: string): Promise<Employee> => {
  const supabase = createSupabaseClient()
  
  const { data: employee, error } = await supabase
    .from('employee_details')
    .select('*')
    .eq('id', employeeId)
    .single()

  if (error) {
    throw new Error(`Employee not found: ${error.message}`)
  }

  if (!employee) {
    throw new Error('Employee data is null')
  }

  return employee as Employee
}

export const uploadPDF = async (fileName: string, pdfBuffer: Uint8Array) => {
  const supabase = createSupabaseClient()
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('employee-agreements')
    .upload(fileName, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true
    })

  if (uploadError) {
    throw new Error(`Failed to upload PDF: ${uploadError.message}`)
  }

  const { data: { publicUrl } } = supabase.storage
    .from('employee-agreements')
    .getPublicUrl(fileName)

  return { uploadData, publicUrl }
}

export const createGeneratedAgreementRecord = async (employeeId: string, fileName: string, publicUrl: string, processingTime: number, employee: Employee) => {
  const supabase = createSupabaseClient()
  
  const { error } = await supabase
    .from('generated_agreements')
    .insert({
      employee_id: employeeId,
      pdf_download_url: publicUrl,
      file_name: fileName,
      generation_status: 'completed',
      processing_time_seconds: processingTime,
      salary_breakdown: {
        annual_gross_salary: employee.annual_gross_salary,
        monthly_gross: employee.monthly_gross,
        annual_basic: employee.annual_basic,
        monthly_basic: employee.monthly_basic,
        annual_hra: employee.annual_hra,
        monthly_hra: employee.monthly_hra,
        yfbp: employee.yfbp,
        mfbp: employee.mfbp
      }
    })

  if (error) {
    console.error('Insert error:', error)
    console.log('Warning: Failed to create generated_agreements record, but PDF generation was successful')
  }
}
