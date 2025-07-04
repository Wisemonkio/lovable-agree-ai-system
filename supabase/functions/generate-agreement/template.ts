import type { Employee } from './types.ts'
import { formatCurrency, formatDate, formatAddress, formatOptionalField } from './formatters.ts'
import { getGoogleAccessToken } from './google-auth.ts'

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
Address: {{Address Line 1}}, {{Address Line 2}}, {{Address City}}, {{Address State}} - {{Pincode}}

EMPLOYMENT DETAILS:
Position: {{Job role}}
Role Details: {{Role details}}
Joining Date: {{Joining Date}}
Last Date: {{Last Date}}
Client: {{client Name}}
Manager: {{Manager}}

COMPENSATION:
Annual Gross Salary: {{Annual_gross}}
Monthly Gross Salary: {{Monthly_gross}}

SALARY BREAKDOWN:
• Basic Salary: {{Annual_basic}} per annum ({{Monthly_basic}} per month)
• House Rent Allowance (HRA): {{Annual_hra}} per annum ({{Monthly_hra}} per month)
• Leave Travel Allowance (LTA): {{Annual_LTA}} per annum ({{Monthly_LTA}} per month)
• Special Allowance: {{Annual_special_allowance}} per annum ({{Monthly_special_allowance}} per month)
• Flexible Benefits: {{YFBP}} per annum ({{MFBP}} per month)

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
    '{{Role details}}': employee.job_description || '',
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

export async function replacePlaceholdersInDoc(docId: string, employee: Employee): Promise<void> {
  const accessToken = await getGoogleAccessToken();
  
  const placeholders = {
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
    '{{Role details}}': employee.job_description || '',
    '{{Last Date}}': employee.last_date ? formatDate(employee.last_date) : '',
    '{{Address State}}': employee.state || '',
    '{{Pincode}}': employee.pincode || '',
    '{{Address City}}': employee.city || '',
    '{{Address Line 2}}': employee.address_line2 || '',
    '{{Address Line 1}}': employee.address_line1 || '',
    '{{relation}}': employee.gender || '',
    '{{Fathers name}}': employee.fathers_name || '',
    '{{Age}}': employee.age ? employee.age.toString() : ''
  };

  console.log('Replacing placeholders in Google Doc:', Object.keys(placeholders).length, 'placeholders');

  // Replace placeholders one by one
  for (const [placeholder, value] of Object.entries(placeholders)) {
    if (value && value.trim()) { // Only replace if value exists and is not empty
      try {
        await replaceTextInDoc(docId, placeholder, value, accessToken);
        console.log(`✓ Replaced "${placeholder}" with "${value}"`);
      } catch (error) {
        console.warn(`⚠ Failed to replace "${placeholder}":`, error.message);
      }
    }
  }
}

async function replaceTextInDoc(docId: string, searchText: string, replaceText: string, accessToken: string): Promise<void> {
  const requests = [{
    replaceAllText: {
      containsText: {
        text: searchText,
        matchCase: false
      },
      replaceText: replaceText
    }
  }];

  const response = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: requests
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to replace text in document: ${response.statusText}. ${errorText}`);
  }
}

export async function exportDocAsPDF(docId: string): Promise<Uint8Array> {
  const accessToken = await getGoogleAccessToken();
  
  console.log('Exporting document as PDF...');
  
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${docId}/export?mimeType=application/pdf`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to export document as PDF: ${response.statusText}. ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  console.log('PDF export successful, size:', arrayBuffer.byteLength);
  return new Uint8Array(arrayBuffer);
}

export async function createDocumentCopy(sourceDocId: string, title: string): Promise<string> {
  const accessToken = await getGoogleAccessToken();
  
  console.log('Creating document copy...');
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${sourceDocId}/copy`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: title
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create document copy: ${response.statusText}. ${errorText}`);
  }
  
  const data = await response.json();
  console.log('Document copy created successfully, ID:', data.id);
  return data.id;
}

export async function deleteDocument(docId: string): Promise<void> {
  const accessToken = await getGoogleAccessToken();
  
  console.log('Deleting temporary document...');
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${docId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete document: ${response.statusText}. ${errorText}`);
  }
  
  console.log('Document deleted successfully');
}
