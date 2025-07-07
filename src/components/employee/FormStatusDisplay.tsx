
import React from 'react'
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { AgreementStatus } from './EmployeeFormTypes'

interface FormStatusDisplayProps {
  success: boolean
  submitting: boolean
  agreementStatus: AgreementStatus
  employeeId: string | null
  error: string | null
}

const FormStatusDisplay: React.FC<FormStatusDisplayProps> = ({
  success,
  submitting,
  agreementStatus,
  employeeId,
  error
}) => {
  const getStatusMessage = () => {
    switch (agreementStatus) {
      case 'creating':
        return 'Creating employee record...'
      case 'generating':
        return 'Generating employment agreement...'
      case 'completed':
        return 'Employment agreement generated successfully!'
      case 'failed':
        return 'Failed to generate agreement'
      default:
        return ''
    }
  }
  
  const getStatusIcon = () => {
    switch (agreementStatus) {
      case 'creating':
      case 'generating':
        return <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
      case 'failed':
        return <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
      default:
        return null
    }
  }

  if (success || agreementStatus === 'completed') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          {getStatusIcon()}
          <h2 className="text-2xl font-bold text-green-800 mb-2">Employee Created Successfully!</h2>
          <p className="text-green-700 mb-4">Employee ID: {employeeId}</p>
          <p className="text-green-600 mb-4">
            Employment agreement has been generated automatically using our Edge Function.
          </p>
          <p className="text-green-600">
            Redirecting to employee list in 3 seconds...
          </p>
        </div>
      </div>
    )
  }
  
  if (submitting) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          {getStatusIcon()}
          <h2 className="text-2xl font-bold text-blue-800 mb-2">{getStatusMessage()}</h2>
          <p className="text-blue-700">
            Please wait while we process your request...
          </p>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}

export default FormStatusDisplay
