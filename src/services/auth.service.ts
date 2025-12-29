import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export interface SignUpData {
  email: string
  password: string
  name: string
  role?: 'client' | 'operator' | 'admin'
  department?: string
  departmentName?: string
}

export const authService = {
  async signIn(email: string, password: string) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  async signUp(userData: SignUpData) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          role: userData.role || 'client',
          department: userData.department,
          department_name: userData.departmentName,
        },
      },
    })
    if (error) throw error
    return data
  },

  async signOut() {
    const supabase = createClient()
    try {
      // scope: 'local'로 변경하여 현재 브라우저의 세션만 제거
      await supabase.auth.signOut({ scope: 'local' })
    } catch (error) {
      // 세션이 이미 없는 경우 에러 무시
      console.log('SignOut error (ignored):', error)
    }
  },

  async getCurrentUser() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  async getProfile(userId: string): Promise<Profile | null> {
    console.log('authService.getProfile() 호출:', userId)
    try {
      // REST API 직접 호출 (세션 문제 우회)
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`

      const response = await fetch(url, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      console.log('authService.getProfile() 결과:', data)

      if (data && data.length > 0) {
        return data[0] as Profile
      }
      return null
    } catch (error) {
      console.error('getProfile 에러:', error)
      return null
    }
  },

}
