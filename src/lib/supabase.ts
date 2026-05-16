import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 프로필 이미지 업로드 함수
export async function uploadAvatar(characterId: string, file: File): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${characterId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    console.log('1. 업로드 경로:', filePath);
    console.log('2. 파일 정보:', { name: file.name, type: file.type, size: file.size });

    const { error, data } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true,
        cacheControl: '3600',
        contentType: file.type
      });

    if (error) {
      console.error('3. 업로드 에러:', error);
      return null;
    }

    console.log('4. 업로드 성공:', data);

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    console.log('5. 공개 URL:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (err) {
    console.error('6. 예외 발생:', err);
    return null;
  }
}

// avatars 버킷 생성 (최초 1회만 실행하면 됨)
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