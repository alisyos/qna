'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui'
import { REQUEST_TYPE_LABELS, PLATFORM_LABELS, PRIORITY_LABELS } from '@/types'
import type { RequestType, AdPlatform, Priority } from '@/types'
import { useAuthContext } from '@/components/layout/AuthProvider'
import { useCreateRequest } from '@/hooks/useRequests'
import { useFileUpload } from '@/hooks/useFileUpload'
import { Upload, X, CheckCircle, Loader2 } from 'lucide-react'

const requestSchema = z.object({
  requestType: z.string().min(1, '요청 유형을 선택해주세요'),
  platform: z.string().min(1, '광고 플랫폼을 선택해주세요'),
  priority: z.string().min(1, '긴급도를 선택해주세요'),
  title: z.string().min(1, '제목을 입력해주세요').max(100, '제목은 100자 이내로 입력해주세요'),
  description: z.string().min(10, '상세 내용은 최소 10자 이상 입력해주세요'),
  desiredDate: z.string().optional(),
})

type RequestFormData = z.infer<typeof requestSchema>

export default function NewRequestPage() {
  const router = useRouter()
  const { client, user } = useAuthContext()
  const createRequest = useCreateRequest()
  const fileUpload = useFileUpload()

  const [files, setFiles] = useState<File[]>([])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      priority: 'normal',
    },
  })

  const selectedPriority = watch('priority')

  const onSubmit = async (data: RequestFormData) => {
    if (!client?.id) {
      alert('클라이언트 정보를 찾을 수 없습니다.')
      return
    }

    try {
      // 요청 생성
      const newRequest = await createRequest.mutateAsync({
        client_id: client.id,
        request_type: data.requestType as RequestType,
        platform: data.platform as AdPlatform,
        priority: data.priority as Priority,
        title: data.title,
        description: data.description,
        desired_date: data.desiredDate || null,
      })

      // 파일 업로드 (있는 경우)
      if (files.length > 0 && user) {
        setIsUploading(true)
        for (const file of files) {
          await fileUpload.mutateAsync({
            file,
            requestId: newRequest.id,
            userId: user.id,
          })
        }
        setIsUploading(false)
      }

      // 성공 상태로 변경
      setIsSubmitted(true)
    } catch (error) {
      console.error('요청 등록 실패:', error)
      alert('요청 등록에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 클라이언트 정보가 없는 경우
  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">클라이언트 정보를 찾을 수 없습니다.</p>
          <p className="text-sm text-gray-500">관리자에게 문의해주세요.</p>
        </div>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">요청이 등록되었습니다</h2>
                <p className="text-gray-600 mb-6">
                  담당자 배정 후 처리가 진행될 예정입니다.<br />
                  진행 상황은 요청 현황 페이지에서 확인하실 수 있습니다.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => {
                    setIsSubmitted(false)
                    setFiles([])
                  }}>
                    추가 요청 등록
                  </Button>
                  <Button onClick={() => router.push('/client/requests')}>
                    요청 현황 보기
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">요청 등록</h1>
          <p className="text-gray-600 mt-1">광고 운영 관련 요청사항을 등록해 주세요.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>요청 정보 입력</CardTitle>
            <CardDescription>
              * 표시된 항목은 필수 입력 사항입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 요청 유형 */}
              <div className="space-y-2">
                <Label htmlFor="requestType">
                  요청 유형 <span className="text-red-500">*</span>
                </Label>
                <Select onValueChange={(value) => setValue('requestType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="요청 유형을 선택해주세요" />
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
                {errors.requestType && (
                  <p className="text-sm text-red-500">{errors.requestType.message}</p>
                )}
              </div>

              {/* 광고 플랫폼 */}
              <div className="space-y-2">
                <Label htmlFor="platform">
                  광고 플랫폼 <span className="text-red-500">*</span>
                </Label>
                <Select onValueChange={(value) => setValue('platform', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="광고 플랫폼을 선택해주세요" />
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
                {errors.platform && (
                  <p className="text-sm text-red-500">{errors.platform.message}</p>
                )}
              </div>

              {/* 긴급도 */}
              <div className="space-y-3">
                <Label>
                  긴급도 <span className="text-red-500">*</span>
                </Label>
                <RadioGroup
                  defaultValue="normal"
                  onValueChange={(value) => setValue('priority', value)}
                  className="flex gap-4"
                >
                  {(Object.entries(PRIORITY_LABELS) as [Priority, string][]).map(
                    ([value, label]) => (
                      <div key={value} className="flex items-center space-x-2">
                        <RadioGroupItem value={value} id={value} />
                        <Label
                          htmlFor={value}
                          className={`cursor-pointer ${
                            selectedPriority === value
                              ? value === 'critical'
                                ? 'text-red-600 font-medium'
                                : value === 'urgent'
                                ? 'text-orange-600 font-medium'
                                : 'text-gray-900 font-medium'
                              : 'text-gray-600'
                          }`}
                        >
                          {label}
                        </Label>
                      </div>
                    )
                  )}
                </RadioGroup>
                {errors.priority && (
                  <p className="text-sm text-red-500">{errors.priority.message}</p>
                )}
              </div>

              {/* 제목 */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  제목 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="요청 제목을 입력해주세요"
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              {/* 상세 내용 */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  상세 내용 <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="요청 내용을 상세히 입력해주세요"
                  rows={6}
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description.message}</p>
                )}
              </div>

              {/* 희망 처리 일시 */}
              <div className="space-y-2">
                <Label htmlFor="desiredDate">희망 처리 일시</Label>
                <Input
                  id="desiredDate"
                  type="date"
                  {...register('desiredDate')}
                />
              </div>

              {/* 파일 첨부 */}
              <div className="space-y-2">
                <Label>파일 첨부</Label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      파일을 드래그하거나 클릭하여 업로드
                    </p>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>파일 선택</span>
                      </Button>
                    </label>
                  </div>
                </div>
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({formatFileSize(file.size)})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 제출 버튼 */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.back()}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting || createRequest.isPending || isUploading}
                >
                  {(isSubmitting || createRequest.isPending || isUploading) ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      {isUploading ? '파일 업로드 중...' : '등록 중...'}
                    </>
                  ) : (
                    '요청 등록'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
