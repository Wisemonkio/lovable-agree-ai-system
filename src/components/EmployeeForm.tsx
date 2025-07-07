
import React, { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'
import { generateEmployeeAgreement } from '../services/agreementService'
import { useTemplateManagement } from '@/hooks/useTemplateManagement'
import { EmployeeFormData, AgreementStatus } from './employee/EmployeeFormTypes'
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
      
      const agreementResult = await generateEmployeeAgreement(employee.id)
      
      if (!agreementResult.success) {
        throw new Error(agreementResult.error || 'Failed to generate agreement')
      }
      
      setAgreementStatus('completed')
      setSuccess(true)
      
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
          <PersonalInfoSection formData={formData} onChange={handleInputChange} />
          
          <EmploymentDetailsSection 
            formData={formData} 
            selectedTemplate={selectedTemplate}
            companyTemplates={companyTemplates}
            onChange={handleInputChange} 
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
          
          <AddressSection formData={formData} onChange={handleInputChange} />
          
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
