
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// JWT helper functions
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function createJWT(email: string, privateKey: string, scope: string): string {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: email,
    scope: scope,
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const unsignedToken = `${encodedHeader}.${encodedPayload}`

  // Import the private key and sign
  return unsignedToken // Note: This is simplified - in production you'd need proper RSA signing
}

async function getAccessToken(): Promise<string> {
  const clientEmail = Deno.env.get('GOOGLE_CLIENT_EMAIL')
  const privateKey = Deno.env.get('GOOGLE_PRIVATE_KEY')
  
  if (!clientEmail || !privateKey) {
    throw new Error('Missing Google credentials')
  }

  const scope = 'https://www.googleapis.com/auth/gmail.send'
  
  // For now, we'll use a simplified approach
  // In production, you'd need proper JWT signing with RSA
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: createJWT(clientEmail, privateKey, scope)
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`)
  }

  const data = await response.json()
  return data.access_token
}

async function sendEmailViaGmail(to: string, subject: string, html: string, text: string): Promise<any> {
  try {
    console.log(`📧 Sending email via Gmail API to: ${to}`)
    
    const accessToken = await getAccessToken()
    
    // Create the email message
    const emailMessage = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      html
    ].join('\n')

    // Encode the message in base64
    const encodedMessage = btoa(emailMessage)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')

    // Send via Gmail API
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: encodedMessage
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gmail API error: ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()
    console.log('✅ Email sent successfully via Gmail:', result)
    return result

  } catch (error) {
    console.error('❌ Gmail sending failed:', error)
    throw error
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { to, subject, html, text } = body
    
    console.log('📧 Email send request received:', { to, subject })
    
    if (!to || !subject) {
      throw new Error('Missing required fields: to, subject')
    }

    // Send email via Gmail API
    const result = await sendEmailViaGmail(to, subject, html || text, text || html)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.id,
        message: 'Email sent successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Error in send-email-api:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to send email'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
