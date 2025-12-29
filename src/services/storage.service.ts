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

  async getSignedUrl(filePath: string): Promise<string> {
    const supabase = createClient()

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 3600) // 1 hour expiry

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

    // Delete file from storage
    await this.deleteFile(filePath)

    // Delete record from database
    const { error } = await supabase
      .from('request_attachments')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
