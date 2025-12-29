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
  Label,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Textarea,
  RadioGroup,
  RadioGroupItem,
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
import type { RequestType, AdPlatform, Priority } from '@/types'
import { useAuthContext } from '@/components/layout/AuthProvider'
import { useClientRequests, useUpdateRequest } from '@/hooks/useRequests'
import { useComments } from '@/hooks/useComments'
import type { RequestWithRelations } from '@/services/requests.service'
import { Plus, Eye, MessageSquare, Check, Loader2, Pencil, X } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

const ITEMS_PER_PAGE = 20

export default function ClientRequestsPage() {
  const { client } = useAuthContext()
  const { data: requests = [], isLoading } = useClientRequests(client?.id)
  const updateRequest = useUpdateRequest()

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRequest, setSelectedRequest] = useState<RequestWithRelations | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // 수정 폼 상태
  const [editForm, setEditForm] = useState({
    request_type: '',
    platform: '',
    priority: '',
    title: '',
    description: '',
    desired_date: '',
  })

  // 선택된 요청의 코멘트 조회
  const { data: comments = [] } = useComments(selectedRequest?.id)

  // 상태별 필터링
  const filteredRequests =
    statusFilter === 'all'
      ? requests
      : requests.filter((req) => req.status === statusFilter)

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

  // 요청 상세 보기
  const openDetail = (request: RequestWithRelations) => {
    setSelectedRequest(request)
    setEditForm({
      request_type: request.request_type,
      platform: request.platform,
      priority: request.priority,
      title: request.title,
      description: request.description,
      desired_date: request.desired_date || '',
    })
    setIsEditing(false)
    setIsDetailOpen(true)
  }

  // 수정 모드 시작
  const startEditing = () => {
    if (selectedRequest) {
      setEditForm({
        request_type: selectedRequest.request_type,
        platform: selectedRequest.platform,
        priority: selectedRequest.priority,
        title: selectedRequest.title,
        description: selectedRequest.description,
        desired_date: selectedRequest.desired_date || '',
      })
      setIsEditing(true)
    }
  }

  // 수정 취소
  const cancelEditing = () => {
    setIsEditing(false)
  }

  // 수정 저장
  const handleSaveEdit = async () => {
    if (!selectedRequest) return

    if (!editForm.title.trim() || !editForm.description.trim()) {
      alert('제목과 상세 내용은 필수입니다.')
      return
    }

    try {
      await updateRequest.mutateAsync({
        id: selectedRequest.id,
        updates: {
          request_type: editForm.request_type as RequestType,
          platform: editForm.platform as AdPlatform,
          priority: editForm.priority as Priority,
          title: editForm.title,
          description: editForm.description,
          desired_date: editForm.desired_date || null,
        },
      })
      setIsEditing(false)
      setIsDetailOpen(false)
    } catch (error) {
      console.error('요청 수정 실패:', error)
      alert('요청 수정에 실패했습니다.')
    }
  }

  // 공개 코멘트만 필터링 (클라이언트는 내부 코멘트 볼 수 없음)
  const publicComments = comments.filter((c) => !c.is_internal)

  // 수정 가능 여부 체크 (접수대기 상태일 때만 수정 가능)
  const canEdit = selectedRequest?.status === 'pending'

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
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">요청 현황</h1>
            <p className="text-gray-600 mt-1">등록한 요청의 처리 현황을 확인할 수 있습니다.</p>
          </div>
          <Link href="/client/request/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              새 요청 등록
            </Button>
          </Link>
        </div>

        {/* 상태 요약 카드 */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {[
            { key: 'all', label: '전체', color: 'bg-gray-100' },
            { key: 'pending', label: '접수대기', color: 'bg-yellow-100' },
            { key: 'in_progress', label: '처리중', color: 'bg-blue-100' },
            { key: 'completed', label: '완료', color: 'bg-green-100' },
            { key: 'on_hold', label: '보류', color: 'bg-gray-100' },
          ].map((item) => (
            <Card
              key={item.key}
              className={`cursor-pointer transition-all ${
                statusFilter === item.key ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleStatusFilter(item.key)}
            >
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">{item.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {statusCounts[item.key as keyof typeof statusCounts]}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 요청 목록 */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>요청 목록</CardTitle>
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="pending">접수대기</SelectItem>
                  <SelectItem value="in_progress">처리중</SelectItem>
                  <SelectItem value="completed">완료</SelectItem>
                  <SelectItem value="on_hold">보류</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">등록된 요청이 없습니다.</p>
                <Link href="/client/request/new">
                  <Button variant="outline" className="mt-4">
                    첫 요청 등록하기
                  </Button>
                </Link>
              </div>
            ) : (
              <>
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[90px]">요청번호</TableHead>
                    <TableHead className="w-auto">제목</TableHead>
                    <TableHead className="w-[80px]">요청유형</TableHead>
                    <TableHead className="w-[80px]">플랫폼</TableHead>
                    <TableHead className="w-[60px]">긴급도</TableHead>
                    <TableHead className="w-[70px]">상태</TableHead>
                    <TableHead className="w-[85px]">등록일</TableHead>
                    <TableHead className="w-[50px]">상세</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-mono truncate">
                        {request.request_number}
                      </TableCell>
                      <TableCell className="truncate">
                        <button
                          onClick={() => openDetail(request)}
                          className="text-left hover:text-blue-600 hover:underline truncate block w-full"
                          title={request.title}
                        >
                          {request.title}
                        </button>
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
                      <TableCell className="text-gray-600">
                        {format(new Date(request.created_at), 'MM.dd HH:mm', {
                          locale: ko,
                        })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => openDetail(request)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
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

        {/* 상세 보기 다이얼로그 */}
        <Dialog open={isDetailOpen} onOpenChange={(open) => {
          setIsDetailOpen(open)
          if (!open) setIsEditing(false)
        }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedRequest && (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          STATUS_COLORS[selectedRequest.status]
                        }`}
                      >
                        {STATUS_LABELS[selectedRequest.status]}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          PRIORITY_COLORS[selectedRequest.priority]
                        }`}
                      >
                        {PRIORITY_LABELS[selectedRequest.priority]}
                      </span>
                    </div>
                    {canEdit && !isEditing && (
                      <Button variant="outline" size="sm" onClick={startEditing}>
                        <Pencil className="w-4 h-4 mr-1" />
                        수정
                      </Button>
                    )}
                  </div>
                  <DialogTitle>{isEditing ? '요청 수정' : selectedRequest.title}</DialogTitle>
                  <DialogDescription>
                    {selectedRequest.request_number} |{' '}
                    {format(new Date(selectedRequest.created_at), 'yyyy년 M월 d일 HH:mm', {
                      locale: ko,
                    })}
                  </DialogDescription>
                </DialogHeader>

                {isEditing ? (
                  /* 수정 모드 */
                  <div className="space-y-6 mt-4">
                    {/* 요청 유형 */}
                    <div className="space-y-2">
                      <Label>요청 유형</Label>
                      <Select
                        value={editForm.request_type}
                        onValueChange={(value) => setEditForm({ ...editForm, request_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.entries(REQUEST_TYPE_LABELS) as [RequestType, string][]).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 광고 플랫폼 */}
                    <div className="space-y-2">
                      <Label>광고 플랫폼</Label>
                      <Select
                        value={editForm.platform}
                        onValueChange={(value) => setEditForm({ ...editForm, platform: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.entries(PLATFORM_LABELS) as [AdPlatform, string][]).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 긴급도 */}
                    <div className="space-y-3">
                      <Label>긴급도</Label>
                      <RadioGroup
                        value={editForm.priority}
                        onValueChange={(value) => setEditForm({ ...editForm, priority: value })}
                        className="flex gap-4"
                      >
                        {(Object.entries(PRIORITY_LABELS) as [Priority, string][]).map(
                          ([value, label]) => (
                            <div key={value} className="flex items-center space-x-2">
                              <RadioGroupItem value={value} id={`edit-${value}`} />
                              <Label htmlFor={`edit-${value}`} className="cursor-pointer">
                                {label}
                              </Label>
                            </div>
                          )
                        )}
                      </RadioGroup>
                    </div>

                    {/* 제목 */}
                    <div className="space-y-2">
                      <Label>제목</Label>
                      <Input
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      />
                    </div>

                    {/* 상세 내용 */}
                    <div className="space-y-2">
                      <Label>상세 내용</Label>
                      <Textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={6}
                      />
                    </div>

                    {/* 희망 처리일 */}
                    <div className="space-y-2">
                      <Label>희망 처리일</Label>
                      <Input
                        type="date"
                        value={editForm.desired_date}
                        onChange={(e) => setEditForm({ ...editForm, desired_date: e.target.value })}
                      />
                    </div>

                    {/* 수정 버튼 */}
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={cancelEditing}
                      >
                        <X className="w-4 h-4 mr-2" />
                        취소
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleSaveEdit}
                        disabled={updateRequest.isPending}
                      >
                        {updateRequest.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        저장
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* 보기 모드 */
                  <div className="space-y-6 mt-4">
                    {/* 요청 정보 */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">요청 유형</p>
                        <p className="font-medium">
                          {REQUEST_TYPE_LABELS[selectedRequest.request_type]}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">플랫폼</p>
                        <p className="font-medium">
                          {PLATFORM_LABELS[selectedRequest.platform]}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">담당자</p>
                        <p className="font-medium">
                          {selectedRequest.operator?.name || '배정 대기중'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">희망 처리일</p>
                        <p className="font-medium">
                          {selectedRequest.desired_date
                            ? format(new Date(selectedRequest.desired_date), 'yyyy년 M월 d일', {
                                locale: ko,
                              })
                            : '-'}
                        </p>
                      </div>
                    </div>

                    {/* 상세 내용 */}
                    <div>
                      <p className="text-sm text-gray-500 mb-2">상세 내용</p>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {selectedRequest.description}
                        </p>
                      </div>
                    </div>

                    {/* 담당자 코멘트 */}
                    <div>
                      <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        담당자 코멘트
                      </p>
                      <div className="space-y-3">
                        {publicComments.length === 0 ? (
                          <p className="text-gray-400 text-sm">아직 코멘트가 없습니다.</p>
                        ) : (
                          publicComments.map((comment) => (
                            <div
                              key={comment.id}
                              className="p-3 rounded-lg bg-gray-50"
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium">
                                  {comment.author?.name || '담당자'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {format(new Date(comment.created_at), 'MM.dd HH:mm')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">{comment.content}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* 수정 안내 메시지 */}
                    {!canEdit && selectedRequest.status !== 'completed' && (
                      <p className="text-sm text-gray-500 text-center">
                        처리가 시작된 요청은 수정할 수 없습니다.
                      </p>
                    )}

                    {/* 완료 확인 버튼 */}
                    {selectedRequest.status === 'completed' && (
                      <div className="pt-4 border-t">
                        <Button className="w-full" variant="outline">
                          <Check className="w-4 h-4 mr-2" />
                          완료 확인
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
