import React, { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { CheckCircle, Loader2, AlertCircle, Upload, Eye, ExternalLink } from 'lucide-react'
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
  bonus: string
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

interface CompanyTemplate {
  id: string
  company_name: string
  google_doc_url: string
  google_doc_id: string
  template_name: string | null
  created_at: string
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
    bonus: '',
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
  
  // Company template state
  const [companyTemplates, setCompanyTemplates] = useState<CompanyTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<CompanyTemplate | null>(null)
  const [templateUrl, setTemplateUrl] = useState('')
  const [templateName, setTemplateName] = useState('')
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false)
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  
  // Load company templates on component mount
  useEffect(() => {
    loadCompanyTemplates()
  }, [])
  
  // Check for existing template when company name changes
  useEffect(() => {
    if (formData.clientName) {
      const existingTemplate = companyTemplates.find(
        template => template.company_name.toLowerCase() === formData.clientName.toLowerCase()
      )
      setSelectedTemplate(existingTemplate || null)
      setShowTemplateForm(!existingTemplate)
    } else {
      setSelectedTemplate(null)
      setShowTemplateForm(false)
    }
  }, [formData.clientName, companyTemplates])
  
  const loadCompanyTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('company_agreement_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setCompanyTemplates(data || [])
    } catch (error) {
      console.error('Error loading company templates:', error)
    }
  }
  
  const extractGoogleDocId = (url: string): string | null => {
    const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : null
  }
  
  const validateGoogleDocUrl = (url: string): boolean => {
    return url.includes('docs.google.com/document/d/') && extractGoogleDocId(url) !== null
  }
  
  const handleTemplateUpload = async () => {
    if (!templateUrl || !formData.clientName) return
    
    if (!validateGoogleDocUrl(templateUrl)) {
      setError('Please enter a valid Google Docs URL')
      return
    }
    
    setIsUploadingTemplate(true)
    setError(null)
    
    try {
      const docId = extractGoogleDocId(templateUrl)
      if (!docId) throw new Error('Could not extract document ID from URL')
      
      const { data, error } = await supabase
        .from('company_agreement_templates')
        .upsert({
          company_name: formData.clientName,
          google_doc_url: templateUrl,
          google_doc_id: docId,
          template_name: templateName || formData.clientName + ' Agreement Template',
          is_active: true
        })
        .select()
        .single()
      
      if (error) throw error
      
      // Reload templates and update selected template
      await loadCompanyTemplates()
      setSelectedTemplate(data)
      setShowTemplateForm(false)
      setTemplateUrl('')
      setTemplateName('')
      
    } catch (error) {
      console.error('Error uploading template:', error)
      setError(error instanceof Error ? error.message : 'Failed to upload template')
    } finally {
      setIsUploadingTemplate(false)
    }
  }
  
  // Calculate only the basic salary breakdown - let database generate the rest
  const calculateSalaryBreakdown = (annualGross: number) => {
    return {
      monthly_gross: annualGross / 12,
      annual_basic: annualGross / 2,
      annual_hra: (annualGross / 2) / 2,
      annual_lta: (annualGross / 2) / 5,
      monthly_basic: (annualGross / 2) / 12,
      monthly_hra: ((annualGross / 2) / 2) / 12,
      monthly_lta: ((annualGross / 2) / 5) / 12
      // Removed yfbp, mfbp, annual_special_allowance, and monthly_special_allowance 
      // as they are generated columns in the database
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name *</label>
                <input
                  type="text"
                  name="fathersName"
                  required
                  value={formData.fathersName}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                <input
                  type="number"
                  name="age"
                  required
                  min="18"
                  max="100"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number *</label>
                <input
                  type="text"
                  name="aadhar"
                  required
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Variable/Bonus (in words)</label>
                <input
                  type="text"
                  name="bonus"
                  value={formData.bonus}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., Ten Thousand Rupees Only"
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
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  list="company-templates"
                />
                <datalist id="company-templates">
                  {companyTemplates.map(template => (
                    <option key={template.id} value={template.company_name} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Email *</label>
                <input
                  type="email"
                  name="clientEmail"
                  required
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

          {/* Agreement Template Section */}
          {formData.clientName && (
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-900 mb-4">Agreement Template</h3>
              
              {selectedTemplate ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div>
                      <h4 className="font-medium text-gray-900">{selectedTemplate.template_name || 'Custom Template'}</h4>
                      <p className="text-sm text-gray-600">Company: {selectedTemplate.company_name}</p>
                      <p className="text-xs text-gray-500">Created: {new Date(selectedTemplate.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a
                        href={selectedTemplate.google_doc_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </a>
                      <a
                        href={selectedTemplate.google_doc_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Open
                      </a>
                    </div>
                  </div>
                </div>
              ) : showTemplateForm && (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-100 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      No custom template found for <strong>{formData.clientName}</strong>. 
                      You can upload a Google Docs template or use the default template.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Google Docs Template URL *
                      </label>
                      <input
                        type="url"
                        value={templateUrl}
                        onChange={(e) => setTemplateUrl(e.target.value)}
                        placeholder="https://docs.google.com/document/d/..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Make sure the document is publicly viewable or shared with appropriate permissions
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Template Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder={`${formData.clientName} Agreement Template`}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleTemplateUpload}
                      disabled={!templateUrl || isUploadingTemplate}
                      className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isUploadingTemplate ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      {isUploadingTemplate ? 'Uploading...' : 'Upload Template'}
                    </button>
                  </div>
                </div>
              )}
              
              {!selectedTemplate && !showTemplateForm && (
                <div className="text-center">
                  <p className="text-gray-600 mb-2">Enter a company name to manage templates</p>
                </div>
              )}
            </div>
          )}

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
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                <input
                  type="text"
                  name="addressLine1"
                  required
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 *</label>
                <input
                  type="text"
                  name="addressLine2"
                  required
                  value={formData.addressLine2}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                <input
                  type="text"
                  name="state"
                  required
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                <input
                  type="text"
                  name="pincode"
                  required
                  value={formData.pincode}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}
          
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
