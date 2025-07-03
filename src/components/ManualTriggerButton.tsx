
import React, { useState } from 'react'
import { FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { generateEmployeeAgreement } from '../services/agreementService'

interface ManualTriggerButtonProps {
  employeeId: string
  onSuccess?: () => void
}

const ManualTriggerButton: React.FC<ManualTriggerButtonProps> = ({ employeeId, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  
  const handleTrigger = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await generateEmployeeAgreement(employeeId)
      
      if (response.success) {
        setResult({
          success: true,
          message: 'Agreement generated successfully!'
        })
        onSuccess?.()
      } else {
        setResult({
          success: false,
          message: response.error || 'Failed to generate agreement'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-2">
      <button
        onClick={handleTrigger}
        disabled={loading}
        className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <FileText className="w-4 h-4" />
            <span>Generate Agreement</span>
          </>
        )}
      </button>
      
      {result && (
        <div className={`flex items-center space-x-2 text-sm p-2 rounded ${
          result.success 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {result.success ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{result.message}</span>
        </div>
      )}
    </div>
  )
}

export default ManualTriggerButton
