
import { jsPDF } from "https://esm.sh/jspdf@2.5.1"
import type { Employee } from './types.ts'

export const generatePDF = (content: string, employee: Employee): Uint8Array => {
  console.log('Generating PDF for employee:', employee.first_name, employee.last_name)
  
  const doc = new jsPDF()
  
  // Split content into lines and handle page breaks
  const lines = content.split('\n')
  let yPosition = 20
  const lineHeight = 6
  const pageHeight = 280
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  
  lines.forEach((line) => {
    // Check if we need a new page
    if (yPosition > pageHeight) {
      doc.addPage()
      yPosition = 20
    }
    
    // Handle different text styles
    if (line.includes('EMPLOYMENT AGREEMENT') || line.includes('EMPLOYEE INFORMATION:') || 
        line.includes('EMPLOYMENT DETAILS:') || line.includes('COMPENSATION:') || 
        line.includes('SALARY BREAKDOWN:') || line.includes('TERMS AND CONDITIONS:') || 
        line.includes('SIGNATURES:')) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
    }
    
    // Split long lines
    const splitLines = doc.splitTextToSize(line, 170)
    splitLines.forEach((splitLine: string) => {
      if (yPosition > pageHeight) {
        doc.addPage()
        yPosition = 20
      }
      doc.text(splitLine, 20, yPosition)
      yPosition += lineHeight
    })
    
    yPosition += 2 // Extra spacing after each original line
  })
  
  return doc.output('arraybuffer')
}
