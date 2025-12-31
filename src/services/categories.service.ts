import { createClient } from '@/lib/supabase/client'

// 타입 정의
export interface RequestType {
  id: string
  code: string
  label: string
  description: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Platform {
  id: string
  code: string
  label: string
  description: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface RequestTypeInsert {
  code: string
  label: string
  description?: string
  is_active?: boolean
  sort_order?: number
}

export interface PlatformInsert {
  code: string
  label: string
  description?: string
  is_active?: boolean
  sort_order?: number
}

export interface RequestTypeUpdate {
  code?: string
  label?: string
  description?: string | null
  is_active?: boolean
  sort_order?: number
}

export interface PlatformUpdate {
  code?: string
  label?: string
  description?: string | null
  is_active?: boolean
  sort_order?: number
}

// 요청 유형 서비스
export const requestTypesService = {
  async getAll(): Promise<RequestType[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('request_types')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) throw error
    return data || []
  },

  async getActive(): Promise<RequestType[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('request_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<RequestType | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('request_types')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async create(requestType: RequestTypeInsert): Promise<RequestType> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('request_types')
      .insert(requestType as never)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: RequestTypeUpdate): Promise<RequestType> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('request_types')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('request_types')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}

// 플랫폼 서비스
export const platformsService = {
  async getAll(): Promise<Platform[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('platforms')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) throw error
    return data || []
  },

  async getActive(): Promise<Platform[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('platforms')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Platform | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('platforms')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async create(platform: PlatformInsert): Promise<Platform> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('platforms')
      .insert(platform as never)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: PlatformUpdate): Promise<Platform> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('platforms')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('platforms')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
