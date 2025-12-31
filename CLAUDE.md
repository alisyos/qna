# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 참고할 가이드를 제공합니다.

## 언어 설정
**중요**: Claude는 이 프로젝트에서 모든 답변과 커뮤니케이션을 한국어로 해야 합니다.

## 프로젝트 개요

**키워드 광고 대행 클라이언트 요청 관리 시스템**입니다.
키워드 광고 운영 대행 업무 수행 시 다수의 클라이언트 담당자로부터 발생하는 문의 및 요청 사항을 체계적으로 접수·추적·처리하기 위한 웹 기반 관리 시스템입니다.

### 주요 기능
- **클라이언트 포털**: 요청 등록/수정, 요청 현황 조회, 코멘트 작성/수정/삭제
- **운영 담당자 페이지**: 대시보드(홈), 요청 처리, 코멘트 작성, 새 코멘트 알림
- **관리자 페이지**: 통계/리포트, 시스템 관리(클라이언트/담당자 계정 관리)

### 사용자 역할 및 접근 제어
| 구분 | 역할 | 주요 기능 | 접근 가능 메뉴 |
|------|------|----------|---------------|
| 클라이언트 담당자 | 요청 등록자 | 문의/요청 등록/수정, 진행 상황 확인, 완료 확인 | 요청 등록, 요청 현황 |
| 광고 운영 담당자 | 처리자 | 요청 접수, 처리, 상태 업데이트, 코멘트 작성 | 대시보드, 요청 처리 |
| 관리자 | 시스템 관리 | 담당자 배정, 통계 확인, 계정 관리, 권한 설정 | 대시보드, 요청 처리, 통계, 시스템 관리 |

**역할별 기본 페이지**:
- 클라이언트: `/client/requests` (요청 현황)
- 운영 담당자/관리자: `/` (대시보드)

## 개발 명령어

```bash
# 개발 서버 시작
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm start

# 린팅 실행
npm run lint
```

개발 서버는 http://localhost:3000 에서 실행됩니다.

## 아키텍처 및 핵심 패턴

### 기술 스택
- **Core**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **백엔드/DB**: Supabase (PostgreSQL, Auth, Storage)
- **데이터 페칭**: TanStack Query (React Query)
- **UI 컴포넌트**: Radix UI 기반 커스텀 컴포넌트
- **아이콘**: Lucide React
- **폰트**: Pretendard (한국어 타이포그래피)
- **상태관리**: useState (로컬), React Query (서버 상태)
- **폼**: React Hook Form + Zod 검증
- **날짜 처리**: date-fns
- **스타일링 유틸리티**: clsx, tailwind-merge, class-variance-authority

### 레이아웃 구조
- **사이드바 레이아웃**: 왼쪽 고정 사이드바 (230px) + 메인 콘텐츠 + 푸터
- **로고**: `public/logo.jpg` (AIWEB 로고, 126x35px)
- **사이드바 컴포넌트**: `src/components/layout/sidebar.tsx`
  - 비밀번호 변경 기능 (열쇠 아이콘)
- **푸터 컴포넌트**: `src/components/layout/footer.tsx`
  - 회사 정보, 개인정보 처리방침 팝업
- **인증 프로바이더**: `src/components/layout/AuthProvider.tsx`
- **메뉴 구조**: 역할에 따라 다른 메뉴 표시
  - 클라이언트: 요청 등록, 요청 현황
  - 운영 담당자: 대시보드, 요청 처리
  - 관리자: 대시보드, 요청 처리, 통계, 시스템 관리

