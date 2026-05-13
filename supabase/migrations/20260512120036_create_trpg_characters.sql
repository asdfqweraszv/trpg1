/*
  # TRPG 캐릭터 시트 데이터베이스 생성

  ## 새 테이블
  - `characters`: 캐릭터 기본 정보 및 스탯 저장
    - id, name, species, job, level
    - 각종 스탯 (base stats from 1d20 roll + species/job bonuses)
    - current/max HP and MP tracking
    - password for owner editing, master_key for master access
    - equipment slots with stat bonuses
  - `equipment`: 장비 아이템 정보

  ## 보안
  - RLS 활성화 (인증 없이도 캐릭터 조회 가능, 수정은 비밀번호 검증)
  - 공개 읽기, 비밀번호 기반 쓰기
*/

CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  species text NOT NULL DEFAULT 'human',
  job text NOT NULL DEFAULT '광전사',
  level integer NOT NULL DEFAULT 1,
  
  -- 기본 스탯 (1d20 롤 결과 + 종족 보너스)
  stat_hp integer NOT NULL DEFAULT 5,
  stat_attack integer NOT NULL DEFAULT 5,
  stat_spell integer NOT NULL DEFAULT 5,
  stat_mana integer NOT NULL DEFAULT 5,
  stat_intelligence integer NOT NULL DEFAULT 5,
  stat_agility integer NOT NULL DEFAULT 5,
  stat_defense integer NOT NULL DEFAULT 5,
  stat_magic_resist integer NOT NULL DEFAULT 5,
  stat_charm integer NOT NULL DEFAULT 5,
  
  -- 레벨업으로 찍은 스탯 포인트
  spent_hp integer NOT NULL DEFAULT 0,
  spent_attack integer NOT NULL DEFAULT 0,
  spent_spell integer NOT NULL DEFAULT 0,
  spent_mana integer NOT NULL DEFAULT 0,
  spent_intelligence integer NOT NULL DEFAULT 0,
  spent_agility integer NOT NULL DEFAULT 0,
  spent_charm integer NOT NULL DEFAULT 0,
  
  -- 남은 스탯 포인트
  stat_points integer NOT NULL DEFAULT 0,
  
  -- 현재/최대 HP, MP
  current_hp integer NOT NULL DEFAULT 0,
  current_mana integer NOT NULL DEFAULT 0,
  
  -- 특수 능력 메모
  special_abilities text DEFAULT '',
  notes text DEFAULT '',
  
  -- 인증
  password_hash text NOT NULL,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  slot_name text NOT NULL,
  item_name text NOT NULL DEFAULT '',
  
  -- 장비 스탯 보너스
  bonus_hp integer NOT NULL DEFAULT 0,
  bonus_attack integer NOT NULL DEFAULT 0,
  bonus_spell integer NOT NULL DEFAULT 0,
  bonus_mana integer NOT NULL DEFAULT 0,
  bonus_intelligence integer NOT NULL DEFAULT 0,
  bonus_agility integer NOT NULL DEFAULT 0,
  bonus_defense integer NOT NULL DEFAULT 0,
  bonus_magic_resist integer NOT NULL DEFAULT 0,
  bonus_charm integer NOT NULL DEFAULT 0,
  
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS master_settings (
  id integer PRIMARY KEY DEFAULT 1,
  master_password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 마스터 비밀번호 기본값 설정 (master123 - 나중에 변경 권장)
INSERT INTO master_settings (id, master_password_hash) 
VALUES (1, 'master123')
ON CONFLICT (id) DO NOTHING;

-- RLS 활성화
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_settings ENABLE ROW LEVEL SECURITY;

-- 누구나 캐릭터 조회 가능
CREATE POLICY "Anyone can view characters"
  ON characters FOR SELECT
  TO anon, authenticated
  USING (true);

-- 누구나 캐릭터 생성 가능
CREATE POLICY "Anyone can create characters"
  ON characters FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 누구나 캐릭터 업데이트 가능 (비밀번호 검증은 앱 레벨에서)
CREATE POLICY "Anyone can update characters"
  ON characters FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 누구나 장비 조회 가능
CREATE POLICY "Anyone can view equipment"
  ON equipment FOR SELECT
  TO anon, authenticated
  USING (true);

-- 누구나 장비 생성 가능
CREATE POLICY "Anyone can create equipment"
  ON equipment FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 누구나 장비 업데이트 가능
CREATE POLICY "Anyone can update equipment"
  ON equipment FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 누구나 장비 삭제 가능
CREATE POLICY "Anyone can delete equipment"
  ON equipment FOR DELETE
  TO anon, authenticated
  USING (true);

-- 마스터 설정 조회
CREATE POLICY "Anyone can view master settings"
  ON master_settings FOR SELECT
  TO anon, authenticated
  USING (true);
