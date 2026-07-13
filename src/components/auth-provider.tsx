import React, { createContext, useContext, useState, useEffect } from "react"
import { authService, UserProfile, AuthError } from '../services/authService'
import { storeToken, removeToken, storeUser, removeUser, clearAuthData, getToken, getUser } from '../utils/tokenUtils'

type UserRole = "admin" | "ngo" | "guest" | null

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  organization?: string
}

interface SignupData {
  name: string
  email: string
  password: string
  role: 'admin' | 'ngo'
  organization?: string
}

interface AuthContextType {
  user: UserProfile | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (data: SignupData) => Promise<boolean>
  loginAsGuest: () => Promise<boolean>
  logout: () => void
  isLoading: boolean
  error: string | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check for existing authentication on app load
    const initializeAuth = async () => {
      try {
        const storedUser = getUser()

        // Check if we have a valid token
        const token = getToken()
        if (token) {
          // Get current user from Firebase
          const currentUser = await authService.getCurrentUser()
          if (currentUser) {
            setUser(currentUser)
          } else if (storedUser) {
            // Local demo staff session fallback
            setUser(storedUser)
          } else {
            // Token exists but user not found, clear auth data
            clearAuthData()
          }
        } else if (storedUser) {
          setUser(storedUser)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        clearAuthData()
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)

      const userProfile = await authService.signIn(email, password)
      const token = await authService.getJWTToken()

      if (token) {
        storeToken(token)
        storeUser(userProfile)
        setUser(userProfile)
        return true
      }

      const isLocalDemoAccount = userProfile.role === 'admin' || userProfile.role === 'ngo'
      if (isLocalDemoAccount) {
        storeToken('local-demo-token')
        storeUser(userProfile)
        setUser(userProfile)
        return true
      }

      setError('Failed to get authentication token')
      return false
    } catch (error: any) {
      const authError = error as AuthError
      setError(authError.message)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (data: SignupData): Promise<boolean> => {
    try {
      console.log('Auth provider: Starting signup...', data)
      setIsLoading(true)
      setError(null)

      const userProfile = await authService.signUp(
        data.email,
        data.password,
        data.name,
        data.role,
        data.organization
      )
      console.log('Auth provider: User profile created:', userProfile)

      const token = await authService.getJWTToken()
      console.log('Auth provider: JWT token received:', !!token)

      if (token) {
        storeToken(token)
        storeUser(userProfile)
        setUser(userProfile)
        console.log('Auth provider: Signup successful')
        return true
      } else {
        setError('Failed to get authentication token')
        console.error('Auth provider: No JWT token received')
        return false
      }
    } catch (error: any) {
      console.error('Auth provider: Signup error:', error)
      const authError = error as AuthError
      setError(authError.message)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const loginAsGuest = async (): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)

      const guestProfile = await authService.signInAsGuest()
      setUser(guestProfile)
      storeToken('guest-demo-token')
      storeUser(guestProfile)
      return true
    } catch (error: any) {
      setError('Failed to login as guest')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      if (user?.role !== 'guest') {
        await authService.signOut()
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearAuthData()
      setUser(null)
      setError(null)
    }
  }

  const clearError = () => {
    setError(null)
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        signup, 
        loginAsGuest, 
        logout, 
        isLoading, 
        error, 
        clearError 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
} 