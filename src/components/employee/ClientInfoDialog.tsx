
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface ClientInfoDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (clientName: string, clientEmail: string) => void
  isLoading: boolean
  employeeName: string
}

const ClientInfoDialog: React.FC<ClientInfoDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  employeeName
}) => {
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})

  const validateForm = () => {
    const newErrors: { name?: string; email?: string } = {}
    
    if (!clientName.trim()) {
      newErrors.name = 'Client name is required'
    }
    
    if (!clientEmail.trim()) {
      newErrors.email = 'Client email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(clientName.trim(), clientEmail.trim())
    }
  }

  const handleClose = () => {
    setClientName('')
    setClientEmail('')
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Client Information Required</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Please provide client information to send the employment agreement for {employeeName} for e-signature.
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name *</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter client name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clientEmail">Client Email *</Label>
            <Input
              id="clientEmail"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="Enter client email"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              'Send for E-signature'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ClientInfoDialog
