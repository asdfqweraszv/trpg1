// 프로필 이미지 업로드 함수
export async function uploadAvatar(characterId: string, file: File): Promise<string | null> {
  try {
    // 파일 확장자 추출
    const fileExt = file.name.split('.').pop();
    // 고유한 파일명 생성 (타임스탬프 추가)
    const fileName = `${characterId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    console.log('업로드 시작:', { fileName, filePath, fileSize: file.size });

    // 업로드
    const { error: uploadError, data } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true,
        cacheControl: '3600',
        contentType: file.type
      });

    if (uploadError) {
      console.error('Upload error details:', uploadError);
      alert(`업로드 실패: ${uploadError.message}`);
      return null;
    }

    console.log('업로드 성공:', data);

    // 공개 URL 가져오기
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    console.log('공개 URL:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (err) {
    console.error('Upload exception:', err);
    alert('업로드 중 오류가 발생했습니다.');
    return null;
  }
}