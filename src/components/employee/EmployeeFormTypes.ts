
export interface EmployeeFormData {
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

export interface CompanyTemplate {
  id: string
  company_name: string
  google_doc_url: string
  google_doc_id: string
  template_name: string | null
  created_at: string
}

export type AgreementStatus = 'creating' | 'generating' | 'completed' | 'failed' | null
