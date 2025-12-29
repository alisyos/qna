'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui'
import {
  REQUEST_TYPE_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  PRIORITY_COLORS,
  STATUS_COLORS,
} from '@/types'
import { useAuthContext } from '@/components/layout/AuthProvider'
import { useRequests } from '@/hooks/useRequests'
import {
  Inbox,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { format, isToday, differenceInHours, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function HomePage() {
  const router = useRouter()
  const { profile, isLoading: authLoading } = useAuthContext()
  const { data: requests = [], isLoading: requestsLoading } = useRequests()

  // 클라이언트 역할인 경우 요청 현황 페이지로 리다이렉트
  useEffect(() => {
    if (!authLoading && profile?.role === 'client') {
      router.replace('/client/requests')
    }
  }, [authLoading, profile, router])

  // 클라이언트 역할인 경우 리다이렉트 중 로딩 표시
  if (authLoading || profile?.role === 'client') {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const isLoading = requestsLoading

  // 오늘 접수된 요청
  const todayRequests = requests.filter((r) => isToday(parseISO(r.created_at)))

  // 미처리 요청 (접수대기)
  const pendingRequests = requests.filter((r) => r.status === 'pending')

  // 본인 담당 요청
  const myRequests = requests.filter((r) => r.operator_id === profile?.id)

  // 처리중인 요청
  const inProgressRequests = myRequests.filter((r) => r.status === 'in_progress')

  // 긴급도별 미처리 요청
  const criticalPending = pendingRequests.filter((r) => r.priority === 'critical')
  const urgentPending = pendingRequests.filter((r) => r.priority === 'urgent')
  const normalPending = pendingRequests.filter((r) => r.priority === 'normal')

  // 처리 기한 임박 요청 (희망 처리일이 24시간 이내)
  const upcomingDeadlines = requests.filter((r) => {
    if (!r.desired_date || r.status === 'completed') return false
    const hoursUntil = differenceInHours(parseISO(r.desired_date), new Date())
    return hoursUntil <= 24 && hoursUntil > 0
  })

  const summaryCards = [
    {
      title: '오늘 접수',
      value: todayRequests.length,
      icon: <Inbox className="w-5 h-5 text-blue-500" />,
      color: 'bg-blue-50',
    },
    {
      title: '미처리 요청',
      value: pendingRequests.length,
      icon: <Clock className="w-5 h-5 text-yellow-500" />,
      color: 'bg-yellow-50',
    },
    {
      title: '처리중',
      value: inProgressRequests.length,
      icon: <AlertCircle className="w-5 h-5 text-orange-500" />,
      color: 'bg-orange-50',
    },
    {
      title: '기한 임박',
      value: upcomingDeadlines.length,
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
      color: 'bg-red-50',
    },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
          <p className="text-gray-600 mt-1">
            안녕하세요, {profile?.name || '담당자'}님! 오늘의 업무 현황입니다.
          </p>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {summaryCards.map((card) => (
            <Card key={card.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${card.color}`}>{card.icon}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* 미처리 요청 현황 */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">미처리 요청 현황</CardTitle>
              <CardDescription>긴급도별 분류</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span className="font-medium">최우선</span>
                  </div>
                  <span className="text-xl font-bold text-red-600">
                    {criticalPending.length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                    <span className="font-medium">긴급</span>
                  </div>
                  <span className="text-xl font-bold text-orange-600">
                    {urgentPending.length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                    <span className="font-medium">일반</span>
                  </div>
                  <span className="text-xl font-bold text-gray-600">
                    {normalPending.length}
                  </span>
                </div>
              </div>
              <Link href="/operator/requests?status=pending">
                <Button variant="outline" className="w-full mt-4">
                  전체 보기
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* 본인 담당 요청 */}
          <Card className="col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">내 담당 요청</CardTitle>
                  <CardDescription>현재 처리중인 요청 목록</CardDescription>
                </div>
                <Link href="/operator/requests?assigned=me">
                  <Button variant="ghost" size="sm">
                    전체 보기
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {inProgressRequests.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-green-300 mx-auto mb-3" />
                  <p className="text-gray-500">처리중인 요청이 없습니다.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>클라이언트</TableHead>
                      <TableHead>제목</TableHead>
                      <TableHead>긴급도</TableHead>
                      <TableHead>등록일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inProgressRequests.slice(0, 5).map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.client?.department_name || '-'}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/operator/requests/${request.id}`}
                            className="hover:text-blue-600 hover:underline"
                          >
                            {request.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              PRIORITY_COLORS[request.priority]
                            }`}
                          >
                            {PRIORITY_LABELS[request.priority]}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {format(parseISO(request.created_at), 'MM.dd')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 처리 기한 임박 알림 */}
        {upcomingDeadlines.length > 0 && (
          <Card className="mt-6 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-lg text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                처리 기한 임박 요청
              </CardTitle>
              <CardDescription className="text-red-600">
                24시간 이내 희망 처리일이 도래하는 요청입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingDeadlines.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between bg-white p-4 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{request.title}</p>
                      <p className="text-sm text-gray-600">
                        {request.client?.department_name || '-'} |{' '}
                        {REQUEST_TYPE_LABELS[request.request_type]}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-red-600 font-medium">
                        희망 처리일:{' '}
                        {format(parseISO(request.desired_date!), 'M월 d일', {
                          locale: ko,
                        })}
                      </p>
                      <Link href={`/operator/requests/${request.id}`}>
                        <Button size="sm" variant="outline" className="mt-2">
                          처리하기
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 오늘 접수된 요청 */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">오늘 접수된 요청</CardTitle>
                <CardDescription>
                  {format(new Date(), 'yyyy년 M월 d일', { locale: ko })} 기준
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {todayRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">오늘 접수된 요청이 없습니다.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>요청번호</TableHead>
                    <TableHead>클라이언트</TableHead>
                    <TableHead>제목</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>긴급도</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>접수시간</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-mono text-sm">
                        {request.request_number}
                      </TableCell>
                      <TableCell>{request.client?.department_name || '-'}</TableCell>
                      <TableCell>
                        <Link
                          href={`/operator/requests/${request.id}`}
                          className="hover:text-blue-600 hover:underline"
                        >
                          {request.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {REQUEST_TYPE_LABELS[request.request_type]}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            PRIORITY_COLORS[request.priority]
                          }`}
                        >
                          {PRIORITY_LABELS[request.priority]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            STATUS_COLORS[request.status]
                          }`}
                        >
                          {STATUS_LABELS[request.status]}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {format(parseISO(request.created_at), 'HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
