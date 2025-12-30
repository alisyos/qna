-- ============================================
-- Migration: 계정 삭제 시 데이터 보존
-- 날짜: 2024-12-30
-- 설명: author_id, uploaded_by 외래 키를 ON DELETE SET NULL로 변경
--       계정 삭제 시 코멘트와 첨부파일이 삭제되지 않도록 함
-- ============================================

-- request_comments 테이블 수정
-- 1. NOT NULL 제약 조건 제거
ALTER TABLE request_comments
  ALTER COLUMN author_id DROP NOT NULL;

-- 2. 기존 외래 키 제약 조건 삭제 후 새로 생성
ALTER TABLE request_comments
  DROP CONSTRAINT IF EXISTS request_comments_author_id_fkey;

ALTER TABLE request_comments
  ADD CONSTRAINT request_comments_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- request_attachments 테이블 수정
-- 1. NOT NULL 제약 조건 제거
ALTER TABLE request_attachments
  ALTER COLUMN uploaded_by DROP NOT NULL;

-- 2. 기존 외래 키 제약 조건 삭제 후 새로 생성
ALTER TABLE request_attachments
  DROP CONSTRAINT IF EXISTS request_attachments_uploaded_by_fkey;

ALTER TABLE request_attachments
  ADD CONSTRAINT request_attachments_uploaded_by_fkey
    FOREIGN KEY (uploaded_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- ============================================
-- 변경 후 동작:
-- - 사용자(profiles) 삭제 시:
--   - request_comments.author_id → NULL (코멘트 유지)
--   - request_attachments.uploaded_by → NULL (첨부파일 유지)
-- - UI에서는 author_id가 NULL인 경우 "삭제된 사용자"로 표시
-- ============================================
