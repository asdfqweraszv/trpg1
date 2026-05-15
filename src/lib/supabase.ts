import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 프로필 이미지 업로드 함수
export async function uploadAvatar(characterId: string, file: File): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${characterId}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return data.publicUrl;
}
// avatars 버킷 생성 (최초 1회만 실행하면 됨)
export async function createAvatarsBucket() {
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
}