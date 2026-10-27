# 또미 (DDOMI) — 사이트 배포 저장소

또 가고 싶은 진짜 맛집. 맛집 신뢰평가 플랫폼입니다.

이 저장소는 **또미 사이트의 정본 배포 저장소**입니다. Vercel이 이 저장소(루트)를 정적 사이트로 배포합니다.
빌드 단계가 없습니다 — Framework Preset = Other, Root Directory = 루트.

- 조직 관리 문서(브랜드가이드·알고리즘 노트 등)는 별도 관리 저장소 `Hwang-InHoo/gicho-hoesa`의 `subsidiaries/ddomi/`에 있습니다.

## 화면

| 파일 | 화면 | 로그인 |
| --- | --- | --- |
| `index.html` | 홈 | 불필요 |
| `map.html` | 맛집 지도 (Leaflet + VWorld) | 불필요 |
| `signup.html` · `login.html` | 가입 · 로그인 | — |
| `taste.html` | 취향 설정 (가입 직후 1회) | 필요 |
| `course.html` | 오늘은 또미가 골라줘 (코스 짜기) | 필요 |
| `account.html` | 내 계정 | 필요 |
| `admin.html` | 관리자 (고통지수 근거판 · 분류기) | 관리자만 |
| `about.html` · `privacy.html` · `reviewer.html` | 소개 · 개인정보처리방침 · 씨앗 미식가 사전 신청 | 불필요 |

## 공용 파일

- `ui.css` — 색·버튼·칩·카드·폼·목록. 모든 새 화면이 같은 규칙을 씁니다.
- `auth.js` — Supabase Auth를 감싼 유틸. 관리자 판정은 서버에서만 내려옵니다(이 파일에 관리자 이메일이 없습니다).
- `config.js` — VWorld 키, Supabase 공개 키, 구글 로그인 스위치.
- `data.js` + `data/restaurants.json` — 공공데이터 음식점 3,571곳(부산광역시 부산진구).
- `style.css` · `auth.css` — 옛 디자인용. `about.html` 등 아직 남은 화면이 씁니다.

## 지금 연동 안 된 것

- 구글 로그인 (`config.js`의 `GOOGLE_ENABLED: false`) — 버튼은 "준비 중"으로만 표시됩니다.
- 미식점수의 세 신호 — 버틴 시간(인허가 데이터), 광고 노출도(검색 집계), 방문 평가(0건) 모두 비어 있습니다.
- 일행 초대 링크 응답 수집, 카카오톡 공유, 일정 저장.
- 전국 확장 — 화면은 전국 구조이나 데이터는 17개 시·도 중 1곳뿐입니다.

## 로컬 전용

- `home-draft/` — 시안 작업 폴더와 현황 페이지(`site.html`). `.gitignore`에 들어 있어 배포되지 않습니다.
