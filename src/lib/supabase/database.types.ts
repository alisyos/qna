export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          role: 'client' | 'operator' | 'admin'
          department: string | null
          department_name: string | null
          phone: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: 'client' | 'operator' | 'admin'
          department?: string | null
          department_name?: string | null
          phone?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'client' | 'operator' | 'admin'
          department?: string | null
          department_name?: string | null
          phone?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string | null
          department_name: string
          contact_name: string
          email: string
          phone: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          department_name: string
          contact_name: string
          email: string
          phone?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          department_name?: string
          contact_name?: string
          email?: string
          phone?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      requests: {
        Row: {
          id: string
          request_number: string
          client_id: string
          operator_id: string | null
          request_type: 'budget_change' | 'keyword_add_delete' | 'ad_material_edit' | 'targeting_change' | 'report_request' | 'account_setting' | 'other'
          platform: 'naver' | 'kakao' | 'google' | 'other'
          priority: 'normal' | 'urgent' | 'critical'
          title: string
          description: string
          desired_date: string | null
          status: 'pending' | 'in_progress' | 'completed' | 'on_hold'
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          request_number?: string
          client_id: string
          operator_id?: string | null
          request_type: 'budget_change' | 'keyword_add_delete' | 'ad_material_edit' | 'targeting_change' | 'report_request' | 'account_setting' | 'other'
          platform: 'naver' | 'kakao' | 'google' | 'other'
          priority?: 'normal' | 'urgent' | 'critical'
          title: string
          description: string
          desired_date?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'on_hold'
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          request_number?: string
          client_id?: string
          operator_id?: string | null
          request_type?: 'budget_change' | 'keyword_add_delete' | 'ad_material_edit' | 'targeting_change' | 'report_request' | 'account_setting' | 'other'
          platform?: 'naver' | 'kakao' | 'google' | 'other'
          priority?: 'normal' | 'urgent' | 'critical'
          title?: string
          description?: string
          desired_date?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'on_hold'
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
      }
      request_comments: {
        Row: {
          id: string
          request_id: string
          author_id: string
          content: string
          is_internal: boolean
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          author_id: string
          content: string
          is_internal?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          author_id?: string
          content?: string
          is_internal?: boolean
          created_at?: string
        }
      }
      request_attachments: {
        Row: {
          id: string
          request_id: string
          comment_id: string | null
          file_name: string
          file_path: string
          file_size: number
          mime_type: string | null
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          comment_id?: string | null
          file_name: string
          file_path: string
          file_size: number
          mime_type?: string | null
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          comment_id?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          mime_type?: string | null
          uploaded_by?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'client' | 'operator' | 'admin'
      request_type: 'budget_change' | 'keyword_add_delete' | 'ad_material_edit' | 'targeting_change' | 'report_request' | 'account_setting' | 'other'
      ad_platform: 'naver' | 'kakao' | 'google' | 'other'
      priority_level: 'normal' | 'urgent' | 'critical'
      request_status: 'pending' | 'in_progress' | 'completed' | 'on_hold'
      account_status: 'active' | 'inactive'
    }
  }
}