### 폴더 구조
```
src/
├── app/                           # Next.js App Router 페이지들
│   ├── page.tsx                   # 홈 (대시보드) - 클라이언트는 /client/requests로 리다이렉트
│   ├── login/page.tsx             # 로그인 페이지
│   ├── api/admin/                 # 관리자 API 라우트
│   │   ├── clients/route.ts       # 클라이언트 생성 API
│   │   ├── operators/route.ts     # 담당자 생성 API
│   │   └── users/password/route.ts # 비밀번호 변경 API
│   ├── client/                    # 클라이언트 포털
│   │   ├── request/new/page.tsx   # 요청 등록
│   │   └── requests/page.tsx      # 요청 현황 (상세 보기/수정 포함)
│   ├── operator/                  # 운영 담당자
│   │   ├── requests/page.tsx      # 요청 처리 목록
│   │   └── requests/[id]/page.tsx # 요청 상세/처리
│   └── admin/                     # 관리자
│       ├── statistics/page.tsx    # 통계
│       └── settings/page.tsx      # 시스템 관리 (클라이언트/담당자 계정 관리)
├── components/
│   ├── ui/                        # Radix UI 기반 커스텀 컴포넌트
│   └── layout/
│       ├── sidebar.tsx            # 사이드바 네비게이션 (역할별 메뉴 필터링, 비밀번호 변경)
│       ├── footer.tsx             # 푸터 (회사 정보, 개인정보 처리방침)
│       └── AuthProvider.tsx       # 인증 상태 관리 (isLoading 포함)
├── lib/
│   ├── utils.ts                   # 유틸리티 함수 (cn)
│   └── supabase/
│       ├── client.ts              # 브라우저용 Supabase 클라이언트
│       ├── server.ts              # 서버용 Supabase 클라이언트
│       ├── admin.ts               # Admin 클라이언트 (service role key)
│       └── database.types.ts      # Supabase 타입 정의
├── services/                      # 데이터 서비스 레이어
│   ├── auth.service.ts            # 인증 관련
│   ├── requests.service.ts        # 요청 CRUD
│   ├── comments.service.ts        # 코멘트 CRUD
│   ├── clients.service.ts         # 클라이언트 CRUD
│   ├── operators.service.ts       # 담당자 CRUD
│   └── storage.service.ts         # 파일 업로드/다운로드
├── hooks/                         # React Query 훅
│   ├── useAuth.ts
│   ├── useRequests.ts             # useUpdateRequest 포함
│   ├── useComments.ts
│   ├── useClients.ts
│   ├── useOperators.ts
│   └── useFileUpload.ts
├── providers/
│   └── QueryProvider.tsx          # React Query 프로바이더
└── types/
    └── index.ts                   # TypeScript 타입 정의
```

## Supabase 연동 현황

### 환경 변수 (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 데이터베이스 테이블
- `profiles` - 사용자 프로필 (auth.users 확장)
- `clients` - 클라이언트 정보 (user_id로 profiles와 연결, assigned_operator_id로 기본 담당자 배정)
- `requests` - 요청 건
- `request_comments` - 코멘트 (author_id는 NULL 허용 - 삭제된 사용자 대응)
- `request_attachments` - 첨부파일 (uploaded_by는 NULL 허용 - 삭제된 사용자 대응)

### 인증 플로우
1. 로그인: `authService.signIn()` → Supabase Auth
2. 세션 확인: `AuthProvider`에서 `onAuthStateChange` 리스너로 처리
3. 프로필 조회: `authService.getProfile()` (REST API 직접 호출)
4. 클라이언트 역할인 경우: `clientsService.getByUserId()` 추가 조회
5. 역할별 리다이렉트: 클라이언트는 `/client/requests`로, 그 외는 `/`로

### 관리자 API 라우트
| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/api/admin/clients` | POST | 클라이언트 계정 생성 (Auth + Profile + Client) |
| `/api/admin/operators` | POST | 담당자 계정 생성 (Auth + Profile) |
| `/api/admin/users/password` | POST | 사용자 비밀번호 변경 |

**API 인증**: Bearer 토큰 (Authorization 헤더)
```typescript
const accessToken = (await supabase.auth.getSession()).data.session?.access_token
fetch('/api/admin/clients', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
})
```

## 중요 기술 노트

### 세션 초기화 타이밍 문제
**문제**: AuthProvider에서 Supabase 클라이언트를 사용한 쿼리가 세션 초기화 전에 호출되면 무한 대기 상태 발생

**해결책**: 인증 초기화 시점의 쿼리는 REST API 직접 호출 사용
```typescript
// authService.getProfile() - REST API 직접 호출
const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`
const response = await fetch(url, {
  headers: {
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
  },
})
```

