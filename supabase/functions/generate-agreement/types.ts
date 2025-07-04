export interface Employee {
  id: string
  first_name: string
  last_name: string
  email: string
  job_title: string
  job_description?: string
  annual_gross_salary: number
  monthly_gross: number
  annual_basic: number
  annual_hra: number
  annual_lta: number
  annual_special_allowance: number
  monthly_basic: number
  monthly_hra: number
  monthly_lta: number
  monthly_special_allowance: number
  yfbp: number
  mfbp: number
  joining_date: string
  last_date?: string
  client_name?: string
  client_email?: string
  manager_details?: string
  fathers_name?: string
  age?: number
  gender?: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  pincode?: string
  place?: string
  aadhar?: string
}

export interface AgreementGenerationResponse {
  success: boolean
  employee_id?: string
  document_urls?: {
    pdf_url: string
    pdf_download_url: string
    doc_url: string
  }
  message?: string
  error?: string
  details?: string
}
