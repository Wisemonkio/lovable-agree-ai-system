
import React, { useState } from 'react'
import EmployeeForm from '@/components/EmployeeForm'
import EmployeeList from '@/components/EmployeeList'
import OnboardedEmployeeList from '@/components/OnboardedEmployeeList'
import Navigation from '@/components/Navigation'

const Dashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<'list' | 'add' | 'onboarded'>('list')
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentView={currentView} setCurrentView={setCurrentView} />
      
      <main className="container mx-auto px-4 py-8">
        {currentView === 'list' ? (
          <EmployeeList />
        ) : currentView === 'add' ? (
          <EmployeeForm onSuccess={() => setCurrentView('list')} />
        ) : (
          <OnboardedEmployeeList />
        )}
      </main>
    </div>
  )
}

export default Dashboard
