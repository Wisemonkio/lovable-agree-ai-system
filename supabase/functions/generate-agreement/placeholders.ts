
import type { Employee } from './types.ts'
import { formatCurrency, formatDate } from './formatters.ts'
import { htmlToPlainText } from './html-utils.ts'

export const createPlaceholders = (employee: Employee): Record<string, string> => {
  return {
    '{{client Name}}': employee.client_name || 'Company',
    '{{Manager}}': employee.manager_details || '',
    '{{First Name}}': employee.first_name,
    '{{last Name}}': employee.last_name,
    '{{Full Name}}': `${employee.first_name} ${employee.last_name}`,
    '{{email}}': employee.email,
    '{{Job role}}': employee.job_title,
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
    '{{Joining Date}}': formatDate(employee.joining_date),
    '{{Agreement Date}}': formatDate(new Date().toISOString()),
    '{{Id}}': employee.id,
    '{{Role details}}': employee.job_description ? htmlToPlainText(employee.job_description) : '',
    '{{Last Date}}': employee.last_date ? formatDate(employee.last_date) : '',
    '{{Address State}}': employee.state || '',
    '{{Pincode}}': employee.pincode || '',
    '{{Address City}}': employee.city || '',
    '{{Address Line 2}}': employee.address_line2 || '',
    '{{Address Line 1}}': employee.address_line1 || '',
    '{{relation}}': employee.gender || '',
    '{{Fathers name}}': employee.fathers_name || '',
    '{{Age}}': employee.age ? employee.age.toString() : ''
  }
}

export const replacePlaceholders = (template: string, employee: Employee): string => {
  const placeholders = createPlaceholders(employee)
  
  let processedTemplate = template
  Object.entries(placeholders).forEach(([placeholder, value]) => {
    processedTemplate = processedTemplate.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value)
  })

  // Clean up any remaining empty placeholder patterns
  processedTemplate = processedTemplate.replace(/\{\{[^}]+\}\}/g, '')
  
  // Clean up excessive empty lines but preserve intentional spacing
  processedTemplate = processedTemplate.replace(/\n\s*\n\s*\n/g, '\n\n')
  
  // Clean up trailing whitespace from lines
  processedTemplate = processedTemplate.replace(/[ \t]+$/gm, '')

  return processedTemplate
}
