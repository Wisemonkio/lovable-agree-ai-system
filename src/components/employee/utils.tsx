
import { Clock, CheckCircle, AlertCircle } from 'lucide-react'

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800 border-green-200'
    case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'failed': return 'bg-red-100 text-red-800 border-red-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return <CheckCircle className="w-4 h-4" />
    case 'processing': return <Clock className="w-4 h-4 animate-spin" />
    case 'pending': return <AlertCircle className="w-4 h-4" />
    case 'failed': return <AlertCircle className="w-4 h-4" />
    default: return <AlertCircle className="w-4 h-4" />
  }
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount)
}

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
