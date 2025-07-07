
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
  console.log('=== AGREEMENT GENERATION STARTED ===')
  
  try {
    const body = await req.json()
    const { employeeId, employee_id } = body
    const finalEmployeeId = employeeId || employee_id
    
    console.log('Request body received:', JSON.stringify(body, null, 2))
    console.log('Final employee ID to process:', finalEmployeeId)
    
    if (!finalEmployeeId) {
      console.error('❌ Employee ID is missing from request')
      return new Response(
        JSON.stringify({ error: 'Employee ID is required', success: false }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🚀 Starting agreement generation for employee: ${finalEmployeeId}`)
    
    // Update status to processing
    console.log('📝 Updating employee status to processing...')
    await updateEmployeeStatus(finalEmployeeId, 'processing', {
      processing_started_at: new Date().toISOString()
    })

    // Fetch employee data
    console.log('👤 Fetching employee data...')
    const employee = await fetchEmployee(finalEmployeeId)
    console.log(`✅ Employee fetched: ${employee.first_name} ${employee.last_name}`)
    console.log('Employee data:', JSON.stringify({
      name: `${employee.first_name} ${employee.last_name}`,
      email: employee.email,
      client_name: employee.client_name,
      job_title: employee.job_title
    }, null, 2))

    // Template selection logic
    let templateDocId = null
    let templateSource = 'none'
    let templateDetails = null
    
    const defaultTemplateId = Deno.env.get('DEFAULT_GOOGLE_DOC_ID')
    console.log('🔧 Environment variables check:')
    console.log('   DEFAULT_GOOGLE_DOC_ID exists:', !!defaultTemplateId)
    console.log('   DEFAULT_GOOGLE_DOC_ID value:', defaultTemplateId ? `${defaultTemplateId.substring(0, 10)}...` : 'NOT SET')
    
    if (employee.client_name) {
      console.log(`🏢 Checking for custom template for company: ${employee.client_name}`)
      
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
        templateSource = 'custom'
        templateDetails = companyTemplate
        console.log(`✅ Using CUSTOM template for ${employee.client_name}:`)
        console.log(`   Template Name: ${companyTemplate.template_name}`)
        console.log(`   Template ID: ${companyTemplate.google_doc_id}`)
        console.log(`   Template URL: ${companyTemplate.google_doc_url}`)
      } else {
        console.log(`ℹ️ No custom template found for company: ${employee.client_name}`)
        if (templateError) {
          console.log('   Template query error:', templateError)
        }
        
        // Use default template for companies without custom templates
        if (defaultTemplateId) {
          templateDocId = defaultTemplateId
          templateSource = 'default'
          console.log(`📄 Using DEFAULT/GENERIC template for company: ${employee.client_name}`)
          console.log(`   Default Template ID: ${defaultTemplateId}`)
        }
      }
    } else {
      console.log('ℹ️ No company name provided, using default template')
      if (defaultTemplateId) {
        templateDocId = defaultTemplateId
        templateSource = 'default'
        console.log(`📄 Using DEFAULT template (no company): ${defaultTemplateId}`)
      }
    }

    // Final template validation
    if (!templateDocId) {
      console.error('❌ TEMPLATE CONFIGURATION ERROR:')
      console.error('   - Company Name:', employee.client_name || 'N/A')
      console.error('   - Custom template found: NO')
      console.error('   - Default template configured:', !!defaultTemplateId)
      console.error('   - Default template value:', defaultTemplateId || 'NOT SET')
      console.error('')
      console.error('🔧 SOLUTION: Set the DEFAULT_GOOGLE_DOC_ID secret in Supabase Edge Functions')
      console.error('   1. Go to Supabase Dashboard > Edge Functions > Settings')
      console.error('   2. Add secret: DEFAULT_GOOGLE_DOC_ID')
      console.error('   3. Set value to your generic Google Docs template ID')
      console.error('')
      throw new Error('No template document ID available. Please configure DEFAULT_GOOGLE_DOC_ID secret.')
    }

    console.log(`🎯 FINAL TEMPLATE SELECTION:`)
    console.log(`   Source: ${templateSource.toUpperCase()}`)
    console.log(`   Company: ${employee.client_name || 'N/A'}`)
    console.log(`   Template ID: ${templateDocId}`)
    if (templateDetails) {
      console.log(`   Template Name: ${templateDetails.template_name}`)
    }

    // Generate the PDF using Google Docs workflow for both custom and default templates
    console.log(`📋 Generating PDF with template: ${templateDocId}`)
    console.log(`🔄 Template processing mode: Google Docs workflow (${templateSource})`)
    
    const pdfBuffer = await generateAgreementPDF(employee, templateDocId)
    console.log(`✅ PDF generated successfully, size: ${pdfBuffer.length} bytes`)
    
    // Upload to storage
    const fileName = `agreement_${employee.first_name}_${employee.last_name}_${finalEmployeeId}.pdf`
    console.log(`📤 Uploading PDF with filename: ${fileName}`)
    const { publicUrl } = await uploadPDF(fileName, pdfBuffer)
    console.log(`✅ PDF uploaded successfully to: ${publicUrl}`)
    
    // Update employee with PDF URL and completion status
    const processingTime = Math.round((Date.now() - startTime) / 1000)
    console.log(`📝 Updating employee status to completed, processing time: ${processingTime}s`)
    
    await updateEmployeeStatus(finalEmployeeId, 'completed', {
      pdf_download_url: publicUrl,
      processing_completed_at: new Date().toISOString()
    })
    
    // Create generated agreement record
    console.log('📋 Creating generated agreement record...')
    await createGeneratedAgreementRecord(finalEmployeeId, fileName, publicUrl, processingTime, employee)
    
    console.log(`🎉 Agreement generated successfully in ${processingTime}s`)
    console.log(`📊 Template Summary: ${templateSource} template used for ${employee.client_name || 'N/A'}`)
    console.log('=== AGREEMENT GENERATION COMPLETED ===')
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        pdfUrl: publicUrl,
        processingTime,
        employeeId: finalEmployeeId,
        templateUsed: {
          source: templateSource,
          templateId: templateDocId,
          companyName: employee.client_name
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Error generating agreement:', error)
    console.error('Error stack:', error.stack)
    
    // Try to update employee status to failed if we have the employeeId
    try {
      const body = await req.clone().json()
      const finalEmployeeId = body.employeeId || body.employee_id
      if (finalEmployeeId) {
        console.log(`📝 Updating employee ${finalEmployeeId} status to failed`)
        await updateEmployeeStatus(finalEmployeeId, 'failed', {
          processing_completed_at: new Date().toISOString()
        })
      }
    } catch (updateError) {
      console.error('Failed to update employee status:', updateError)
    }
    
    console.log('=== AGREEMENT GENERATION FAILED ===')
    
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
