-- ============================================
-- Seed Data for Ad Request Management System
-- Run this after creating test users via Supabase Auth
-- ============================================

-- Note: First create users via Supabase Dashboard or Auth API:
-- 1. client@example.com (role: client)
-- 2. operator@example.com (role: operator)
-- 3. admin@example.com (role: admin)

-- After creating auth users, their profiles will be auto-created
-- Then run this to update profiles and create sample data

-- Update profiles with additional info (run after users are created)
-- UPDATE profiles SET
--   name = '김영수',
--   department_name = '마케팅팀',
--   phone = '02-1234-5678'
-- WHERE email = 'client@example.com';

-- UPDATE profiles SET
--   name = '홍길동',
--   department = '광고운영팀'
-- WHERE email = 'operator@example.com';

-- UPDATE profiles SET
--   name = '이영희',
--   department = '광고운영팀'
-- WHERE email = 'admin@example.com';

-- Sample clients (after profile user_ids are known)
-- INSERT INTO clients (user_id, department_name, contact_name, email, phone, status)
-- SELECT id, '마케팅팀', '김영수', 'client@example.com', '02-1234-5678', 'active'
-- FROM profiles WHERE email = 'client@example.com';

-- Additional sample clients without user accounts
INSERT INTO clients (department_name, contact_name, email, phone, status)
VALUES
  ('영업팀', '이지현', 'lee@example.com', '02-2345-6789', 'active'),
  ('홍보팀', '박민준', 'park@example.com', '02-3456-7890', 'active'),
  ('전략기획팀', '최서연', 'choi@example.com', '02-4567-8901', 'active'),
  ('디지털사업팀', '정현우', 'jung@example.com', '02-5678-9012', 'inactive')
ON CONFLICT DO NOTHING;

-- Note: Sample requests should be created after clients and operators are set up
-- Example:
-- INSERT INTO requests (client_id, operator_id, request_type, platform, priority, title, description, desired_date, status)
-- SELECT
--   c.id,
--   p.id,
--   'budget_change',
--   'naver',
--   'urgent',
--   '네이버 광고 일예산 증액 요청',
--   '12월 프로모션 진행으로 인해 일예산을 50만원에서 100만원으로 증액해 주세요.',
--   '2024-12-20',
--   'in_progress'
-- FROM clients c, profiles p
-- WHERE c.department_name = '마케팅팀' AND p.email = 'operator@example.com';
