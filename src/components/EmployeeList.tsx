
import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Eye, Download, FileText, Calendar, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import EmployeeDetailModal from './EmployeeDetailModal'

interface Employee {
  id: string
  first_name: string
  last_name: string
  email: string
  job_title: string
  annual_gross_salary: number
  monthly_gross: number
  agreement_status: string
  pdf_url?: string
  doc_url?: string
  pdf_download_url?: string
  joining_date: string
  created_at: string
  client_name?: string
  city?: string
  state?: string
  processing_started_at?: string
  processing_completed_at?: string
}

const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )
  
  useEffect(() => {
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
    
    return () => subscription.unsubscribe()
  }, [])
  
  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_details')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'processing': return <Clock className="w-4 h-4 animate-spin" />
      case 'pending': return <AlertCircle className="w-4 h-4" />
      case 'failed': return <AlertCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-500">Loading employees...</span>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Directory</h1>
          <p className="text-gray-600 mt-1">Manage employees and their employment agreements</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-2">
          <div className="text-sm text-gray-500">Total Employees</div>
          <div className="text-2xl font-bold text-gray-900">{employees.length}</div>
        </div>
      </div>
      
      {employees.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="text-gray-400 text-8xl mb-4">👥</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No employees found</h3>
          <p className="text-gray-500 mb-6">Get started by adding your first employee to the system.</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-blue-800 text-sm">
              <strong>💡 Tip:</strong> When you add an employee, their employment agreement will be generated automatically!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((employee) => (
            <div
              key={employee.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {employee.first_name} {employee.last_name}
                    </h3>
                    <p className="text-blue-100 text-sm">{employee.job_title}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-blue-100">Employee ID</div>
                    <div className="text-xs font-mono">{employee.id.substring(0, 8)}</div>
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(employee.agreement_status)}`}>
                    {getStatusIcon(employee.agreement_status)}
                    <span className="capitalize">{employee.agreement_status}</span>
                  </span>
                  <span className="text-xs text-gray-500">
                    Added {formatDate(employee.created_at)}
                  </span>
                </div>
                
                {/* Employee Details */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Joins: {formatDate(employee.joining_date)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {formatCurrency(employee.annual_gross_salary)}/year
                    </span>
                  </div>
                  
                  {employee.client_name && (
                    <div className="flex items-center space-x-2 text-sm">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Client: {employee.client_name}</span>
                    </div>
                  )}
                  
                  {(employee.city || employee.state) && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-gray-400">📍</span>
                      <span className="text-gray-600">
                        {[employee.city, employee.state].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="mt-6 flex space-x-2">
                  <button
                    onClick={() => setSelectedEmployee(employee)}
                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </button>
                  
                  {employee.agreement_status === 'completed' && employee.pdf_download_url && (
                    <button
                      onClick={() => window.open(employee.pdf_download_url, '_blank')}
                      className="bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* Processing Status */}
                {employee.agreement_status === 'processing' && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-blue-800 text-sm font-medium">Generating Agreement...</span>
                    </div>
                    <p className="text-blue-700 text-xs mt-1">
                      Employment agreement is being created. This usually takes a few moments.
                    </p>
                  </div>
                )}
                
                {employee.agreement_status === 'completed' && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-800 text-sm font-medium">Agreement Ready!</span>
                    </div>
                    <p className="text-green-700 text-xs mt-1">
                      Employment agreement has been generated and is ready for download.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  )
}

export default EmployeeList
