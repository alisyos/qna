'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { requestsService } from '@/services/requests.service'
import type { Database } from '@/lib/supabase/database.types'

type RequestInsert = Database['public']['Tables']['requests']['Insert']
type RequestUpdate = Database['public']['Tables']['requests']['Update']

export function useRequests() {
  return useQuery({
    queryKey: ['requests'],
    queryFn: () => requestsService.getAll(),
  })
}

export function useRequest(id: string) {
  return useQuery({
    queryKey: ['requests', id],
    queryFn: () => requestsService.getById(id),
    enabled: !!id,
  })
}

export function useClientRequests(clientId: string | undefined) {
  return useQuery({
    queryKey: ['requests', 'client', clientId],
    queryFn: () => requestsService.getByClientId(clientId!),
    enabled: !!clientId,
  })
}

export function useCreateRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: RequestInsert) => requestsService.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}

export function useUpdateRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: RequestUpdate }) =>
      requestsService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
      queryClient.invalidateQueries({ queryKey: ['requests', data.id] })
    },
  })
}

export function useUpdateRequestStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'pending' | 'in_progress' | 'completed' | 'on_hold' }) =>
      requestsService.updateStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
      queryClient.invalidateQueries({ queryKey: ['requests', data.id] })
    },
  })
}

export function useAssignOperator() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, operatorId }: { id: string; operatorId: string }) =>
      requestsService.assignOperator(id, operatorId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
      queryClient.invalidateQueries({ queryKey: ['requests', data.id] })
    },
  })
}

export function useDeleteRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => requestsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}
