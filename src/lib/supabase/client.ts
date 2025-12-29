import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

let supabaseInstance: ReturnType<typeof createSupabaseClient<Database>> | null = null

export function createClient() {
  if (supabaseInstance) return supabaseInstance

  supabaseInstance = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return supabaseInstance
}
