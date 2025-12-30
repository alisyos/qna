-- ============================================
-- Supabase Schema for Ad Request Management System
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('client', 'operator', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE request_type AS ENUM (
    'budget_change',
    'keyword_add_delete',
    'ad_material_edit',
    'targeting_change',
    'report_request',
    'account_setting',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ad_platform AS ENUM ('naver', 'kakao', 'google', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE priority_level AS ENUM ('normal', 'urgent', 'critical');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE request_status AS ENUM ('pending', 'in_progress', 'completed', 'on_hold');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE account_status AS ENUM ('active', 'inactive');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'client',
  department TEXT,
  department_name TEXT,
  phone TEXT,
  status account_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CLIENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  department_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  assigned_operator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status account_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REQUESTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number TEXT UNIQUE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  request_type request_type NOT NULL,
  platform ad_platform NOT NULL,
  priority priority_level NOT NULL DEFAULT 'normal',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  desired_date DATE,
  status request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- REQUEST COMMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS request_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REQUEST ATTACHMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS request_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_requests_client_id ON requests(client_id);
CREATE INDEX IF NOT EXISTS idx_requests_operator_id ON requests(operator_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_comments_request_id ON request_comments(request_id);
CREATE INDEX IF NOT EXISTS idx_request_attachments_request_id ON request_attachments(request_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-generate request number
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(request_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM requests;

  NEW.request_number := 'REQ-' || LPAD(next_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_request_number ON requests;
CREATE TRIGGER trigger_generate_request_number
  BEFORE INSERT ON requests
  FOR EACH ROW
  WHEN (NEW.request_number IS NULL)
  EXECUTE FUNCTION generate_request_number();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_update_clients_updated_at ON clients;
CREATE TRIGGER trigger_update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_update_requests_updated_at ON requests;
CREATE TRIGGER trigger_update_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Set completed_at when status changes to completed
CREATE OR REPLACE FUNCTION set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    NEW.completed_at = NOW();
  ELSIF NEW.status != 'completed' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_completed_at ON requests;
CREATE TRIGGER trigger_set_completed_at
  BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION set_completed_at();

-- ============================================
-- PROFILE AUTO-CREATE TRIGGER (for auth.users)
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, department, department_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client'),
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'department_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- IMPORTANT: auth.users 트리거 수동 설정 필요
-- ============================================
-- SQL Editor에서는 auth 스키마에 대한 권한이 없습니다.
-- Supabase Dashboard에서 아래 단계를 따라 설정하세요:
--
-- 방법 1: Database > Triggers 메뉴 사용
--   1. Supabase Dashboard > Database > Triggers
--   2. "Create a new trigger" 클릭
--   3. 설정:
--      - Name: on_auth_user_created
--      - Table: auth.users
--      - Events: INSERT
--      - Trigger type: After the event
--      - Orientation: Row
--      - Function: public.handle_new_user
--
-- 방법 2: 회원가입 시 수동으로 profiles 생성
--   - 위 트리거 없이도 사용 가능
--   - 회원가입 후 profiles 테이블에 직접 데이터 삽입
-- ============================================

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_attachments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS FOR RLS (in public schema)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_operator_or_admin()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role() IN ('operator', 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role() = 'admin';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_client_id()
RETURNS UUID AS $$
  SELECT c.id FROM public.clients c WHERE c.user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- PROFILES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Operators can view all profiles" ON profiles;
CREATE POLICY "Operators can view all profiles"
  ON profiles FOR SELECT
  USING (public.is_operator_or_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- ============================================
-- CLIENTS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Clients can view own record" ON clients;
CREATE POLICY "Clients can view own record"
  ON clients FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Operators can view all clients" ON clients;
CREATE POLICY "Operators can view all clients"
  ON clients FOR SELECT
  USING (public.is_operator_or_admin());

DROP POLICY IF EXISTS "Operators can insert clients" ON clients;
CREATE POLICY "Operators can insert clients"
  ON clients FOR INSERT
  WITH CHECK (public.is_operator_or_admin());

DROP POLICY IF EXISTS "Operators can update clients" ON clients;
CREATE POLICY "Operators can update clients"
  ON clients FOR UPDATE
  USING (public.is_operator_or_admin());

DROP POLICY IF EXISTS "Admins can delete clients" ON clients;
CREATE POLICY "Admins can delete clients"
  ON clients FOR DELETE
  USING (public.is_admin());

-- ============================================
-- REQUESTS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Clients can view own requests" ON requests;
CREATE POLICY "Clients can view own requests"
  ON requests FOR SELECT
  USING (client_id = public.get_user_client_id());

DROP POLICY IF EXISTS "Clients can create requests" ON requests;
CREATE POLICY "Clients can create requests"
  ON requests FOR INSERT
  WITH CHECK (client_id = public.get_user_client_id());

DROP POLICY IF EXISTS "Operators can view all requests" ON requests;
CREATE POLICY "Operators can view all requests"
  ON requests FOR SELECT
  USING (public.is_operator_or_admin());

DROP POLICY IF EXISTS "Operators can insert requests" ON requests;
CREATE POLICY "Operators can insert requests"
  ON requests FOR INSERT
  WITH CHECK (public.is_operator_or_admin());

DROP POLICY IF EXISTS "Operators can update requests" ON requests;
CREATE POLICY "Operators can update requests"
  ON requests FOR UPDATE
  USING (public.is_operator_or_admin());

DROP POLICY IF EXISTS "Admins can delete requests" ON requests;
CREATE POLICY "Admins can delete requests"
  ON requests FOR DELETE
  USING (public.is_admin());

-- ============================================
-- REQUEST COMMENTS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Clients can view public comments on own requests" ON request_comments;
CREATE POLICY "Clients can view public comments on own requests"
  ON request_comments FOR SELECT
  USING (
    is_internal = FALSE AND
    request_id IN (SELECT id FROM requests WHERE client_id = public.get_user_client_id())
  );

DROP POLICY IF EXISTS "Clients can create comments on own requests" ON request_comments;
CREATE POLICY "Clients can create comments on own requests"
  ON request_comments FOR INSERT
  WITH CHECK (
    author_id = auth.uid() AND
    is_internal = FALSE AND
    request_id IN (SELECT id FROM requests WHERE client_id = public.get_user_client_id())
  );

DROP POLICY IF EXISTS "Operators can view all comments" ON request_comments;
CREATE POLICY "Operators can view all comments"
  ON request_comments FOR SELECT
  USING (public.is_operator_or_admin());

DROP POLICY IF EXISTS "Operators can create comments" ON request_comments;
CREATE POLICY "Operators can create comments"
  ON request_comments FOR INSERT
  WITH CHECK (public.is_operator_or_admin() AND author_id = auth.uid());

-- ============================================
-- REQUEST ATTACHMENTS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Clients can view attachments on own requests" ON request_attachments;
CREATE POLICY "Clients can view attachments on own requests"
  ON request_attachments FOR SELECT
  USING (request_id IN (SELECT id FROM requests WHERE client_id = public.get_user_client_id()));

DROP POLICY IF EXISTS "Clients can upload attachments to own requests" ON request_attachments;
CREATE POLICY "Clients can upload attachments to own requests"
  ON request_attachments FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND
    request_id IN (SELECT id FROM requests WHERE client_id = public.get_user_client_id())
  );

DROP POLICY IF EXISTS "Operators can view all attachments" ON request_attachments;
CREATE POLICY "Operators can view all attachments"
  ON request_attachments FOR SELECT
  USING (public.is_operator_or_admin());

DROP POLICY IF EXISTS "Operators can upload attachments" ON request_attachments;
CREATE POLICY "Operators can upload attachments"
  ON request_attachments FOR INSERT
  WITH CHECK (public.is_operator_or_admin() AND uploaded_by = auth.uid());

-- ============================================
-- STORAGE BUCKET (run separately if needed)
-- ============================================

-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('request-attachments', 'request-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'request-attachments' AND
    auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Authenticated users can view files" ON storage.objects;
CREATE POLICY "Authenticated users can view files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'request-attachments' AND
    auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Admins can delete files" ON storage.objects;
CREATE POLICY "Admins can delete files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'request-attachments' AND
    public.is_admin()
  );
