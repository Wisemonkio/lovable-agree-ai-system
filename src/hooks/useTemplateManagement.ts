
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { CompanyTemplate } from '@/components/employee/EmployeeFormTypes'

export const useTemplateManagement = () => {
  const [companyTemplates, setCompanyTemplates] = useState<CompanyTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<CompanyTemplate | null>(null)
  const [templateUrl, setTemplateUrl] = useState('')
  const [templateName, setTemplateName] = useState('')
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false)
  const [showTemplateForm, setShowTemplateForm] = useState(false)

  const loadCompanyTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('company_agreement_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setCompanyTemplates(data || [])
    } catch (error) {
      console.error('Error loading company templates:', error)
    }
  }

  const extractGoogleDocId = (url: string): string | null => {
    const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : null
  }
  
  const validateGoogleDocUrl = (url: string): boolean => {
    return url.includes('docs.google.com/document/d/') && extractGoogleDocId(url) !== null
  }

  const handleTemplateUpload = async (clientName: string): Promise<{ success: boolean; error?: string }> => {
    if (!templateUrl || !clientName) return { success: false, error: 'Missing required fields' }
    
    if (!validateGoogleDocUrl(templateUrl)) {
      return { success: false, error: 'Please enter a valid Google Docs URL' }
    }
    
    setIsUploadingTemplate(true)
    
    try {
      const docId = extractGoogleDocId(templateUrl)
      if (!docId) throw new Error('Could not extract document ID from URL')
      
      const { data, error } = await supabase
        .from('company_agreement_templates')
        .upsert({
          company_name: clientName,
          google_doc_url: templateUrl,
          google_doc_id: docId,
          template_name: templateName || clientName + ' Agreement Template',
          is_active: true
        })
        .select()
        .single()
      
      if (error) throw error
      
      // Reload templates and update selected template
      await loadCompanyTemplates()
      setSelectedTemplate(data)
      setShowTemplateForm(false)
      setTemplateUrl('')
      setTemplateName('')
      
      return { success: true }
    } catch (error) {
      console.error('Error uploading template:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to upload template' }
    } finally {
      setIsUploadingTemplate(false)
    }
  }

  const updateSelectedTemplate = (clientName: string) => {
    if (clientName) {
      const existingTemplate = companyTemplates.find(
        template => template.company_name.toLowerCase() === clientName.toLowerCase()
      )
      setSelectedTemplate(existingTemplate || null)
      setShowTemplateForm(!existingTemplate)
    } else {
      setSelectedTemplate(null)
      setShowTemplateForm(false)
    }
  }

  useEffect(() => {
    loadCompanyTemplates()
  }, [])

  return {
    companyTemplates,
    selectedTemplate,
    templateUrl,
    templateName,
    isUploadingTemplate,
    showTemplateForm,
    setTemplateUrl,
    setTemplateName,
    handleTemplateUpload,
    updateSelectedTemplate,
    loadCompanyTemplates
  }
}
