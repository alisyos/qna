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
import { useComments, useCreateComment, useUpdateComment, useDeleteComment } from '@/hooks/useComments'
import { useAttachments, useFileUpload, useDeleteAttachment, useSignedUrl, useCommentFileUpload } from '@/hooks/useFileUpload'
import type { RequestWithRelations } from '@/services/requests.service'
import { Plus, Eye, MessageSquare, Check, Loader2, Pencil, X, Paperclip, Download, Trash2, Upload, Send, ChevronUp, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

const ITEMS_PER_PAGE = 20

export default function ClientRequestsPage() {
  const { client, profile } = useAuthContext()
  const { data: requests = [], isLoading } = useClientRequests(client?.id)
  const updateRequest = useUpdateRequest()
  const createComment = useCreateComment()
  const updateComment = useUpdateComment()
  const deleteComment = useDeleteComment()
  const commentFileUpload = useCommentFileUpload()

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRequest, setSelectedRequest] = useState<RequestWithRelations | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // 정렬 상태
  const [sortField, setSortField] = useState<'created_at' | 'desired_date' | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // 수정 폼 상태
  const [editForm, setEditForm] = useState({
    request_type: '',
    platform: '',
    priority: '',
    title: '',
    description: '',
    desired_date: '',
  })

  // 코멘트 작성 상태
  const [newComment, setNewComment] = useState('')
  const [commentFiles, setCommentFiles] = useState<File[]>([])
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  // 코멘트 수정 상태
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [editingNewFiles, setEditingNewFiles] = useState<File[]>([])
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<string[]>([])

  // 선택된 요청의 코멘트 조회
  const { data: comments = [] } = useComments(selectedRequest?.id)

  // 첨부파일 관련
  const { data: attachments = [] } = useAttachments(selectedRequest?.id)
  const fileUpload = useFileUpload()
  const deleteAttachment = useDeleteAttachment()
  const getSignedUrl = useSignedUrl()

  // 파일 다운로드
  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const url = await getSignedUrl.mutateAsync({ filePath, fileName })
      window.open(url, '_blank')
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  // 파일 업로드
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedRequest || !client || !client.user_id) return

    const files = Array.from(e.target.files)
    for (const file of files) {
      try {
        await fileUpload.mutateAsync({
          file,
          requestId: selectedRequest.id,
          userId: client.user_id,
        })
      } catch (error) {
        console.error('File upload failed:', error)
      }
    }
    e.target.value = ''
  }

  // 파일 삭제
  const handleDeleteFile = async (id: string, filePath: string) => {
    console.log('handleDeleteFile called:', { id, filePath, selectedRequest: selectedRequest?.id })

    if (!selectedRequest) {
      console.log('No selectedRequest')
      return
    }
    if (!confirm('파일을 삭제하시겠습니까?')) {
      console.log('User cancelled')
      return
    }

    console.log('Attempting to delete attachment...')
    try {
      await deleteAttachment.mutateAsync({
        id,
        filePath,
        requestId: selectedRequest.id,
      })
      console.log('Delete successful')
    } catch (error) {
      console.error('File delete failed:', error)
      alert(`파일 삭제에 실패했습니다.\n\n오류: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // 파일 크기 포맷
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 상태별 필터링
  const filteredRequests =
    statusFilter === 'all'
      ? requests
      : requests.filter((req) => req.status === statusFilter)

  // 정렬 적용
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (!sortField) return 0

    let aValue: string | null = null
    let bValue: string | null = null

    if (sortField === 'created_at') {
      aValue = a.created_at
      bValue = b.created_at
    } else if (sortField === 'desired_date') {
      aValue = a.desired_date
      bValue = b.desired_date
    }

    // null 값 처리 (null은 항상 뒤로)
    if (!aValue && !bValue) return 0
    if (!aValue) return 1
    if (!bValue) return -1

    const comparison = aValue.localeCompare(bValue)
    return sortOrder === 'asc' ? comparison : -comparison
  })

  // 정렬 토글 핸들러
  const handleSort = (field: 'created_at' | 'desired_date') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  // 페이지네이션
  const totalPages = Math.ceil(sortedRequests.length / ITEMS_PER_PAGE)
  const paginatedRequests = sortedRequests.slice(
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

  // 코멘트 제출
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !selectedRequest || !profile) return

    setIsSubmittingComment(true)
    try {
      // 1. 코멘트 생성
      const comment = await createComment.mutateAsync({
        request_id: selectedRequest.id,
        author_id: profile.id,
        content: newComment.trim(),
        is_internal: false, // 클라이언트 코멘트는 항상 공개
      })

      // 2. 첨부파일 업로드
      if (commentFiles.length > 0) {
        for (const file of commentFiles) {
          await commentFileUpload.mutateAsync({
            file,
            requestId: selectedRequest.id,
            commentId: comment.id,
            userId: profile.id,
          })
        }
      }

      // 3. 상태 초기화
      setNewComment('')
      setCommentFiles([])
    } catch (error) {
      console.error('코멘트 작성 실패:', error)
      alert('코멘트 작성에 실패했습니다.')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  // 코멘트 파일 선택
  const handleCommentFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setCommentFiles(prev => [...prev, ...Array.from(e.target.files!)])
    }
    e.target.value = ''
  }

  // 코멘트 파일 제거
  const removeCommentFile = (index: number) => {
    setCommentFiles(prev => prev.filter((_, i) => i !== index))
  }

  // 코멘트 수정 시작
  const startEditComment = (comment: { id: string; content: string }) => {
    setEditingCommentId(comment.id)
    setEditingContent(comment.content)
    setEditingNewFiles([])
    setDeletedAttachmentIds([])
  }

  // 코멘트 수정 취소
  const cancelEditComment = () => {
    setEditingCommentId(null)
    setEditingContent('')
    setEditingNewFiles([])
    setDeletedAttachmentIds([])
  }

  // 수정 모드에서 파일 선택
  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setEditingNewFiles(prev => [...prev, ...Array.from(e.target.files!)])
    }
    e.target.value = ''
  }

  // 수정 모드에서 새 파일 제거
  const removeEditingNewFile = (index: number) => {
    setEditingNewFiles(prev => prev.filter((_, i) => i !== index))
  }

  // 수정 모드에서 기존 첨부파일 삭제 표시
  const markAttachmentForDeletion = (attachmentId: string) => {
    setDeletedAttachmentIds(prev => [...prev, attachmentId])
  }

  // 수정 모드에서 삭제 표시 취소
  const unmarkAttachmentForDeletion = (attachmentId: string) => {
    setDeletedAttachmentIds(prev => prev.filter(id => id !== attachmentId))
  }

  // 코멘트 수정 저장
  const handleSaveComment = async () => {
    if (!editingCommentId || !editingContent.trim() || !profile || !selectedRequest) return

    try {
      // 1. 코멘트 내용 수정
      await updateComment.mutateAsync({
        id: editingCommentId,
        content: editingContent.trim(),
        isInternal: false, // 클라이언트 코멘트는 항상 공개
        requestId: selectedRequest.id,
      })

      // 2. 삭제 표시된 첨부파일 삭제
      for (const attachmentId of deletedAttachmentIds) {
        const comment = comments.find(c => c.id === editingCommentId)
        const attachment = comment?.attachments?.find(a => a.id === attachmentId)
        if (attachment) {
          await deleteAttachment.mutateAsync({
            id: attachmentId,
            filePath: attachment.file_path,
            requestId: selectedRequest.id,
          })
        }
      }

      // 3. 새 첨부파일 업로드
      for (const file of editingNewFiles) {
        await commentFileUpload.mutateAsync({
          file,
          requestId: selectedRequest.id,
          commentId: editingCommentId,
          userId: profile.id,
        })
      }

      cancelEditComment()
    } catch (error) {
      console.error('코멘트 수정 실패:', error)
      alert('코멘트 수정에 실패했습니다.')
    }
  }

  // 코멘트 삭제
  const handleDeleteComment = async (commentId: string) => {
    if (!selectedRequest) return
    if (!confirm('코멘트를 삭제하시겠습니까? 첨부파일도 함께 삭제됩니다.')) return

    try {
      await deleteComment.mutateAsync({ id: commentId, requestId: selectedRequest.id })
    } catch (error) {
      console.error('코멘트 삭제 실패:', error)
      alert('코멘트 삭제에 실패했습니다.')
    }
  }

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
                    <TableHead className="w-auto">제목</TableHead>
                    <TableHead className="w-[100px]">요청유형</TableHead>
                    <TableHead className="w-[100px]">플랫폼</TableHead>
                    <TableHead className="w-[70px]">긴급도</TableHead>
                    <TableHead className="w-[70px]">상태</TableHead>
                    <TableHead className="w-[90px]">
                      <button
                        onClick={() => handleSort('created_at')}
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        등록일
                        {sortField === 'created_at' && (
                          sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="w-[90px]">
                      <button
                        onClick={() => handleSort('desired_date')}
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        희망처리일
                        {sortField === 'desired_date' && (
                          sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="w-[50px]">상세</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openDetail(request)}
                            className="text-left hover:text-blue-600 hover:underline truncate"
                            title={request.title}
                          >
                            {request.title}
                          </button>
                          {(request.comment_count ?? 0) > 0 && (
                            <span className="flex items-center gap-0.5 text-xs text-gray-500 shrink-0">
                              <MessageSquare className="w-3 h-3" />
                              {request.comment_count}
                            </span>
                          )}
                        </div>
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
                      <TableCell className="text-gray-600">
                        {request.desired_date
                          ? format(new Date(request.desired_date), 'MM.dd', { locale: ko })
                          : '-'}
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

                    {/* 첨부파일 */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4" />
                        첨부파일
                      </Label>
                      {attachments.length > 0 && (
                        <div className="space-y-2">
                          {attachments.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-sm truncate">{file.file_name}</span>
                                <span className="text-xs text-gray-400 flex-shrink-0">
                                  ({formatFileSize(file.file_size)})
                                </span>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleDownload(file.file_path, file.file_name)}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                  onClick={() => handleDeleteFile(file.id, file.file_path)}
                                  disabled={deleteAttachment.isPending}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          id="file-upload-edit"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <label htmlFor="file-upload-edit">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                            asChild
                          >
                            <span>
                              <Upload className="w-4 h-4 mr-2" />
                              파일 추가
                            </span>
                          </Button>
                        </label>
                        {fileUpload.isPending && (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        )}
                      </div>
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

                    {/* 첨부파일 (보기 모드) */}
                    {attachments.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                          <Paperclip className="w-4 h-4" />
                          첨부파일
                        </p>
                        <div className="space-y-2">
                          {attachments.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-sm truncate">{file.file_name}</span>
                                <span className="text-xs text-gray-400 flex-shrink-0">
                                  ({formatFileSize(file.file_size)})
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => handleDownload(file.file_path, file.file_name)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 코멘트 */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-200">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-blue-900">코멘트</span>
                        {publicComments.length > 0 && (
                          <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                            {publicComments.length}
                          </span>
                        )}
                      </div>
                      <div className="space-y-3">
                        {publicComments.length === 0 ? (
                          <p className="text-blue-400 text-sm text-center py-2">아직 코멘트가 없습니다.</p>
                        ) : (
                          publicComments.map((comment) => {
                            const isMyComment = comment.author_id === profile?.id
                            return (
                              <div
                                key={comment.id}
                                className={`p-3 rounded-lg shadow-sm ${
                                  isMyComment
                                    ? 'bg-green-50 border border-green-200 ml-4'
                                    : 'bg-white border border-blue-100 mr-4'
                                }`}
                              >
                                {editingCommentId === comment.id ? (
                                  /* 수정 모드 */
                                  <div className="space-y-3">
                                    <Textarea
                                      value={editingContent}
                                      onChange={(e) => setEditingContent(e.target.value)}
                                      rows={3}
                                      className="bg-white"
                                    />

                                    {/* 기존 첨부파일 */}
                                    {comment.attachments && comment.attachments.length > 0 && (
                                      <div className="space-y-1">
                                        <p className="text-xs text-gray-500">기존 첨부파일</p>
                                        {comment.attachments.map((file) => (
                                          <div
                                            key={file.id}
                                            className={`flex items-center justify-between px-2 py-1.5 rounded text-sm ${
                                              deletedAttachmentIds.includes(file.id)
                                                ? 'bg-red-50 line-through text-gray-400'
                                                : 'bg-gray-100'
                                            }`}
                                          >
                                            <div className="flex items-center gap-2 min-w-0">
                                              <Paperclip className="w-3 h-3 flex-shrink-0" />
                                              <span className="truncate text-xs">{file.file_name}</span>
                                            </div>
                                            {deletedAttachmentIds.includes(file.id) ? (
                                              <button
                                                type="button"
                                                onClick={() => unmarkAttachmentForDeletion(file.id)}
                                                className="text-xs text-blue-600 hover:underline"
                                              >
                                                복원
                                              </button>
                                            ) : (
                                              <button
                                                type="button"
                                                onClick={() => markAttachmentForDeletion(file.id)}
                                                className="text-gray-400 hover:text-red-500"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* 새로 추가할 파일 */}
                                    {editingNewFiles.length > 0 && (
                                      <div className="space-y-1">
                                        <p className="text-xs text-gray-500">새 첨부파일</p>
                                        {editingNewFiles.map((file, index) => (
                                          <div
                                            key={index}
                                            className="flex items-center justify-between px-2 py-1.5 bg-green-50 rounded text-sm"
                                          >
                                            <div className="flex items-center gap-2 min-w-0">
                                              <Paperclip className="w-3 h-3 flex-shrink-0 text-green-600" />
                                              <span className="truncate text-xs">{file.name}</span>
                                              <span className="text-xs text-gray-400">({formatFileSize(file.size)})</span>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => removeEditingNewFile(index)}
                                              className="text-gray-400 hover:text-red-500"
                                            >
                                              <X className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    <div className="flex justify-between items-center">
                                      <div>
                                        <input
                                          type="file"
                                          id={`edit-file-${comment.id}`}
                                          multiple
                                          onChange={handleEditFileSelect}
                                          className="hidden"
                                        />
                                        <label htmlFor={`edit-file-${comment.id}`}>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="cursor-pointer"
                                            asChild
                                          >
                                            <span>
                                              <Paperclip className="w-3.5 h-3.5 mr-1" />
                                              파일 추가
                                            </span>
                                          </Button>
                                        </label>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={cancelEditComment}
                                        >
                                          <X className="w-4 h-4 mr-1" />
                                          취소
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={handleSaveComment}
                                          disabled={updateComment.isPending || deleteAttachment.isPending || commentFileUpload.isPending || !editingContent.trim()}
                                        >
                                          {(updateComment.isPending || deleteAttachment.isPending || commentFileUpload.isPending) ? (
                                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                          ) : (
                                            <Check className="w-4 h-4 mr-1" />
                                          )}
                                          저장
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  /* 보기 모드 */
                                  <>
                                    <div className="flex justify-between items-center mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-sm font-semibold ${!comment.author ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                                          {comment.author?.name || '삭제된 사용자'}
                                        </span>
                                        {comment.author?.role && comment.author.role !== 'client' && (
                                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                            담당자
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                          {format(new Date(comment.created_at), 'MM.dd HH:mm')}
                                        </span>
                                        {/* 본인이 작성한 코멘트만 수정/삭제 가능 */}
                                        {isMyComment && (
                                          <div className="flex gap-1">
                                            <button
                                              onClick={() => startEditComment(comment)}
                                              className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                              title="수정"
                                            >
                                              <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              onClick={() => handleDeleteComment(comment.id)}
                                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                                              title="삭제"
                                              disabled={deleteComment.isPending}
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                                    {/* 코멘트 첨부파일 */}
                                    {comment.attachments && comment.attachments.length > 0 && (
                                      <div className="mt-3 pt-2 border-t border-gray-100">
                                        <div className="flex flex-wrap gap-2">
                                          {comment.attachments.map((file) => (
                                            <button
                                              key={file.id}
                                              onClick={() => handleDownload(file.file_path, file.file_name)}
                                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 rounded border border-blue-200 text-xs text-blue-700 hover:bg-blue-100 transition-colors"
                                            >
                                              <Paperclip className="w-3 h-3" />
                                              <span className="max-w-[150px] truncate">{file.file_name}</span>
                                              <Download className="w-3 h-3" />
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )
                          })
                        )}
                      </div>

                      {/* 코멘트 작성 폼 */}
                      <div className="mt-4 pt-3 border-t border-blue-200">
                        <Textarea
                          placeholder="코멘트를 입력하세요..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          rows={2}
                          className="bg-white resize-none"
                        />

                        {/* 첨부파일 목록 */}
                        {commentFiles.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {commentFiles.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between bg-white px-3 py-2 rounded border text-sm"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <span className="truncate">{file.name}</span>
                                  <span className="text-xs text-gray-400 flex-shrink-0">
                                    ({formatFileSize(file.size)})
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeCommentFile(index)}
                                  className="text-gray-400 hover:text-red-500"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex justify-between items-center mt-3">
                          <div>
                            <input
                              type="file"
                              id="comment-file"
                              multiple
                              onChange={handleCommentFileSelect}
                              className="hidden"
                            />
                            <label htmlFor="comment-file">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="cursor-pointer"
                                asChild
                              >
                                <span>
                                  <Paperclip className="w-4 h-4 mr-1" />
                                  파일 첨부
                                </span>
                              </Button>
                            </label>
                          </div>
                          <Button
                            onClick={handleSubmitComment}
                            disabled={!newComment.trim() || isSubmittingComment}
                          >
                            {isSubmittingComment ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4 mr-2" />
                            )}
                            등록
                          </Button>
                        </div>
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
