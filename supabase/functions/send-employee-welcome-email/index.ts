import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'npm:resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  employeeName: string
  employeeEmail: string
  jobTitle: string
  companyName: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured')
    }

    const resend = new Resend(resendApiKey)
    
    const { employeeName, employeeEmail, jobTitle, companyName }: EmailRequest = await req.json()

    console.log('Sending welcome email to:', employeeEmail)

    const emailResponse = await resend.emails.send({
      from: 'HR Team <onboarding@resend.dev>',
      to: [employeeEmail],
      subject: 'Please sign your agreement',
      html: `
        <h2>Welcome to ${companyName}!</h2>
        
        <p>Dear ${employeeName},</p>
        
        <p>Congratulations on your new position as <strong>${jobTitle}</strong>! We are excited to have you join our team.</p>
        
        <p>Your employment agreement has been generated and is ready for your review and signature. Please take some time to carefully read through the document.</p>
        
        <h3>Next Steps:</h3>
        <ul>
          <li>Review your employment agreement carefully</li>
          <li>Sign the agreement electronically when ready</li>
          <li>Contact us if you have any questions</li>
        </ul>
        
        <p>If you have any questions about your agreement or need clarification on any terms, please don't hesitate to reach out to us.</p>
        
        <p>Best regards,<br>
        ${companyName} Team</p>
      `,
    })

    console.log('Email sent successfully:', emailResponse)

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error sending welcome email:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send email',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})