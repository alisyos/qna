-- ============================================
-- Migration: 클라이언트별 담당자 배정 기능 추가
-- 날짜: 2024-12-30
-- 설명: clients 테이블에 assigned_operator_id 필드 추가
--       클라이언트가 요청 등록 시 해당 담당자가 자동 배정됨
-- ============================================

-- clients 테이블에 assigned_operator_id 컬럼 추가
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS assigned_operator_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_clients_assigned_operator_id ON clients(assigned_operator_id);

-- ============================================
-- 변경 후 동작:
-- - 클라이언트에 담당자를 미리 배정할 수 있음
-- - 해당 클라이언트가 요청을 등록하면 배정된 담당자가 자동으로 설정됨
-- - 담당자가 삭제되면 assigned_operator_id는 NULL로 변경됨
-- ============================================
