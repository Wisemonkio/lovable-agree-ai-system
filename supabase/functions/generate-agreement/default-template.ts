
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
