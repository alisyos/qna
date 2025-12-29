'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { operatorsService } from '@/services/operators.service'
import type { Database } from '@/lib/supabase/database.types'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export function useOperators() {
  return useQuery({
    queryKey: ['operators'],
    queryFn: () => operatorsService.getAll(),
  })
}

export function useOperator(id: string | undefined) {
  return useQuery({
    queryKey: ['operators', id],
    queryFn: () => operatorsService.getById(id!),
    enabled: !!id,
  })
}

export function useUpdateOperator() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: ProfileUpdate }) =>
      operatorsService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['operators'] })
      queryClient.invalidateQueries({ queryKey: ['operators', data.id] })
    },
  })
}

export function useDeleteOperator() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => operatorsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operators'] })
    },
  })
}
