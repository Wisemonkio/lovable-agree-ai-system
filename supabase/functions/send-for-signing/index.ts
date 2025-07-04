
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ZohoTokenResponse {
  access_token: string
  expires_in: number
}

interface ZohoSignRequest {
  request_name: string
  actions: Array<{
    recipient_email: string
    recipient_name: string
    action_type: string
    signing_order: number
  }>
  document_ids: string[]
}

const getZohoAccessToken = async (): Promise<string> => {
  const clientId = Deno.env.get('ZOHO_CLIENT_ID')
  const clientSecret = Deno.env.get('ZOHO_CLIENT_SECRET')
  const refreshToken = Deno.env.get('ZOHO_REFRESH_TOKEN')

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Zoho credentials')
  }

  const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`)
  }

  const data: ZohoTokenResponse = await response.json()
  return data.access_token
}

const uploadDocumentToZoho = async (accessToken: string, pdfUrl: string, fileName: string): Promise<string> => {
  // Download the PDF from the URL
  const pdfResponse = await fetch(pdfUrl)
  if (!pdfResponse.ok) {
    throw new Error('Failed to download PDF')
  }
  
  const pdfBuffer = await pdfResponse.arrayBuffer()
  const formData = new FormData()
  formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), fileName)

  const response = await fetch('https://sign.zoho.com/api/v1/documents', {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${accessToken}`,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Failed to upload document: ${response.statusText}`)
  }

  const data = await response.json()
  return data.document_id
}

const createSignRequest = async (accessToken: string, documentId: string, employee: any, clientName: string, clientEmail: string): Promise<string> => {
  // Validate that we have client information
  if (!clientName || !clientEmail) {
    throw new Error('Client name and email are required for sending documents for signature')
  }

  const signRequest: ZohoSignRequest = {
    request_name: `Employment Agreement - ${employee.first_name} ${employee.last_name}`,
    actions: [
      {
        recipient_email: employee.email,
        recipient_name: `${employee.first_name} ${employee.last_name}`,
        action_type: 'SIGN',
        signing_order: 1,
      },
      {
        recipient_email: clientEmail,
        recipient_name: clientName,
        action_type: 'SIGN',
        signing_order: 2,
      },
    ],
    document_ids: [documentId],
  }

  const response = await fetch('https://sign.zoho.com/api/v1/requests', {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(signRequest),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create sign request: ${error}`)
  }

  const data = await response.json()
  return data.request_id
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { employeeId, clientName, clientEmail } = await req.json()

    if (!employeeId) {
      return new Response(
        JSON.stringify({ error: 'Employee ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch employee details
    const { data: employee, error: fetchError } = await supabase
      .from('employee_details')
      .select('*')
      .eq('id', employeeId)
      .single()

    if (fetchError || !employee) {
      return new Response(
        JSON.stringify({ error: 'Employee not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if employee has a PDF URL
    if (!employee.pdf_download_url) {
      return new Response(
        JSON.stringify({ error: 'No PDF available for signing' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine client information - use provided values or fall back to employee record
    const finalClientName = clientName || employee.client_name
    const finalClientEmail = clientEmail || employee.client_email

    // Validate that we have client information
    if (!finalClientName || !finalClientEmail) {
      return new Response(
        JSON.stringify({ 
          error: 'Client name and email are required for sending documents for signature',
          details: 'Please provide client information to proceed with e-signature'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update employee record with client information if provided
    if (clientName || clientEmail) {
      const updateData: any = {}
      if (clientName) updateData.client_name = clientName
      if (clientEmail) updateData.client_email = clientEmail
      
      await supabase
        .from('employee_details')
        .update(updateData)
        .eq('id', employeeId)
    }

    // Update status to indicate signing process has started
    await supabase
      .from('employee_details')
      .update({ 
        signing_sent_at: new Date().toISOString(),
        zoho_sign_status: 'sent'
      })
      .eq('id', employeeId)

    // Get Zoho access token
    const accessToken = await getZohoAccessToken()

    // Upload document to Zoho
    const fileName = `employment_agreement_${employee.first_name}_${employee.last_name}.pdf`
    const documentId = await uploadDocumentToZoho(accessToken, employee.pdf_download_url, fileName)

    // Create sign request with both employee and client
    const requestId = await createSignRequest(accessToken, documentId, employee, finalClientName, finalClientEmail)

    // Update employee record with Zoho details
    const { error: updateError } = await supabase
      .from('employee_details')
      .update({
        zoho_sign_request_id: requestId,
        zoho_sign_document_id: documentId,
        zoho_sign_status: 'sent',
        signing_sent_at: new Date().toISOString(),
      })
      .eq('id', employeeId)

    if (updateError) {
      console.error('Failed to update employee record:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update employee record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Document sent for signing to ${employee.first_name} ${employee.last_name} and ${finalClientName}`,
        request_id: requestId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-for-signing function:', error)
    
    // Try to update employee record with error
    if (req.method === 'POST') {
      try {
        const { employeeId } = await req.json()
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        
        await supabase
          .from('employee_details')
          .update({
            zoho_sign_status: 'failed',
            zoho_sign_error: error.message,
          })
          .eq('id', employeeId)
      } catch (updateError) {
        console.error('Failed to update error status:', updateError)
      }
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
