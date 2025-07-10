
import React from 'react'
import { Calendar, DollarSign, Download, Eye, Mail, MapPin, User, FileText } from 'lucide-react'
import { Employee } from './types'
import EmployeeStatusIndicator from './EmployeeStatusIndicator'
import SendForESignButton from './SendForESignButton'

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
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {employee.name}
            </h3>
            <p className="text-gray-600 text-sm">{employee.job_title}</p>
          </div>
        </div>
        
        <div className="flex items-center text-gray-500 text-sm space-x-4 mt-3">
          <div className="flex items-center space-x-1">
            <Mail className="w-4 h-4" />
            <span className="truncate max-w-[200px]">{employee.email}</span>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Salary Information */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-600">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm font-medium">Annual Salary</span>
          </div>
          <span className="font-semibold text-gray-900">
            {formatCurrency(employee.annual_gross_salary)}
          </span>
        </div>
        
        {/* Joining Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">Joining Date</span>
          </div>
          <span className="text-gray-900">{formatDate(employee.joining_date)}</span>
        </div>
        
        {/* Location (if available) */}
        {(employee.city || employee.state) && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">Location</span>
            </div>
            <span className="text-gray-900">
              {[employee.city, employee.state].filter(Boolean).join(', ')}
            </span>
          </div>
        )}

        {/* Employee ID */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-600">
            <User className="w-4 h-4" />
            <span className="text-sm font-medium">Employee ID</span>
          </div>
          <span className="text-gray-900 text-sm font-mono">
            {employee.id.substring(0, 8)}
          </span>
        </div>

        {/* Signing Status (if applicable) */}
        {employee.zoho_sign_status && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-gray-600">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">Signing Status</span>
            </div>
            <span className={`text-sm px-2 py-1 rounded-full ${
              employee.zoho_sign_status === 'completed' ? 'bg-green-100 text-green-800' :
              employee.zoho_sign_status === 'sent' ? 'bg-yellow-100 text-yellow-800' :
              employee.zoho_sign_status === 'failed' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {employee.zoho_sign_status === 'completed' ? 'Signed' :
               employee.zoho_sign_status === 'sent' ? 'Pending' :
               employee.zoho_sign_status === 'failed' ? 'Failed' :
               employee.zoho_sign_status}
            </span>
          </div>
        )}

        {/* Employee Status Indicator - positioned after signing status */}
        <EmployeeStatusIndicator status={employee.agreement_status} />
      </div>
      
      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 rounded-b-lg border-t border-gray-100">
        <div className="flex items-center justify-between space-x-3">
          <button
            onClick={() => onViewDetails(employee)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>View Details</span>
          </button>
          
          <div className="flex items-center space-x-2">
            <SendForESignButton 
              employee={employee}
              onSuccess={onRefresh}
            />
            
            {employee.agreement_status === 'completed' && employee.pdf_download_url && (
              <button
                onClick={() => onDownload(employee)}
                className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmployeeCard
