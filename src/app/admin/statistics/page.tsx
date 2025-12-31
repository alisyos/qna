'use client'

export const dynamic = 'force-dynamic'

import { useState, useMemo } from 'react'
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
  Button,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { format, parseISO, differenceInHours, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns'
import { ko } from 'date-fns/locale'

type DatePreset = '7days' | '30days' | '90days' | 'all' | 'custom'

export default function AdminStatisticsPage() {
  const { data: requests = [], isLoading: requestsLoading } = useRequests()
  const { data: clients = [], isLoading: clientsLoading } = useClients()
  const { data: operators = [], isLoading: operatorsLoading } = useOperators()

  const isLoading = requestsLoading || clientsLoading || operatorsLoading

  // 기간 설정 상태 (기본값: 최근 30일)
  const [datePreset, setDatePreset] = useState<DatePreset>('30days')
  const [startDate, setStartDate] = useState<string>(format(subDays(new Date(), 29), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))

  // 전체보기 다이얼로그 상태
  const [operatorDialogOpen, setOperatorDialogOpen] = useState(false)
  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [operatorPage, setOperatorPage] = useState(1)
  const [clientPage, setClientPage] = useState(1)

  // 프리셋에 따른 날짜 범위 계산
  const getDateRange = (preset: DatePreset) => {
    const today = new Date()
    switch (preset) {
      case '7days':
        return { start: subDays(today, 6), end: today }
      case '30days':
        return { start: subDays(today, 29), end: today }
      case '90days':
        return { start: subDays(today, 89), end: today }
      case 'all':
        return { start: new Date(2000, 0, 1), end: today }
      case 'custom':
        return { start: parseISO(startDate), end: parseISO(endDate) }
    }
  }

  // 프리셋 변경 핸들러
  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset)
    if (preset !== 'custom') {
      const range = getDateRange(preset)
      setStartDate(format(range.start, 'yyyy-MM-dd'))
      setEndDate(format(range.end, 'yyyy-MM-dd'))
    }
  }

  // 날짜 직접 입력 시 custom으로 전환
  const handleDateChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') setStartDate(value)
    else setEndDate(value)
    setDatePreset('custom')
  }

  // 기간 필터링된 요청 데이터
  const filteredRequests = useMemo(() => {
    const range = getDateRange(datePreset)
    return requests.filter((r) => {
      const reqDate = parseISO(r.created_at)
      return isWithinInterval(reqDate, {
        start: startOfDay(range.start),
        end: endOfDay(range.end),
      })
    })
  }, [requests, datePreset, startDate, endDate])

  // 통계 계산 (필터링된 데이터 기준)
  const totalRequests = filteredRequests.length
  const completedRequests = filteredRequests.filter((r) => r.status === 'completed').length
  const pendingRequests = filteredRequests.filter((r) => r.status === 'pending').length
  const inProgressRequests = filteredRequests.filter((r) => r.status === 'in_progress').length
  const onHoldRequests = filteredRequests.filter((r) => r.status === 'on_hold').length

  // 평균 처리 시간 계산 (완료된 요청 기준)
  const completedWithTime = filteredRequests.filter(
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
    filteredRequests.reduce((acc, r) => {
      acc[r.request_type] = (acc[r.request_type] || 0) + 1
      return acc
    }, {} as Record<RequestType, number>)
  ).sort((a, b) => b[1] - a[1])

  // 플랫폼별 분포
  const platformStats = Object.entries(
    filteredRequests.reduce((acc, r) => {
      acc[r.platform] = (acc[r.platform] || 0) + 1
      return acc
    }, {} as Record<AdPlatform, number>)
  ).sort((a, b) => b[1] - a[1])

  // 담당자별 처리 현황
  const operatorStats = operators
    .filter((op) => op.role === 'operator')
    .map((op) => {
      const opRequests = filteredRequests.filter((r) => r.operator_id === op.id)
      const pending = opRequests.filter((r) => r.status === 'pending').length
      const inProgress = opRequests.filter((r) => r.status === 'in_progress').length
      const completed = opRequests.filter((r) => r.status === 'completed').length
      const onHold = opRequests.filter((r) => r.status === 'on_hold').length
      return {
        ...op,
        total: opRequests.length,
        pending,
        inProgress,
        completed,
        onHold,
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
      const clientRequests = filteredRequests.filter((r) => r.client_id === client.id)
      const pending = clientRequests.filter((r) => r.status === 'pending').length
      const inProgress = clientRequests.filter((r) => r.status === 'in_progress').length
      const completed = clientRequests.filter((r) => r.status === 'completed').length
      const onHold = clientRequests.filter((r) => r.status === 'on_hold').length
      return {
        ...client,
        requestCount: clientRequests.length,
        pending,
        inProgress,
        completed,
        onHold,
        completionRate:
          clientRequests.length > 0
            ? Math.round((completed / clientRequests.length) * 100)
            : 0,
        lastRequestDate: clientRequests.length > 0
          ? clientRequests.sort(
              (a, b) =>
                parseISO(b.created_at).getTime() - parseISO(a.created_at).getTime()
            )[0].created_at
          : null,
      }
    })
    .sort((a, b) => b.requestCount - a.requestCount)

  // 선택 기간 내 일별 요청 건수 (최대 30일 표시)
  const dateRange = getDateRange(datePreset)
  const daysDiff = Math.min(
    Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    30
  )
  const dailyStats = Array.from({ length: daysDiff }, (_, i) => {
    const date = subDays(dateRange.end, daysDiff - 1 - i)
    const count = filteredRequests.filter((r) => {
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
      customContent: (
        <div className="space-y-1 mt-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">접수대기</span>
            <span className="font-medium text-gray-900">{pendingRequests}건</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">처리중</span>
            <span className="font-medium text-gray-900">{inProgressRequests}건</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">보류</span>
            <span className="font-medium text-gray-900">{onHoldRequests}건</span>
          </div>
        </div>
      ),
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
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">통계</h1>
              <p className="text-gray-600 mt-1">요청 처리 현황 및 통계를 확인합니다.</p>
            </div>
          </div>

          {/* 기간 설정 */}
          <Card className="mt-4">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">조회 기간</span>
                </div>

                {/* 프리셋 버튼 */}
                <div className="flex gap-2">
                  {[
                    { value: '7days' as const, label: '최근 7일' },
                    { value: '30days' as const, label: '최근 30일' },
                    { value: '90days' as const, label: '최근 90일' },
                    { value: 'all' as const, label: '전체' },
                  ].map((preset) => (
                    <Button
                      key={preset.value}
                      variant={datePreset === preset.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePresetChange(preset.value)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>

                {/* 직접 입력 */}
                <div className="flex items-center gap-2 ml-4">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleDateChange('start', e.target.value)}
                    className="w-36 h-8 text-sm"
                  />
                  <span className="text-gray-500">~</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => handleDateChange('end', e.target.value)}
                    className="w-36 h-8 text-sm"
                  />
                </div>

                {/* 선택 기간 표시 */}
                <span className="text-sm text-gray-500 ml-auto">
                  {format(parseISO(startDate), 'yyyy.MM.dd')} ~ {format(parseISO(endDate), 'yyyy.MM.dd')}
                  <span className="ml-2 text-blue-600 font-medium">({totalRequests}건)</span>
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {summaryCards.map((card) => (
            <Card key={card.title}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">{card.title}</p>
                    {card.customContent ? (
                      card.customContent
                    ) : (
                      <>
                        <p className="text-3xl font-bold text-gray-900 mt-1">
                          {card.value}
                        </p>
                        {card.subtext && (
                          <p className="text-xs text-gray-500 mt-1">{card.subtext}</p>
                        )}
                      </>
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
              일별 요청 추이
              <span className="text-sm font-normal text-gray-500">
                (최근 {daysDiff}일)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-40 gap-1 px-4 overflow-x-auto">
              {dailyStats.map((day, index) => {
                const maxCount = Math.max(...dailyStats.map((d) => d.count), 1)
                const height = (day.count / maxCount) * 100
                return (
                  <div key={index} className="flex-1 min-w-[24px] flex flex-col items-center">
                    <div className="w-full bg-gray-100 rounded-t relative" style={{ height: '120px' }}>
                      <div
                        className="absolute bottom-0 w-full bg-blue-500 rounded-t transition-all"
                        style={{ height: `${height}%` }}
                      >
                        {day.count > 0 && daysDiff <= 14 && (
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-medium">
                            {day.count}
                          </span>
                        )}
                      </div>
                    </div>
                    {daysDiff <= 14 ? (
                      <span className="text-xs text-gray-500 mt-2">{day.date}</span>
                    ) : index % Math.ceil(daysDiff / 10) === 0 ? (
                      <span className="text-xs text-gray-500 mt-2">{day.date}</span>
                    ) : (
                      <span className="text-xs text-transparent mt-2">.</span>
                    )}
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                담당자별 처리 현황
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setOperatorPage(1)
                  setOperatorDialogOpen(true)
                }}
              >
                전체보기
              </Button>
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
                  {operatorStats.slice(0, 5).map((op) => (
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
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">클라이언트별 요청 빈도</CardTitle>
                <CardDescription>요청 건수 기준 상위 클라이언트</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setClientPage(1)
                  setClientDialogOpen(true)
                }}
              >
                전체보기
              </Button>
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
                        {client.contact_name}
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

      {/* 담당자별 처리 현황 전체보기 다이얼로그 */}
      <Dialog open={operatorDialogOpen} onOpenChange={setOperatorDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>담당자별 처리 현황</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>담당자</TableHead>
                <TableHead className="text-center">총 담당</TableHead>
                <TableHead className="text-center">접수대기</TableHead>
                <TableHead className="text-center">처리중</TableHead>
                <TableHead className="text-center">완료</TableHead>
                <TableHead className="text-center">보류</TableHead>
                <TableHead className="text-center">완료율</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operatorStats
                .slice((operatorPage - 1) * 10, operatorPage * 10)
                .map((op) => (
                  <TableRow key={op.id}>
                    <TableCell className="font-medium">{op.name}</TableCell>
                    <TableCell className="text-center">{op.total}</TableCell>
                    <TableCell className="text-center">
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs">
                        {op.pending}
                      </span>
                    </TableCell>
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
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                        {op.onHold}
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
          {/* 페이지네이션 */}
          {operatorStats.length > 10 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOperatorPage((p) => Math.max(1, p - 1))}
                disabled={operatorPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600">
                {operatorPage} / {Math.ceil(operatorStats.length / 10)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setOperatorPage((p) =>
                    Math.min(Math.ceil(operatorStats.length / 10), p + 1)
                  )
                }
                disabled={operatorPage >= Math.ceil(operatorStats.length / 10)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 클라이언트별 요청 빈도 전체보기 다이얼로그 */}
      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>클라이언트별 요청 빈도</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>부서명</TableHead>
                <TableHead>담당자</TableHead>
                <TableHead className="text-center">요청 건수</TableHead>
                <TableHead className="text-center">접수대기</TableHead>
                <TableHead className="text-center">처리중</TableHead>
                <TableHead className="text-center">완료</TableHead>
                <TableHead className="text-center">보류</TableHead>
                <TableHead className="text-center">완료율</TableHead>
                <TableHead>최근 요청일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientStats
                .slice((clientPage - 1) * 10, clientPage * 10)
                .map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      {client.department_name}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {client.contact_name}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                        {client.requestCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs">
                        {client.pending}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                        {client.inProgress}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
                        {client.completed}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                        {client.onHold}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`font-medium ${
                          client.completionRate >= 70
                            ? 'text-green-600'
                            : client.completionRate >= 40
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {client.completionRate}%
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
          {/* 페이지네이션 */}
          {clientStats.length > 10 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setClientPage((p) => Math.max(1, p - 1))}
                disabled={clientPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600">
                {clientPage} / {Math.ceil(clientStats.length / 10)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setClientPage((p) =>
                    Math.min(Math.ceil(clientStats.length / 10), p + 1)
                  )
                }
                disabled={clientPage >= Math.ceil(clientStats.length / 10)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
