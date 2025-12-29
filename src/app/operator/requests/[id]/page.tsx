'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  Label,
} from '@/components/ui'
import {
  REQUEST_TYPE_LABELS,
  PLATFORM_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  PRIORITY_COLORS,
  STATUS_COLORS,
} from '@/types'
import type { RequestStatus } from '@/types'
import { useAuthContext } from '@/components/layout/AuthProvider'
import { useRequest, useUpdateRequestStatus, useAssignOperator } from '@/hooks/useRequests'
import { useComments, useCreateComment } from '@/hooks/useComments'
import { useAttachments, useSignedUrl } from '@/hooks/useFileUpload'
import { useOperators } from '@/hooks/useOperators'
import {
  ArrowLeft,
  Calendar,
  User,
  Building,
  MessageSquare,
  Paperclip,
  Download,
  Send,
  CheckCircle,
  Clock,
  Pause,
  Loader2,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function RequestDetailPage() {
  const params = useParams()
  const requestId = params.id as string
  const { user } = useAuthContext()

  const { data: request, isLoading } = useRequest(requestId)
  const { data: comments = [] } = useComments(requestId)
  const { data: attachments = [] } = useAttachments(requestId)
  const { data: operators = [] } = useOperators()

  const updateStatus = useUpdateRequestStatus()
  const assignOperator = useAssignOperator()
  const createComment = useCreateComment()
  const getSignedUrl = useSignedUrl()

  const [newComment, setNewComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-gray-500">요청을 찾을 수 없습니다.</p>
          <Link href="/operator/requests">
            <Button variant="outline" className="mt-4">
              목록으로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleStatusChange = (newStatus: RequestStatus) => {
    updateStatus.mutate({ id: requestId, status: newStatus })
  }

  const handleAssignOperator = (operatorId: string) => {
    assignOperator.mutate({ id: requestId, operatorId })
  }

  const handleCommentSubmit = () => {
    if (!newComment.trim() || !user) return

    createComment.mutate({
      request_id: requestId,
      author_id: user.id,
      content: newComment.trim(),
      is_internal: isInternal,
    }, {
      onSuccess: () => {
        setNewComment('')
        setIsInternal(false)
      }
    })
  }

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const url = await getSignedUrl.mutateAsync(filePath)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const status = request.status

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 뒤로가기 */}
        <Link
          href="/operator/requests"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          요청 목록으로
        </Link>

        {/* 헤더 카드 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-sm text-gray-500">
                    {request.request_number}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      PRIORITY_COLORS[request.priority]
                    }`}
                  >
                    {PRIORITY_LABELS[request.priority]}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      STATUS_COLORS[status]
                    }`}
                  >
                    {STATUS_LABELS[status]}
                  </span>
                </div>
                <CardTitle className="text-xl">{request.title}</CardTitle>
                <CardDescription className="mt-2">
                  {format(parseISO(request.created_at), 'yyyy년 M월 d일 HH:mm', {
                    locale: ko,
                  })}{' '}
                  등록
                </CardDescription>
              </div>

              {/* 상태 변경 버튼 */}
              <div className="flex gap-2">
                {status === 'pending' && (
                  <Button
                    onClick={() => handleStatusChange('in_progress')}
                    disabled={updateStatus.isPending}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    처리 시작
                  </Button>
                )}
                {status === 'in_progress' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange('on_hold')}
                      disabled={updateStatus.isPending}
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      보류
                    </Button>
                    <Button
                      onClick={() => handleStatusChange('completed')}
                      disabled={updateStatus.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      완료 처리
                    </Button>
                  </>
                )}
                {status === 'on_hold' && (
                  <Button
                    onClick={() => handleStatusChange('in_progress')}
                    disabled={updateStatus.isPending}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    처리 재개
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-3 gap-6">
          {/* 좌측: 요청 정보 */}
          <div className="col-span-2 space-y-6">
            {/* 요청 상세 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">요청 내용</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {request.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 첨부파일 */}
            {attachments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    첨부파일
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {attachments.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">{file.file_name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.file_size)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(file.file_path, file.file_name)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 코멘트 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  코멘트
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* 코멘트 목록 */}
                <div className="space-y-4 mb-6">
                  {comments.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">
                      아직 코멘트가 없습니다.
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`p-4 rounded-lg ${
                          comment.is_internal
                            ? 'bg-yellow-50 border border-yellow-200'
                            : comment.author?.role === 'client'
                            ? 'bg-blue-50 ml-8'
                            : 'bg-gray-50 mr-8'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {comment.author?.name || '알 수 없음'}
                            </span>
                            {comment.author?.role !== 'client' && (
                              <span className="text-xs text-gray-500">
                                (담당자)
                              </span>
                            )}
                            {comment.is_internal && (
                              <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
                                내부 메모
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {format(parseISO(comment.created_at), 'MM.dd HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* 코멘트 입력 */}
                <div className="border-t pt-4">
                  <Textarea
                    placeholder="코멘트를 입력해주세요..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="internal"
                        checked={isInternal}
                        onCheckedChange={(checked) =>
                          setIsInternal(checked as boolean)
                        }
                      />
                      <Label htmlFor="internal" className="text-sm text-gray-600">
                        내부 메모 (클라이언트에게 표시되지 않음)
                      </Label>
                    </div>
                    <Button
                      onClick={handleCommentSubmit}
                      disabled={!newComment.trim() || createComment.isPending}
                    >
                      {createComment.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      등록
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 우측: 요청 정보 */}
          <div className="space-y-6">
            {/* 클라이언트 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  클라이언트
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{request.client?.department_name || '-'}</p>
                <p className="text-sm text-gray-500">{request.client?.contact_name || '-'}</p>
              </CardContent>
            </Card>

            {/* 요청 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">요청 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">요청 유형</p>
                  <p className="font-medium">
                    {REQUEST_TYPE_LABELS[request.request_type]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">플랫폼</p>
                  <p className="font-medium">
                    {PLATFORM_LABELS[request.platform]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">희망 처리일</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {request.desired_date
                      ? format(parseISO(request.desired_date), 'yyyy년 M월 d일', {
                          locale: ko,
                        })
                      : '-'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 담당자 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-4 h-4" />
                  담당자
                </CardTitle>
              </CardHeader>
              <CardContent>
                {request.operator?.name ? (
                  <div>
                    <p className="font-medium">{request.operator.name}</p>
                    <p className="text-sm text-gray-500">{request.operator.department || '광고운영팀'}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-400 mb-3">담당자 미배정</p>
                    <Select onValueChange={handleAssignOperator}>
                      <SelectTrigger>
                        <SelectValue placeholder="담당자 배정" />
                      </SelectTrigger>
                      <SelectContent>
                        {operators
                          .filter((op) => op.role === 'operator')
                          .map((op) => (
                            <SelectItem key={op.id} value={op.id}>
                              {op.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 처리 이력 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">처리 이력</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-gray-400 mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">요청 등록</p>
                      <p className="text-xs text-gray-500">
                        {format(parseISO(request.created_at), 'MM.dd HH:mm')}
                      </p>
                    </div>
                  </div>
                  {request.updated_at !== request.created_at && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-400 mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">상태 업데이트</p>
                        <p className="text-xs text-gray-500">
                          {format(parseISO(request.updated_at), 'MM.dd HH:mm')}
                        </p>
                      </div>
                    </div>
                  )}
                  {request.completed_at && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-400 mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">처리 완료</p>
                        <p className="text-xs text-gray-500">
                          {format(parseISO(request.completed_at), 'MM.dd HH:mm')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
