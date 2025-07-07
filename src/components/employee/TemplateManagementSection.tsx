
import React from 'react'
import { Loader2, Upload, Eye, ExternalLink, Info, AlertCircle } from 'lucide-react'
import { CompanyTemplate } from './EmployeeFormTypes'

interface TemplateManagementSectionProps {
  clientName: string
  selectedTemplate: CompanyTemplate | null
  showTemplateForm: boolean
  templateUrl: string
  templateName: string
  isUploadingTemplate: boolean
  onTemplateUrlChange: (value: string) => void
  onTemplateNameChange: (value: string) => void
  onTemplateUpload: () => void
}

const TemplateManagementSection: React.FC<TemplateManagementSectionProps> = ({
  clientName,
  selectedTemplate,
  showTemplateForm,
  templateUrl,
  templateName,
  isUploadingTemplate,
  onTemplateUrlChange,
  onTemplateNameChange,
  onTemplateUpload
}) => {
  if (!clientName) {
    return (
      <div className="bg-orange-50 p-4 rounded-lg">
        <h3 className="font-semibold text-orange-900 mb-4">Agreement Template</h3>
        <div className="text-center">
          <p className="text-gray-600 mb-2">Enter a company name to manage templates</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-orange-50 p-4 rounded-lg">
      <h3 className="font-semibold text-orange-900 mb-4">Agreement Template</h3>
      
      {selectedTemplate ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-200">
            <div>
              <h4 className="font-medium text-gray-900 flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                {selectedTemplate.template_name || 'Custom Template'}
              </h4>
              <p className="text-sm text-gray-600">Company: {selectedTemplate.company_name}</p>
              <p className="text-xs text-gray-500">Created: {new Date(selectedTemplate.created_at).toLocaleDateString()}</p>
              <p className="text-xs text-green-600 font-medium mt-1">✓ Custom template will be used for this company</p>
            </div>
            <div className="flex items-center space-x-2">
              <a
                href={selectedTemplate.google_doc_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </a>
              <a
                href={selectedTemplate.google_doc_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Open
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-amber-100 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-amber-800 font-medium mb-1">
                  No custom template found for <strong>{clientName}</strong>
                </p>
                <p className="text-xs text-amber-700">
                  The generic default template will be used for agreement generation. 
                  You can upload a company-specific template below for customized agreements.
                </p>
              </div>
            </div>
          </div>
          
          {showTemplateForm && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    Upload a Google Docs template to create customized agreements for {clientName}. 
                    This will replace the generic template for all future agreements for this company.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Google Docs Template URL *
                  </label>
                  <input
                    type="url"
                    value={templateUrl}
                    onChange={(e) => onTemplateUrlChange(e.target.value)}
                    placeholder="https://docs.google.com/document/d/..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Make sure the document is publicly viewable or shared with appropriate permissions
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => onTemplateNameChange(e.target.value)}
                    placeholder={`${clientName} Agreement Template`}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                
                <button
                  type="button"
                  onClick={onTemplateUpload}
                  disabled={!templateUrl || isUploadingTemplate}
                  className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUploadingTemplate ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {isUploadingTemplate ? 'Uploading...' : 'Upload Custom Template'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TemplateManagementSection
