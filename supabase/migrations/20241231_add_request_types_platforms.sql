-- 요청 유형 테이블
CREATE TABLE IF NOT EXISTS request_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 플랫폼 테이블
CREATE TABLE IF NOT EXISTS platforms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 요청 유형 데이터 삽입
INSERT INTO request_types (code, label, sort_order) VALUES
  ('budget_change', '예산 변경', 1),
  ('keyword_add_delete', '키워드 추가/삭제', 2),
  ('ad_material_edit', '광고 소재 수정', 3),
  ('targeting_change', '타겟팅 변경', 4),
  ('report_request', '성과 리포트 요청', 5),
  ('account_setting', '계정 설정 변경', 6),
  ('other', '기타 문의', 7)
ON CONFLICT (code) DO NOTHING;

-- 기본 플랫폼 데이터 삽입
INSERT INTO platforms (code, label, sort_order) VALUES
  ('naver', '네이버 검색광고', 1),
  ('kakao', '카카오 키워드광고', 2),
  ('google', '구글 Ads', 3),
  ('meta', '메타(페이스북/인스타그램)', 4),
  ('other', '기타', 99)
ON CONFLICT (code) DO NOTHING;

-- RLS 정책 설정
ALTER TABLE request_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;

-- 읽기 정책 (인증된 사용자 모두)
CREATE POLICY "request_types_select_policy" ON request_types
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "platforms_select_policy" ON platforms
  FOR SELECT TO authenticated USING (true);

-- 수정 정책 (관리자만)
CREATE POLICY "request_types_insert_policy" ON request_types
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "request_types_update_policy" ON request_types
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "request_types_delete_policy" ON request_types
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "platforms_insert_policy" ON platforms
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "platforms_update_policy" ON platforms
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "platforms_delete_policy" ON platforms
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_request_types_updated_at
  BEFORE UPDATE ON request_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platforms_updated_at
  BEFORE UPDATE ON platforms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
