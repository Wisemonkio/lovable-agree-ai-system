
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const Auth: React.FC = () => {
  console.log('Auth page rendering')
  
  const { signIn, signUp, signInWithGoogle, resetPassword, updatePassword, user, loading, session } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleSignInLoading, setIsGoogleSignInLoading] = useState(false)
  const [isGoogleSignUpLoading, setIsGoogleSignUpLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('signin')
  const [hasFailedLogin, setHasFailedLogin] = useState(false)
  
  // Check if we're in password update mode
  const mode = searchParams.get('mode')
  const isPasswordUpdateMode = mode === 'update-password'
  
  // Check if this is a recovery session (password reset)
  const isRecoverySession = session?.user?.aud === 'authenticated' && mode === 'update-password'

  // Redirect if already authenticated but NOT in recovery mode
  useEffect(() => {
    console.log('Auth useEffect - user:', user, 'loading:', loading, 'isRecoverySession:', isRecoverySession)
    if (user && !loading && !isRecoverySession) {
      console.log('User authenticated, redirecting to dashboard')
      navigate('/dashboard')
    }
  }, [user, loading, navigate, isRecoverySession])

  // Reset failed login when tab changes or on successful login
  useEffect(() => {
    if (activeTab !== 'signin') {
      setHasFailedLogin(false)
    }
  }, [activeTab])

  useEffect(() => {
    if (user && !loading) {
      setHasFailedLogin(false)
    }
  }, [user, loading])

  // Sign In Form
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  })

  // Sign Up Form
  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  })

  // Reset Password Form
  const [resetPasswordData, setResetPasswordData] = useState({
    email: ''
  })

  // Update Password Form
  const [updatePasswordData, setUpdatePasswordData] = useState({
    password: '',
    confirmPassword: ''
  })

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error } = await signIn(signInData.email, signInData.password)
    
    if (error) {
      setError(error.message)
      setHasFailedLogin(true)
    }
    
    setIsLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    if (signUpData.password !== signUpData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (signUpData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      setIsLoading(false)
      return
    }

    const { error } = await signUp(
      signUpData.email, 
      signUpData.password, 
      signUpData.name
    )
    
    if (error) {
      setError(error.message)
    } else {
      setSuccess('Sign up successful! Please check your email to verify your account.')
    }
    
    setIsLoading(false)
  }

  const handleGoogleSignIn = async (type: 'signin' | 'signup') => {
    if (type === 'signin') {
      setIsGoogleSignInLoading(true)
    } else {
      setIsGoogleSignUpLoading(true)
    }
    setError(null)

    const { error } = await signInWithGoogle()
    
    if (error) {
      setError(error.message)
      setIsGoogleSignInLoading(false)
      setIsGoogleSignUpLoading(false)
    }
    // Note: Don't set loading to false here - the redirect will happen
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const { error } = await resetPassword(resetPasswordData.email)
    
    if (error) {
      setError(error.message)
    } else {
      setSuccess('Password reset email sent! Please check your inbox and follow the instructions.')
      setResetPasswordData({ email: '' })
    }
    
    setIsLoading(false)
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    if (updatePasswordData.password !== updatePasswordData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (updatePasswordData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      setIsLoading(false)
      return
    }

    const { error } = await updatePassword(updatePasswordData.password)
    
    if (error) {
      setError(error.message)
    } else {
      setSuccess('Password updated successfully! You can now sign in with your new password.')
      setUpdatePasswordData({ password: '', confirmPassword: '' })
      // Navigate to sign in after successful password update
      navigate('/auth')
    }
    
    setIsLoading(false)
  }

  if (loading) {
    console.log('Auth page showing loading state')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  console.log('Auth page rendering main content')
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Employment Agreement System</h2>
          <p className="mt-2 text-gray-600">Sign in to your account or create a new one</p>
        </div>

        <Card>
          {isPasswordUpdateMode ? (
            // Password Update Mode
            <>
              <CardHeader>
                <CardTitle>Update Password</CardTitle>
                <CardDescription>Enter your new password</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div>
                    <Input
                      type="password"
                      placeholder="New Password"
                      value={updatePasswordData.password}
                      onChange={(e) => setUpdatePasswordData({ ...updatePasswordData, password: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type="password"
                      placeholder="Confirm New Password"
                      value={updatePasswordData.confirmPassword}
                      onChange={(e) => setUpdatePasswordData({ ...updatePasswordData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Update Password
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            // Normal Auth Mode
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="reset">Reset Password</TabsTrigger>
              </TabsList>

            <TabsContent value="signin">
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>Enter your email and password to access your account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={signInData.email}
                      onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type="password"
                      placeholder="Password"
                      value={signInData.password}
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Sign In
                  </Button>
                  
                   {hasFailedLogin && (
                     <div className="text-center">
                       <button
                         type="button"
                         onClick={() => setActiveTab('reset')}
                         className="text-sm text-primary hover:underline"
                       >
                         Forgot your password?
                       </button>
                     </div>
                   )}
                </form>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => handleGoogleSignIn('signin')}
                  disabled={isGoogleSignInLoading}
                >
                  {isGoogleSignInLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : (
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  Sign in with Google
                </Button>
              </CardContent>
            </TabsContent>

            <TabsContent value="signup">
              <CardHeader>
                <CardTitle>Sign Up</CardTitle>
                <CardDescription>Create a new account to get started</CardDescription>
              </CardHeader>
              <CardContent>
                 <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Input
                      type="text"
                      placeholder="Full Name"
                      value={signUpData.name}
                      onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type="password"
                      placeholder="Password"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type="password"
                      placeholder="Confirm Password"
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Sign Up
                  </Button>
                </form>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => handleGoogleSignIn('signup')}
                  disabled={isGoogleSignUpLoading}
                >
                  {isGoogleSignUpLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : (
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  Sign up with Google
                </Button>
              </CardContent>
            </TabsContent>

            <TabsContent value="reset">
              <CardHeader>
                <CardTitle>Reset Password</CardTitle>
                <CardDescription>Enter your email address to receive a password reset link</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={resetPasswordData.email}
                      onChange={(e) => setResetPasswordData({ ...resetPasswordData, email: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Send Reset Email
                  </Button>
                  
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setActiveTab('signin')}
                      className="text-sm text-primary hover:underline"
                    >
                      Back to sign in
                    </button>
                  </div>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
          )}

          {error && (
            <div className="p-4">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {success && (
            <div className="p-4">
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default Auth
