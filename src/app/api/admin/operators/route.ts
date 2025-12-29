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
    const { name, email, department, role, password } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: '필수 항목을 모두 입력해주세요.' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '비밀번호는 최소 6자 이상이어야 합니다.' }, { status: 400 })
    }

    const operatorRole = role === 'admin' ? 'admin' : 'operator'

    // 1. Create auth user
    const { data: authData, error: createAuthError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name,
        role: operatorRole,
        department,
      },
    })

    if (createAuthError) {
      console.error('Auth user creation error:', createAuthError)
      if (createAuthError.message.includes('already been registered')) {
        return NextResponse.json({ error: '이미 등록된 이메일입니다.' }, { status: 400 })
      }
      return NextResponse.json({ error: '사용자 계정 생성에 실패했습니다.' }, { status: 500 })
    }

    const newUserId = authData.user.id

    // 2. Create profile
    const { data: profileData, error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: newUserId,
        email,
        name,
        role: operatorRole,
        department: department || null,
        phone: null,
        status: 'active',
      } as never)
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Rollback: delete auth user
      await adminClient.auth.admin.deleteUser(newUserId)
      return NextResponse.json({ error: '프로필 생성에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      message: '담당자가 성공적으로 생성되었습니다.',
      operator: profileData,
    })
  } catch (error) {
    console.error('Operator creation error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
