'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthContext } from './AuthProvider'
import {
  FileText,
  List,
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  User,
  Shield
} from 'lucide-react'

type UserRole = 'client' | 'operator' | 'admin'

type MenuItem = {
  label: string
  href: string
  icon: React.ReactNode
}

type MenuSection = {
  title: string
  roles: UserRole[]
  items: MenuItem[]
}

const menuSections: MenuSection[] = [
  {
    title: '클라이언트 포털',
    roles: ['client'],
    items: [
      { label: '요청 등록', href: '/client/request/new', icon: <FileText className="w-4 h-4" /> },
      { label: '요청 현황', href: '/client/requests', icon: <List className="w-4 h-4" /> },
    ]
  },
  {
    title: '운영 담당자',
    roles: ['operator', 'admin'],
    items: [
      { label: '요청 처리', href: '/operator/requests', icon: <ClipboardList className="w-4 h-4" /> },
    ]
  },
  {
    title: '관리자',
    roles: ['admin'],
    items: [
      { label: '통계', href: '/admin/statistics', icon: <BarChart3 className="w-4 h-4" /> },
      { label: '시스템 관리', href: '/admin/settings', icon: <Settings className="w-4 h-4" /> },
    ]
  }
]

const ROLE_LABELS: Record<UserRole, string> = {
  client: '클라이언트',
  operator: '운영 담당자',
  admin: '관리자'
}

const ROLE_COLORS: Record<UserRole, string> = {
  client: 'bg-blue-100 text-blue-700',
  operator: 'bg-green-100 text-green-700',
  admin: 'bg-purple-100 text-purple-700'
}

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  client: <User className="w-3 h-3" />,
  operator: <Shield className="w-3 h-3" />,
  admin: <Settings className="w-3 h-3" />
}

export function Sidebar() {
  const pathname = usePathname()
  const { profile, user, signOut } = useAuthContext()

  // 디버깅용
  console.log('Sidebar - user:', user?.email, 'profile:', profile)

  const handleLogout = async () => {
    await signOut()
  }

  const userRole = profile?.role as UserRole | undefined

  const filteredSections = menuSections.filter(
    (section) => userRole && section.roles.includes(userRole)
  )

  return (
    <aside className="fixed left-0 top-0 h-full w-[230px] bg-white border-r border-gray-200 shadow-sm overflow-y-auto flex flex-col">
      <div className="p-6 flex-1">
        {/* 로고 영역 */}
        <div className="mb-8">
          <Link href="/" className="block">
            <Image
              src="/logo.jpg"
              alt="AIWEB 로고"
              width={126}
              height={35}
              className="object-contain"
              priority
            />
          </Link>
          <p className="text-xs text-gray-500 mt-2">광고 대행 요청 관리</p>
        </div>

        {/* 대시보드 링크 - 클라이언트가 아닌 경우에만 표시 */}
        {userRole && userRole !== 'client' && (
          <nav className="mb-6">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
                pathname === '/'
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <LayoutDashboard className="w-4 h-4" />
              대시보드
            </Link>
          </nav>
        )}

        {/* 섹션별 메뉴 */}
        {filteredSections.map((section) => (
          <div key={section.title} className="mb-6">
            <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {section.title}
            </h3>
            <nav className="space-y-1">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
                    pathname === item.href || pathname.startsWith(item.href + '/')
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        ))}
      </div>

      {/* 사용자 정보 및 로그아웃 */}
      {profile && userRole && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{profile.name}</p>
              <span className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium",
                ROLE_COLORS[userRole]
              )}>
                {ROLE_ICONS[userRole]}
                {ROLE_LABELS[userRole]}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </div>
      )}
    </aside>
  )
}
