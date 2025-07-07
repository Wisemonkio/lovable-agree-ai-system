
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileText, ExternalLink, Eye, Edit } from 'lucide-react'

interface AgreementTemplateViewerProps {
  formData?: any
}

const AgreementTemplateViewer: React.FC<AgreementTemplateViewerProps> = ({ formData }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview')
  
  const templateUrl = 'https://docs.google.com/document/d/1CpMQCfZn4ePyNr_2bYfr2IgCTZMeAJ_Og3vDwmR--zc'
  const editUrl = `${templateUrl}/edit?tab=t.0`
  const previewUrl = `${templateUrl}/preview`
  
  const openInNewTab = () => {
    window.open(editUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-amber-600" />
          <h3 className="font-semibold text-amber-900">Agreement Template</h3>
        </div>
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openInNewTab}
            className="flex items-center space-x-1"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Edit in New Tab</span>
          </Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <Eye className="w-4 h-4" />
                <span>Preview Template</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="fixed inset-0 w-screen h-screen max-w-none max-h-none p-0 m-0">
              <DialogHeader className="absolute top-0 left-0 right-0 z-20 p-4 bg-white border-b shadow-sm">
                <DialogTitle className="flex items-center justify-between">
                  <span>Agreement Template Preview</span>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant={viewMode === 'preview' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('preview')}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      type="button"
                      variant={viewMode === 'edit' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('edit')}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="pt-24 h-full">
                <iframe
                  src={viewMode === 'edit' ? editUrl : previewUrl}
                  className="w-full h-full border-0"
                  title="Agreement Template"
                  allow="clipboard-write"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="text-sm text-amber-700 mb-2">
        <p className="mb-1">
          <strong>Template Source:</strong> This is the agreement template that will be used when generating employment agreements.
        </p>
        <p className="mb-1">
          <strong>Customization:</strong> You can edit the template directly in Google Docs. Changes will be reflected in all future generated agreements.
        </p>
        <p>
          <strong>Placeholders:</strong> The template contains placeholders like {`{{FIRST_NAME}}`}, {`{{SALARY}}`} etc. that will be automatically replaced with employee data.
        </p>
      </div>
      
      {formData && (
        <div className="mt-3 p-3 bg-white rounded border border-amber-200">
          <h4 className="font-medium text-amber-900 mb-2">Current Form Data Preview:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {formData.firstName && (
              <div><span className="font-medium">Name:</span> {formData.firstName} {formData.lastName}</div>
            )}
            {formData.jobTitle && (
              <div><span className="font-medium">Job Title:</span> {formData.jobTitle}</div>
            )}
            {formData.annualGrossSalary > 0 && (
              <div><span className="font-medium">Salary:</span> ₹{formData.annualGrossSalary.toLocaleString()}</div>
            )}
            {formData.email && (
              <div><span className="font-medium">Email:</span> {formData.email}</div>
            )}
            {formData.joiningDate && (
              <div><span className="font-medium">Joining Date:</span> {formData.joiningDate}</div>
            )}
            {formData.clientName && (
              <div><span className="font-medium">Company:</span> {formData.clientName}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AgreementTemplateViewer
