
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Employee } from './types.ts'
import { fetchEmployee, updateEmployeeStatus, uploadPDF, createGeneratedAgreementRecord } from './database.ts'
import { generateAgreementPDF } from './pdf-generator.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()
  
  try {
    const { employeeId } = await req.json()
    
    if (!employeeId) {
      return new Response(
        JSON.stringify({ error: 'Employee ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Starting agreement generation for employee: ${employeeId}`)
    
    // Update status to processing
    await updateEmployeeStatus(employeeId, 'processing', {
      processing_started_at: new Date().toISOString()
    })

    // Fetch employee data
    const employee = await fetchEmployee(employeeId)
    console.log(`Employee fetched: ${employee.first_name} ${employee.last_name}`)

    // Check for company-specific template
    let templateDocId = Deno.env.get('DEFAULT_GOOGLE_DOC_ID')
    
    if (employee.client_name) {
      console.log(`Checking for custom template for company: ${employee.client_name}`)
      
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
      
      const { data: companyTemplate, error: templateError } = await supabase
        .from('company_agreement_templates')
        .select('google_doc_id, google_doc_url, template_name')
        .eq('company_name', employee.client_name)
        .eq('is_active', true)
        .single()
      
      if (!templateError && companyTemplate) {
        templateDocId = companyTemplate.google_doc_id
        console.log(`Using custom template for ${employee.client_name}: ${companyTemplate.template_name}`)
      } else {
        console.log(`No custom template found for ${employee.client_name}, using default template`)
      }
    }

    if (!templateDocId) {
      throw new Error('No template document ID available (neither custom nor default)')
    }

    // Generate the PDF
    console.log(`Generating PDF with template: ${templateDocId}`)
    const pdfBuffer = await generateAgreementPDF(employee, templateDocId)
    
    // Upload to storage
    const fileName = `agreement_${employee.first_name}_${employee.last_name}_${employeeId}.pdf`
    const { publicUrl } = await uploadPDF(fileName, pdfBuffer)
    
    // Update employee with PDF URL and completion status
    const processingTime = Math.round((Date.now() - startTime) / 1000)
    
    await updateEmployeeStatus(employeeId, 'completed', {
      pdf_download_url: publicUrl,
      processing_completed_at: new Date().toISOString()
    })
    
    // Create generated agreement record
    await createGeneratedAgreementRecord(employeeId, fileName, publicUrl, processingTime, employee)
    
    console.log(`Agreement generated successfully in ${processingTime}s`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        pdfUrl: publicUrl,
        processingTime 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error generating agreement:', error)
    
    // Try to update employee status to failed if we have the employeeId
    try {
      const body = await req.clone().json()
      if (body.employeeId) {
        await updateEmployeeStatus(body.employeeId, 'failed', {
          processing_completed_at: new Date().toISOString()
        })
      }
    } catch (updateError) {
      console.error('Failed to update employee status:', updateError)
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
