/**
 * Converts HTML content to plain text with proper formatting
 * Handles common HTML elements from rich text editors
 */
export const htmlToPlainText = (html: string): string => {
  if (!html) return ''
  
  let text = html
  
  // Convert div tags to line breaks
  text = text.replace(/<div[^>]*>/gi, '\n')
  text = text.replace(/<\/div>/gi, '')
  
  // Convert paragraph tags to double line breaks
  text = text.replace(/<p[^>]*>/gi, '\n')
  text = text.replace(/<\/p>/gi, '\n')
  
  // Convert break tags to line breaks
  text = text.replace(/<br[^>]*>/gi, '\n')
  
  // Handle unordered lists
  text = text.replace(/<ul[^>]*>/gi, '\n')
  text = text.replace(/<\/ul>/gi, '\n')
  text = text.replace(/<li[^>]*>/gi, '• ')
  text = text.replace(/<\/li>/gi, '\n')
  
  // Handle ordered lists
  let listCounter = 0
  text = text.replace(/<ol[^>]*>/gi, () => {
    listCounter = 0
    return '\n'
  })
  text = text.replace(/<\/ol>/gi, '\n')
  text = text.replace(/<li[^>]*>/gi, () => {
    listCounter++
    return `${listCounter}. `
  })
  
  // Remove strong/bold tags but keep content
  text = text.replace(/<\/?strong[^>]*>/gi, '')
  text = text.replace(/<\/?b[^>]*>/gi, '')
  
  // Remove italic/emphasis tags but keep content
  text = text.replace(/<\/?em[^>]*>/gi, '')
  text = text.replace(/<\/?i[^>]*>/gi, '')
  
  // Handle links - extract text content
  text = text.replace(/<a[^>]*>(.*?)<\/a>/gi, '$1')
  
  // Remove any remaining HTML tags
  text = text.replace(/<[^>]*>/g, '')
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&#39;/g, "'")
  
  // Clean up excessive whitespace and line breaks
  text = text.replace(/\n\s*\n\s*\n/g, '\n\n') // Replace multiple line breaks with double
  text = text.replace(/^\s+|\s+$/g, '') // Trim start and end
  text = text.replace(/[ \t]+$/gm, '') // Remove trailing spaces from lines
  
  return text
}
