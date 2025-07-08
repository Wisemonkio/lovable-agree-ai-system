// SMTP version - much simpler and more reliable

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts"

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
  console.log('📧 SMTP Email function called, method:', req.method)

  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log('⚡ Handling CORS preflight request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📬 Processing SMTP email request...')
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
    const gmailUser = Deno.env.get('GMAIL_USER')
    const gmailAppPassword = Deno.env.get('GMAIL_APP_PASSWORD')

    console.log('🔐 Environment check:')
    console.log('  GMAIL_USER set:', !!gmailUser)
    console.log('  GMAIL_USER value:', gmailUser || 'NOT SET')
    console.log('  GMAIL_APP_PASSWORD set:', !!gmailAppPassword)
    console.log('  GMAIL_APP_PASSWORD length:', gmailAppPassword?.length || 0)

    if (!gmailUser || !gmailAppPassword) {
      console.error('❌ Gmail credentials not configured')
      return new Response(
        JSON.stringify({ 
          error: 'Gmail credentials not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD secrets.',
          missing: {
            GMAIL_USER: !gmailUser,
            GMAIL_APP_PASSWORD: !gmailAppPassword
          },
          help: {
            GMAIL_USER: "Set your Gmail address",
            GMAIL_APP_PASSWORD: "Generate an App Password from Google Account settings (16 characters)"
          }
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('🔌 Creating SMTP client...')
    
    // Create SMTP client
    const client = new SmtpClient()

    console.log('🔗 Connecting to Gmail SMTP server...')
    
    // Connect to Gmail SMTP server
    await client.connectTLS({
      hostname: "smtp.gmail.com",
      port: 587,
      username: gmailUser,
      password: gmailAppPassword,
    })

    console.log('✅ Connected to Gmail SMTP successfully')
    console.log('📤 Sending email...')

    // Prepare email content
    const emailContent = text || (html ? html.replace(/<[^>]*>/g, '') : '')
    
    // Send email
    await client.send({
      from: gmailUser,
      to: to,
      subject: subject,
      content: emailContent,
      html: html || undefined,
    })

    console.log('📧 Email sent successfully via SMTP')

    // Close connection
    await client.close()
    console.log('🔌 SMTP connection closed')

    return new Response(
      JSON.stringify({ 
        message: 'Email sent successfully via SMTP',
        from: gmailUser,
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
    console.error('💥 Error sending email via SMTP:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    })
    
    // Provide helpful error messages
    let helpfulMessage = error.message
    if (error.message.includes('Authentication failed')) {
      helpfulMessage = 'Gmail authentication failed. Make sure you are using an App Password (16 characters), not your regular Gmail password.'
    } else if (error.message.includes('Connection refused')) {
      helpfulMessage = 'Cannot connect to Gmail SMTP server. Check your network connection.'
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email via SMTP', 
        details: helpfulMessage,
        originalError: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})