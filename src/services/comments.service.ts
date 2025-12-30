import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Comment = Database['public']['Tables']['request_comments']['Row']
type CommentInsert = Database['public']['Tables']['request_comments']['Insert']
type Attachment = Database['public']['Tables']['request_attachments']['Row']

export interface CommentWithAuthor extends Comment {
  author?: {
    id: string
    name: string
    email: string
    role: 'client' | 'operator' | 'admin'
  } | null
  attachments?: Attachment[]
}

export const commentsService = {
  async getByRequestId(requestId: string): Promise<CommentWithAuthor[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('request_comments')
      .select(`
        *,
        author:profiles(id, name, email, role),
        attachments:request_attachments(*)
      `)
      .eq('request_id', requestId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as CommentWithAuthor[]
  },

  async create(comment: CommentInsert): Promise<Comment> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('request_comments')
      .insert(comment as never)
      .select()
      .single()

    if (error) throw error
    return data as Comment
  },

  async update(id: string, content: string, isInternal: boolean): Promise<Comment> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('request_comments')
      .update({ content, is_internal: isInternal } as never)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Comment
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('request_comments')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
