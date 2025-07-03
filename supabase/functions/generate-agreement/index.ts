
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jsPDF } from "https://esm.sh/jspdf@2.5.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Employee {
  id: string
  first_name: string
  last_name: string
  email: string
  job_title: string
  annual_gross_salary: number
  monthly_gross: number
  annual_basic: number
  annual_hra: number
  annual_lta: number
  annual_special_allowance: number
  monthly_basic: number
  monthly_hra: number
  monthly_lta: number
  monthly_special_allowance: number
  yfbp: number
  mfbp: number
  joining_date: string
  client_name?: string
  manager_details?: string
  fathers_name?: string
  age?: number
  address_line1?: string
  city?: string
  state?: string
  pincode?: string
  place?: string
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount)
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const fetchGoogleDocsContent = async (docId: string): Promise<string> => {
  try {
    // Use the public export URL to get plain text content
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`
    const response = await fetch(exportUrl)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.status}`)
    }
    
    const content = await response.text()
    return content
  } catch (error) {
    console.error('Error fetching Google Docs content:', error)
    // Fallback to default template if Google Docs fetch fails
    return getDefaultTemplate()
  }
}

const getDefaultTemplate = (): string => {
  return `EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is entered into on {{Agreement Date}} between {{client Name}} ("Company") and {{Full Name}} ("Employee").

EMPLOYEE INFORMATION:
Name: {{Full Name}}
Father's Name: {{Fathers name}}
Age: {{Age}}
Email: {{email}}
Address: {{Address Line 1}}, {{Address City}}, {{Address State}} - {{Pincode}}

EMPLOYMENT DETAILS:
Position: {{Job role}}
Joining Date: {{Joining Date}}
Place of Work: {{Place}}
Client: {{client Name}}
Manager: {{Manager}}

COMPENSATION:
Annual Gross Salary: {{Annual_gross}}
Monthly Gross Salary: {{Monthly_gross}}

SALARY BREAKDOWN:
- Basic Salary: {{Annual_basic}} per annum ({{Monthly_basic}} per month)
- House Rent Allowance (HRA): {{Annual_hra}} per annum ({{Monthly_hra}} per month)
- Leave Travel Allowance (LTA): {{Annual_LTA}} per annum ({{Monthly_LTA}} per month)
- Special Allowance: {{Annual_special_allowance}} per annum ({{Monthly_special_allowance}} per month)
- Flexible Benefits: {{YFBP}} per annum ({{MFBP}} per month)

TERMS AND CONDITIONS:
1. This agreement is subject to company policies and procedures.
2. The employee agrees to maintain confidentiality of company information.
3. Either party may terminate this agreement with 30 days written notice.
4. The employee agrees to perform duties diligently and professionally.
5. This agreement is governed by the laws of India.

SIGNATURES:
Employee: _____________________ Date: _____________
{{Full Name}}

Company Representative: _____________________ Date: _____________
{{client Name}}`
}

const replacePlaceholders = (template: string, employee: Employee): string => {
  const fullAddress = [
    employee.address_line1,
    employee.city,
    employee.state,
    employee.pincode
  ].filter(Boolean).join(', ')

  const placeholders = {
    '{{client Name}}': employee.client_name || 'N/A',
    '{{Manager}}': employee.manager_details || 'N/A',
    '{{Client Address}}': 'N/A', // Not available in current data
    '{{Client Country}}': 'N/A', // Not available in current data
    '{{First Name}}': employee.first_name,
    '{{last Name}}': employee.last_name,
    '{{Full Name}}': `${employee.first_name} ${employee.last_name}`,
    '{{relation}}': 'N/A', // Not available in current data
    '{{email}}': employee.email,
    '{{Job role}}': employee.job_title,
    '{{Role details}}': 'N/A', // Not available in current data
    '{{Annual_gross}}': formatCurrency(employee.annual_gross_salary),
    '{{Annual_basic}}': formatCurrency(employee.annual_basic),
    '{{Annual_hra}}': formatCurrency(employee.annual_hra),
    '{{Annual_special_allowance}}': formatCurrency(employee.annual_special_allowance),
    '{{YFBP}}': formatCurrency(employee.yfbp),
    '{{Annual_LTA}}': formatCurrency(employee.annual_lta),
    '{{Monthly_gross}}': formatCurrency(employee.monthly_gross),
    '{{Monthly_basic}}': formatCurrency(employee.monthly_basic),
    '{{Monthly_hra}}': formatCurrency(employee.monthly_hra),
    '{{Monthly_special_allowance}}': formatCurrency(employee.monthly_special_allowance),
    '{{Monthly_LTA}}': formatCurrency(employee.monthly_lta),
    '{{MFBP}}': formatCurrency(employee.mfbp),
    '{{bonus}}': 'N/A', // Not available in current data
    '{{Joining Date}}': formatDate(employee.joining_date),
    '{{Last Date}}': 'N/A', // Not available in current data
    '{{Agreement Date}}': formatDate(new Date().toISOString()),
    '{{Id}}': employee.id,
    '{{Fathers name}}': employee.fathers_name || 'N/A',
    '{{Age}}': employee.age?.toString() || 'N/A',
    '{{Address Line 1}}': employee.address_line1 || 'N/A',
    '{{Address Line 2}}': 'N/A', // Not available in current data
    '{{Address City}}': employee.city || 'N/A',
    '{{Pincode}}': employee.pincode || 'N/A',
    '{{Address State}}': employee.state || 'N/A',
    '{{Aadhar}}': 'N/A', // Not available in current data
    '{{Place}}': employee.place || 'N/A',
    '{{Roles and Responsibilities}}': 'N/A' // Not available in current data
  }

  let processedTemplate = template
  Object.entries(placeholders).forEach(([placeholder, value]) => {
    processedTemplate = processedTemplate.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value)
  })

  return processedTemplate
}

