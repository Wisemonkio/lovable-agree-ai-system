import React, { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { generateEmployeeAgreement } from '../services/agreementService'
import JobDescriptionEditor from './employee/JobDescriptionEditor'
import AgreementTemplateViewer from './employee/AgreementTemplateViewer'

interface EmployeeFormProps {
  onSuccess: () => void
}

interface EmployeeFormData {
  firstName: string
  lastName: string
  email: string
  jobTitle: string
  jobDescription: string
  annualGrossSalary: number
  bonus: number
  joiningDate: string
  clientName: string
  clientEmail: string
  managerDetails: string
  fathersName: string
  age: number
  gender: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  pincode: string
  aadhar: string
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ onSuccess }) => {
  
  const { user } = useAuth()
  const [formData, setFormData] = useState<EmployeeFormData>({
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: '',
    jobDescription: '',
    annualGrossSalary: 0,
    bonus: 0,
    joiningDate: '',
    clientName: '',
    clientEmail: '',
    managerDetails: '',
    fathersName: '',
    age: 0,
    gender: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    aadhar: ''
  })
  
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [employeeId, setEmployeeId] = useState<string | null>(null)
  const [agreementStatus, setAgreementStatus] = useState<'creating' | 'generating' | 'completed' | 'failed' | null>(null)
  
  // Calculate salary breakdown
  const calculateSalaryBreakdown = (annualGross: number) => {
    const annualBasic = annualGross / 2
    const annualHra = annualBasic / 2
    const annualLta = annualBasic / 5
    const yfbp = annualGross <= 1275000 ? 0 : 169392
    const annualSpecialAllowance = annualGross - annualBasic - annualHra - annualLta - yfbp - 21600
    
    return {
      monthly_gross: annualGross / 12,
      annual_basic: annualBasic,
      annual_hra: annualHra,
      annual_lta: annualLta,
      annual_special_allowance: annualSpecialAllowance,
      monthly_basic: annualBasic / 12,
      monthly_hra: annualHra / 12,
      monthly_lta: annualLta / 12,
      monthly_special_allowance: annualSpecialAllowance / 12,
      yfbp,
      mfbp: yfbp / 12
    }
  }

  // Calculate last date (today + 5 days)
  const calculateLastDate = () => {
    const today = new Date()
    const lastDate = new Date(today)
    lastDate.setDate(today.getDate() + 5)
    return lastDate.toISOString().split('T')[0]
  }

  // Transform gender selection
  const transformGender = (gender: string) => {
    return gender === 'Male' ? 'Son' : gender === 'Female' ? 'Daughter' : ''
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setSubmitting(true)
    setError(null)
    setAgreementStatus('creating')
    
    try {
      const salaryBreakdown = calculateSalaryBreakdown(formData.annualGrossSalary)
      const lastDate = calculateLastDate()
      const transformedGender = transformGender(formData.gender)
      
      // Step 1: Create employee record
      const { data: employee, error: createError } = await supabase
        .from('employee_details')
        .insert({
          user_id: user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          job_title: formData.jobTitle,
          job_description: formData.jobDescription,
          annual_gross_salary: formData.annualGrossSalary,
          bonus: formData.bonus,
          joining_date: formData.joiningDate,
          last_date: lastDate,
          client_name: formData.clientName,
          client_email: formData.clientEmail,
          manager_details: formData.managerDetails,
          fathers_name: formData.fathersName,
          age: formData.age,
          gender: transformedGender,
          address_line1: formData.addressLine1,
          address_line2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          aadhar: formData.aadhar,
          ...salaryBreakdown
        })
        .select()
        .single()
      
      if (createError) throw createError
      
      setEmployeeId(employee.id)
      setAgreementStatus('generating')
      
      // Step 2: Call Edge Function to generate agreement
      const agreementResult = await generateEmployeeAgreement(employee.id)
      
      if (!agreementResult.success) {
        throw new Error(agreementResult.error || 'Failed to generate agreement')
      }
      
      setAgreementStatus('completed')
      setSuccess(true)
      
      // Redirect after 3 seconds
      setTimeout(() => {
        onSuccess()
      }, 3000)
      
    } catch (error) {
      console.error('Error creating employee:', error)
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
      setAgreementStatus('failed')
    } finally {
      setSubmitting(false)
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  const handleJobDescriptionChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      jobDescription: value
    }))
  }
  
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
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Add New Employee</h1>
        
        {/* Agreement Template Section */}
        <div className="mb-6">
          <AgreementTemplateViewer formData={formData} />
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                <select
                  name="gender"
                  required
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
                <input
                  type="text"
                  name="fathersName"
                  value={formData.fathersName}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input
                  type="number"
                  name="age"
                  min="18"
                  max="100"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number</label>
                <input
                  type="text"
                  name="aadhar"
                  value={formData.aadhar}
                  onChange={handleInputChange}
                  placeholder="1234 5678 9012"
                  maxLength={12}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          
          {/* Employment Details Section */}
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
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Annual Gross Salary (₹) *</label>
                <input
                  type="number"
                  name="annualGrossSalary"
                  required
                  min="0"
                  value={formData.annualGrossSalary}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bonus (₹)</label>
                <input
                  type="number"
                  name="bonus"
                  min="0"
                  value={formData.bonus}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter bonus amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date *</label>
                <input
                  type="date"
                  name="joiningDate"
                  required
                  value={formData.joiningDate}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Date (Auto-calculated)</label>
                <input
                  type="text"
                  value={formData.joiningDate ? (() => {
                    const joinDate = new Date(formData.joiningDate)
                    const lastDate = new Date(joinDate)
                    lastDate.setDate(joinDate.getDate() + 5)
                    return lastDate.toLocaleDateString()
                  })() : 'Select joining date first'}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Email</label>
                <input
                  type="email"
                  name="clientEmail"
                  value={formData.clientEmail}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Manager Details</label>
                <input
                  type="text"
                  name="managerDetails"
                  value={formData.managerDetails}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>

          {/* Job Description Section */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-4">Job Description</h3>
            <JobDescriptionEditor
              value={formData.jobDescription}
              onChange={handleJobDescriptionChange}
              placeholder="Describe the role, responsibilities, requirements, and other relevant details for this position..."
            />
          </div>
          
          {/* Address Information Section */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-4">Address Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Create Employee & Generate Agreement</span>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default EmployeeForm
