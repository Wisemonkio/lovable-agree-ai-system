
import React, { useState } from 'react'
import EmployeeDetailModal from './EmployeeDetailModal'
import EmployeeCard from './employee/EmployeeCard'
import EmptyEmployeeState from './employee/EmptyEmployeeState'
import EmployeeListHeader from './employee/EmployeeListHeader'
import { useEmployees } from '@/hooks/useEmployees'
import { Employee } from './employee/types'

const EmployeeList: React.FC = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const {
    employees,
    loading,
    refreshing,
    handleRefresh,
    handleDownload
  } = useEmployees()
  
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
      <EmployeeListHeader
        employeeCount={employees.length}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
      
      {employees.length === 0 ? (
        <EmptyEmployeeState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((employee) => (
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

export default EmployeeList
