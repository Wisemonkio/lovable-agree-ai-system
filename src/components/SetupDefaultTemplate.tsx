
import React, { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, Settings } from 'lucide-react'

const SetupDefaultTemplate: React.FC = () => {
  const [isSetup, setIsSetup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setupTemplate = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔧 Setting up default template...')
      
      // Add the Google Doc as a default company template
      const { data, error } = await supabase
        .from('company_agreement_templates')
        .upsert({
          company_name: 'Default Template',
          google_doc_url: 'https://docs.google.com/document/d/1CpMQCfZn4ePyNr_2bYfr2IgCTZMeAJ_Og3vDwmR--zc/edit',
          google_doc_id: '1CpMQCfZn4ePyNr_2bYfr2IgCTZMeAJ_Og3vDwmR--zc',
          template_name: 'Default Employment Agreement Template',
          is_active: true
        })
        .select()
        .single()
      
      if (error) throw error
      
      console.log('✅ Template setup successful:', data)
      setIsSetup(true)
      
    } catch (err) {
      console.error('❌ Template setup failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to setup template')
    } finally {
      setLoading(false)
    }
  }

  if (isSetup) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span>Template Ready!</span>
          </CardTitle>
          <CardDescription>
            Default template has been configured successfully.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>Setup Default Template</span>
        </CardTitle>
        <CardDescription>
          Configure the Google Doc template for agreement generation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={setupTemplate}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Setting up...
            </>
          ) : (
            'Setup Template'
          )}
        </Button>
        
        {error && (
          <div className="mt-3 text-red-600 text-sm bg-red-50 p-2 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SetupDefaultTemplate
