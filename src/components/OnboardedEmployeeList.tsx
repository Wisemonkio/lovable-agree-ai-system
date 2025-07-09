import React, { useState } from 'react'
import EmployeeDetailModal from './EmployeeDetailModal'
import EmployeeCard from './employee/EmployeeCard'
import EmployeeListHeader from './employee/EmployeeListHeader'
import { useEmployees } from '@/hooks/useEmployees'
import { Employee } from './employee/types'
import { UserCheck } from 'lucide-react'

const OnboardedEmployeeList: React.FC = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const {
    employees,
    loading,
    refreshing,
    handleRefresh,
    handleDownload
  } = useEmployees()
  
  // Filter for onboarded employees (those who have completed signing)
  const onboardedEmployees = employees.filter(employee => 
    employee.zoho_sign_status === 'completed' || employee.signing_completed_at
  )
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-500">Loading onboarded employees...</span>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <EmployeeListHeader
        employeeCount={onboardedEmployees.length}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        title="Onboarded Employees"
        subtitle="Employees who have completed their agreement signing"
      />
      
      {onboardedEmployees.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <UserCheck className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Onboarded Employees Yet
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Employees who have completed their employment agreement signing will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {onboardedEmployees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onViewDetails={setSelectedEmployee}
              onDownload={handleDownload}
              onRefresh={handleRefresh}
            />
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

export default OnboardedEmployeeList