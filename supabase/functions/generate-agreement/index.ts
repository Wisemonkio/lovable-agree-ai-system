
// Re-deployed: Agreement generation edge function
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Employee } from './types.ts'
import { fetchEmployee, updateEmployeeStatus, uploadPDF, createGeneratedAgreementRecord } from './database.ts'
import { generateAgreementPDF } from './pdf-generator.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const sendEmployeeNotificationEmail = async (employee: Employee) => {
  try {
    console.log(`📧 Sending notification email to: ${employee.email}`)
    
    const emailSubject = 'Please sign your agreement'
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">Welcome to ${employee.client_name || 'Our Company'}!</h2>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6;">Dear ${employee.first_name} ${employee.last_name},</p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Congratulations on your new position as <strong>${employee.job_title}</strong>! We are excited to have you join our team.
          </p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Your employment agreement has been generated and is ready for your review and signature. Please take some time to carefully read through the document.
          </p>
          
          <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c5aa0; margin-top: 0;">Next Steps:</h3>
            <ul style="color: #555; font-size: 16px; line-height: 1.6;">
              <li>Review your employment agreement carefully</li>
              <li>Sign the agreement electronically when ready</li>
              <li>Contact us if you have any questions</li>
            </ul>
          </div>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            If you have any questions about your agreement or need clarification on any terms, please don't hesitate to reach out to us.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #777; font-size: 14px; margin: 0;">
              Best regards,<br>
              <strong>${employee.client_name || 'Your Company'} Team</strong>
            </p>
          </div>
        </div>
      </div>
    `
    
    const emailText = `
      Welcome to ${employee.client_name || 'Our Company'}!
      
      Dear ${employee.first_name} ${employee.last_name},
      
      Congratulations on your new position as ${employee.job_title}! We are excited to have you join our team.
      
      Your employment agreement has been generated and is ready for your review and signature. Please take some time to carefully read through the document.
      
      Next Steps:
      - Review your employment agreement carefully
      - Sign the agreement electronically when ready
      - Contact us if you have any questions
      
      If you have any questions about your agreement or need clarification on any terms, please don't hesitate to reach out to us.
      
      Best regards,
      ${employee.client_name || 'Your Company'} Team
    `

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

    const { data, error } = await supabase.functions.invoke('send-email-api', {
      body: {
        to: employee.email,
        subject: emailSubject,
        html: emailHtml,
        text: emailText
      }
    })

    if (error) {
      console.error('❌ Email sending failed:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Email sent successfully:', data)
    return { success: true, data }

  } catch (error) {
    console.error('💥 Error in sendEmployeeNotificationEmail:', error)
    return { success: false, error: error.message }
  }
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
    
    // Send notification email to employee
    console.log('📧 Sending notification email to employee...')
    const emailResult = await sendEmployeeNotificationEmail(employee)
    
    if (emailResult.success) {
      console.log('✅ Email sent successfully to employee')
    } else {
      console.warn('⚠️ Email sending failed but continuing with agreement generation:', emailResult.error)
      // Note: We don't fail the entire process if email fails
    }
    
    console.log(`🎉 Agreement generated successfully in ${processingTime}s`)
    console.log(`📊 Template Summary: ${templateSource} template used for ${employee.client_name || 'N/A'}`)
    console.log(`📧 Email Status: ${emailResult.success ? 'SENT' : 'FAILED'}`)
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
        },
        emailSent: emailResult.success
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
