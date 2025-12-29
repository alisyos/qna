'use client'

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui'
import {
  REQUEST_TYPE_LABELS,
  PLATFORM_LABELS,
} from '@/types'
import type { RequestType, AdPlatform } from '@/types'
import { useRequests } from '@/hooks/useRequests'
import { useClients } from '@/hooks/useClients'
import { useOperators } from '@/hooks/useOperators'
import {
  BarChart3,
  TrendingUp,
  Clock,
  FileText,
  CheckCircle,
  Users,
  Loader2,
} from 'lucide-react'
import { format, parseISO, differenceInHours, subDays } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function AdminStatisticsPage() {
  const { data: requests = [], isLoading: requestsLoading } = useRequests()
  const { data: clients = [], isLoading: clientsLoading } = useClients()
  const { data: operators = [], isLoading: operatorsLoading } = useOperators()

  const isLoading = requestsLoading || clientsLoading || operatorsLoading

  // 통계 계산
  const totalRequests = requests.length
  const completedRequests = requests.filter((r) => r.status === 'completed').length
  const pendingRequests = requests.filter((r) => r.status === 'pending').length

  // 평균 처리 시간 계산 (완료된 요청 기준)
  const completedWithTime = requests.filter(
    (r) => r.status === 'completed' && r.completed_at
  )
  const avgProcessingHours =
    completedWithTime.length > 0
      ? completedWithTime.reduce((acc, r) => {
          return (
            acc +
            differenceInHours(parseISO(r.completed_at!), parseISO(r.created_at))
          )
        }, 0) / completedWithTime.length
      : 0

  // 요청 유형별 분포
  const requestTypeStats = Object.entries(
    requests.reduce((acc, r) => {
      acc[r.request_type] = (acc[r.request_type] || 0) + 1
      return acc
    }, {} as Record<RequestType, number>)
  ).sort((a, b) => b[1] - a[1])

  // 플랫폼별 분포
  const platformStats = Object.entries(
    requests.reduce((acc, r) => {
      acc[r.platform] = (acc[r.platform] || 0) + 1
      return acc
    }, {} as Record<AdPlatform, number>)
  ).sort((a, b) => b[1] - a[1])

  // 담당자별 처리 현황
  const operatorStats = operators
    .filter((op) => op.role === 'operator')
    .map((op) => {
      const opRequests = requests.filter((r) => r.operator_id === op.id)
      const completed = opRequests.filter((r) => r.status === 'completed').length
      const inProgress = opRequests.filter((r) => r.status === 'in_progress').length
      return {
        ...op,
        total: opRequests.length,
        completed,
        inProgress,
        completionRate:
          opRequests.length > 0
            ? Math.round((completed / opRequests.length) * 100)
            : 0,
      }
    })
    .sort((a, b) => b.total - a.total)

  // 클라이언트별 요청 빈도
  const clientStats = clients
    .map((client) => {
      const clientRequests = requests.filter((r) => r.client_id === client.id)
      return {
        ...client,
        requestCount: clientRequests.length,
        lastRequestDate: clientRequests.length > 0
          ? clientRequests.sort(
              (a, b) =>
                parseISO(b.created_at).getTime() - parseISO(a.created_at).getTime()
            )[0].created_at
          : null,
      }
    })
    .sort((a, b) => b.requestCount - a.requestCount)

  // 최근 7일간 일별 요청 건수
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i)
    const count = requests.filter((r) => {
      const reqDate = parseISO(r.created_at)
      return format(reqDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    }).length
    return {
      date: format(date, 'M/d'),
      count,
    }
  })

  const summaryCards = [
    {
      title: '총 요청 건수',
      value: totalRequests,
      icon: <FileText className="w-5 h-5 text-blue-500" />,
      color: 'bg-blue-50',
    },
    {
      title: '완료된 요청',
      value: completedRequests,
      subtext: totalRequests > 0 ? `완료율 ${Math.round((completedRequests / totalRequests) * 100)}%` : '',
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      color: 'bg-green-50',
    },
    {
      title: '미처리 요청',
      value: pendingRequests,
      icon: <Clock className="w-5 h-5 text-yellow-500" />,
      color: 'bg-yellow-50',
    },
    {
      title: '평균 처리 시간',
      value: `${Math.round(avgProcessingHours)}시간`,
      icon: <TrendingUp className="w-5 h-5 text-purple-500" />,
      color: 'bg-purple-50',
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
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">통계</h1>
          <p className="text-gray-600 mt-1">요청 처리 현황 및 통계를 확인합니다.</p>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {summaryCards.map((card) => (
            <Card key={card.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {card.value}
                    </p>
                    {card.subtext && (
                      <p className="text-xs text-gray-500 mt-1">{card.subtext}</p>
                    )}
                  </div>
                  <div className={`p-3 rounded-full ${card.color}`}>{card.icon}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 일별 요청 추이 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              최근 7일간 요청 추이
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-40 gap-4 px-4">
              {last7Days.map((day, index) => {
                const maxCount = Math.max(...last7Days.map((d) => d.count), 1)
                const height = (day.count / maxCount) * 100
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-gray-100 rounded-t relative" style={{ height: '120px' }}>
                      <div
                        className="absolute bottom-0 w-full bg-blue-500 rounded-t transition-all"
                        style={{ height: `${height}%` }}
                      >
                        {day.count > 0 && (
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-medium">
                            {day.count}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 mt-2">{day.date}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* 요청 유형별 분포 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">요청 유형별 분포</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {requestTypeStats.map(([type, count]) => {
                  const percentage = totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 0
                  return (
                    <div key={type}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">
                          {REQUEST_TYPE_LABELS[type as RequestType]}
                        </span>
                        <span className="text-sm font-medium">
                          {count}건 ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* 플랫폼별 분포 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">플랫폼별 분포</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {platformStats.map(([platform, count]) => {
                  const percentage = totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 0
                  const colors: Record<string, string> = {
                    naver: 'bg-green-500',
                    kakao: 'bg-yellow-500',
                    google: 'bg-red-500',
                    other: 'bg-gray-500',
                  }
                  return (
                    <div key={platform}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">
                          {PLATFORM_LABELS[platform as AdPlatform]}
                        </span>
                        <span className="text-sm font-medium">
                          {count}건 ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`${colors[platform]} h-2 rounded-full`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* 담당자별 처리 현황 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                담당자별 처리 현황
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>담당자</TableHead>
                    <TableHead className="text-center">총 담당</TableHead>
                    <TableHead className="text-center">처리중</TableHead>
                    <TableHead className="text-center">완료</TableHead>
                    <TableHead className="text-center">완료율</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operatorStats.map((op) => (
                    <TableRow key={op.id}>
                      <TableCell className="font-medium">{op.name}</TableCell>
                      <TableCell className="text-center">{op.total}</TableCell>
                      <TableCell className="text-center">
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                          {op.inProgress}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
                          {op.completed}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`font-medium ${
                            op.completionRate >= 70
                              ? 'text-green-600'
                              : op.completionRate >= 40
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {op.completionRate}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* 클라이언트별 요청 빈도 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">클라이언트별 요청 빈도</CardTitle>
              <CardDescription>요청 건수 기준 상위 클라이언트</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>클라이언트</TableHead>
                    <TableHead className="text-center">요청 건수</TableHead>
                    <TableHead>최근 요청일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientStats.slice(0, 5).map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        {client.department_name}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                          {client.requestCount}건
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {client.lastRequestDate
                          ? format(parseISO(client.lastRequestDate), 'yyyy.MM.dd')
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
