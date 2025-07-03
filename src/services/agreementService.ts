
import { supabase } from '@/integrations/supabase/client'

export interface AgreementGenerationResponse {
  success: boolean
  employee_id?: string
  document_urls?: {
    pdf_url: string
    doc_url: string
    pdf_download_url: string
  }
  message?: string
  error?: string
}

export const generateEmployeeAgreement = async (employeeId: string): Promise<AgreementGenerationResponse> => {
  try {
    console.log(`Calling Edge Function for employee: ${employeeId}`)
    
    const { data, error } = await supabase.functions.invoke('generate-agreement', {
      body: { employee_id: employeeId }
    })
    
    if (error) {
      console.error('Edge Function error:', error)
      throw new Error(error.message || 'Failed to generate agreement')
    }
    
    console.log('Edge Function response:', data)
    return data as AgreementGenerationResponse
    
  } catch (error) {
    console.error('Error calling agreement generation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export const checkAgreementStatus = async (employeeId: string) => {
  try {
    const { data, error } = await supabase
      .from('employee_details')
      .select('agreement_status, pdf_url, doc_url, pdf_download_url, processing_started_at, processing_completed_at')
      .eq('id', employeeId)
      .single()
    
    if (error) throw error
    return data
    
  } catch (error) {
    console.error('Error checking agreement status:', error)
    return null
  }
}

export const downloadAgreement = async (downloadUrl: string, fileName: string) => {
  try {
    const response = await fetch(downloadUrl)
    const blob = await response.blob()
    
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
  } catch (error) {
    console.error('Error downloading agreement:', error)
    throw new Error('Failed to download agreement')
  }
}
