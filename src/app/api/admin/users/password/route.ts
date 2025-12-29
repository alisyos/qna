import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    // Get access token from header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const accessToken = authHeader.substring(7)
    const adminClient = createAdminClient()

    // Verify the token and get user
    const { data: { user }, error: authError } = await adminClient.auth.getUser(accessToken)

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null }

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    // Get request body
    const body = await request.json()
    const { userId, newPassword } = body

    if (!userId || !newPassword) {
      return NextResponse.json({ error: '사용자 ID와 새 비밀번호가 필요합니다.' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: '비밀번호는 최소 6자 이상이어야 합니다.' }, { status: 400 })
    }

    // Use admin client to update password
    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (error) {
      console.error('Password update error:', error)
      return NextResponse.json({ error: '비밀번호 변경에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ message: '비밀번호가 성공적으로 변경되었습니다.' })
  } catch (error) {
    console.error('Password update error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
