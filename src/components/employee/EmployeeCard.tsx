
import React from 'react'
import { Eye, Download, FileText, Calendar, DollarSign } from 'lucide-react'
import { Employee } from './types'
import { getStatusColor, getStatusIcon, formatCurrency, formatDate } from './utils'
import ManualTriggerButton from '../ManualTriggerButton'
import EmployeeStatusIndicator from './EmployeeStatusIndicator'

interface EmployeeCardProps {
  employee: Employee
  onViewDetails: (employee: Employee) => void
  onDownload: (employee: Employee) => void
  onRefresh: () => void
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  onViewDetails,
  onDownload,
  onRefresh
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {employee.first_name} {employee.last_name}
            </h3>
            <p className="text-blue-100 text-sm">{employee.job_title}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-blue-100">Employee ID</div>
            <div className="text-xs font-mono">{employee.id.substring(0, 8)}</div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-4">
          <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(employee.agreement_status)}`}>
            {getStatusIcon(employee.agreement_status)}
            <span className="capitalize">{employee.agreement_status}</span>
          </span>
          <span className="text-xs text-gray-500">
            Added {formatDate(employee.created_at)}
          </span>
        </div>
        
        {/* Employee Details */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Joins: {formatDate(employee.joining_date)}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              {formatCurrency(employee.annual_gross_salary)}/year
            </span>
          </div>
          
          {employee.client_name && (
            <div className="flex items-center space-x-2 text-sm">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Client: {employee.client_name}</span>
            </div>
          )}
          
          {(employee.city || employee.state) && (
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-400">📍</span>
              <span className="text-gray-600">
                {[employee.city, employee.state].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          <div className="flex space-x-2">
            <button
              onClick={() => onViewDetails(employee)}
              className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
            >
              <Eye className="w-4 h-4" />
              <span>View Details</span>
            </button>
            
            {employee.agreement_status === 'completed' && employee.pdf_download_url && (
              <button
                onClick={() => onDownload(employee)}
                className="bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Manual trigger for testing Edge Function */}
          {(employee.agreement_status === 'pending' || employee.agreement_status === 'failed') && (
            <ManualTriggerButton 
              employeeId={employee.id} 
              onSuccess={onRefresh}
            />
          )}
        </div>
        
        {/* Processing Status */}
        <EmployeeStatusIndicator status={employee.agreement_status} />
      </div>
    </div>
  )
}

export default EmployeeCard
