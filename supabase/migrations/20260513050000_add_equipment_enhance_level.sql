-- equipment 테이블에 enhance_level 컬럼 추가
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS enhance_level INTEGER DEFAULT 0;

npx supabase migration up
