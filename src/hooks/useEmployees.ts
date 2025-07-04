
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Employee } from '@/components/employee/types'

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()
  
  const fetchEmployees = async () => {
    try {
      console.log('useEmployees: Fetching employees with centralized client')
      const { data, error } = await supabase
        .from('employee_details')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      console.log('useEmployees: Successfully fetched employees:', data?.length)
      
      // Transform the data to match our Employee interface
      const transformedData = data?.map(employee => ({
        ...employee,
        zoho_sign_status: employee.zoho_sign_status as Employee['zoho_sign_status'],
        // Ensure bonus is handled as string or undefined
        bonus: employee.bonus || undefined
      })) || []
      
      setEmployees(transformedData)
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast({
        title: "Error",
        description: "Failed to fetch employees. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchEmployees()
  }

  const handleDownload = async (employee: Employee) => {
    if (!employee.pdf_download_url) return
    
    try {
      const response = await fetch(employee.pdf_download_url)
      const blob = await response.blob()
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `employment_agreement_${employee.first_name}_${employee.last_name}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Success",
        description: "Agreement downloaded successfully!",
      })
    } catch (error) {
      console.error('Error downloading agreement:', error)
      toast({
        title: "Error",
        description: "Failed to download agreement. Please try again.",
        variant: "destructive",
      })
    }
  }
  
  useEffect(() => {
    console.log('useEmployees: Setting up employee data fetch and real-time subscription')
    fetchEmployees()
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('employee-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'employee_details'
      }, (payload) => {
        console.log('Real-time update:', payload)
        fetchEmployees() // Refresh the list
      })
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    employees,
    loading,
    refreshing,
    fetchEmployees,
    handleRefresh,
    handleDownload
  }
}
