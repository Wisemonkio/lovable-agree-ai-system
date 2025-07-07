
import { jsPDF } from "https://esm.sh/jspdf@2.5.1"
import type { Employee } from './types.ts'
import { fetchGoogleDocsContent, replacePlaceholdersInDoc, exportDocAsPDF, createDocumentCopy, deleteDocument } from './google-docs.ts'
import { replacePlaceholders } from './placeholders.ts'
import { getDefaultTemplate } from './default-template.ts'

export const generatePDF = (content: string, employee: Employee): Uint8Array => {
  console.log('Generating PDF for employee:', employee.first_name, employee.last_name)
  
  const doc = new jsPDF()
  
  // PDF settings
  const pageWidth = 210 // A4 width in mm
  const pageHeight = 297 // A4 height in mm
  const margin = 20
  const maxWidth = pageWidth - (margin * 2)
  
  let yPosition = margin
  const normalFontSize = 11
  const headerFontSize = 14
  const titleFontSize = 16
  const normalLineHeight = 6
  const headerLineHeight = 8
  const titleLineHeight = 10
  const sectionSpacing = 10
  const paragraphSpacing = 4
  
  // Split content into lines
  const lines = content.split('\n')
  
  const addNewPageIfNeeded = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      doc.addPage()
      yPosition = margin
      console.log('Added new page, reset yPosition to:', yPosition)
    }
  }
  
  const addText = (text: string, fontSize: number = normalFontSize, fontStyle: string = 'normal', lineHeight: number = normalLineHeight, addSpacing: boolean = false) => {
    if (!text.trim()) {
      yPosition += lineHeight / 2
      return
    }
    
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', fontStyle as any)
    
    const splitText = doc.splitTextToSize(text, maxWidth)
    const requiredHeight = splitText.length * lineHeight + (addSpacing ? sectionSpacing : 0)
    
    addNewPageIfNeeded(requiredHeight)
    
    splitText.forEach((line: string) => {
      doc.text(line, margin, yPosition)
      yPosition += lineHeight
    })
    
    if (addSpacing) {
      yPosition += sectionSpacing - lineHeight
    }
  }
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim()
    
    if (!trimmedLine) {
      yPosition += normalLineHeight / 2
      return
    }
    
    // Main title
    if (trimmedLine.includes('EMPLOYMENT AGREEMENT')) {
      if (index > 0) yPosition += sectionSpacing
      addText(trimmedLine, titleFontSize, 'bold', titleLineHeight, true)
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
      addText(trimmedLine, headerFontSize, 'bold', headerLineHeight, false)
      yPosition += paragraphSpacing
    }
    // Numbered terms
    else if (trimmedLine.match(/^\d+\./)) {
      addText(trimmedLine, normalFontSize, 'normal', normalLineHeight, false)
      yPosition += paragraphSpacing
    }
    // Bullet points
    else if (trimmedLine.startsWith('•')) {
      addText(trimmedLine, normalFontSize, 'normal', normalLineHeight, false)
      yPosition += 2
    }
    // Regular content
    else {
      addText(trimmedLine, normalFontSize, 'normal', normalLineHeight, false)
      yPosition += 1
    }
  })
  
  console.log('PDF generation completed, final yPosition:', yPosition)
  return doc.output('arraybuffer')
}

export const generateAgreementPDF = async (employee: Employee, templateDocId?: string): Promise<Uint8Array> => {
  console.log('Starting PDF generation for employee:', employee.first_name, employee.last_name)
  console.log('Template Doc ID:', templateDocId)
  
  try {
    // If we have a Google Docs template ID, use the Google Docs workflow
    if (templateDocId) {
      console.log('Using Google Docs template workflow')
      
      try {
        // Create a copy of the template document
        const tempDocTitle = `Agreement_${employee.first_name}_${employee.last_name}_${Date.now()}`
        const tempDocId = await createDocumentCopy(templateDocId, tempDocTitle)
        console.log('Created temporary document copy:', tempDocId)
        
        // Replace placeholders in the temporary document
        await replacePlaceholdersInDoc(tempDocId, employee)
        console.log('Placeholders replaced successfully')
        
        // Export the document as PDF
        const pdfBuffer = await exportDocAsPDF(tempDocId)
        console.log('PDF exported successfully from Google Docs')
        
        // Clean up: delete the temporary document
        await deleteDocument(tempDocId)
        console.log('Temporary document deleted successfully')
        
        return pdfBuffer
        
      } catch (googleDocsError) {
        console.error('Google Docs workflow failed:', googleDocsError)
        console.log('Falling back to default template')
        // Fall through to default template workflow
      }
    }
    
    // Use default template workflow (either no templateDocId or Google Docs failed)
    console.log('Using default template workflow')
    
    // Get the default hardcoded template
    const defaultTemplate = getDefaultTemplate()
    console.log('Retrieved default template')
    
    // Replace placeholders in the template
    const processedContent = replacePlaceholders(defaultTemplate, employee)
    console.log('Placeholders replaced in default template')
    
    // Generate PDF from the processed content
    const pdfBuffer = generatePDF(processedContent, employee)
    console.log('PDF generated from default template')
    
    return pdfBuffer
    
  } catch (error) {
    console.error('Error in generateAgreementPDF:', error)
    throw new Error(`Failed to generate agreement PDF: ${error.message}`)
  }
}
