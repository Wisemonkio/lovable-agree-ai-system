
import React from 'react'
import { Users, UserPlus } from 'lucide-react'

interface NavigationProps {
  currentView: 'list' | 'add'
  setCurrentView: (view: 'list' | 'add') => void
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setCurrentView }) => {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={() => setCurrentView('list')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                currentView === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Employee List</span>
            </button>
            
            <button
              onClick={() => setCurrentView('add')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                currentView === 'add'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
