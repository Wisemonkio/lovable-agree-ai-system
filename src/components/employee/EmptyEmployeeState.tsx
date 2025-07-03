
import React from 'react'

const EmptyEmployeeState: React.FC = () => {
  return (
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
  )
}

export default EmptyEmployeeState
