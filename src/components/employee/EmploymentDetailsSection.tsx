
import React from 'react'
import { CheckCircle } from 'lucide-react'
import { EmployeeFormData, CompanyTemplate } from './EmployeeFormTypes'

interface EmploymentDetailsSectionProps {
  formData: EmployeeFormData
  selectedTemplate: CompanyTemplate | null
  companyTemplates: CompanyTemplate[]
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  validationErrors: Record<string, string>
}

const EmploymentDetailsSection: React.FC<EmploymentDetailsSectionProps> = ({ 
  formData, 
  selectedTemplate, 
  companyTemplates, 
  onChange,
  validationErrors
}) => {
  const calculateLastDate = () => {
    if (!formData.joiningDate) return 'Select joining date first'
    const joinDate = new Date(formData.joiningDate)
    const lastDate = new Date(joinDate)
    lastDate.setDate(joinDate.getDate() + 5)
    return lastDate.toLocaleDateString()
  }

  return (
    <div className="bg-green-50 p-4 rounded-lg">
      <h3 className="font-semibold text-green-900 mb-4">Employment Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
          <input
            type="text"
            name="jobTitle"
            required
            value={formData.jobTitle}
            onChange={onChange}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
              validationErrors.jobTitle ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.jobTitle && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.jobTitle}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Annual Gross Salary (₹) *</label>
          <input
            type="number"
            name="annualGrossSalary"
            required
            min="0"
            value={formData.annualGrossSalary}
            onChange={onChange}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
              validationErrors.annualGrossSalary ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.annualGrossSalary && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.annualGrossSalary}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Variable/Bonus (in words)</label>
          <input
            type="text"
            name="bonus"
            value={formData.bonus}
            onChange={onChange}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
              validationErrors.bonus ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., Ten Thousand Rupees Only"
          />
          {validationErrors.bonus && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.bonus}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date *</label>
          <input
            type="date"
            name="joiningDate"
            required
            value={formData.joiningDate}
            onChange={onChange}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
              validationErrors.joiningDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.joiningDate && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.joiningDate}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Date (Auto-calculated)</label>
          <input
            type="text"
            value={calculateLastDate()}
            readOnly
            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company *
            {selectedTemplate && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Custom Template
              </span>
            )}
          </label>
          <input
            type="text"
            name="clientName"
            required
            value={formData.clientName}
            onChange={onChange}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
              validationErrors.clientName ? 'border-red-500' : 'border-gray-300'
            }`}
            list="company-templates"
          />
          <datalist id="company-templates">
            {companyTemplates.map(template => (
              <option key={template.id} value={template.company_name} />
            ))}
          </datalist>
          {validationErrors.clientName && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.clientName}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client Email *</label>
          <input
            type="email"
            name="clientEmail"
            required
            value={formData.clientEmail}
            onChange={onChange}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
              validationErrors.clientEmail ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.clientEmail && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.clientEmail}</p>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Manager Details</label>
          <input
            type="text"
            name="managerDetails"
            value={formData.managerDetails}
            onChange={onChange}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
              validationErrors.managerDetails ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.managerDetails && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.managerDetails}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default EmploymentDetailsSection
