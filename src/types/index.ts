// 요청 유형
export type RequestType =
  | 'budget_change'      // 예산 변경
  | 'keyword_add_delete' // 키워드 추가/삭제
  | 'ad_material_edit'   // 광고 소재 수정
  | 'targeting_change'   // 타겟팅 변경
  | 'report_request'     // 성과 리포트 요청
  | 'account_setting'    // 계정 설정 변경
  | 'other'              // 기타 문의

// 광고 플랫폼
export type AdPlatform =
  | 'naver'   // 네이버 검색광고
  | 'kakao'   // 카카오 키워드광고
  | 'google'  // 구글 Ads
  | 'other'   // 기타

// 긴급도
export type Priority =
  | 'normal'   // 일반
  | 'urgent'   // 긴급
  | 'critical' // 최우선

// 요청 상태
export type RequestStatus =
  | 'pending'     // 접수대기
  | 'in_progress' // 처리중
  | 'completed'   // 완료
  | 'on_hold'     // 보류

// 사용자 역할
export type UserRole =
  | 'client'   // 클라이언트 담당자
  | 'operator' // 광고 운영 담당자
  | 'admin'    // 관리자

// 클라이언트
export interface Client {
  id: string
  departmentName: string
  contactName: string
  email: string
  phone: string
  createdAt: string
  status: 'active' | 'inactive'
}

// 운영 담당자
export interface Operator {
  id: string
  name: string
  email: string
  role: UserRole
  department: string
  createdAt: string
  status: 'active' | 'inactive'
}

// 요청 건
export interface Request {
  id: string
  clientId: string
  clientName: string
  operatorId: string | null
  operatorName: string | null
  requestType: RequestType
  platform: AdPlatform
  priority: Priority
  title: string
  description: string
  desiredDate: string | null
  status: RequestStatus
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

// 코멘트
export interface RequestComment {
  id: string
  requestId: string
  authorId: string
  authorName: string
  authorType: 'client' | 'operator'
  content: string
  isInternal: boolean  // 내부 메모 여부
  createdAt: string
}

// 첨부파일
export interface RequestAttachment {
  id: string
  requestId: string
  fileName: string
  fileUrl: string
  fileSize: number
  uploadedBy: string
  createdAt: string
}

// 레이블 매핑
export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  budget_change: '예산 변경',
  keyword_add_delete: '키워드 추가/삭제',
  ad_material_edit: '광고 소재 수정',
  targeting_change: '타겟팅 변경',
  report_request: '성과 리포트 요청',
  account_setting: '계정 설정 변경',
  other: '기타 문의'
}

export const PLATFORM_LABELS: Record<AdPlatform, string> = {
  naver: '네이버 검색광고',
  kakao: '카카오 키워드광고',
  google: '구글 Ads',
  other: '기타'
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  normal: '일반',
  urgent: '긴급',
  critical: '최우선'
}

export const STATUS_LABELS: Record<RequestStatus, string> = {
  pending: '접수대기',
  in_progress: '처리중',
  completed: '완료',
  on_hold: '보류'
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  normal: 'bg-gray-100 text-gray-700',
  urgent: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700'
}

export const STATUS_COLORS: Record<RequestStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  on_hold: 'bg-gray-100 text-gray-700'
}
