'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Pagination,
} from '@/components/ui'
import {
  REQUEST_TYPE_LABELS,
  PLATFORM_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  PRIORITY_COLORS,
  STATUS_COLORS,
} from '@/types'
import { useRequests } from '@/hooks/useRequests'
import { Search, Filter, Eye, UserPlus, Loader2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'

const ITEMS_PER_PAGE = 20

export default function OperatorRequestsPage() {
  const { data: requests = [], isLoading } = useRequests()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // 필터링된 요청 목록
  const filteredRequests = requests.filter((request) => {
    const matchesStatus =
      statusFilter === 'all' || request.status === statusFilter
    const matchesPriority =
      priorityFilter === 'all' || request.priority === priorityFilter
    const matchesSearch =
      searchQuery === '' ||
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.client?.department_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.request_number.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesStatus && matchesPriority && matchesSearch
  })

  // 페이지네이션
  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE)
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // 필터 변경 시 페이지 리셋
  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const handlePriorityFilter = (value: string) => {
    setPriorityFilter(value)
    setCurrentPage(1)
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  // 상태별 카운트
  const statusCounts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    in_progress: requests.filter((r) => r.status === 'in_progress').length,
    completed: requests.filter((r) => r.status === 'completed').length,
    on_hold: requests.filter((r) => r.status === 'on_hold').length,
  }

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
          <h1 className="text-2xl font-bold text-gray-900">요청 처리</h1>
          <p className="text-gray-600 mt-1">
            클라이언트 요청을 확인하고 처리할 수 있습니다.
          </p>
        </div>

        {/* 상태 탭 */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'all', label: '전체' },
            { key: 'pending', label: '접수대기' },
            { key: 'in_progress', label: '처리중' },
            { key: 'completed', label: '완료' },
            { key: 'on_hold', label: '보류' },
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={statusFilter === tab.key ? 'default' : 'outline'}
              onClick={() => handleStatusFilter(tab.key)}
              className="relative"
            >
              {tab.label}
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  statusFilter === tab.key
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {statusCounts[tab.key as keyof typeof statusCounts]}
              </span>
            </Button>
          ))}
        </div>

        {/* 필터 및 검색 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="요청번호, 제목, 클라이언트명으로 검색"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={priorityFilter} onValueChange={handlePriorityFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="긴급도" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 긴급도</SelectItem>
                  <SelectItem value="critical">최우선</SelectItem>
                  <SelectItem value="urgent">긴급</SelectItem>
                  <SelectItem value="normal">일반</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 요청 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>요청 목록</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">조건에 맞는 요청이 없습니다.</p>
              </div>
            ) : (
              <>
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[90px]">요청번호</TableHead>
                    <TableHead className="w-[100px]">클라이언트</TableHead>
                    <TableHead className="w-auto">제목</TableHead>
                    <TableHead className="w-[80px]">유형</TableHead>
                    <TableHead className="w-[80px]">플랫폼</TableHead>
                    <TableHead className="w-[70px]">긴급도</TableHead>
                    <TableHead className="w-[70px]">상태</TableHead>
                    <TableHead className="w-[70px]">담당자</TableHead>
                    <TableHead className="w-[85px]">등록일</TableHead>
                    <TableHead className="w-[60px]">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-mono truncate">
                        {request.request_number}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="truncate">{request.client?.department_name || '-'}</div>
                        <div className="truncate text-gray-500 font-normal">{request.client?.contact_name || ''}</div>
                      </TableCell>
                      <TableCell className="truncate">
                        <Link
                          href={`/operator/requests/${request.id}`}
                          className="hover:text-blue-600 hover:underline"
                          title={request.title}
                        >
                          {request.title}
                        </Link>
                      </TableCell>
                      <TableCell className="truncate">
                        {REQUEST_TYPE_LABELS[request.request_type]}
                      </TableCell>
                      <TableCell className="truncate">
                        {PLATFORM_LABELS[request.platform]}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                            PRIORITY_COLORS[request.priority]
                          }`}
                        >
                          {PRIORITY_LABELS[request.priority]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                            STATUS_COLORS[request.status]
                          }`}
                        >
                          {STATUS_LABELS[request.status]}
                        </span>
                      </TableCell>
                      <TableCell className="truncate">
                        {request.operator?.name ? (
                          <span>{request.operator.name}</span>
                        ) : (
                          <span className="text-gray-400">미배정</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {format(parseISO(request.created_at), 'MM.dd HH:mm')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-0.5">
                          <Link href={`/operator/requests/${request.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          {!request.operator_id && (
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <UserPlus className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
