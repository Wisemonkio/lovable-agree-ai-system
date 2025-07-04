
import { getGoogleAccessToken } from './google-auth.ts'
import type { Employee } from './types.ts'
import { createPlaceholders } from './placeholders.ts'

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
    throw error
  }
}

export async function replacePlaceholdersInDoc(docId: string, employee: Employee): Promise<void> {
  const accessToken = await getGoogleAccessToken()
  const placeholders = createPlaceholders(employee)

  console.log('Replacing placeholders in Google Doc:', Object.keys(placeholders).length, 'placeholders')

  // Replace placeholders one by one
  for (const [placeholder, value] of Object.entries(placeholders)) {
    if (value && value.trim()) { // Only replace if value exists and is not empty
      try {
        await replaceTextInDoc(docId, placeholder, value, accessToken)
        console.log(`✓ Replaced "${placeholder}" with "${value}"`)
      } catch (error) {
        console.warn(`⚠ Failed to replace "${placeholder}":`, error.message)
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
  }]

  const response = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: requests
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to replace text in document: ${response.statusText}. ${errorText}`)
  }
}

export async function exportDocAsPDF(docId: string): Promise<Uint8Array> {
  const accessToken = await getGoogleAccessToken()
  
  console.log('Exporting document as PDF...')
  
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${docId}/export?mimeType=application/pdf`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to export document as PDF: ${response.statusText}. ${errorText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  console.log('PDF export successful, size:', arrayBuffer.byteLength)
  return new Uint8Array(arrayBuffer)
}

export async function createDocumentCopy(sourceDocId: string, title: string): Promise<string> {
  const accessToken = await getGoogleAccessToken()
  
  console.log('Creating document copy...')
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${sourceDocId}/copy`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: title
    })
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to create document copy: ${response.statusText}. ${errorText}`)
  }
  
  const data = await response.json()
  console.log('Document copy created successfully, ID:', data.id)
  return data.id
}

export async function deleteDocument(docId: string): Promise<void> {
  const accessToken = await getGoogleAccessToken()
  
  console.log('Deleting temporary document...')
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${docId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to delete document: ${response.statusText}. ${errorText}`)
  }
  
  console.log('Document deleted successfully')
}
