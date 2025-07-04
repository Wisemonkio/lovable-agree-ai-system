
import type { Employee } from './types.ts'
import { fetchGoogleDocsContent, replacePlaceholdersInDoc, exportDocAsPDF, createDocumentCopy, deleteDocument } from './google-docs.ts'
import { replacePlaceholders } from './placeholders.ts'
import { getDefaultTemplate } from './default-template.ts'

// Re-export functions for backward compatibility
export { fetchGoogleDocsContent, replacePlaceholdersInDoc, exportDocAsPDF, createDocumentCopy, deleteDocument, getDefaultTemplate, replacePlaceholders }
