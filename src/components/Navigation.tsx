
import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Users, UserPlus, LogOut, User, UserCheck } from 'lucide-react'

interface NavigationProps {
  currentView: 'list' | 'add' | 'onboarded'
  setCurrentView: (view: 'list' | 'add' | 'onboarded') => void
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setCurrentView }) => {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-gray-900">
              Employment Agreement System
            </h1>
            
            <div className="flex space-x-4">
              <Button
                variant={currentView === 'list' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('list')}
                className="flex items-center space-x-2"
              >
                <Users className="w-4 h-4" />
                <span>Employee List</span>
              </Button>
              
              <Button
                variant={currentView === 'add' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('add')}
                className="flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Employee</span>
              </Button>
              
              <Button
                variant={currentView === 'onboarded' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('onboarded')}
                className="flex items-center space-x-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>Onboarded</span>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{user?.email}</span>
            </div>
            
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
