// 또미 외부 서비스 키 설정
// ─────────────────────────────────────────────────────────────
// VWorld(국토부 공간정보 오픈플랫폼) 인증키를 발급받아 아래에 붙여넣으세요.
//   발급: https://www.vworld.kr  →  오픈API 인증키 신청
//   ⚠️ 인증키 "활용 URL"에 이 사이트 도메인(https://ddomi.vercel.app)을 반드시 등록해야 지도가 뜹니다.
// 이 키는 도메인 제한 키라 공개돼도 다른 도메인에서는 쓸 수 없습니다(카카오 JS 키와 동일 모델).
// 비워두면 지도 대신 "준비중" 안내가 표시됩니다.
window.DDOMI_CONFIG = {
  VWORLD_KEY: "5722BAC8-9328-4BCC-B4E4-32B6D4B32AB3",

  // 씨앗 미식가 모집 폼 → Supabase(또미 소유 DB)로 접수 저장
  // 신청 내역은 Supabase 대시보드 → Table Editor → ddomi_reviewers 에서 확인.
  // (공개 키·URL은 공개돼도 안전 — RLS로 '등록만' 허용, 읽기는 차단)
  SUPABASE_URL: "https://hdcmzlncwtmhmnfstokt.supabase.co",
  SUPABASE_KEY: "sb_publishable_TFypc74O_8v6r0RpXnnyXg_WPcbS3mJ",
  SUPABASE_TABLE: "ddomi_reviewers"
};
