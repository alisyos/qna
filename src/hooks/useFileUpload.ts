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

export function useDeleteAttachment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, filePath, requestId }: { id: string; filePath: string; requestId: string }) =>
      storageService.deleteAttachment(id, filePath),
    onSuccess: (_, { requestId }) => {
      queryClient.invalidateQueries({ queryKey: ['attachments', requestId] })
    },
  })
}

export function useSignedUrl() {
  return useMutation({
    mutationFn: (filePath: string) => storageService.getSignedUrl(filePath),
  })
}
