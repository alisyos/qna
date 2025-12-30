import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

const BUCKET_NAME = 'request-attachments'

type Attachment = Database['public']['Tables']['request_attachments']['Row']
type AttachmentInsert = Database['public']['Tables']['request_attachments']['Insert']

export const storageService = {
  async uploadFile(file: File, requestId: string, userId: string): Promise<string> {
    const supabase = createClient()

    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${requestId}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file)

    if (error) throw error
    return data.path
  },

  async getSignedUrl(filePath: string, downloadFileName?: string): Promise<string> {
    const supabase = createClient()

    const options: { download?: string | boolean } = {}
    if (downloadFileName) {
      options.download = downloadFileName
    }

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 3600, options) // 1 hour expiry

    if (error) throw error
    return data.signedUrl
  },

  async deleteFile(filePath: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (error) throw error
  },

  async getAttachmentsByRequestId(requestId: string): Promise<Attachment[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('request_attachments')
      .select('*')
      .eq('request_id', requestId)
      .is('comment_id', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async getAttachmentsByCommentId(commentId: string): Promise<Attachment[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('request_attachments')
      .select('*')
      .eq('comment_id', commentId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async createAttachmentRecord(attachment: AttachmentInsert): Promise<Attachment> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('request_attachments')
      .insert(attachment as never)
      .select()
      .single()

    if (error) throw error
    return data as Attachment
  },

  async deleteAttachment(id: string, filePath: string): Promise<void> {
    const supabase = createClient()
    console.log('deleteAttachment called:', { id, filePath })

    // Delete file from storage
    try {
      await this.deleteFile(filePath)
      console.log('Storage file deleted successfully')
    } catch (storageError) {
      console.error('Storage delete error:', storageError)
      // Storage 삭제 실패해도 DB 레코드는 삭제 시도
    }

    // Delete record from database
    console.log('Attempting to delete DB record...')
    const { error } = await supabase
      .from('request_attachments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('DB delete error:', error)
      throw error
    }
    console.log('DB record deleted successfully')
  },
}