**영향 범위**:
- `src/services/auth.service.ts` - `getProfile()` 함수
- `src/services/clients.service.ts` - `getByUserId()` 함수

### Supabase 타입 캐스팅
Supabase insert/update 시 타입 에러 발생하면 `as never` 캐스팅 사용:
```typescript
await supabase.from('profiles').insert({ ...data } as never)
```

### API 라우트에서 인증
서버사이드에서는 쿠키가 아닌 헤더로 토큰 전달:
```typescript
// API Route
const authHeader = request.headers.get('authorization')
const accessToken = authHeader?.substring(7) // "Bearer " 제거
const { data: { user } } = await adminClient.auth.getUser(accessToken)
```

## 데이터 모델

### 주요 타입 (`src/types/index.ts`)

```typescript
// 요청 유형
type RequestType = 'budget_change' | 'keyword_add_delete' | 'ad_material_edit' |
                   'targeting_change' | 'report_request' | 'account_setting' | 'other'

// 광고 플랫폼
type AdPlatform = 'naver' | 'kakao' | 'google' | 'other'

// 긴급도
type Priority = 'normal' | 'urgent' | 'critical'

// 요청 상태
type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'on_hold'

// 사용자 역할
type UserRole = 'admin' | 'operator' | 'client'
```

## 페이지별 기능

### 홈/대시보드 (`/`)
- 운영 담당자/관리자 전용 (클라이언트는 자동 리다이렉트)
- 오늘 접수, 접수대기, 처리중, 기한 임박 통계 카드
- **처리 기한 임박 요청** (24시간 이내 희망 처리일)
- **새 코멘트가 있는 요청** (최근 3일 이내 클라이언트 코멘트)
- 긴급도별 접수대기 요청 현황
- 내 담당 요청 목록 (처리중인 요청)

### 요청 처리 페이지 (`/operator/requests`)
- **필터링**: 유형, 플랫폼, 긴급도, 상태, 담당자 셀렉트 박스
- **검색**: 요청번호, 제목, 클라이언트명(부서명, 이름) 통합 검색
- **정렬**: 등록일, 희망 처리일 기준 정렬
- **테이블 컬럼**: 제목(코멘트 수 + NEW 배지), 클라이언트, 유형, 플랫폼, 긴급도, 상태, 등록일, 희망처리일, 담당자, 액션(삭제)
- **새 코멘트 표시**: 24시간 이내 클라이언트 코멘트 시 NEW 배지

### 클라이언트 포털
- `/client/request/new`: 요청 등록 (파일 첨부 포함)
- `/client/requests`: 본인 요청 목록 조회
  - **테이블 컬럼**: 제목(코멘트 수), 유형, 플랫폼, 긴급도, 상태, 등록일, 희망처리일, 상세
  - **정렬**: 등록일, 희망 처리일 기준 정렬
  - 상세 보기 다이얼로그
  - 요청 수정 기능 (접수대기 상태일 때만 가능)
  - **코멘트 작성/수정/삭제** (본인 코멘트만)
  - 코멘트에 파일 첨부 가능

### 운영 담당자 페이지
- `/operator/requests/[id]`: 요청 상세/처리, 코멘트 작성, 담당자 변경 가능

### 관리자 페이지
- `/admin/statistics`: 통계 (클라이언트별 요청 빈도에서 작성자 이름 표시)
- `/admin/settings`: 시스템 관리 (클라이언트/담당자 계정 관리)

### 시스템 관리 (`/admin/settings`)
- **클라이언트 관리**: 추가/수정/삭제, 비밀번호 변경, 담당자 배정
- **담당자 관리**: 추가/수정/삭제, 비밀번호 변경
- 계정 생성 시 Auth 사용자 + Profile + (Client) 레코드 동시 생성
- 클라이언트별 담당자 배정 시 해당 클라이언트의 요청이 자동으로 담당자에게 배정됨

