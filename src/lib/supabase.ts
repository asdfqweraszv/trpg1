export async function uploadAvatar(characterId: string, file: File): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${characterId}-${Date.now()}.${fileExt}`;
    // ❌ 기존: 'avatars/' 제거
    const filePath = fileName;  // 폴더 경로 없이 파일명만

    console.log('업로드 경로:', filePath);

    const { error, data } = await supabase.storage
      .from('avatars')  // 버킷 이름만 지정
      .upload(filePath, file, {
        upsert: true,
        cacheControl: '3600',
        contentType: file.type
      });

    if (error) {
      console.error('업로드 에러:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    console.log('공개 URL:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (err) {
    console.error('예외 발생:', err);
    return null;
  }
}