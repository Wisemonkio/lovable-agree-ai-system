
import React, { useState } from 'react'
import EmployeeForm from '@/components/EmployeeForm'
import EmployeeList from '@/components/EmployeeList'
import Navigation from '@/components/Navigation'

const Dashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<'list' | 'add'>('list')
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentView={currentView} setCurrentView={setCurrentView} />
      
      <main className="container mx-auto px-4 py-8">
        {currentView === 'list' ? (
          <EmployeeList />
        ) : (
          <EmployeeForm onSuccess={() => setCurrentView('list')} />
        )}
      </main>
    </div>
  )
}

export default Dashboard
