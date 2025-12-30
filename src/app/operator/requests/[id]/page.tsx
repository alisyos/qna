'use client'

export const dynamic = 'force-dynamic'

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
import { useComments, useCreateComment, useUpdateComment, useDeleteComment } from '@/hooks/useComments'
import { useAttachments, useSignedUrl, useCommentFileUpload, useDeleteAttachment } from '@/hooks/useFileUpload'
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
  Loader2,
  X,
  Pencil,
  Trash2,
  Check,
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
  const updateComment = useUpdateComment()
  const deleteComment = useDeleteComment()
  const getSignedUrl = useSignedUrl()
  const commentFileUpload = useCommentFileUpload()
  const deleteAttachment = useDeleteAttachment()

  const [newComment, setNewComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [commentFiles, setCommentFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 코멘트 수정 상태
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [editingIsInternal, setEditingIsInternal] = useState(false)
  const [editingNewFiles, setEditingNewFiles] = useState<File[]>([])
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<string[]>([])

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

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !user) return

    setIsSubmitting(true)
    try {
      // 1. 코멘트 생성
      const comment = await new Promise<{ id: string }>((resolve, reject) => {
        createComment.mutate({
          request_id: requestId,
          author_id: user.id,
          content: newComment.trim(),
          is_internal: isInternal,
        }, {
          onSuccess: (data) => resolve(data),
          onError: (error) => reject(error),
        })
      })

      // 2. 첨부파일 업로드
      if (commentFiles.length > 0) {
        for (const file of commentFiles) {
          await commentFileUpload.mutateAsync({
            file,
            requestId,
            commentId: comment.id,
            userId: user.id,
          })
        }
      }

      // 3. 상태 초기화
      setNewComment('')
      setIsInternal(false)
      setCommentFiles([])
    } catch (error) {
      console.error('코멘트 등록 실패:', error)
      alert('코멘트 등록에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCommentFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setCommentFiles(prev => [...prev, ...Array.from(e.target.files!)])
    }
    e.target.value = ''
  }

  const removeCommentFile = (index: number) => {
    setCommentFiles(prev => prev.filter((_, i) => i !== index))
  }

  // 코멘트 수정 시작
  const startEditComment = (comment: { id: string; content: string; is_internal: boolean }) => {
    setEditingCommentId(comment.id)
    setEditingContent(comment.content)
    setEditingIsInternal(comment.is_internal)
    setEditingNewFiles([])
    setDeletedAttachmentIds([])
  }

  // 코멘트 수정 취소
  const cancelEditComment = () => {
    setEditingCommentId(null)
    setEditingContent('')
    setEditingIsInternal(false)
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
    if (!editingCommentId || !editingContent.trim() || !user) return

    try {
      // 1. 코멘트 내용 수정
      await updateComment.mutateAsync({
        id: editingCommentId,
        content: editingContent.trim(),
        isInternal: editingIsInternal,
        requestId,
      })

      // 2. 삭제 표시된 첨부파일 삭제
      for (const attachmentId of deletedAttachmentIds) {
        const comment = comments.find(c => c.id === editingCommentId)
        const attachment = comment?.attachments?.find(a => a.id === attachmentId)
        if (attachment) {
          await deleteAttachment.mutateAsync({
            id: attachmentId,
            filePath: attachment.file_path,
            requestId,
          })
        }
      }

      // 3. 새 첨부파일 업로드
      for (const file of editingNewFiles) {
        await commentFileUpload.mutateAsync({
          file,
          requestId,
          commentId: editingCommentId,
          userId: user.id,
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
    if (!confirm('코멘트를 삭제하시겠습니까? 첨부파일도 함께 삭제됩니다.')) return

    try {
      await deleteComment.mutateAsync({ id: commentId, requestId })
    } catch (error) {
      console.error('코멘트 삭제 실패:', error)
      alert('코멘트 삭제에 실패했습니다.')
    }
  }

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const url = await getSignedUrl.mutateAsync({ filePath, fileName })
      window.open(url, '_blank')
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

              {/* 상태 변경 셀렉트박스 */}
              <div className="flex items-center gap-2">
                <Label className="text-sm text-gray-500 whitespace-nowrap">상태 변경:</Label>
                <Select
                  value={status}
                  onValueChange={(value) => handleStatusChange(value as RequestStatus)}
                  disabled={updateStatus.isPending}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">접수대기</SelectItem>
                    <SelectItem value="in_progress">처리중</SelectItem>
                    <SelectItem value="completed">완료</SelectItem>
                    <SelectItem value="on_hold">보류</SelectItem>
                  </SelectContent>
                </Select>
                {updateStatus.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
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
                        {editingCommentId === comment.id ? (
                          /* 수정 모드 */
                          <div className="space-y-3">
                            <Textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              rows={3}
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
                                    className="flex items-center justify-between px-2 py-1.5 bg-blue-50 rounded text-sm"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Paperclip className="w-3 h-3 flex-shrink-0 text-blue-600" />
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
                              <div className="flex items-center gap-3">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`edit-internal-${comment.id}`}
                                    checked={editingIsInternal}
                                    onCheckedChange={(checked) => setEditingIsInternal(checked as boolean)}
                                  />
                                  <Label htmlFor={`edit-internal-${comment.id}`} className="text-sm text-gray-600">
                                    내부 메모
                                  </Label>
                                </div>
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
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                  {format(parseISO(comment.created_at), 'MM.dd HH:mm')}
                                </span>
                                {/* 본인이 작성한 코멘트만 수정/삭제 가능 */}
                                {user && comment.author_id === user.id && (
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
                            <p className="text-sm text-gray-700">{comment.content}</p>
                            {/* 코멘트 첨부파일 */}
                            {comment.attachments && comment.attachments.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <div className="flex flex-wrap gap-2">
                                  {comment.attachments.map((file) => (
                                    <button
                                      key={file.id}
                                      onClick={() => handleDownload(file.file_path, file.file_name)}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded border text-xs text-gray-600 hover:bg-gray-50"
                                    >
                                      <Paperclip className="w-3 h-3" />
                                      <span className="max-w-[150px] truncate">{file.file_name}</span>
                                      <Download className="w-3 h-3 text-gray-400" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
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

                  {/* 첨부파일 목록 */}
                  {commentFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {commentFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded text-sm"
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
                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="internal"
                          checked={isInternal}
                          onCheckedChange={(checked) =>
                            setIsInternal(checked as boolean)
                          }
                        />
                        <Label htmlFor="internal" className="text-sm text-gray-600">
                          내부 메모
                        </Label>
                      </div>
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
                    </div>
                    <Button
                      onClick={handleCommentSubmit}
                      disabled={!newComment.trim() || isSubmitting}
                    >
                      {isSubmitting ? (
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
