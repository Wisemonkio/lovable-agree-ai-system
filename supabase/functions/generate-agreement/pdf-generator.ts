
import { jsPDF } from "https://esm.sh/jspdf@2.5.1"
import type { Employee } from './types.ts'

export const generatePDF = (content: string, employee: Employee): Uint8Array => {
  console.log('Generating PDF for employee:', employee.first_name, employee.last_name)
  
  const doc = new jsPDF()
  
  // PDF settings
  const pageWidth = 210 // A4 width in mm
  const pageHeight = 297 // A4 height in mm
  const margin = 20
  const maxWidth = pageWidth - (margin * 2)
  
  let yPosition = margin
  const normalLineHeight = 7
  const headerLineHeight = 10
  const sectionSpacing = 8
  
  // Split content into lines
  const lines = content.split('\n')
  
  const addNewPageIfNeeded = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      doc.addPage()
      yPosition = margin
    }
  }
  
  const addText = (text: string, fontSize: number = 11, fontStyle: string = 'normal', isHeader: boolean = false) => {
    if (!text.trim()) {
      yPosition += normalLineHeight / 2
      return
    }
    
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', fontStyle as any)
    
    const lineHeight = isHeader ? headerLineHeight : normalLineHeight
    const splitText = doc.splitTextToSize(text, maxWidth)
    
    addNewPageIfNeeded(splitText.length * lineHeight)
    
    splitText.forEach((line: string, index: number) => {
      doc.text(line, margin, yPosition)
      yPosition += lineHeight
    })
    
    // Add extra spacing after headers and sections
    if (isHeader) {
      yPosition += sectionSpacing - lineHeight
    }
  }
  
  lines.forEach((line) => {
    const trimmedLine = line.trim()
    
    if (!trimmedLine) {
      yPosition += normalLineHeight / 2
      return
    }
    
    // Main title
    if (trimmedLine.includes('EMPLOYMENT AGREEMENT')) {
      addText(trimmedLine, 16, 'bold', true)
      yPosition += sectionSpacing
    }
    // Section headers
    else if (
      trimmedLine.includes('EMPLOYEE INFORMATION:') || 
      trimmedLine.includes('EMPLOYMENT DETAILS:') || 
      trimmedLine.includes('COMPENSATION:') || 
      trimmedLine.includes('SALARY BREAKDOWN:') || 
      trimmedLine.includes('TERMS AND CONDITIONS:') || 
      trimmedLine.includes('SIGNATURES:')
    ) {
      yPosition += sectionSpacing / 2
      addText(trimmedLine, 13, 'bold', true)
    }
    // Numbered terms
    else if (trimmedLine.match(/^\d+\./)) {
      addText(trimmedLine, 11, 'normal')
      yPosition += 2
    }
    // Regular content
    else {
      addText(trimmedLine, 11, 'normal')
    }
  })
  
  return doc.output('arraybuffer')
}
