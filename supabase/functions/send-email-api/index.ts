// =============================================================================
// SUPABASE EDGE FUNCTION: send-email-api
// File: supabase/functions/send-email-api/index.ts
// Purpose: Send emails via Resend API for employee agreement notifications
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  html?: string
  text?: string
}

serve(async (req) => {
  console.log('📧 Resend Email function called, method:', req.method)

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('⚡ Handling CORS preflight request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📬 Processing Resend email request...')
    const { to, subject, html, text }: EmailRequest = await req.json()

    console.log('📧 Email request details:')
    console.log('  To:', to)
    console.log('  Subject:', subject)
    console.log('  Has HTML:', !!html)
    console.log('  Has Text:', !!text)

    // Validate required fields
    if (!to || !subject || (!html && !text)) {
      console.error('❌ Missing required fields')
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: to, subject, and html or text',
          received: { to: !!to, subject: !!subject, html: !!html, text: !!text }
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('FROM_EMAIL')

    console.log('🔐 Environment check:')
    console.log('  RESEND_API_KEY set:', !!resendApiKey)
    console.log('  RESEND_API_KEY prefix:', resendApiKey?.substring(0, 3) || 'NOT SET')
    console.log('  FROM_EMAIL set:', !!fromEmail)
    console.log('  FROM_EMAIL value:', fromEmail || 'NOT SET')

    if (!resendApiKey) {
      console.error('❌ Resend API key not configured')
      return new Response(
        JSON.stringify({ 
          error: 'Resend API key not configured. Please set RESEND_API_KEY secret.',
          help: {
            step1: "Sign up at resend.com",
            step2: "Get your API key from the dashboard",
            step3: "Run: supabase secrets set RESEND_API_KEY=re_your_key_here"
          }
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!fromEmail) {
      console.error('❌ FROM_EMAIL not configured')
      return new Response(
        JSON.stringify({ 
          error: 'FROM_EMAIL not configured. Please set FROM_EMAIL secret.',
          help: {
            option1: "Use your domain: supabase secrets set FROM_EMAIL=noreply@yourdomain.com",
            option2: "Use Resend default: supabase secrets set FROM_EMAIL=onboarding@resend.dev"
          }
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('📤 Sending email via Resend API...')
    
    // Prepare email data for Resend
    const emailData: any = {
      from: fromEmail,
      to: [to],
      subject: subject,
    }

    // Add content based on what's provided
    if (html && text) {
      emailData.html = html
      emailData.text = text
    } else if (html) {
      emailData.html = html
      // Generate text version from HTML for better deliverability
      emailData.text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    } else {
      emailData.text = text
    }

    console.log('📋 Email payload prepared:', {
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      hasHtml: !!emailData.html,
      hasText: !!emailData.text
    })

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ Resend API error:', result)
      console.error('❌ Response status:', response.status)
      console.error('❌ Response headers:', Object.fromEntries(response.headers.entries()))
      
      // Provide helpful error messages
      let helpfulMessage = result.message || 'Unknown error'
      if (response.status === 401) {
        helpfulMessage = 'Invalid API key. Please check your RESEND_API_KEY secret.'
      } else if (response.status === 403) {
        helpfulMessage = 'API key doesn\'t have permission to send emails.'
      } else if (response.status === 422) {
        helpfulMessage = `Validation error: ${result.message}`
      }
      
      throw new Error(helpfulMessage)
    }

    console.log('✅ Email sent successfully via Resend!')
    console.log('📧 Email ID:', result.id)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Email sent successfully via Resend',
        emailId: result.id,
        from: fromEmail,
        to: to,
        subject: subject,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('💥 Error sending email via Resend:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    })
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to send email via Resend', 
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})