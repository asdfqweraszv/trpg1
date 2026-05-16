import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 프로필 이미지 업로드 함수 (Base64 방식)
export async function uploadAvatar(characterId: string, file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      console.log('✅ 이미지 Base64 변환 완료 (길이:', base64String.length, ')');
      resolve(base64String);
    };
    reader.onerror = (error) => {
      console.error('❌ 파일 읽기 실패:', error);
      resolve(null);
    };
    reader.readAsDataURL(file);
  });
}

// avatars 버킷 생성 (필요 없을 수 있음)
export async function createAvatarsBucket() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some(b => b.name === 'avatars');
    
    if (!exists) {
      const { error } = await supabase.storage.createBucket('avatars', {
        public: true,
      });
      if (error) {
        console.error('Bucket creation error:', error);
      } else {
        console.log('Avatars bucket created!');
      }
    }
  } catch (err) {
    console.error('Bucket check error:', err);
  }
}