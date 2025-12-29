import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export const operatorsService = {
  async getAll(): Promise<Profile[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['operator', 'admin'])
      .order('name', { ascending: true })

    if (error) throw error
    return data
  },

  async getById(id: string): Promise<Profile | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  },

  async update(id: string, updates: ProfileUpdate): Promise<Profile> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Profile
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'inactive' } as never)
      .eq('id', id)

    if (error) throw error
  },
}
