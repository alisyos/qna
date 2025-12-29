import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Client = Database['public']['Tables']['clients']['Row']
type ClientInsert = Database['public']['Tables']['clients']['Insert']
type ClientUpdate = Database['public']['Tables']['clients']['Update']

export const clientsService = {
  async getAll(): Promise<Client[]> {
    console.log('clientsService.getAll() 호출')
    const supabase = createClient()
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('clientsService.getAll() 결과:', { data, error })
    if (error) throw error
    return data
  },

  async getById(id: string): Promise<Client | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  },

  async getByUserId(userId: string): Promise<Client | null> {
    console.log('clientsService.getByUserId() 호출:', userId)
    try {
      // REST API 직접 호출 (세션 초기화 타이밍 문제 우회)
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/clients?user_id=eq.${userId}&select=*`

      const response = await fetch(url, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      console.log('clientsService.getByUserId() 결과:', data)

      if (data && data.length > 0) {
        return data[0] as Client
      }
      return null
    } catch (error) {
      console.error('클라이언트 조회 에러:', error)
      return null
    }
  },

  async create(client: ClientInsert): Promise<Client> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('clients')
      .insert(client as never)
      .select()
      .single()

    if (error) throw error
    return data as Client
  },

  async update(id: string, updates: ClientUpdate): Promise<Client> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('clients')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Client
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
