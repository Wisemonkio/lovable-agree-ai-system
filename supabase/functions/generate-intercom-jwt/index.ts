import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as jose from "https://deno.land/x/jose@v4.14.4/index.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user's JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid authentication token')
    }

    // Get Intercom secret key from environment
    const intercomSecretKey = Deno.env.get('INTERCOM_SECRET_KEY')
    if (!intercomSecretKey) {
      throw new Error('Intercom secret key not configured')
    }

    // Create JWT payload for Intercom
    const payload = {
      user_id: user.id,
      email: user.email,
      iat: Math.floor(Date.now() / 1000), // issued at time
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // expire in 1 hour
    }

    // Sign the JWT with HMAC SHA256
    const secret = new TextEncoder().encode(intercomSecretKey)
    const jwt = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret)

    console.log('Generated Intercom JWT for user:', user.id)

    return new Response(
      JSON.stringify({ 
        jwt,
        user_id: user.id,
        email: user.email
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    )

  } catch (error) {
    console.error('Error generating Intercom JWT:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate Intercom JWT',
        details: error.message 
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    )
  }
})