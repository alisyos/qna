'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { authService } from '@/services/auth.service'
import { clientsService } from '@/services/clients.service'
import { Sidebar } from './sidebar'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type Client = Database['public']['Tables']['clients']['Row']

interface AuthContextType {
  user: User | null
  profile: Profile | null
  client: Client | null
  isAuthenticated: boolean
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  client: null,
  isAuthenticated: false,
  isLoading: true,
  signOut: async () => {},
})

export const useAuthContext = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  // useMemo로 클라이언트 한 번만 생성
  const supabase = useMemo(() => createClient(), [])

  const fetchUserData = useCallback(async (currentUser: User | null) => {
    console.log('fetchUserData 호출:', currentUser?.email)
    if (!currentUser) {
      setUser(null)
      setProfile(null)
      setClient(null)
      return
    }

    setUser(currentUser)

    try {
      console.log('프로필 조회 시작:', currentUser.id)
      const profileData = await authService.getProfile(currentUser.id)
      console.log('프로필 조회 결과:', profileData)
      console.log('프로필 role 값:', profileData?.role, '타입:', typeof profileData?.role)
      setProfile(profileData)

      // role이 'client'인 경우 클라이언트 데이터 조회
      const isClientRole = profileData?.role === 'client'
      console.log('클라이언트 role 체크:', isClientRole, 'role값:', `"${profileData?.role}"`)

      if (isClientRole) {
        console.log('클라이언트 데이터 조회 시작:', currentUser.id)
        try {
          const clientData = await clientsService.getByUserId(currentUser.id)
          console.log('클라이언트 데이터 조회 결과:', clientData)
          setClient(clientData)
        } catch (clientError) {
          console.error('클라이언트 데이터 조회 실패:', clientError)
          // 에러가 발생해도 로딩 완료 처리
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    let authHandled = false  // 인증 처리 완료 플래그
    console.log('=== AuthProvider useEffect 실행 ===')

    // Auth 상태 변경 리스너 (먼저 등록)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth 상태 변경:', event, session?.user?.email)

        if (!isMounted) return

        // INITIAL_SESSION 또는 SIGNED_IN 이벤트 처리
        if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session?.user) {
          authHandled = true
          await fetchUserData(session.user)
          setIsLoading(false)
          setAuthChecked(true)
        } else if (event === 'INITIAL_SESSION' && !session) {
          // 세션 없음
          authHandled = true
          setUser(null)
          setProfile(null)
          setClient(null)
          setIsLoading(false)
          setAuthChecked(true)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setClient(null)
          router.push('/login')
        }
      }
    )
    console.log('onAuthStateChange 등록 완료')

    // 폴백: 3초 후에도 인증 처리가 안되면 getSession 시도
    const fallbackTimer = setTimeout(async () => {
      if (!authHandled && isMounted) {
        console.log('폴백: getSession 시도...')
        try {
          const { data: { session } } = await supabase.auth.getSession()
          console.log('폴백 getSession 결과:', session?.user?.email)

          if (isMounted && !authHandled) {
            if (session?.user) {
              await fetchUserData(session.user)
            } else {
              setUser(null)
              setProfile(null)
              setClient(null)
            }
            setIsLoading(false)
            setAuthChecked(true)
          }
        } catch (error) {
          console.error('폴백 getSession 에러:', error)
          if (isMounted && !authHandled) {
            setUser(null)
            setProfile(null)
            setClient(null)
            setIsLoading(false)
            setAuthChecked(true)
          }
        }
      }
    }, 3000)

    return () => {
      console.log('=== AuthProvider cleanup ===')
      isMounted = false
      clearTimeout(fallbackTimer)
      subscription.unsubscribe()
    }
  }, [supabase, fetchUserData])

  const signOut = async () => {
    await authService.signOut()
  }

  // 로딩 중
  if (isLoading || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">로딩중...</div>
      </div>
    )
  }

  const isLoginPage = pathname === '/login'
  const isAuthenticated = !!user

  console.log('AuthProvider 렌더링:', { pathname, isLoginPage, isAuthenticated, user: user?.email })

  // 로그인 페이지
  if (isLoginPage) {
    if (isAuthenticated) {
      // 이미 로그인된 상태면 홈으로
      router.push('/')
      return null
    }
    return (
      <AuthContext.Provider value={{ user, profile, client, isAuthenticated, isLoading, signOut }}>
        {children}
      </AuthContext.Provider>
    )
  }

  // 비인증 상태에서 보호된 페이지 접근
  if (!isAuthenticated) {
    router.push('/login')
    return null
  }

  // 인증된 상태
  return (
    <AuthContext.Provider value={{ user, profile, client, isAuthenticated, isLoading, signOut }}>
      <Sidebar />
      <main className="ml-[230px]">{children}</main>
    </AuthContext.Provider>
  )
}
