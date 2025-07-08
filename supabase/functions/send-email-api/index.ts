
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts"

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

async function getGmailAccessToken(): Promise<string> {
  const clientEmail = Deno.env.get('GOOGLE_CLIENT_EMAIL')
  const privateKey = Deno.env.get('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n')
  
  console.log('🔐 Checking Google credentials...')
  console.log('Client Email set:', !!clientEmail)
  console.log('Private Key set:', !!privateKey)
  
  if (!clientEmail || !privateKey) {
    throw new Error('Missing Google credentials: GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY required')
  }

  const now = Math.floor(Date.now() / 1000)
  
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/gmail.send',
    aud: 'https://oauth2.googleapis.com/token',
    exp: getNumericDate(60 * 60), // 1 hour
    iat: now,
  }

  console.log('🔑 Creating JWT...')
  
  try {
    const jwt = await create(
      { alg: "RS256", typ: "JWT" },
      payload,
      privateKey
    )

    console.log('📝 JWT created, requesting access token...')

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('❌ Token request failed:', data)
      throw new Error(`Failed to get access token: ${data.error} - ${data.error_description}`)
    }

    console.log('✅ Access token obtained successfully')
    return data.access_token
  } catch (error) {
    console.error('💥 JWT/Token error:', error)
    throw new Error(`JWT creation failed: ${error.message}`)
  }
}

function createEmailMessage(to: string, subject: string, html?: string, text?: string): string {
  const fromEmail = Deno.env.get('GOOGLE_CLIENT_EMAIL')
  
  console.log('📝 Creating email message...')
  
  let message = `From: ${fromEmail}\r\n`
  message += `To: ${to}\r\n`
  message += `Subject: ${subject}\r\n`
  message += `MIME-Version: 1.0\r\n`
  
  if (html && text) {
    const boundary = `boundary_${Date.now()}`
    message += `Content-Type: multipart/alternative; boundary=${boundary}\r\n\r\n`
    message += `--${boundary}\r\n`
    message += `Content-Type: text/plain; charset=UTF-8\r\n\r\n`
    message += `${text}\r\n\r\n`
    message += `--${boundary}\r\n`
    message += `Content-Type: text/html; charset=UTF-8\r\n\r\n`
    message += `${html}\r\n\r\n`
    message += `--${boundary}--`
  } else if (html) {
    message += `Content-Type: text/html; charset=UTF-8\r\n\r\n`
    message += html
  } else {
    message += `Content-Type: text/plain; charset=UTF-8\r\n\r\n`
    message += text
  }

  return btoa(message).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

serve(async (req) => {
  console.log('📧 Email API function called, method:', req.method)

  if (req.method === 'OPTIONS') {
    console.log('⚡ Handling CORS preflight request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📬 Processing Gmail API email request...')
    const { to, subject, html, text }: EmailRequest = await req.json()

    console.log('📧 Email request details:')
    console.log('  To:', to)
    console.log('  Subject:', subject)
    console.log('  Has HTML:', !!html)
    console.log('  Has Text:', !!text)

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

    console.log('🔑 Getting Gmail access token...')
    const accessToken = await getGmailAccessToken()
    
    console.log('📝 Creating email message...')
    const encodedMessage = createEmailMessage(to, subject, html, text)

    console.log('📤 Sending email via Gmail API...')
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedMessage,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ Gmail API error:', result)
      throw new Error(`Gmail API error: ${result.error?.message || 'Unknown error'}`)
    }

    console.log('✅ Email sent successfully via Gmail API:', result.id)

    return new Response(
      JSON.stringify({ 
        message: 'Email sent successfully',
        messageId: result.id,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('💥 Error sending email via Gmail API:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    })
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email via Gmail API', 
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
