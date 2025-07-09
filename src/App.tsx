
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from '@/components/ui/toaster'
import ErrorBoundary from '@/components/ErrorBoundary'
import ProtectedRoute from '@/components/ProtectedRoute'
import { IntercomChat } from '@/components/IntercomChat'
import Auth from '@/pages/Auth'
import Dashboard from '@/pages/Dashboard'
import Landing from '@/pages/Landing'
import NotFound from '@/pages/NotFound'

function App() {
  console.log('App component rendering')
  
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
            <IntercomChat />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