## UI 컴포넌트 사용법

### 컴포넌트 임포트
```typescript
import {
  Button,
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Input, Label, Textarea,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  RadioGroup, RadioGroupItem,
  Checkbox,
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui'
```

### 레이블 매핑 사용
```typescript
import {
  REQUEST_TYPE_LABELS, PLATFORM_LABELS, PRIORITY_LABELS, STATUS_LABELS,
  PRIORITY_COLORS, STATUS_COLORS,
} from '@/types'
```

### Select 컴포넌트 스타일
- 드롭다운 배경: `bg-white` (불투명 흰색)

## 개발 가이드라인

### 사용해야 할 것
- ✅ Supabase 클라이언트를 통한 데이터 조회/수정
- ✅ React Query 훅을 통한 서버 상태 관리
- ✅ `src/components/ui/`의 Radix UI 기반 커스텀 컴포넌트
- ✅ 스타일링을 위한 Tailwind CSS
- ✅ 폼을 위한 React Hook Form + Zod

### 주의사항
- ⚠️ AuthProvider 내부에서 Supabase 클라이언트 쿼리 사용 시 세션 타이밍 문제 주의
- ⚠️ 관리자 API는 반드시 Bearer 토큰 인증 사용
- ⚠️ Supabase 타입 에러 시 `as never` 캐스팅 고려
- ⚠️ 요청 수정은 접수대기(pending) 상태에서만 가능
- ⚠️ 코멘트 수정/삭제는 본인 작성 코멘트만 가능

### 미적용 마이그레이션 (Supabase SQL Editor에서 실행 필요)
아래 마이그레이션 파일들이 생성되어 있으며, Supabase에 적용해야 합니다:

1. **`supabase/migrations/20241230_fix_cascade_delete.sql`**
   - 코멘트/첨부파일의 외래 키를 ON DELETE SET NULL로 변경
   - 계정 삭제 시 데이터 보존

2. **`supabase/migrations/20241230_add_assigned_operator.sql`**
   - clients 테이블에 assigned_operator_id 필드 추가
   - 클라이언트별 담당자 자동 배정 기능

### 구현 완료 후 필수 검증
```bash
npm run build
```
TypeScript 오류, ESLint 오류, 컴파일 오류 등을 사전에 발견하고 해결해야 합니다.

## 변경 이력

### 2024-12-31 업데이트
- ✅ **대시보드 개선**
  - "미처리 요청 현황" → "접수대기 요청 현황"으로 명칭 변경
  - "오늘 접수된 요청" 리스트 제거 (요청 처리 페이지와 중복)
  - 순서 재배치: 요약 카드 > 처리 기한 임박 요청 > 새 코멘트가 있는 요청 > 접수대기 현황 & 내 담당 요청
  - "새 코멘트가 있는 요청" 섹션 추가 (최근 3일 이내 클라이언트 코멘트, 전체 요청 대상)
  - 클라이언트 표시를 부서명에서 작성자 이름(contact_name)으로 변경
- ✅ **요청 처리 페이지 개선** (`/operator/requests`)
  - 필터링 기능 개선: 유형, 플랫폼, 긴급도, 상태, 담당자 셀렉트 박스
  - 통합 검색: 요청번호, 제목, 클라이언트명(부서명, 이름)
  - 요청번호 컬럼 삭제, 희망 처리일 컬럼 추가
  - 제목에 코멘트 수 표시 (24시간 이내 클라이언트 코멘트 시 NEW 배지)
  - 등록일, 희망 처리일 기준 정렬 기능 추가
  - 요청 삭제 기능 추가 (확인 다이얼로그 포함)
- ✅ **클라이언트 요청 현황 페이지 개선** (`/client/requests`)
  - 요청번호 컬럼 삭제, 희망 처리일 컬럼 추가
  - 제목에 코멘트 수 표시
  - 등록일, 희망 처리일 기준 정렬 기능 추가
  - 요청유형, 플랫폼 컬럼 너비 확대 (80px → 100px)
