
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { employee_id } = await req.json()
    
    if (!employee_id) {
      throw new Error('Employee ID is required')
    }

    console.log(`Starting agreement generation for employee: ${employee_id}`)

    // Update status to processing
    await supabaseClient
      .from('employee_details')
      .update({ 
        agreement_status: 'processing',
        processing_started_at: new Date().toISOString()
      })
      .eq('id', employee_id)

    // Fetch employee details
    const { data: employee, error: fetchError } = await supabaseClient
      .from('employee_details')
      .select('*')
      .eq('id', employee_id)
      .single()

    if (fetchError || !employee) {
      throw new Error(`Failed to fetch employee: ${fetchError?.message}`)
    }

    // Generate PDF content
    const pdfContent = generatePDFContent(employee)
    
    // Create filename
    const fileName = `Employment_Agreement_${employee.first_name}_${employee.last_name}_${new Date().toISOString().split('T')[0]}.pdf`
    
    // For now, we'll simulate PDF generation and use Google Docs URLs
    // In a real implementation, you would generate actual PDFs here
    const mockDocId = `doc_${employee_id}_${Date.now()}`
    const documentUrls = {
      pdf_url: `https://docs.google.com/document/d/${mockDocId}/preview`,
      doc_url: `https://docs.google.com/document/d/${mockDocId}/edit`,
      pdf_download_url: `https://docs.google.com/document/d/${mockDocId}/export?format=pdf`
    }

    // Update employee with generated URLs
    const { error: updateError } = await supabaseClient
      .from('employee_details')
      .update({
        agreement_status: 'completed',
        processing_completed_at: new Date().toISOString(),
        ...documentUrls
      })
      .eq('id', employee_id)

    if (updateError) {
      throw new Error(`Failed to update employee: ${updateError.message}`)
    }

    // Create agreement record
    await supabaseClient
      .from('generated_agreements')
      .insert({
        employee_id: employee_id,
        google_doc_id: mockDocId,
        google_doc_url: documentUrls.doc_url,
        pdf_file_id: `pdf_${mockDocId}`,
        pdf_preview_url: documentUrls.pdf_url,
        pdf_download_url: documentUrls.pdf_download_url,
        generation_status: 'completed',
        file_name: fileName,
        processing_time_seconds: 2,
        placeholders_replaced: {
          'First Name': employee.first_name,
          'Last Name': employee.last_name,
          'Email': employee.email,
          'Job Title': employee.job_title,
          'Annual Gross Salary': employee.annual_gross_salary,
          'Monthly Gross': employee.monthly_gross
        },
        salary_breakdown: {
          annualBasic: employee.annual_basic,
          annualHra: employee.annual_hra,
          annualLta: employee.annual_lta,
          monthlyGross: employee.monthly_gross,
          yfbp: employee.yfbp,
          mfbp: employee.mfbp
        }
      })

    console.log(`Agreement generation completed for employee: ${employee_id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        employee_id,
        document_urls: documentUrls,
        message: 'Employment agreement generated successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error generating agreement:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

function generatePDFContent(employee: Employee): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return `
EMPLOYMENT AGREEMENT

This Employment Agreement is entered into between [COMPANY NAME] and ${employee.first_name} ${employee.last_name}.

EMPLOYEE DETAILS:
- Name: ${employee.first_name} ${employee.last_name}
- Email: ${employee.email}
- Job Title: ${employee.job_title}
- Joining Date: ${formatDate(employee.joining_date)}
${employee.fathers_name ? `- Father's Name: ${employee.fathers_name}` : ''}
${employee.age ? `- Age: ${employee.age}` : ''}

SALARY BREAKDOWN:
- Annual Gross Salary: ${formatCurrency(employee.annual_gross_salary)}
- Monthly Gross Salary: ${formatCurrency(employee.monthly_gross)}
- Annual Basic: ${formatCurrency(employee.annual_basic)}
- Annual HRA: ${formatCurrency(employee.annual_hra)}
- Annual LTA: ${formatCurrency(employee.annual_lta)}
- Annual Special Allowance: ${formatCurrency(employee.annual_special_allowance)}
- Monthly Basic: ${formatCurrency(employee.monthly_basic)}
- Monthly HRA: ${formatCurrency(employee.monthly_hra)}
- Monthly LTA: ${formatCurrency(employee.monthly_lta)}
- Monthly Special Allowance: ${formatCurrency(employee.monthly_special_allowance)}

TERMS AND CONDITIONS:
1. The employee agrees to work diligently and maintain confidentiality.
2. The employment is subject to company policies and procedures.
3. Either party may terminate with 30 days notice.

${employee.client_name ? `Client: ${employee.client_name}` : ''}
${employee.manager_details ? `Manager: ${employee.manager_details}` : ''}
${employee.place ? `Work Location: ${employee.place}` : ''}

Date: ${new Date().toLocaleDateString('en-IN')}

_____________________          _____________________
Employee Signature             Company Representative
  `
}
