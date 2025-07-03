
export const formatCurrency = (amount: number): string => {
  if (!amount || amount === 0) return '₹0'
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return ''
  }
}

export const formatAddress = (addressLine1?: string, city?: string, state?: string, pincode?: string): string => {
  const parts = [addressLine1, city, state, pincode].filter(part => part && part.trim())
  return parts.length > 0 ? parts.join(', ') : ''
}

export const formatOptionalField = (value?: string | number): string => {
  if (!value || (typeof value === 'string' && !value.trim())) return ''
  return String(value)
}
