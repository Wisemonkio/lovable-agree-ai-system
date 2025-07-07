
import React, { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2, FileText } from 'lucide-react'

interface ManualTriggerButtonProps {
  employeeId: string
  employeeName: string
  onSuccess?: () => void
}

const ManualTriggerButton: React.FC<ManualTriggerButtonProps> = ({ 
  employeeId, 
  employeeName, 
  onSuccess 
}) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleManualTrigger = async () => {
    setIsGenerating(true)
    setError(null)
    setSuccess(false)
    
    try {
      console.log(`🔥 Manually triggering agreement generation for employee: ${employeeId}`)
      
      const { data, error } = await supabase.functions.invoke('generate-agreement', {
        body: { 
          employeeId: employeeId,
          employee_id: employeeId,
          manual_trigger: true
        }
      })
      
      if (error) {
        console.error('❌ Manual trigger error:', error)
        throw new Error(error.message || 'Failed to generate agreement')
      }
      
      console.log('✅ Manual trigger response:', data)
      
      if (data && data.success) {
        console.log('🎉 Agreement generated successfully!')
        setSuccess(true)
        if (onSuccess) {
          onSuccess()
        }
      } else {
        throw new Error(data?.error || 'Agreement generation failed')
      }
      
    } catch (err) {
      console.error('💥 Manual trigger failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  if (success) {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <FileText className="w-4 h-4" />
        <span className="text-sm font-medium">Agreement Generated!</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Button 
        onClick={handleManualTrigger}
        disabled={isGenerating}
        size="sm"
        variant="outline"
        className="flex items-center space-x-2"
      >
        {isGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        <span>
          {isGenerating ? 'Generating...' : 'Generate Agreement'}
        </span>
      </Button>
      
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  )
}

export default ManualTriggerButton
