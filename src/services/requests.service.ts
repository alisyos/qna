import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Request = Database['public']['Tables']['requests']['Row']
type RequestInsert = Database['public']['Tables']['requests']['Insert']
type RequestUpdate = Database['public']['Tables']['requests']['Update']

export interface RequestWithRelations extends Request {
  client?: {
    id: string
    department_name: string
    contact_name: string
    email?: string
    phone?: string
  } | null
  operator?: {
    id: string
    name: string
    email: string
    department?: string
  } | null
}

export const requestsService = {
  async getAll(): Promise<RequestWithRelations[]> {
    console.log('requestsService.getAll() 호출')
    const supabase = createClient()
    const { data, error } = await supabase
      .from('requests')
      .select(`
        *,
        client:clients(id, department_name, contact_name, email, phone),
        operator:profiles(id, name, email, department)
      `)
      .order('created_at', { ascending: false })

    console.log('requestsService.getAll() 결과:', { data, error })
    if (error) throw error
    return data as RequestWithRelations[]
  },

  async getById(id: string): Promise<RequestWithRelations | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('requests')
      .select(`
        *,
        client:clients(id, department_name, contact_name, email, phone),
        operator:profiles(id, name, email, department)
      `)
      .eq('id', id)
      .single()

    if (error) return null
    return data as RequestWithRelations
  },

  async getByClientId(clientId: string): Promise<RequestWithRelations[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('requests')
      .select(`
        *,
        operator:profiles(id, name, email)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as RequestWithRelations[]
  },

  async create(request: RequestInsert): Promise<Request> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('requests')
      .insert(request as never)
      .select()
      .single()

    if (error) throw error
    return data as Request
  },

  async update(id: string, updates: RequestUpdate): Promise<Request> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('requests')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Request
  },

  async updateStatus(id: string, status: Request['status']): Promise<Request> {
    return this.update(id, { status })
  },

  async assignOperator(id: string, operatorId: string): Promise<Request> {
    return this.update(id, { operator_id: operatorId })
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('requests')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
