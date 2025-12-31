import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Request = Database['public']['Tables']['requests']['Row']
type RequestInsert = Database['public']['Tables']['requests']['Insert']
type RequestUpdate = Database['public']['Tables']['requests']['Update']

export interface LatestClientComment {
  id: string
  content: string
  created_at: string
  author_id: string
  author_name: string
}

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
  comment_count?: number
  latest_client_comment?: LatestClientComment | null
}

// Supabase 쿼리 결과 타입
interface RequestQueryResult {
  id: string
  [key: string]: unknown
  request_comments?: Array<{ count: number }>
}

interface CommentQueryResult {
  id: string
  request_id: string
  content: string
  created_at: string
  author_id: string | null
  is_internal: boolean
  author: { id: string; name: string; role: string } | null
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
        operator:profiles(id, name, email, department),
        request_comments(count)
      `)
      .order('created_at', { ascending: false })

    console.log('requestsService.getAll() 결과:', { data, error })
    if (error) throw error
    if (!data) return []

    // 타입 단언
    const requestsData = data as unknown as RequestQueryResult[]

    // 모든 요청 ID 수집
    const requestIds = requestsData.map(item => item.id)

    // 공개 코멘트 조회 (클라이언트 작성자 정보 포함)
    let commentsMap: Record<string, LatestClientComment> = {}
    if (requestIds.length > 0) {
      const { data: commentsData } = await supabase
        .from('request_comments')
        .select(`
          id,
          request_id,
          content,
          created_at,
          author_id,
          is_internal,
          author:profiles(id, name, role)
        `)
        .in('request_id', requestIds)
        .eq('is_internal', false)
        .order('created_at', { ascending: false })

      // 각 요청별 최신 클라이언트 코멘트 찾기
      if (commentsData) {
        const comments = commentsData as unknown as CommentQueryResult[]
        for (const comment of comments) {
          const author = comment.author
          if (author?.role === 'client' && !commentsMap[comment.request_id]) {
            commentsMap[comment.request_id] = {
              id: comment.id,
              content: comment.content,
              created_at: comment.created_at,
              author_id: comment.author_id || '',
              author_name: author.name,
            }
          }
        }
      }
    }

    // 코멘트 수 및 최신 클라이언트 코멘트 변환
    const requestsWithCount = requestsData.map((item) => {
      const { request_comments, ...rest } = item
      return {
        ...rest,
        comment_count: request_comments?.[0]?.count || 0,
        latest_client_comment: commentsMap[item.id] || null,
      } as RequestWithRelations
    })

    return requestsWithCount
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
        operator:profiles(id, name, email),
        request_comments(count)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw error
    if (!data) return []

    // 코멘트 수 변환
    const requestsWithCount = data.map((item) => {
      const { request_comments, ...rest } = item as Record<string, unknown> & {
        request_comments?: Array<{ count: number }>
      }
      return {
        ...rest,
        comment_count: request_comments?.[0]?.count || 0,
      } as RequestWithRelations
    })

    return requestsWithCount
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
