
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

const generatePDF = (employee: Employee): Uint8Array => {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('EMPLOYMENT AGREEMENT', 105, 20, { align: 'center' })
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('This Employment Agreement is entered into between:', 20, 40)
  
  // Company details
  doc.setFont('helvetica', 'bold')
  doc.text('Company: Your Company Name', 20, 55)
  doc.setFont('helvetica', 'normal')
  doc.text('Address: Company Address', 20, 65)
  
  // Employee details
  doc.setFont('helvetica', 'bold')
  doc.text('Employee Details:', 20, 85)
  doc.setFont('helvetica', 'normal')
  doc.text(`Name: ${employee.first_name} ${employee.last_name}`, 20, 95)
  doc.text(`Email: ${employee.email}`, 20, 105)
  doc.text(`Job Title: ${employee.job_title}`, 20, 115)
  doc.text(`Father's Name: ${employee.fathers_name || 'N/A'}`, 20, 125)
  
  if (employee.address_line1) {
    doc.text(`Address: ${employee.address_line1}`, 20, 135)
    if (employee.city || employee.state) {
      doc.text(`${employee.city || ''} ${employee.state || ''} ${employee.pincode || ''}`, 20, 145)
    }
  }
  
  // Employment terms
  doc.setFont('helvetica', 'bold')
  doc.text('Employment Terms:', 20, 165)
  doc.setFont('helvetica', 'normal')
  doc.text(`Joining Date: ${formatDate(employee.joining_date)}`, 20, 175)
  doc.text(`Place of Work: ${employee.place || 'To be determined'}`, 20, 185)
  
  if (employee.client_name) {
    doc.text(`Client: ${employee.client_name}`, 20, 195)
  }
  
  if (employee.manager_details) {
    doc.text(`Manager: ${employee.manager_details}`, 20, 205)
  }
  
  // Salary breakdown
  doc.setFont('helvetica', 'bold')
  doc.text('Salary Structure:', 20, 225)
  doc.setFont('helvetica', 'normal')
  
  const salaryY = 240
  doc.text(`Annual Gross Salary: ${formatCurrency(employee.annual_gross_salary)}`, 20, salaryY)
  doc.text(`Monthly Gross: ${formatCurrency(employee.monthly_gross)}`, 20, salaryY + 10)
  doc.text(`Annual Basic: ${formatCurrency(employee.annual_basic)}`, 20, salaryY + 20)
  doc.text(`Monthly Basic: ${formatCurrency(employee.monthly_basic)}`, 20, salaryY + 30)
  doc.text(`Annual HRA: ${formatCurrency(employee.annual_hra)}`, 20, salaryY + 40)
  doc.text(`Monthly HRA: ${formatCurrency(employee.monthly_hra)}`, 20, salaryY + 50)
  
  if (employee.yfbp > 0) {
    doc.text(`Yearly Flexible Benefits: ${formatCurrency(employee.yfbp)}`, 20, salaryY + 60)
    doc.text(`Monthly Flexible Benefits: ${formatCurrency(employee.mfbp)}`, 20, salaryY + 70)
  }
  
  // Terms and conditions
  doc.addPage()
  doc.setFont('helvetica', 'bold')
  doc.text('Terms and Conditions:', 20, 20)
  doc.setFont('helvetica', 'normal')
  
  const terms = [
    '1. This agreement is subject to company policies and procedures.',
    '2. The employee agrees to maintain confidentiality of company information.',
    '3. Either party may terminate this agreement with 30 days written notice.',
    '4. The employee agrees to perform duties diligently and professionally.',
    '5. This agreement is governed by the laws of India.'
  ]
  
  terms.forEach((term, index) => {
    doc.text(term, 20, 35 + (index * 15), { maxWidth: 170 })
  })
  
  // Signatures
  doc.text('Employee Signature: _________________', 20, 150)
  doc.text('Date: _________________', 120, 150)
  
  doc.text('Company Representative: _________________', 20, 180)
  doc.text('Date: _________________', 120, 180)
  
  return doc.output('arraybuffer')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      'https://kzejmozxbhzkrbfmwmnx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6ZWptb3p4Ymh6a3JiZm13bW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1Mzc3MzMsImV4cCI6MjA2NzExMzczM30.dvMHh8cLAeYRbalHsA8x1QUI36nWP-xgkws11vnrKdI'
    )

    const { employee_id } = await req.json()

    if (!employee_id) {
      throw new Error('Employee ID is required')
    }

    console.log('Processing employee:', employee_id)

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
      throw new Error(`Employee not found: ${fetchError?.message}`)
    }

    console.log('Generating PDF for employee:', employee.first_name, employee.last_name)

    // Generate PDF
    const pdfBuffer = generatePDF(employee as Employee)
    const fileName = `employment_agreement_${employee.first_name}_${employee.last_name}_${Date.now()}.pdf`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('employee-agreements')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
      throw new Error(`Failed to upload PDF: ${uploadError.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from('employee-agreements')
      .getPublicUrl(fileName)

    // Update employee record with URLs
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
      throw new Error(`Failed to update employee record: ${updateError.message}`)
    }

    // Create generated_agreements record
    await supabaseClient
      .from('generated_agreements')
      .insert({
        employee_id: employee_id,
        pdf_download_url: publicUrl,
        file_name: fileName,
        generation_status: 'completed',
        processing_time_seconds: Math.floor((Date.now() - new Date(employee.processing_started_at || Date.now()).getTime()) / 1000),
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

    console.log('Agreement generated successfully for employee:', employee_id)

    return new Response(
      JSON.stringify({
        success: true,
        employee_id: employee_id,
        document_urls: {
          pdf_url: publicUrl,
          pdf_download_url: publicUrl,
          doc_url: publicUrl
        },
        message: 'Employment agreement generated successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error generating agreement:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate agreement'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