const generatePDF = (content: string, employee: Employee): Uint8Array => {
  console.log('Generating PDF for employee:', employee.first_name, employee.last_name)
  
  const doc = new jsPDF()
  
  // Split content into lines and handle page breaks
  const lines = content.split('\n')
  let yPosition = 20
  const lineHeight = 6
  const pageHeight = 280
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  
  lines.forEach((line) => {
    // Check if we need a new page
    if (yPosition > pageHeight) {
      doc.addPage()
      yPosition = 20
    }
    
    // Handle different text styles
    if (line.includes('EMPLOYMENT AGREEMENT') || line.includes('EMPLOYEE INFORMATION:') || 
        line.includes('EMPLOYMENT DETAILS:') || line.includes('COMPENSATION:') || 
        line.includes('SALARY BREAKDOWN:') || line.includes('TERMS AND CONDITIONS:') || 
        line.includes('SIGNATURES:')) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
    }
    
    // Split long lines
    const splitLines = doc.splitTextToSize(line, 170)
    splitLines.forEach((splitLine: string) => {
      if (yPosition > pageHeight) {
        doc.addPage()
        yPosition = 20
      }
      doc.text(splitLine, 20, yPosition)
      yPosition += lineHeight
    })
    
    yPosition += 2 // Extra spacing after each original line
  })
  
  return doc.output('arraybuffer')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== Edge Function Started ===')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseServiceKey?.length || 0
    })

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { employee_id } = await req.json()

    if (!employee_id) {
      throw new Error('Employee ID is required')
    }

    console.log('Processing employee:', employee_id)

    // Update status to processing
    console.log('Updating status to processing...')
    const { error: statusError } = await supabaseClient
      .from('employee_details')
      .update({ 
        agreement_status: 'processing',
        processing_started_at: new Date().toISOString()
      })
      .eq('id', employee_id)

    if (statusError) {
      console.error('Status update error:', statusError)
      throw new Error(`Failed to update status: ${statusError.message}`)
    }

    // Fetch employee details
    console.log('Fetching employee details...')
    const { data: employee, error: fetchError } = await supabaseClient
      .from('employee_details')
      .select('*')
      .eq('id', employee_id)
      .single()

    if (fetchError) {
      console.error('Fetch error:', fetchError)
      throw new Error(`Employee not found: ${fetchError.message}`)
    }

    if (!employee) {
      throw new Error('Employee data is null')
    }

    console.log('Employee fetched successfully:', employee.first_name, employee.last_name)

    // Fetch Google Docs template
    console.log('Fetching Google Docs template...')
    const docId = '1CpMQCfZn4ePyNr_2bYfr2IgCTZMeAJ_Og3vDwmR--zc'
    const templateContent = await fetchGoogleDocsContent(docId)
    
    // Replace placeholders with employee data
    console.log('Processing template with employee data...')
    const processedContent = replacePlaceholders(templateContent, employee as Employee)

    // Generate PDF
    console.log('Generating PDF...')
    const pdfBuffer = generatePDF(processedContent, employee as Employee)
    const fileName = `employment_agreement_${employee.first_name}_${employee.last_name}_${Date.now()}.pdf`

    console.log('PDF generated, uploading to storage...')
    console.log('File name:', fileName)
    console.log('Buffer size:', pdfBuffer.byteLength)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('employee-agreements')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error(`Failed to upload PDF: ${uploadError.message}`)
    }

    console.log('Upload successful:', uploadData)

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from('employee-agreements')
      .getPublicUrl(fileName)

    console.log('Public URL generated:', publicUrl)

    // Update employee record with URLs
    console.log('Updating employee record with URLs...')
    const { error: updateError } = await supabaseClient
      .from('employee_details')
      .update({
        agreement_status: 'completed',
        pdf_url: publicUrl,
        pdf_download_url: publicUrl,
        processing_completed_at: new Date().toISOString()
      })
      .eq('id', employee_id)

    if (updateError) {
      console.error('Update error:', updateError)
      throw new Error(`Failed to update employee record: ${updateError.message}`)
    }

    // Create generated_agreements record
    console.log('Creating generated_agreements record...')
    const processingStartTime = employee.processing_started_at ? new Date(employee.processing_started_at).getTime() : Date.now()
    const processingTime = Math.floor((Date.now() - processingStartTime) / 1000)

    const { error: insertError } = await supabaseClient
      .from('generated_agreements')
      .insert({
        employee_id: employee_id,
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

    if (insertError) {
      console.error('Insert error:', insertError)
      console.log('Warning: Failed to create generated_agreements record, but PDF generation was successful')
    }

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
      }),
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
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
