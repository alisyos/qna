'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { storageService } from '@/services/storage.service'

export function useAttachments(requestId: string | undefined) {
  return useQuery({
    queryKey: ['attachments', requestId],
    queryFn: () => storageService.getAttachmentsByRequestId(requestId!),
    enabled: !!requestId,
  })
}

export function useCommentAttachments(commentId: string | undefined) {
  return useQuery({
    queryKey: ['commentAttachments', commentId],
    queryFn: () => storageService.getAttachmentsByCommentId(commentId!),
    enabled: !!commentId,
  })
}

export function useFileUpload() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      file,
      requestId,
      userId,
    }: {
      file: File
      requestId: string
      userId: string
    }) => {
      // Upload to storage
      const filePath = await storageService.uploadFile(file, requestId, userId)

      // Create attachment record
      const attachment = await storageService.createAttachmentRecord({
        request_id: requestId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: userId,
      })

      return attachment
    },
    onSuccess: (_, { requestId }) => {
      queryClient.invalidateQueries({ queryKey: ['attachments', requestId] })
    },
  })
}

export function useCommentFileUpload() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      file,
      requestId,
      commentId,
      userId,
    }: {
      file: File
      requestId: string
      commentId: string
      userId: string
    }) => {
      // Upload to storage
      const filePath = await storageService.uploadFile(file, requestId, userId)

      // Create attachment record with comment_id
      const attachment = await storageService.createAttachmentRecord({
        request_id: requestId,
        comment_id: commentId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: userId,
      })

      return attachment
    },
    onSuccess: (_, { commentId }) => {
      queryClient.invalidateQueries({ queryKey: ['commentAttachments', commentId] })
      queryClient.invalidateQueries({ queryKey: ['comments'] })
    },
  })
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, filePath, requestId }: { id: string; filePath: string; requestId: string }) =>
      storageService.deleteAttachment(id, filePath),
    onSuccess: (_, { requestId }) => {
      console.log('useDeleteAttachment onSuccess - invalidating cache for requestId:', requestId)
      // 캐시 즉시 무효화 및 refetch
      queryClient.invalidateQueries({ queryKey: ['attachments', requestId] })
      queryClient.refetchQueries({ queryKey: ['attachments', requestId] })
    },
  })
}

export function useSignedUrl() {
  return useMutation({
    mutationFn: ({ filePath, fileName }: { filePath: string; fileName?: string }) =>
      storageService.getSignedUrl(filePath, fileName),
  })
}