- ✅ **클라이언트 코멘트 기능 추가**
  - 클라이언트도 코멘트 작성 가능
  - 코멘트에 파일 첨부 가능
  - 본인 코멘트 수정/삭제 가능
- ✅ **통계 페이지 수정** (`/admin/statistics`)
  - 클라이언트별 요청 빈도에서 부서명 대신 작성자 이름 표시
- ✅ **비밀번호 변경 기능** (본인 계정)
  - 사이드바에 열쇠 아이콘으로 비밀번호 변경 기능 추가
  - 새 비밀번호 2번 입력으로 휴먼 에러 방지
- ✅ **푸터 추가** (`src/components/layout/footer.tsx`)
  - 회사 정보 표시 (상호, 대표, 사업자번호, 주소, 연락처)
  - 개인정보 처리방침 팝업

### 2024-12-30 업데이트 (2차)
- ✅ 요청 처리 상세 페이지에서 담당자 변경 기능 추가 (배정 후에도 다른 담당자로 변경 가능)
- ✅ 계정 삭제 시 데이터 보존 개선
  - `request_comments.author_id`: ON DELETE CASCADE → SET NULL
  - `request_attachments.uploaded_by`: ON DELETE CASCADE → SET NULL
  - 삭제된 사용자의 코멘트/첨부파일은 "삭제된 사용자"로 표시
- ✅ 클라이언트별 담당자 배정 기능 추가
  - `clients` 테이블에 `assigned_operator_id` 필드 추가
  - 시스템 관리 페이지에서 클라이언트별 담당자 배정/변경 가능
  - 클라이언트 수정 다이얼로그에 담당자 선택 필드 추가
- ✅ 요청 생성 시 담당자 자동 배정 (클라이언트에 배정된 담당자가 자동으로 설정됨)
- ✅ 담당자 목록에서 활성 상태인 담당자만 선택 가능하도록 필터링

### 2024-12-30 업데이트 (1차)
- ✅ 요청 처리 상세 페이지 상태 변경을 셀렉트박스로 변경 (자유롭게 상태 전환 가능)
- ✅ 코멘트에 파일 첨부 기능 추가 (`request_attachments` 테이블에 `comment_id` 필드 추가)
- ✅ 클라이언트 요청 현황 페이지에서 코멘트 첨부파일 표시 및 다운로드 기능
- ✅ 클라이언트 코멘트 섹션 UI 개선 (파란색 테마, 코멘트 개수 배지)
- ✅ 코멘트 수정/삭제 기능 추가 (본인 작성 코멘트만)
- ✅ 코멘트 수정 시 첨부파일 삭제/추가 기능
- ✅ 리스트 테이블 긴급도 컬럼 너비 조정 (60px → 70px)
- ✅ 첨부파일 삭제 기능 디버깅 및 RLS 정책 문서화

### 2024-12-29 업데이트
- ✅ 클라이언트 관리 페이지(`/operator/clients`) 삭제 - 시스템 관리와 중복
- ✅ 대시보드를 홈페이지(`/`)로 통합 - `/operator/dashboard` 삭제
- ✅ 클라이언트 요청 수정 기능 추가 (접수대기 상태에서만)
- ✅ 클라이언트 코멘트 입력 기능 제거 (담당자만 작성 가능)
- ✅ 역할별 메뉴 접근 제어 적용 (클라이언트는 대시보드 접근 불가)
- ✅ 클라이언트 로그인 시 기본 페이지를 `/client/requests`로 설정
- ✅ 셀렉트박스 드롭다운 배경 흰색 불투명으로 변경
- ✅ 사이드바 로고 이미지 적용 (`public/logo.jpg`)
- ✅ AuthContext에 `isLoading` 속성 추가

### 이전 완료 작업
- ✅ Supabase 연동 (Auth, Database)
- ✅ 관리자 시스템 설정 페이지 (클라이언트/담당자 CRUD)
- ✅ 계정 생성 시 로그인 계정 동시 생성
- ✅ 비밀번호 변경 기능

## GitHub 저장소

```
https://github.com/alisyos/qna.git
```
