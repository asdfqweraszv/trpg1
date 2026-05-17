// /home/project/src/lib/supabase.ts
export async function uploadAvatar(characterId: string, file: File): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    // 파일명: 캐릭터ID-시간Stamp.확장자
    const fileName = `${characterId}-${Date.now()}.${fileExt}`;
    // ✅ 수정된 부분: 'avatars/'를 제거하여 버킷 내 최상위 경로에 저장되도록 함
    const filePath = fileName;

    console.log('✅ 업로드 시도 (수정된 경로):', filePath);

    const { error, data } = await supabase.storage
      .from('avatars') // 'avatars' 버킷을 지정
      .upload(filePath, file, {
        upsert: true,
        cacheControl: '3600',
        contentType: file.type,
      });

    if (error) {
      console.error('❌ 업로드 에러:', error);
      alert(`업로드 실패: ${error.message}`);
      return null;
    }

    console.log('✅ 업로드 성공:', data);

    // 정상적인 public URL 생성 (경로 중복 없음)
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);

    console.log('✅ 생성된 Public URL:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (err) {
    console.error('❌ 업로드 중 예외 발생:', err);
    alert('업로드 중 오류가 발생했습니다.');
    return null;
  }
}