
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import type { Employee, AgreementGenerationResponse } from './types.ts'
import { replacePlaceholdersInDoc, exportDocAsPDF, createDocumentCopy, deleteDocument, fetchGoogleDocsContent, replacePlaceholders } from './template.ts'
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

    let pdfBuffer: Uint8Array
    let fileName = `employment_agreement_${employee.first_name}_${employee.last_name}_${Date.now()}.pdf`

    try {
      // Try Google Docs API approach first
      console.log('Attempting Google Docs API approach...')
      
      // Create a copy of the template document
      console.log('Creating copy of template document...')
      const templateDocId = '1CpMQCfZn4ePyNr_2bYfr2IgCTZMeAJ_Og3vDwmR--zc'
      const copyTitle = `Employment_Agreement_${employee.first_name}_${employee.last_name}_${Date.now()}`
      const copyDocId = await createDocumentCopy(templateDocId, copyTitle)
      console.log('Document copy created with ID:', copyDocId)
      
      // Replace placeholders in the copied document
      console.log('Replacing placeholders in document...')
      await replacePlaceholdersInDoc(copyDocId, employee)
      
      // Export the document as PDF
      console.log('Exporting document as PDF...')
      pdfBuffer = await exportDocAsPDF(copyDocId)
      
      // Clean up - delete the temporary document copy
      console.log('Cleaning up temporary document...')
      try {
        await deleteDocument(copyDocId)
        console.log('Temporary document deleted successfully')
      } catch (deleteError) {
        console.warn('Failed to delete temporary document:', deleteError)
        // Continue execution even if cleanup fails
      }
      
      console.log('Google Docs API approach successful!')
      
    } catch (googleError) {
      console.warn('Google Docs API approach failed, falling back to text-based approach:', googleError)
      
      // Fallback to existing text-based approach
      console.log('Fetching Google Docs template content...')
      const docId = '1CpMQCfZn4ePyNr_2bYfr2IgCTZMeAJ_Og3vDwmR--zc'
      const templateContent = await fetchGoogleDocsContent(docId)
      
      // Replace placeholders with employee data
      console.log('Processing template with employee data...')
      const processedContent = replacePlaceholders(templateContent, employee)

      // Generate PDF using existing PDF generator
      console.log('Generating PDF using fallback method...')
      pdfBuffer = generatePDF(processedContent, employee)
    }

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
    
    // Try to update employee status to failed
    try {
      const { employee_id } = await req.json()
      if (employee_id) {
        await updateEmployeeStatus(employee_id, 'failed', {
          error_message: error.message,
          processing_completed_at: new Date().toISOString()
        })
      }
    } catch (statusUpdateError) {
      console.error('Failed to update employee status:', statusUpdateError)
    }
    
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
