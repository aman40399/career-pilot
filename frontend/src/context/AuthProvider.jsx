import { useState, useEffect } from 'react'
import { useUser, useAuth, useClerk } from '@clerk/clerk-react'
import { AuthContext } from './AuthContext'
import { authApi } from '../services/api'

const HAS_CLERK = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)

function ClerkAuthProviderInner({ children }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser()
  const { getToken: getClerkToken, signOut } = useAuth()
  const clerk = useClerk()
  
  const [mappedUser, setMappedUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(false)

  // Map Clerk user to our app's expected user structure
  useEffect(() => {
    if (isLoaded && isSignedIn && clerkUser) {
      setCheckingAdmin(true)
      
      const u = {
        uid: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        displayName: clerkUser.fullName || clerkUser.username || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0],
        photoURL: clerkUser.imageUrl,
        isAdmin: false // default, check backend next
      }

      authApi.getProfile()
        .then(res => {
          if (res?.success && res?.user) {
            u.isAdmin = !!res.user.isAdmin
            setIsAdmin(u.isAdmin)
          }
        })
        .catch(err => {
          console.error('Failed to fetch user profile for admin check:', err)
        })
        .finally(() => {
          setMappedUser(u)
          setCheckingAdmin(false)
        })
    } else {
      setMappedUser(null)
      setIsAdmin(false)
      setCheckingAdmin(false)
    }
  }, [isLoaded, isSignedIn, clerkUser])

  const signup = async () => {
    clerk.redirectToSignUp()
  }

  const login = async () => {
    clerk.redirectToSignIn()
  }

  const loginWithGoogle = async () => {
    clerk.redirectToSignIn({ strategy: 'oauth_google' })
  }

  const loginWithLinkedIn = () => {
    clerk.redirectToSignIn({ strategy: 'oauth_linkedin' })
  }

  const loginWithGitHub = async () => {
    clerk.redirectToSignIn({ strategy: 'oauth_github' })
  }

  const logout = async () => {
    await signOut()
  }

  const getToken = async () => {
    if (!isSignedIn) return null
    try {
      return await getClerkToken()
    } catch (err) {
      console.error("Failed to get Clerk token", err)
      return null
    }
  }

  const loading = !isLoaded || (isSignedIn && checkingAdmin)

  const value = {
    user: mappedUser,
    loading,
    isAdmin,
    signup,
    login,
    loginWithGoogle,
    loginWithLinkedIn,
    loginWithGitHub,
    logout,
    getToken,
    isMockAuth: false
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

function LocalAuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('careerpilot_local_user')
      if (saved) return JSON.parse(saved)
    } catch {}
    return {
      uid: 'dev-user-001',
      email: 'dev@example.com',
      displayName: 'Local Dev User',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LocalDev',
      isAdmin: true,
      getIdToken: async () => 'mock-dev-token'
    }
  })

  const login = async (email) => {
    const logged = {
      uid: 'dev-user-001',
      email: email || 'dev@example.com',
      displayName: email ? email.split('@')[0] : 'Local Dev User',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LocalDev',
      isAdmin: true,
      getIdToken: async () => 'mock-dev-token'
    }
    setUser(logged)
    localStorage.setItem('careerpilot_local_user', JSON.stringify(logged))
    return logged
  }

  const signup = async (email, password, displayName) => {
    const created = {
      uid: 'dev-user-' + Date.now(),
      email: email || 'dev@example.com',
      displayName: displayName || (email ? email.split('@')[0] : 'Local Dev User'),
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LocalDev',
      isAdmin: true,
      getIdToken: async () => 'mock-dev-token'
    }
    setUser(created)
    localStorage.setItem('careerpilot_local_user', JSON.stringify(created))
    return created
  }

  const logout = async () => {
    setUser(null)
    localStorage.removeItem('careerpilot_local_user')
  }

  const getToken = async () => 'mock-dev-token'

  const value = {
    user,
    loading: false,
    isAdmin: user ? (user.isAdmin ?? true) : false,
    signup,
    login,
    loginWithGoogle: () => login('google-user@example.com'),
    loginWithLinkedIn: () => login('linkedin-user@example.com'),
    loginWithGitHub: () => login('github-user@example.com'),
    logout,
    getToken,
    isMockAuth: true
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function AuthProvider({ children }) {
  if (HAS_CLERK) {
    return <ClerkAuthProviderInner>{children}</ClerkAuthProviderInner>
  }
  return <LocalAuthProvider>{children}</LocalAuthProvider>
}
