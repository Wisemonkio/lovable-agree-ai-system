
import type { Employee } from './types.ts'
import { formatCurrency, formatDate } from './formatters.ts'

export const fetchGoogleDocsContent = async (docId: string): Promise<string> => {
  try {
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`
    const response = await fetch(exportUrl)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.status}`)
    }
    
    const content = await response.text()
    return content
  } catch (error) {
    console.error('Error fetching Google Docs content:', error)
    return getDefaultTemplate()
  }
}

export const getDefaultTemplate = (): string => {
  return `EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is entered into on {{Agreement Date}} between {{client Name}} ("Company") and {{Full Name}} ("Employee").

EMPLOYEE INFORMATION:
Name: {{Full Name}}
Father's Name: {{Fathers name}}
Age: {{Age}}
Email: {{email}}
Address: {{Address Line 1}}, {{Address City}}, {{Address State}} - {{Pincode}}

EMPLOYMENT DETAILS:
Position: {{Job role}}
Joining Date: {{Joining Date}}
Place of Work: {{Place}}
Client: {{client Name}}
Manager: {{Manager}}

COMPENSATION:
Annual Gross Salary: {{Annual_gross}}
Monthly Gross Salary: {{Monthly_gross}}

SALARY BREAKDOWN:
- Basic Salary: {{Annual_basic}} per annum ({{Monthly_basic}} per month)
- House Rent Allowance (HRA): {{Annual_hra}} per annum ({{Monthly_hra}} per month)
- Leave Travel Allowance (LTA): {{Annual_LTA}} per annum ({{Monthly_LTA}} per month)
- Special Allowance: {{Annual_special_allowance}} per annum ({{Monthly_special_allowance}} per month)
- Flexible Benefits: {{YFBP}} per annum ({{MFBP}} per month)

TERMS AND CONDITIONS:
1. This agreement is subject to company policies and procedures.
2. The employee agrees to maintain confidentiality of company information.
3. Either party may terminate this agreement with 30 days written notice.
4. The employee agrees to perform duties diligently and professionally.
5. This agreement is governed by the laws of India.

SIGNATURES:
Employee: _____________________ Date: _____________
{{Full Name}}

Company Representative: _____________________ Date: _____________
{{client Name}}`
}

export const replacePlaceholders = (template: string, employee: Employee): string => {
  const placeholders = {
    '{{client Name}}': employee.client_name || 'N/A',
    '{{Manager}}': employee.manager_details || 'N/A',
    '{{Client Address}}': 'N/A',
    '{{Client Country}}': 'N/A',
    '{{First Name}}': employee.first_name,
    '{{last Name}}': employee.last_name,
    '{{Full Name}}': `${employee.first_name} ${employee.last_name}`,
    '{{relation}}': 'N/A',
    '{{email}}': employee.email,
    '{{Job role}}': employee.job_title,
    '{{Role details}}': 'N/A',
    '{{Annual_gross}}': formatCurrency(employee.annual_gross_salary),
    '{{Annual_basic}}': formatCurrency(employee.annual_basic),
    '{{Annual_hra}}': formatCurrency(employee.annual_hra),
    '{{Annual_special_allowance}}': formatCurrency(employee.annual_special_allowance),
    '{{YFBP}}': formatCurrency(employee.yfbp),
    '{{Annual_LTA}}': formatCurrency(employee.annual_lta),
    '{{Monthly_gross}}': formatCurrency(employee.monthly_gross),
    '{{Monthly_basic}}': formatCurrency(employee.monthly_basic),
    '{{Monthly_hra}}': formatCurrency(employee.monthly_hra),
    '{{Monthly_special_allowance}}': formatCurrency(employee.monthly_special_allowance),
    '{{Monthly_LTA}}': formatCurrency(employee.monthly_lta),
    '{{MFBP}}': formatCurrency(employee.mfbp),
    '{{bonus}}': 'N/A',
    '{{Joining Date}}': formatDate(employee.joining_date),
    '{{Last Date}}': 'N/A',
    '{{Agreement Date}}': formatDate(new Date().toISOString()),
    '{{Id}}': employee.id,
    '{{Fathers name}}': employee.fathers_name || 'N/A',
    '{{Age}}': employee.age?.toString() || 'N/A',
    '{{Address Line 1}}': employee.address_line1 || 'N/A',
    '{{Address Line 2}}': 'N/A',
    '{{Address City}}': employee.city || 'N/A',
    '{{Pincode}}': employee.pincode || 'N/A',
    '{{Address State}}': employee.state || 'N/A',
    '{{Aadhar}}': 'N/A',
    '{{Place}}': employee.place || 'N/A',
    '{{Roles and Responsibilities}}': 'N/A'
  }

  let processedTemplate = template
  Object.entries(placeholders).forEach(([placeholder, value]) => {
    processedTemplate = processedTemplate.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value)
  })

  return processedTemplate
}
