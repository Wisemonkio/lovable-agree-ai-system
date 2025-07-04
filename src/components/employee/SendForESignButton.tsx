
import React, { useState } from 'react'
import { PenTool, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Employee } from './types'
import { useToast } from '@/hooks/use-toast'
import { sendForSigning } from '@/services/zohoSignService'
import ClientInfoDialog from './ClientInfoDialog'

interface SendForESignButtonProps {
  employee: Employee
  onSuccess?: () => void
}

const SendForESignButton: React.FC<SendForESignButtonProps> = ({ employee, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [showClientDialog, setShowClientDialog] = useState(false)
  const { toast } = useToast()

  const handleSendForSigning = async (clientName?: string, clientEmail?: string) => {
    // Check if we need client information
    const needsClientInfo = !employee.client_name || !employee.client_email
    
    if (needsClientInfo && (!clientName || !clientEmail)) {
      setShowClientDialog(true)
      return
    }

    setIsLoading(true)
    
    try {
      const result = await sendForSigning(employee.id, {
        clientName: clientName || employee.client_name || '',
        clientEmail: clientEmail || employee.client_email || ''
      })

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Agreement sent for e-signature successfully!",
        })

        setShowClientDialog(false)
        if (onSuccess) {
          onSuccess()
        }
      } else {
        throw new Error(result.error || 'Failed to send for signing')
      }
    } catch (error) {
      console.error('Error sending for signature:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send for signing. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Sending...</span>
        </>
      )
    }

    switch (employee.zoho_sign_status) {
      case 'sent':
        return (
          <>
            <Clock className="w-4 h-4" />
            <span>Pending Signature</span>
          </>
        )
      case 'completed':
        return (
          <>
            <CheckCircle className="w-4 h-4" />
            <span>Signed</span>
          </>
        )
      case 'failed':
        return (
          <>
            <XCircle className="w-4 h-4" />
            <span>Failed - Retry</span>
          </>
        )
      default:
        return (
          <>
            <PenTool className="w-4 h-4" />
            <span>Send for E-sign</span>
          </>
        )
    }
  }

  const getButtonStyle = () => {
    switch (employee.zoho_sign_status) {
      case 'sent':
        return "bg-yellow-600 hover:bg-yellow-700 text-white"
      case 'completed':
        return "bg-green-600 hover:bg-green-700 text-white"
      case 'failed':
        return "bg-red-600 hover:bg-red-700 text-white"
      default:
        return "bg-purple-600 hover:bg-purple-700 text-white"
    }
  }

  const isDisabled = () => {
    return isLoading || 
           !employee.pdf_download_url || 
           employee.agreement_status !== 'completed' ||
           employee.zoho_sign_status === 'completed' ||
           employee.zoho_sign_status === 'sent'
  }

  const shouldShowButton = () => {
    return employee.agreement_status === 'completed' && employee.pdf_download_url
  }

  if (!shouldShowButton()) {
    return null
  }

  return (
    <>
      <button
        onClick={() => handleSendForSigning()}
        disabled={isDisabled()}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${getButtonStyle()}`}
      >
        {getButtonContent()}
      </button>

      <ClientInfoDialog
        isOpen={showClientDialog}
        onClose={() => setShowClientDialog(false)}
        onSubmit={handleSendForSigning}
        isLoading={isLoading}
        employeeName={`${employee.first_name} ${employee.last_name}`}
      />
    </>
  )
}

export default SendForESignButton
