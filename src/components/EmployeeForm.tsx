
import React, { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'
import { generateEmployeeAgreement } from '../services/agreementService'
import { useTemplateManagement } from '@/hooks/useTemplateManagement'
import { EmployeeFormData, AgreementStatus } from './employee/EmployeeFormTypes'
import { EmployeeSecuritySchema, sanitizeInput, FormRateLimit } from './employee/SecurityValidation'
import PersonalInfoSection from './employee/PersonalInfoSection'
import EmploymentDetailsSection from './employee/EmploymentDetailsSection'
import TemplateManagementSection from './employee/TemplateManagementSection'
import JobDescriptionEditor from './employee/JobDescriptionEditor'
import AddressSection from './employee/AddressSection'
import FormStatusDisplay from './employee/FormStatusDisplay'
import AgreementTemplateViewer from './employee/AgreementTemplateViewer'

interface EmployeeFormProps {
  onSuccess: () => void
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ onSuccess }) => {
  const { user } = useAuth()
  const {
    companyTemplates,
    selectedTemplate,
    templateUrl,
    templateName,
    isUploadingTemplate,
    showTemplateForm,
    setTemplateUrl,
    setTemplateName,
    handleTemplateUpload,
    updateSelectedTemplate
  } = useTemplateManagement()
  
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
  const [agreementStatus, setAgreementStatus] = useState<AgreementStatus>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isRateLimited, setIsRateLimited] = useState(false)
  
  // Security: Check authentication on component mount
  useEffect(() => {
    if (!user) {
      setError('You must be logged in to create employees')
      return
    }
  }, [user])
  
  // Update selected template when company name changes
  useEffect(() => {
    updateSelectedTemplate(formData.clientName)
  }, [formData.clientName, companyTemplates])
  
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
    }
  }

  const calculateLastDate = () => {
    const today = new Date()
    const lastDate = new Date(today)
    lastDate.setDate(today.getDate() + 5)
    return lastDate.toISOString().split('T')[0]
  }

  const transformGender = (gender: string) => {
    return gender === 'Male' ? 'Son' : gender === 'Female' ? 'Daughter' : ''
  }

  // Security: Comprehensive form validation
  const validateForm = (): boolean => {
    try {
      // Clear previous validation errors
      setValidationErrors({})
      
      // Validate using Zod schema
      EmployeeSecuritySchema.parse({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        jobTitle: formData.jobTitle,
        annualGrossSalary: formData.annualGrossSalary,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        aadhar: formData.aadhar || undefined,
        pincode: formData.pincode || undefined,
        age: formData.age || undefined
      })
      
      return true
    } catch (error: any) {
      const errors: Record<string, string> = {}
      
      if (error.errors) {
        error.errors.forEach((err: any) => {
          errors[err.path[0]] = err.message
        })
      }
      
      setValidationErrors(errors)
      return false
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Security checks
    if (!user) {
      setError('Authentication required. Please log in.')
      return
    }
    
    // Rate limiting check
    if (!FormRateLimit.canSubmit()) {
      const waitTime = Math.ceil(FormRateLimit.getTimeUntilNextSubmission() / 1000)
      setError(`Too many submissions. Please wait ${waitTime} seconds before trying again.`)
      setIsRateLimited(true)
      setTimeout(() => setIsRateLimited(false), waitTime * 1000)
      return
    }
    
    // Validate form data
    if (!validateForm()) {
      setError('Please fix the validation errors before submitting.')
      return
    }
    
    setSubmitting(true)
    setError(null)
    setAgreementStatus('creating')
    
    try {
      const salaryBreakdown = calculateSalaryBreakdown(formData.annualGrossSalary)
      const lastDate = calculateLastDate()
      const transformedGender = transformGender(formData.gender)
      
      // Sanitize all text inputs before database insertion
      const sanitizedData = {
        user_id: user.id, // Explicitly set user_id for security
        first_name: sanitizeInput(formData.firstName),
        last_name: sanitizeInput(formData.lastName),
        email: formData.email.toLowerCase().trim(),
        job_title: sanitizeInput(formData.jobTitle),
        job_description: sanitizeInput(formData.jobDescription),
        annual_gross_salary: formData.annualGrossSalary,
        bonus: formData.bonus ? sanitizeInput(formData.bonus) : null,
        joining_date: formData.joiningDate,
        last_date: lastDate,
        client_name: sanitizeInput(formData.clientName),
        client_email: formData.clientEmail.toLowerCase().trim(),
        manager_details: formData.managerDetails ? sanitizeInput(formData.managerDetails) : null,
        fathers_name: formData.fathersName ? sanitizeInput(formData.fathersName) : null,
        age: formData.age || null,
        gender: transformedGender,
        address_line1: formData.addressLine1 ? sanitizeInput(formData.addressLine1) : null,
        address_line2: formData.addressLine2 ? sanitizeInput(formData.addressLine2) : null,
        city: formData.city ? sanitizeInput(formData.city) : null,
        state: formData.state ? sanitizeInput(formData.state) : null,
        pincode: formData.pincode || null,
        aadhar: formData.aadhar || null,
        ...salaryBreakdown
      }
      
      const { data: employee, error: createError } = await supabase
        .from('employee_details')
        .insert(sanitizedData)
        .select()
        .single()
      
      if (createError) {
        console.error('Database error:', createError)
        throw new Error('Failed to create employee record. Please try again.')
      }
      
      setEmployeeId(employee.id)
      setAgreementStatus('generating')
      
      const agreementResult = await generateEmployeeAgreement(employee.id)
      
      if (!agreementResult.success) {
        throw new Error(agreementResult.error || 'Failed to generate agreement')
      }
      
      setAgreementStatus('completed')
      setSuccess(true)
      
      // Send welcome email to employee
      try {
        const emailResponse = await supabase.functions.invoke('send-employee-welcome-email', {
          body: {
            employeeName: `${formData.firstName} ${formData.lastName}`,
            employeeEmail: formData.email,
            jobTitle: formData.jobTitle,
            companyName: formData.clientName || 'Our Company'
          }
        })
        
        if (emailResponse.error) {
          console.error('Email sending failed:', emailResponse.error)
        } else {
          console.log('Welcome email sent successfully')
        }
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError)
        // Don't fail the whole process if email fails
      }
      
      setTimeout(() => {
        onSuccess()
      }, 3000)
      
    } catch (error) {
      console.error('Error creating employee:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(errorMessage)
      setAgreementStatus('failed')
    } finally {
      setSubmitting(false)
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    // Security: Sanitize input on change
    const sanitizedValue = type === 'text' || type === 'email' ? sanitizeInput(value) : value
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : sanitizedValue
    }))
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleJobDescriptionChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      jobDescription: sanitizeInput(value)
    }))
  }

  const handleTemplateUploadClick = async () => {
    const result = await handleTemplateUpload(formData.clientName)
    if (!result.success) {
      setError(result.error || 'Failed to upload template')
    }
  }
  
  // Show status displays if submitting or completed
  const statusDisplay = (
    <FormStatusDisplay
      success={success}
      submitting={submitting}
      agreementStatus={agreementStatus}
      employeeId={employeeId}
      error={error}
    />
  )

  if (success || agreementStatus === 'completed' || submitting) {
    return statusDisplay
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Add New Employee</h1>
        
        <div className="mb-6">
          <AgreementTemplateViewer formData={formData} />
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <PersonalInfoSection 
            formData={formData} 
            onChange={handleInputChange}
            validationErrors={validationErrors}
          />
          
          <EmploymentDetailsSection 
            formData={formData} 
            selectedTemplate={selectedTemplate}
            companyTemplates={companyTemplates}
            onChange={handleInputChange}
            validationErrors={validationErrors}
          />

          {formData.clientName && (
            <TemplateManagementSection
              clientName={formData.clientName}
              selectedTemplate={selectedTemplate}
              showTemplateForm={showTemplateForm}
              templateUrl={templateUrl}
              templateName={templateName}
              isUploadingTemplate={isUploadingTemplate}
              onTemplateUrlChange={setTemplateUrl}
              onTemplateNameChange={setTemplateName}
              onTemplateUpload={handleTemplateUploadClick}
            />
          )}

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-4">Job Description</h3>
            <JobDescriptionEditor
              value={formData.jobDescription}
              onChange={handleJobDescriptionChange}
              placeholder="Describe the role, responsibilities, requirements, and other relevant details for this position..."
            />
          </div>
          
          <AddressSection 
            formData={formData} 
            onChange={handleInputChange}
            validationErrors={validationErrors}
          />
          
          {Object.keys(validationErrors).length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">Please fix the following errors:</h4>
              <ul className="list-disc list-inside text-red-700">
                {Object.entries(validationErrors).map(([field, error]) => (
                  <li key={field}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}
          
          <button
            type="submit"
            disabled={submitting || isRateLimited}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : isRateLimited ? (
              <span>Rate Limited - Please Wait</span>
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
