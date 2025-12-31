'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  requestTypesService,
  platformsService,
  type RequestTypeInsert,
  type RequestTypeUpdate,
  type PlatformInsert,
  type PlatformUpdate,
} from '@/services/categories.service'

// 요청 유형 훅
export function useRequestTypes() {
  return useQuery({
    queryKey: ['requestTypes'],
    queryFn: () => requestTypesService.getAll(),
  })
}

export function useActiveRequestTypes() {
  return useQuery({
    queryKey: ['requestTypes', 'active'],
    queryFn: () => requestTypesService.getActive(),
  })
}

export function useCreateRequestType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (requestType: RequestTypeInsert) =>
      requestTypesService.create(requestType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requestTypes'] })
    },
  })
}

export function useUpdateRequestType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: RequestTypeUpdate }) =>
      requestTypesService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requestTypes'] })
    },
  })
}

export function useDeleteRequestType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => requestTypesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requestTypes'] })
    },
  })
}

// 플랫폼 훅
export function usePlatforms() {
  return useQuery({
    queryKey: ['platforms'],
    queryFn: () => platformsService.getAll(),
  })
}

export function useActivePlatforms() {
  return useQuery({
    queryKey: ['platforms', 'active'],
    queryFn: () => platformsService.getActive(),
  })
}

export function useCreatePlatform() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (platform: PlatformInsert) => platformsService.create(platform),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platforms'] })
    },
  })
}

export function useUpdatePlatform() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: PlatformUpdate }) =>
      platformsService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platforms'] })
    },
  })
}

export function useDeletePlatform() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => platformsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platforms'] })
    },
  })
}
