// 또미 외부 서비스 키 설정
// ─────────────────────────────────────────────────────────────
// VWorld(국토부 공간정보 오픈플랫폼) 인증키를 발급받아 아래에 붙여넣으세요.
//   발급: https://www.vworld.kr  →  오픈API 인증키 신청
//   ⚠️ 인증키 "활용 URL"에 이 사이트 도메인(https://ddomi.vercel.app)을 반드시 등록해야 지도가 뜹니다.
// 이 키는 도메인 제한 키라 공개돼도 다른 도메인에서는 쓸 수 없습니다(카카오 JS 키와 동일 모델).
// 비워두면 지도 대신 "준비중" 안내가 표시됩니다.
window.DDOMI_CONFIG = {
  VWORLD_KEY: "5722BAC8-9328-4BCC-B4E4-32B6D4B32AB3",

  // 씨앗 미식가 모집 폼 → Supabase(또미 전용 DB, 서울 리전)로 접수 저장
  // 신청 내역은 Supabase 대시보드 → Table Editor → ddomi_reviewers 에서 확인.
  // (공개 키·URL은 공개돼도 안전 — RLS로 '등록만' 허용, 읽기는 차단)
  // 프로젝트: ddomi (wwmpszugglbpypsdaxsa, ap-northeast-2/서울) — 2026-09-15 캘린더 프로젝트에서 분리
  SUPABASE_URL: "https://wwmpszugglbpypsdaxsa.supabase.co",
  SUPABASE_KEY: "sb_publishable_zbpqvbsSnrEE9V5ypU29zg_1MzfyJX3",
  SUPABASE_TABLE: "ddomi_reviewers",

  // ── 구글 로그인 연동 스위치 ────────────────────────────────
  // false인 동안에는 로그인/가입 화면에 구글 버튼이 "준비 중"으로만 표시되고 눌러도 아무 일도 없습니다.
  // 아래 3단계를 마친 뒤 true로 바꾸면 그 즉시 동작합니다(페이지 수정 불필요).
  //   1. Google Cloud Console → 사용자 인증 정보 → OAuth 클라이언트 ID(웹) 생성
  //   2. 승인된 리디렉션 URI에 https://wwmpszugglbpypsdaxsa.supabase.co/auth/v1/callback 추가
  //   3. Supabase → Authentication → Providers → Google 에 클라이언트 ID·시크릿 입력 후 활성화
  //      (같은 화면 URL Configuration의 Site URL = https://ddomi.vercel.app,
  //       Redirect URLs에 https://ddomi.vercel.app/** 추가)
  GOOGLE_ENABLED: false
};
