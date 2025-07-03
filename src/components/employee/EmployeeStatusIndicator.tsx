
import React from 'react'
import { CheckCircle } from 'lucide-react'

interface EmployeeStatusIndicatorProps {
  status: string
}

const EmployeeStatusIndicator: React.FC<EmployeeStatusIndicatorProps> = ({ status }) => {
  if (status === 'processing') {
    return (
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-blue-800 text-sm font-medium">Generating Agreement...</span>
        </div>
        <p className="text-blue-700 text-xs mt-1">
          Employment agreement is being created. This usually takes a few moments.
        </p>
      </div>
    )
  }
  
  if (status === 'completed') {
    return (
      <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-green-800 text-sm font-medium">Agreement Ready!</span>
        </div>
        <p className="text-green-700 text-xs mt-1">
          Employment agreement has been generated and is ready for download.
        </p>
      </div>
    )
  }
  
  return null
}

export default EmployeeStatusIndicator
