
import React from 'react'
import { RefreshCw } from 'lucide-react'

interface EmployeeListHeaderProps {
  employeeCount: number
  onRefresh: () => void
  refreshing: boolean
  title?: string
  subtitle?: string
}

const EmployeeListHeader: React.FC<EmployeeListHeaderProps> = ({
  employeeCount,
  onRefresh,
  refreshing,
  title = "Employees",
  subtitle = "Manage employee information and employment agreements"
}) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 mt-1">{subtitle}</p>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-2">
          <div className="text-sm text-gray-500">Total Employees</div>
          <div className="text-2xl font-bold text-gray-900">{employeeCount}</div>
        </div>
      </div>
    </div>
  )
}

export default EmployeeListHeader
