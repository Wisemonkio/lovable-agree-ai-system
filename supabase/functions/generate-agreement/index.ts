
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import type { Employee, AgreementGenerationResponse } from './types.ts'
import { fetchGoogleDocsContent, replacePlaceholders } from './template.ts'
import { generatePDF } from './pdf-generator.ts'
import { updateEmployeeStatus, fetchEmployee, uploadPDF, createGeneratedAgreementRecord } from './database.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== Edge Function Started ===')

    const { employee_id } = await req.json()

    if (!employee_id) {
      throw new Error('Employee ID is required')
    }

    console.log('Processing employee:', employee_id)

    // Update status to processing
    console.log('Updating status to processing...')
    await updateEmployeeStatus(employee_id, 'processing', {
      processing_started_at: new Date().toISOString()
    })

    // Fetch employee details
    console.log('Fetching employee details...')
    const employee = await fetchEmployee(employee_id)
    console.log('Employee fetched successfully:', employee.first_name, employee.last_name)

    // Fetch Google Docs template
    console.log('Fetching Google Docs template...')
    const docId = '1CpMQCfZn4ePyNr_2bYfr2IgCTZMeAJ_Og3vDwmR--zc'
    const templateContent = await fetchGoogleDocsContent(docId)
    
    // Replace placeholders with employee data
    console.log('Processing template with employee data...')
    const processedContent = replacePlaceholders(templateContent, employee)

    // Generate PDF
    console.log('Generating PDF...')
    const pdfBuffer = generatePDF(processedContent, employee)
    const fileName = `employment_agreement_${employee.first_name}_${employee.last_name}_${Date.now()}.pdf`

    console.log('PDF generated, uploading to storage...')
    console.log('File name:', fileName)
    console.log('Buffer size:', pdfBuffer.byteLength)

    // Upload to Supabase Storage
    const { publicUrl } = await uploadPDF(fileName, pdfBuffer)
    console.log('Upload successful, public URL:', publicUrl)

    // Update employee record with URLs
    console.log('Updating employee record with URLs...')
    await updateEmployeeStatus(employee_id, 'completed', {
      pdf_url: publicUrl,
      pdf_download_url: publicUrl,
      processing_completed_at: new Date().toISOString()
    })

    // Create generated_agreements record
    console.log('Creating generated_agreements record...')
    const processingStartTime = employee.processing_started_at ? new Date(employee.processing_started_at).getTime() : Date.now()
    const processingTime = Math.floor((Date.now() - processingStartTime) / 1000)
    
    await createGeneratedAgreementRecord(employee_id, fileName, publicUrl, processingTime, employee)

    console.log('=== Agreement generated successfully ===')

    return new Response(
      JSON.stringify({
        success: true,
        employee_id: employee_id,
        document_urls: {
          pdf_url: publicUrl,
          pdf_download_url: publicUrl,
          doc_url: publicUrl
        },
        message: 'Employment agreement generated successfully using Google Docs template'
      } as AgreementGenerationResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('=== Edge Function Error ===')
    console.error('Error details:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate agreement',
        details: error.stack || 'No stack trace available'
      } as AgreementGenerationResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
