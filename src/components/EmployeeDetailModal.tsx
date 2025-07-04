
import React from 'react'
import { X, Download, ExternalLink, Calendar, DollarSign, MapPin, User, Briefcase, FileText } from 'lucide-react'
import { Employee } from './employee/types'

interface EmployeeDetailModalProps {
  employee: Employee
  onClose: () => void
}

const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({ employee, onClose }) => {
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
      month: 'long',
      day: 'numeric'
    })
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{employee.first_name} {employee.last_name}</h2>
              <p className="text-blue-100">{employee.job_title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Status and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(employee.agreement_status)}`}>
                <span className="capitalize">{employee.agreement_status}</span>
              </span>
              <span className="text-sm text-gray-500">
                Employee ID: {employee.id.substring(0, 8)}
              </span>
            </div>
            
            {employee.agreement_status === 'completed' && (
              <div className="flex space-x-2">
                {employee.doc_url && (
                  <button
                    onClick={() => window.open(employee.doc_url, '_blank')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>View Document</span>
                  </button>
                )}
                
                {employee.pdf_download_url && (
                  <button
                    onClick={() => window.open(employee.pdf_download_url, '_blank')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Personal Information */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Personal Information</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <p className="text-gray-900">{employee.first_name} {employee.last_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{employee.email}</p>
              </div>
              {employee.gender && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <p className="text-gray-900">{employee.gender === 'Son' ? 'Male' : employee.gender === 'Daughter' ? 'Female' : employee.gender}</p>
                </div>
              )}
              {employee.fathers_name && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Father's Name</label>
                  <p className="text-gray-900">{employee.fathers_name}</p>
                </div>
              )}
              {employee.age && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Age</label>
                  <p className="text-gray-900">{employee.age} years</p>
                </div>
              )}
              {employee.aadhar && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Aadhar Number</label>
                  <p className="text-gray-900">{employee.aadhar}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Employment Details */}
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center space-x-2">
              <Briefcase className="w-5 h-5" />
              <span>Employment Details</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Job Title</label>
                <p className="text-gray-900">{employee.job_title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                <p className="text-gray-900">{formatDate(employee.joining_date)}</p>
              </div>
              {employee.last_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Date</label>
                  <p className="text-gray-900">{formatDate(employee.last_date)}</p>
                </div>
              )}
              {employee.client_name && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company</label>
                  <p className="text-gray-900">{employee.client_name}</p>
                </div>
              )}
              {employee.client_email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Client Email</label>
                  <p className="text-gray-900">{employee.client_email}</p>
                </div>
              )}
              {employee.manager_details && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Manager Details</label>
                  <p className="text-gray-900">{employee.manager_details}</p>
                </div>
              )}
              {employee.place && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Work Location</label>
                  <p className="text-gray-900">{employee.place}</p>
                </div>
              )}
              {employee.bonus && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bonus</label>
                  <p className="text-gray-900">{employee.bonus}</p>
                </div>
              )}
            </div>
            
            {/* Job Description */}
            {employee.job_description && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div 
                    className="text-gray-900 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: employee.job_description }}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Address Information */}
          {(employee.address_line1 || employee.address_line2 || employee.city || employee.state || employee.pincode) && (
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Address Information</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {employee.address_line1 && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
                    <p className="text-gray-900">{employee.address_line1}</p>
                  </div>
                )}
                {employee.address_line2 && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Address Line 2</label>
                    <p className="text-gray-900">{employee.address_line2}</p>
                  </div>
                )}
                {employee.city && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <p className="text-gray-900">{employee.city}</p>
                  </div>
                )}
                {employee.state && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <p className="text-gray-900">{employee.state}</p>
                  </div>
                )}
                {employee.pincode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Pincode</label>
                    <p className="text-gray-900">{employee.pincode}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Salary Breakdown */}
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Salary Breakdown</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Annual Components */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Annual Components</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gross Salary:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(employee.annual_gross_salary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Basic:</span>
                    <span className="text-gray-900">{formatCurrency(employee.annual_basic)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">HRA:</span>
                    <span className="text-gray-900">{formatCurrency(employee.annual_hra)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">LTA:</span>
                    <span className="text-gray-900">{formatCurrency(employee.annual_lta)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Special Allowance:</span>
                    <span className="text-gray-900">{formatCurrency(employee.annual_special_allowance)}</span>
                  </div>
                  {employee.yfbp > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">YFBP:</span>
                      <span className="text-gray-900">{formatCurrency(employee.yfbp)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Monthly Components */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Monthly Components</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gross Salary:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(employee.monthly_gross)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Basic:</span>
                    <span className="text-gray-900">{formatCurrency(employee.monthly_basic)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">HRA:</span>
                    <span className="text-gray-900">{formatCurrency(employee.monthly_hra)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">LTA:</span>
                    <span className="text-gray-900">{formatCurrency(employee.monthly_lta)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Special Allowance:</span>
                    <span className="text-gray-900">{formatCurrency(employee.monthly_special_allowance)}</span>
                  </div>
                  {employee.mfbp > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">MFBP:</span>
                      <span className="text-gray-900">{formatCurrency(employee.mfbp)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Agreement Status */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Agreement Status</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Status</label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(employee.agreement_status)}`}>
                  <span className="capitalize">{employee.agreement_status}</span>
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Employee Created</label>
                <p className="text-gray-900">{formatDate(employee.created_at)}</p>
              </div>
              {employee.processing_started_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Processing Started</label>
                  <p className="text-gray-900">{formatDate(employee.processing_started_at)}</p>
                </div>
              )}
              {employee.processing_completed_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Processing Completed</label>
                  <p className="text-gray-900">{formatDate(employee.processing_completed_at)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmployeeDetailModal
