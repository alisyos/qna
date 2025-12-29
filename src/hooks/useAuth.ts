'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { authService } from '@/services/auth.service'
import { clientsService } from '@/services/clients.service'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type Client = Database['public']['Tables']['clients']['Row']

interface AuthState {
  user: User | null
  profile: Profile | null
  client: Client | null
  loading: boolean
  isAuthenticated: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    client: null,
    loading: true,
    isAuthenticated: false,
  })
  const router = useRouter()
  const supabase = createClient()

  const fetchUserData = useCallback(async (user: User | null) => {
    if (!user) {
      setState({
        user: null,
        profile: null,
        client: null,
        loading: false,
        isAuthenticated: false,
      })
      return
    }

    try {
      const profile = await authService.getProfile(user.id)
      let client: Client | null = null

      if (profile?.role === 'client') {
        client = await clientsService.getByUserId(user.id)
      }

      setState({
        user,
        profile,
        client,
        loading: false,
        isAuthenticated: true,
      })
    } catch {
      setState({
        user,
        profile: null,
        client: null,
        loading: false,
        isAuthenticated: true,
      })
    }
  }, [])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      await fetchUserData(user)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        await fetchUserData(session?.user ?? null)

        if (event === 'SIGNED_OUT') {
          router.push('/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, router, fetchUserData])

  const signIn = async (email: string, password: string) => {
    const data = await authService.signIn(email, password)
    return data
  }

  const signOut = async () => {
    await authService.signOut()
    router.push('/login')
  }

  return {
    ...state,
    signIn,
    signOut,
    role: state.profile?.role,
  }
}
