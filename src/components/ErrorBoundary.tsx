
import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('ErrorBoundary caught an error:', error)
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary details:', error, errorInfo)
    
    // Log specific Supabase errors
    if (error.message.includes('supabaseUrl') || error.message.includes('supabase')) {
      console.error('Supabase configuration error detected:', error.message)
    }
  }

  render() {
    if (this.state.hasError) {
      const isSupabaseError = this.state.error?.message.includes('supabase') || 
                              this.state.error?.message.includes('required')

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              {isSupabaseError ? 'Configuration Error' : 'Something went wrong'}
            </h1>
            <p className="text-gray-600 mb-4">
              {isSupabaseError 
                ? 'There was an issue with the database configuration. Please check the console for details.'
                : 'An error occurred while loading the application.'
              }
            </p>
            <button 
              onClick={() => {
                this.setState({ hasError: false, error: undefined })
                window.location.reload()
              }} 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-2"
            >
              Reload Page
            </button>
            <button 
              onClick={() => this.setState({ hasError: false, error: undefined })} 
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Try Again
            </button>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">Error Details</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
