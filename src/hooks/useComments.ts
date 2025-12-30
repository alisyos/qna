'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { commentsService } from '@/services/comments.service'
import type { Database } from '@/lib/supabase/database.types'

type CommentInsert = Database['public']['Tables']['request_comments']['Insert']

export function useComments(requestId: string | undefined) {
  return useQuery({
    queryKey: ['comments', requestId],
    queryFn: () => commentsService.getByRequestId(requestId!),
    enabled: !!requestId,
  })
}

export function useCreateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (comment: CommentInsert) => commentsService.create(comment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.request_id] })
    },
  })
}

export function useUpdateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, content, isInternal, requestId }: {
      id: string
      content: string
      isInternal: boolean
      requestId: string
    }) => commentsService.update(id, content, isInternal),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.requestId] })
    },
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, requestId }: { id: string; requestId: string }) =>
      commentsService.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.requestId] })
    },
  })
}
